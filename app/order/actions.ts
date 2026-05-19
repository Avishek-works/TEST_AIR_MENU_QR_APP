"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import { getConfiguredClientId } from "@/lib/config";
import { getOrderNotesSupport } from "@/lib/order-capabilities";
import type { PlaceOrderInput, PlaceOrderResult } from "@/lib/types";

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

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  try {
    const tableNumber = sanitizeText(input.tableNumber).toUpperCase();
    const customerName = sanitizeText(input.customerName);
    const customerPhone = sanitizePhone(input.customerPhone);
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

    const billInsertPayload: Record<string, string | number> = {
      client_id: clientId,
      walk_in_name: customerName,
      walk_in_phone: customerPhone,
      table_number: tableNumber,
      total_amount: totalAmount,
      discount,
      final_amount: finalAmount,
      status: REQUIRED_STATUS,
    };

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
          ...billInsertPayload,
          walk_in_name: Boolean(billInsertPayload.walk_in_name),
          walk_in_phone_len: String(billInsertPayload.walk_in_phone ?? "").length,
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
