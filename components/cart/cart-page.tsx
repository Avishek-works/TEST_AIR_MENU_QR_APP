"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatCurrency } from "@/lib/format";

export function CartPageView({ tableId }: { tableId: string }) {
  const { items, subtotal, notes, setNotes, setQty } = useCart();

  return (
    <section>
      <div className="rounded-[2rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-5 shadow-[0_18px_40px_-20px_rgba(74,44,33,0.04)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Table {tableId}</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--brand-brown)]">Your cart</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Review your selections and adjust quantities before checkout.</p>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-[1.75rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-beige)] p-6 text-center shadow-[0_14px_30px_-20px_rgba(74,44,33,0.06)]">
          <p className="text-sm text-[var(--muted)]">Your cart is empty.</p>
          <Link
            href={`/order/table/${tableId}/menu`}
            className="mt-5 inline-flex min-h-[3rem] w-full items-center justify-center rounded-2xl bg-[var(--brand-brown)] px-4 text-sm font-semibold text-[var(--brand-white)] transition hover:brightness-95"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <article key={item.menuItemId} className="rounded-[1.75rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-beige)] p-5 shadow-[0_12px_30px_-18px_rgba(74,44,33,0.06)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--brand-brown)]">{item.itemName}</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                  <p className="text-base font-semibold text-[var(--brand-brown)]">{formatCurrency(item.qty * item.unitPrice)}</p>
                </div>
                <div className="mt-4">
                  <QuantityStepper
                    quantity={item.qty}
                    onDecrease={() => setQty(item.menuItemId, item.qty - 1)}
                    onIncrease={() => setQty(item.menuItemId, item.qty + 1)}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-beige)] p-5 shadow-[0_18px_40px_-22px_rgba(74,44,33,0.06)]">
            <label className="block text-sm text-[var(--muted)]">
              Order notes
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Less sugar, no onion..."
                className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--brand-white)] px-4 py-3 text-sm text-[var(--brand-brown)] outline-none transition focus:border-[var(--brand-brown)] focus:ring-2 focus:ring-[var(--brand-brown-opaque)]"
              />
            </label>

            <div className="mt-5 rounded-[1.5rem] bg-[var(--brand-white)] p-4">
              <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-lg font-semibold text-[var(--brand-brown)]">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </div>

          <Link
            href={`/order/table/${tableId}/details`}
            className="mt-6 inline-flex min-h-[3rem] w-full items-center justify-center rounded-2xl bg-[var(--brand-brown)] px-4 font-semibold text-[var(--brand-white)] transition hover:brightness-95"
            style={{ boxShadow: '0 8px 20px rgba(74,44,33,0.12)' }}
          >
            Continue to details
          </Link>
        </>
      )}
    </section>
  );
}
