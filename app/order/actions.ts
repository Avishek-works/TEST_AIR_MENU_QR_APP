"use server";

import { createBill, deleteBillById } from "@/db/bills";
import {
  createCustomer,
  findCustomerProfileByPhone,
} from "@/db/customers";
import { createBillItems } from "@/db/orders";
import { getConfiguredClientId } from "@/lib/config";
import type { PlaceOrderInput, PlaceOrderResult } from "@/lib/types";

const sanitize = (v: any) => (v ?? "").toString().trim();
const phone = (v: any) => sanitize(v).replace(/\D+/g, "").slice(0, 10);

export async function placeOrderAction(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  try {
    const clientId = getConfiguredClientId();
    if (!clientId) return { ok: false, error: "Config missing" };

    const tableNumber = sanitize(input.tableNumber).toUpperCase();
    const customerPhone = phone(input.customerPhone);
    const customerName = sanitize(input.customerName);

    if (!tableNumber || !customerPhone || !input.items?.length) {
      return { ok: false, error: "Missing fields" };
    }

    const normalizedItems = input.items
      .map((i) => ({
        productId: sanitize(i.menuItemId ?? i.productId),
        quantity: Number(i.qty || 0),
        price: Number(i.unitPrice || 0),
      }))
      .filter((i) => i.productId && i.quantity > 0);

    if (!normalizedItems.length) {
      return { ok: false, error: "Cart empty" };
    }

    let customerId;

    const existing = await findCustomerProfileByPhone(clientId, customerPhone);
    customerId = existing.data?.id;

    if (!customerId) {
      const created = await createCustomer({
        clientId,
        name: customerName,
        phone: customerPhone,
      });

      if (!created.data) {
        return { ok: false, error: "Customer failed" };
      }

      customerId = created.data.id;
    }

    const bill = await createBill({
      clientId,
      customerId,
      tableNumber,
      totalAmount: normalizedItems.reduce(
        (a, b) => a + b.quantity * b.price,
        0
      ),
      discount: 0,
      finalAmount: normalizedItems.reduce(
        (a, b) => a + b.quantity * b.price,
        0
      ),
      status: "PENDING",
    });

    if (bill.error || !bill.data) {
      return { ok: false, error: "Bill failed" };
    }

    await createBillItems(
      normalizedItems.map((i) => ({
        billId: bill.data.id,
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        total: i.quantity * i.price,
      }))
    );

    // IMPORTANT: single source of truth
    return {
      ok: true,
      orderId: bill.data.id,
    };
  } catch (e) {
    return { ok: false, error: "Server error" };
  }
}
