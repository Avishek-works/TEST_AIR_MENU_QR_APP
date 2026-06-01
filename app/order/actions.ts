"use server";

import { createBill, deleteBillById } from "@/db/bills";
import {
  createCustomer,
  deleteCustomerById,
  findCustomerIdByPhone,
  findCustomerProfileByPhone,
} from "@/db/customers";
import { createBillItems } from "@/db/orders";
import { getConfiguredClientId } from "@/lib/config";
import { getOrderNotesSupport } from "@/lib/order-capabilities";
import type { CustomerLookupResult, PlaceOrderInput, PlaceOrderResult } from "@/lib/types";

const REQUIRED_STATUS = "PENDING";

const sanitizeText = (value: string | undefined | null) => (value ?? "").trim();

const sanitizePhone = (value: string | undefined | null): string =>
  sanitizeText(value).replace(/\D+/g, "").slice(0, 10);

const sanitizeEmail = (value: string | undefined | null): string => sanitizeText(value).toLowerCase().slice(0, 254);

const sanitizeOrderNotes = (value: string | undefined | null): string =>
  sanitizeText(value).replace(/\s+/g, " ").slice(0, 280);

const isValidPhone = (phone: string): boolean => /^\d{10}$/.test(phone);
const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeDob = (value: string | undefined | null): string | null => {
  const normalized = sanitizeText(value);
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;

  const parsed = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  const isoDate = parsed.toISOString().slice(0, 10);
  if (isoDate !== normalized) return null;

  const today = new Date();
  const maxDate = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`;
  if (normalized > maxDate) return null;

  return normalized;
};

const toSafeNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export async function lookupCustomerByPhoneAction(phone: string): Promise<CustomerLookupResult> {
  try {
    const sanitizedPhone = sanitizePhone(phone);

    if (!isValidPhone(sanitizedPhone)) {
      return { found: false };
    }

    const clientId = getConfiguredClientId();
    if (!clientId) {
      return { found: false };
    }

    const { data, error } = await findCustomerProfileByPhone(clientId, sanitizedPhone);

    if (error || !data) {
      if (error) {
        console.error("[order] customer lookup failed", {
          code: error.code,
          message: error.message,
        });
      }
      return { found: false };
    }

    return {
      found: true,
      customer: {
        id: data.id,
        name: sanitizeText(data.name),
        email: sanitizeEmail(data.email),
        dob: sanitizeText(data.dob),
      },
    };
  } catch (error) {
    console.error("[order] customer lookup crashed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { found: false };
  }
}

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  try {
    const tableNumber = sanitizeText(input.tableNumber).toUpperCase();
    const customerPhone = sanitizePhone(input.customerPhone);
    const customerName = sanitizeText(input.customerName);
    const customerEmail = sanitizeEmail(input.customerEmail);
    const customerDobRaw = sanitizeText(input.customerDob);
    const customerDob = normalizeDob(customerDobRaw);
    const orderNotes = sanitizeOrderNotes(input.notes);

    if (!tableNumber || !customerPhone || input.items.length === 0) {
      console.log("[order] validation failed: missing required fields", {
        hasTableNumber: Boolean(tableNumber),
        hasCustomerPhone: Boolean(customerPhone),
        itemsCount: input.items?.length ?? 0,
      });
      return { ok: false, error: "Please complete required fields and cart items." };
    }

    if (!isValidPhone(customerPhone)) {
      console.log("[order] validation failed: invalid phone", {
        customerPhonePreview: customerPhone ? "***10digits" : null,
      });
      return { ok: false, error: "Please enter a valid 10-digit phone number." };
    }

    if (customerEmail && !isValidEmail(customerEmail)) {
      return { ok: false, error: "Please enter a valid email address." };
    }

    if (customerDobRaw && !customerDob) {
      return { ok: false, error: "Please enter a valid date of birth." };
    }

    const normalizedItems = input.items
      .map((item) => {
        const quantity = Math.trunc(toSafeNumber(item.qty));
        const price = toSafeNumber(item.unitPrice);
        const total = quantity * price;
        return {
          productId: sanitizeText(item.menuItemId),
          quantity,
          price,
          total,
        };
      })
      .filter(
        (item) =>
          Boolean(item.productId) &&
          Number.isFinite(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.price) &&
          item.price >= 0 &&
          Number.isFinite(item.total) &&
          item.total >= 0,
      );

    if (!normalizedItems.length) {
      return { ok: false, error: "Cart is empty." };
    }

    const totalAmount = normalizedItems.reduce((acc, item) => acc + item.total, 0);
    const discount = 0;
    const finalAmount = totalAmount - discount;

    if (!Number.isFinite(totalAmount) || !Number.isFinite(finalAmount) || totalAmount < 0 || finalAmount < 0) {
      return { ok: false, error: "Invalid order total. Please review your cart." };
    }

    const clientId = getConfiguredClientId();

    if (!clientId) {
      console.error("[order] missing or invalid restaurant client_id configuration", {
        tableNumber,
      });
      return { ok: false, error: "Restaurant configuration missing." };
    }

    const orderNotesSupport = await getOrderNotesSupport();
    let createdCustomerId: string | null = null;

    const cleanupCreatedCustomer = async (reason: string) => {
      if (!createdCustomerId) {
        return;
      }

      const { error: customerRollbackError } = await deleteCustomerById(clientId, createdCustomerId);

      if (customerRollbackError) {
        console.error("[order] rollback delete customer failed", {
          reason,
          customerId: createdCustomerId,
          code: customerRollbackError.code,
          message: customerRollbackError.message,
        });
      }
    };

    const { data: existingCustomer, error: existingCustomerError } = await findCustomerProfileByPhone(clientId, customerPhone);

    if (existingCustomerError) {
      console.error("[order] customer lookup for placement failed", {
        code: existingCustomerError.code,
        message: existingCustomerError.message,
      });
      return { ok: false, error: "Could not verify customer details. Please try again." };
    }

    let resolvedCustomerId = existingCustomer?.id ?? null;

    if (!resolvedCustomerId) {
      if (!customerName) {
        return { ok: false, error: "Name is required for new customers." };
      }

      const { data: createdCustomer, error: createCustomerError } = await createCustomer({
        clientId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail || undefined,
        dob: customerDob || undefined,
      });

      if (createCustomerError || !createdCustomer) {
        if (createCustomerError?.code === "23505") {
          const { data: fetchedAfterConflict, error: fetchAfterConflictError } = await findCustomerIdByPhone(
            clientId,
            customerPhone,
          );

          if (fetchAfterConflictError || !fetchedAfterConflict) {
            console.error("[order] customer re-fetch failed after duplicate conflict", {
              conflictCode: createCustomerError.code,
              fetchCode: fetchAfterConflictError?.code,
              fetchMessage: fetchAfterConflictError?.message,
            });
            return { ok: false, error: "Could not resolve customer profile. Please retry." };
          }

          resolvedCustomerId = fetchedAfterConflict.id;
        } else {
          console.error("[order] customer creation failed", {
            code: createCustomerError?.code,
            message: createCustomerError?.message,
          });
          return { ok: false, error: "Could not save customer details. Please retry." };
        }
      } else {
        resolvedCustomerId = createdCustomer.id;
        createdCustomerId = createdCustomer.id;
      }
    }

    if (!resolvedCustomerId) {
      return { ok: false, error: "Could not resolve customer profile. Please retry." };
    }

    const { data: bill, error: billError } = await createBill({
      clientId,
      customerId: resolvedCustomerId,
      tableNumber,
      totalAmount,
      discount,
      finalAmount,
      status: REQUIRED_STATUS,
      notesColumn: orderNotesSupport.columnName,
      notes: orderNotes || undefined,
    });

    if (billError) {
      console.error("[order] supabase insert bills failed", {
        code: billError.code,
        message: billError.message,
        details: (billError as { details?: unknown }).details,
        hint: (billError as { hint?: unknown }).hint,
        payloadShape: {
          client_id: clientId,
          customer_id: resolvedCustomerId,
          table_number: tableNumber,
          total_amount: totalAmount,
          discount,
          final_amount: finalAmount,
          status: REQUIRED_STATUS,
          hasCustomerId: Boolean(resolvedCustomerId),
        },
      });
    }

    if (billError || !bill) {
      await cleanupCreatedCustomer("bill_insert_failed");
      return { ok: false, error: "Could not place order. Please try again." };
    }

    if (bill.client_id !== clientId) {
      console.error("[order] inserted bill missing expected client_id", {
        billId: bill.id,
        expectedClientId: clientId,
        actualClientId: bill.client_id,
      });

      const { error: rollbackError } = await deleteBillById(bill.id);
      if (rollbackError) {
        console.error("[order] rollback delete bills failed after client_id mismatch", {
          code: rollbackError.code,
          message: rollbackError.message,
        });
      }

      await cleanupCreatedCustomer("bill_client_mismatch");
      return { ok: false, error: "Could not place order. Please try again." };
    }

    const billItemPayload = normalizedItems.map((item) => ({
      billId: bill.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    }));

    const { error: itemError } = await createBillItems(billItemPayload);

    if (itemError) {
      console.error("[order] supabase insert bill_items failed", {
        code: itemError.code,
        message: itemError.message,
        details: (itemError as { details?: unknown }).details,
        hint: (itemError as { hint?: unknown }).hint,
        payloadShape: {
          billId: bill.id,
          itemsCount: billItemPayload.length,
          hasInvalidProductId: billItemPayload.some((item) => !item.productId),
        },
      });

      const { error: rollbackError } = await deleteBillById(bill.id);
      if (rollbackError) {
        console.error("[order] rollback delete bills failed", {
          code: rollbackError.code,
          message: rollbackError.message,
        });
      }

      await cleanupCreatedCustomer("bill_items_insert_failed");
      return { ok: false, error: "Could not save order items. Please retry." };
    }

    return { ok: true, orderId: bill.order_id || bill.id };
  } catch (err) {
    console.error("[order] submit flow crashed", {
      message: err instanceof Error ? err.message : String(err),
      input: {
        tableNumber: sanitizeText(input.tableNumber).toUpperCase(),
        customerPhoneLen: sanitizePhone(input.customerPhone).length,
        hasCustomerName: Boolean(sanitizeText(input.customerName)),
        itemsCount: input.items?.length ?? 0,
      },
      stack: err instanceof Error ? err.stack : undefined,
    });

    return { ok: false, error: "Unable to submit order. Please try again." };
  }
}
