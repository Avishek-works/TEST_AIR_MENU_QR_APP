"use server";

import {
  createCustomer,
  findCustomerProfileByPhone,
} from "@/db/customers";
import { createBill, deleteBillById } from "@/db/bills";
import { createBillItems } from "@/db/orders";
import { getConfiguredClientId } from "@/lib/config";
import type { PlaceOrderInput, PlaceOrderResult } from "@/lib/types";

/* ---------------- helpers ---------------- */

const sanitize = (v: unknown): string =>
  typeof v === "string" ? v.trim() : String(v ?? "").trim();

const phone = (v: unknown): string =>
  sanitize(v).replace(/\D+/g, "").slice(0, 10);

const isValidPhone = (p: string): boolean => /^\d{10}$/.test(p);

/* ---------------- lookup action (FIX MISSING EXPORT) ---------------- */

export async function lookupCustomerByPhoneAction(
  phoneInput: string
) {
  try {
    const clientId = getConfiguredClientId();
    const sanitizedPhone = phone(phoneInput);

    if (!clientId || !isValidPhone(sanitizedPhone)) {
      return { found: false };
    }

    const { data } = await findCustomerProfileByPhone(
      clientId,
      sanitizedPhone
    );

    if (!data) return { found: false };

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

/* ---------------- place order ---------------- */

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

    const items = (input.items ?? [])
      .map((i) => {
        const qty = Number(i.qty ?? 0);
        const price = Number(i.unitPrice ?? 0);

        return {
          productId: sanitize(i.menuItemId ?? i.productId),
          quantity: qty,
          price,
          total: qty * price,
        };
      })
      .filter((i) => i.productId && i.quantity > 0);

    if (!items.length) return { ok: false, error: "Cart empty" };

    let customerId: string | undefined;

    const existing = await findCustomerProfileByPhone(
      clientId,
      customerPhone
    );

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

    const total = items.reduce((a, b) => a + b.total, 0);

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
      return { ok: false, error: "Bill failed" };
    }

    const billId = bill.data.id;

    const { error: itemError } = await createBillItems(
      items.map((i) => ({
        billId,
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
      }))
    );

    if (itemError) {
      await deleteBillById(billId);
      return { ok: false, error: "Item insert failed" };
    }

    return {
      ok: true,
      orderId: billId,
    };
  } catch {
    return { ok: false, error: "Server error" };
  }
}
