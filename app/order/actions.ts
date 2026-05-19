"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import { getConfiguredClientId } from "@/lib/config";
import { getOrderNotesSupport } from "@/lib/order-capabilities";
import type { LookupCustomerResult, PlaceOrderInput, PlaceOrderResult } from "@/lib/types";

const REQUIRED_STATUS = "PENDING";

const sanitizeText = (value: string | undefined | null) => (value ?? "").trim();

const sanitizePhone = (value: string | undefined | null): string =>
  sanitizeText(value).replace(/\D+/g, "").slice(0, 10);

const sanitizeOrderNotes = (value: string | undefined | null): string =>
  sanitizeText(value).replace(/\s+/g, " ").slice(0, 280);

const isValidPhone = (phone: string): boolean => /^\d{10}$/.test(phone);

const toSafeNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

/**
 * Look up an existing customer by sanitized phone + client_id.
 * Returns their name when found so the UI can show a welcome message.
 */
export async function lookupCustomerAction(rawPhone: string): Promise<LookupCustomerResult> {
  try {
    const phone = sanitizePhone(rawPhone);
    if (!isValidPhone(phone)) return { found: false };

    const clientId = getConfiguredClientId();
    if (!clientId) return { found: false };

    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from("customers")
      .select("id,name")
      .eq("phone", phone)
      .eq("client_id", clientId)
      .maybeSingle();

    if (error || !data) return { found: false };
    return { found: true, name: data.name };
  } catch {
    return { found: false };
  }
}

/**
 * Resolve or create a customer record and return their id.
 * Returns null only when creation fails unexpectedly.
 */
async function resolveCustomerId(
  supabase: ReturnType<typeof createAdminSupabase>,
  clientId: string,
  name: string,
  phone: string,
  email?: string,
  dob?: string,
): Promise<string | null> {
  // 1. Try to find existing customer (exact phone + client scoped)
  const { data: existing, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .eq("client_id", clientId)
    .maybeSingle();

  if (lookupError) {
    console.warn("[order] customer lookup error (non-fatal)", {
      code: lookupError.code,
      message: lookupError.message,
    });
  }

  if (existing) {
    console.log("[order] existing customer resolved", { customerId: existing.id });
    return existing.id;
  }

  // 2. Create new customer
  const newCustomer: Record<string, string | boolean> = {
    client_id: clientId,
    name,
    phone,
    is_active: true,
  };
  if (email) newCustomer.email = email;
  if (dob) newCustomer.dob = dob;

  const { data: created, error: createError } = await supabase
    .from("customers")
    .insert(newCustomer)
    .select("id")
    .single();

  if (createError) {
    // Handle race condition: another request may have inserted the same customer
    if (createError.code === "23505") {
      console.log("[order] duplicate customer race condition — re-fetching", {
        code: createError.code,
      });
      const { data: refetched, error: refetchError } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .eq("client_id", clientId)
        .maybeSingle();

      if (!refetchError && refetched) return refetched.id;
    }

    console.error("[order] customer creation failed", {
      code: createError.code,
      message: createError.message,
    });
    return null;
  }

  console.log("[order] new customer created", { customerId: created?.id });
  return created?.id ?? null;
}

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  try {
    const tableNumber = sanitizeText(input.tableNumber).toUpperCase();
    const customerName = sanitizeText(input.customerName);
    const customerPhone = sanitizePhone(input.customerPhone);
    const customerEmail = sanitizeText(input.customerEmail) || undefined;
    const customerDob = sanitizeText(input.customerDob) || undefined;
    const orderNotes = sanitizeOrderNotes(input.notes);

    if (!tableNumber || !customerName || !customerPhone || input.items.length === 0) {
      console.log("[order] validation failed: missing required fields", {
        hasTableNumber: Boolean(tableNumber),
        hasCustomerName: Boolean(customerName),
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

    const supabase = createAdminSupabase();
    const orderNotesSupport = await getOrderNotesSupport();

    // Resolve customer: look up existing or create new
    const customerId = await resolveCustomerId(
      supabase,
      clientId,
      customerName,
      customerPhone,
      customerEmail,
      customerDob,
    );

    // Build bill payload — prefer customer_id linkage; fall back to walk_in only when customer
    // resolution failed unexpectedly so order placement can still succeed.
    const billInsertPayload: Record<string, string | number> = {
      client_id: clientId,
      table_number: tableNumber,
      total_amount: totalAmount,
      discount,
      final_amount: finalAmount,
      status: REQUIRED_STATUS,
    };

    if (customerId) {
      billInsertPayload.customer_id = customerId;
    } else {
      // Graceful walk-in fallback
      console.warn("[order] customer resolution failed — using walk_in fallback", {
        tableNumber,
      });
      billInsertPayload.walk_in_name = customerName;
      billInsertPayload.walk_in_phone = customerPhone;
    }

    if (orderNotesSupport.columnName && orderNotes) {
      billInsertPayload[orderNotesSupport.columnName] = orderNotes;
    }

    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert(billInsertPayload)
      .select("id,client_id")
      .single();

    if (billError) {
      console.error("[order] supabase insert bills failed", {
        code: billError.code,
        message: billError.message,
        details: (billError as { details?: unknown }).details,
        hint: (billError as { hint?: unknown }).hint,
        payloadShape: {
          hasCustomerId: Boolean(billInsertPayload.customer_id),
          hasWalkInFallback: Boolean(billInsertPayload.walk_in_name),
        },
      });
    }

    if (billError || !bill) {
      return { ok: false, error: "Could not place order. Please try again." };
    }

    if (bill.client_id !== clientId) {
      console.error("[order] inserted bill missing expected client_id", {
        billId: bill.id,
        expectedClientId: clientId,
        actualClientId: bill.client_id,
      });

      const { error: rollbackError } = await supabase.from("bills").delete().eq("id", bill.id);
      if (rollbackError) {
        console.error("[order] rollback delete bills failed after client_id mismatch", {
          code: rollbackError.code,
          message: rollbackError.message,
        });
      }

      return { ok: false, error: "Could not place order. Please try again." };
    }

    const billItemPayload = normalizedItems.map((item) => ({
      bill_id: bill.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    }));

    const { error: itemError } = await supabase.from("bill_items").insert(billItemPayload);

    if (itemError) {
      console.error("[order] supabase insert bill_items failed", {
        code: itemError.code,
        message: itemError.message,
        details: (itemError as { details?: unknown }).details,
        hint: (itemError as { hint?: unknown }).hint,
        payloadShape: {
          billId: bill.id,
          itemsCount: billItemPayload.length,
          hasInvalidProductId: billItemPayload.some((item) => !item.product_id),
        },
      });

      const { error: rollbackError } = await supabase.from("bills").delete().eq("id", bill.id);
      if (rollbackError) {
        console.error("[order] rollback delete bills failed", {
          code: rollbackError.code,
          message: rollbackError.message,
        });
      }

      return { ok: false, error: "Could not save order items. Please retry." };
    }

    return { ok: true, orderId: bill.id };
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
