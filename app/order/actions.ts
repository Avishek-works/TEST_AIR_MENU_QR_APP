"use server";

import {
  createCustomer,
  findCustomerProfileByPhone,
} from "@/db/customers";
import { createBill } from "@/db/bills";
import { createBillItems } from "@/db/orders";
import { getConfiguredClientId } from "@/lib/config";
import type { PlaceOrderInput, PlaceOrderResult } from "@/lib/types";

/* ---------------- helpers ---------------- */

const sanitize = (v: unknown): string =>
  typeof v === "string" ? v.trim() : String(v ?? "").trim();

const phone = (v: unknown): string =>
  sanitize(v).replace(/\D+/g, "").slice(0, 10);

const isValidPhone = (p: string): boolean => /^\d{10}$/.test(p);

/* ---------------- main action ---------------- */

export async function placeOrderAction(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  try {
    const clientId = getConfiguredClientId();
    if (!clientId) return { ok: false, error: "Missing config" };

    const tableNumber = sanitize(input.tableNumber).toUpperCase();
    const customerPhone = phone(input.customerPhone);
    const customerName = sanitize(input.customerName);

    if (!tableNumber || !isValidPhone(customerPhone)) {
      return { ok: false, error: "Invalid input" };
    }

    /* ---------------- normalize cart items ---------------- */

    const items = (input.items ?? [])
      .map((i) => {
        const qty = Number(i.qty ?? 0);
        const price = Number(i.unitPrice ?? 0);

        // SAFE: no any, supports both field names
        const productId =
          "menuItemId" in i
            ? String((i as { menuItemId: string }).menuItemId)
            : "productId" in i
              ? String((i as { productId: string }).productId)
              : "";

        return {
          productId,
          quantity: qty,
          price,
          total: qty * price,
        };
      })
      .filter((i) => i.productId && i.quantity > 0);

    if (!items.length) {
      return { ok: false, error: "Cart empty" };
    }

    /* ---------------- customer resolve ---------------- */

    const existing = await findCustomerProfileByPhone(
      clientId,
      customerPhone
    );

    let customerId: string;

    if (existing.data?.id) {
      customerId = existing.data.id;
    } else {
      const created = await createCustomer({
        clientId,
        name: customerName,
        phone: customerPhone,
      });

      if (!created.data) {
        return { ok: false, error: "Customer creation failed" };
      }

      customerId = created.data.id;
    }

    /* ---------------- bill calculation ---------------- */

    const total = items.reduce((sum, i) => sum + i.total, 0);

    const bill = await createBill({
      clientId,
      customerId,
      tableNumber,
      totalAmount: total,
      discount: 0,
      finalAmount: total,
      status: "PENDING",
    });

    if (bill.error || !bill.data) {
      return { ok: false, error: "Bill creation failed" };
    }

    /* ---------------- bill items ---------------- */

    const itemsPayload = items.map((i) => ({
      billId: bill.data.id,
      productId: i.productId,
      quantity: i.quantity,
      price: i.price,
      total: i.total,
    }));

    const itemResult = await createBillItems(itemsPayload);

    if (itemResult?.error) {
      return { ok: false, error: "Failed to save items" };
    }

    return {
      ok: true,
      orderId: bill.data.id,
    };
  } catch {
    return { ok: false, error: "Server error" };
  }
}

/* ---------------- customer lookup (required by UI) ---------------- */

export async function lookupCustomerByPhoneAction(phoneInput: string) {
  try {
    const clientId = getConfiguredClientId();
    if (!clientId) return { found: false };

    const phone = String(phoneInput).replace(/\D+/g, "").slice(0, 10);

    if (phone.length !== 10) {
      return { found: false };
    }

    const { data, error } = await findCustomerProfileByPhone(
      clientId,
      phone
    );

    if (error || !data) {
      return { found: false };
    }

    return {
      found: true,
      customer: {
        id: data.id,
        name: data.name,
        email: data.email,
        dob: data.dob,
      },
    };
  } catch {
    return { found: false };
  }
}
