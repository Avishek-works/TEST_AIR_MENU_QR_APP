"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import type { PlaceOrderInput, PlaceOrderResult } from "@/lib/types";

const REQUIRED_STATUS = "NEW";
const REQUIRED_PAYMENT_STATUS = "UNPAID";

const sanitizeText = (value: string | undefined | null) => (value ?? "").trim();

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  try {
  const tableNumber = sanitizeText(input.tableNumber).toUpperCase();
  const customerName = sanitizeText(input.customerName);
  const customerPhone = sanitizeText(input.customerPhone);

  if (!tableNumber || !customerName || !customerPhone || input.items.length === 0) {
    return { ok: false, error: "Please complete required fields and cart items." };
  }

  const normalizedItems = input.items
    .filter((item) => item.qty > 0)
    .map((item) => ({
      menuItemId: item.menuItemId,
      itemName: item.itemName,
      qty: item.qty,
      unitPrice: item.unitPrice,
      totalPrice: item.qty * item.unitPrice,
    }));

  if (!normalizedItems.length) {
    return { ok: false, error: "Cart is empty." };
  }

  const subtotal = normalizedItems.reduce((acc, item) => acc + item.totalPrice, 0);

  const supabase = createAdminSupabase();

  if (input.clientToken) {
    const { data: existing } = await supabase
      .from("qr_orders")
      .select("id")
      .eq("client_order_token", input.clientToken)
      .maybeSingle();

    if (existing?.id) {
      return { ok: true, orderId: existing.id };
    }
  }

  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select("table_number")
    .eq("table_number", tableNumber)
    .eq("active", true)
    .maybeSingle();

  if (tableError || !table) {
    return { ok: false, error: "Table is invalid or inactive." };
  }

  const { data: order, error: orderError } = await supabase
    .from("qr_orders")
    .insert({
      table_number: tableNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: sanitizeText(input.customerEmail) || null,
      customer_dob: sanitizeText(input.customerDob) || null,
      notes: sanitizeText(input.notes) || null,
      subtotal,
      total: subtotal,
      status: REQUIRED_STATUS,
      payment_status: REQUIRED_PAYMENT_STATUS,
      client_order_token: sanitizeText(input.clientToken) || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    if (orderError?.code === "23505" && input.clientToken) {
      const { data: existing } = await supabase
        .from("qr_orders")
        .select("id")
        .eq("client_order_token", input.clientToken)
        .single();

      if (existing?.id) {
        return { ok: true, orderId: existing.id };
      }
    }

    return { ok: false, error: "Could not place order. Please try again." };
  }

  const { error: itemError } = await supabase.from("qr_order_items").insert(
    normalizedItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      item_name: item.itemName,
      qty: item.qty,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
    })),
  );

  if (itemError) {
    await supabase.from("qr_orders").delete().eq("id", order.id);
    return { ok: false, error: "Could not save order items. Please retry." };
  }

  return { ok: true, orderId: order.id };
  } catch {
    return { ok: false, error: "Unable to submit order. Please try again." };
  }
}
