"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatCurrency } from "@/lib/format";

export function CartPageView({ tableId }: { tableId: string }) {
  const { items, subtotal, notes, setNotes, setQty } = useCart();

  return (
    <section>
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--brand-beige)] p-4">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Table {tableId}</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--brand-brown)]">Your cart</h1>
      </div>

      <Link
        href={`/order/table/${tableId}/menu`}
        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--brand-white)] px-3 text-xs font-semibold text-[var(--muted)]"
      >
        ← Add More Items
      </Link>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--brand-beige)] p-4 text-center">
          <p className="text-sm text-[var(--muted)]">Your cart is empty.</p>
          <Link
            href={`/order/table/${tableId}/menu`}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-[var(--button-bg)] px-4 text-sm font-semibold text-[var(--brand-brown)]"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--brand-beige)]">
            <div className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <article key={item.menuItemId} className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-1 text-sm font-semibold text-[var(--brand-brown)]">{item.itemName}</h2>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{formatCurrency(item.unitPrice)} each</p>
                    <p className="text-xs font-semibold text-[var(--muted)]">{formatCurrency(item.qty * item.unitPrice)}</p>
                  </div>
                  <div className="shrink-0">
                    <QuantityStepper
                      quantity={item.qty}
                      onDecrease={() => setQty(item.menuItemId, item.qty - 1)}
                      onIncrease={() => setQty(item.menuItemId, item.qty + 1)}
                    />
                  </div>
                </article>
              ))}
            </div>

            <label className="block border-t border-[var(--border)] p-3 text-xs text-[var(--muted)]">
              Order notes
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Less sugar, no onion..."
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--brand-white)] px-3 py-2 text-sm text-[var(--brand-brown)] outline-none focus:border-[var(--muted)]"
              />
            </label>
          </div>

          <div className="sticky bottom-3 z-20 mt-4 rounded-2xl border border-[var(--border)] bg-[var(--brand-beige)] p-3 backdrop-blur">
            <div className="flex items-center justify-between text-sm text-[var(--muted)]">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-base font-semibold text-[var(--brand-brown)]">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <Link
              href={`/order/table/${tableId}/details`}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--button-bg)] px-4 text-sm font-semibold text-[var(--brand-brown)]"
            >
              Continue to details
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
