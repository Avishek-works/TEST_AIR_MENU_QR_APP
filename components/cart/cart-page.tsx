"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatCurrency } from "@/lib/format";

export function CartPageView({ tableId }: { tableId: string }) {
  const { items, subtotal, notes, setNotes, setQty } = useCart();

  return (
    <section>
      {/* Header */}
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.55)]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent-gold)] opacity-90">Table {tableId}</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Your cart</h1>
      </div>

      <Link
        href={`/order/table/${tableId}/menu`}
        className="btn-ghost mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--border-warm)] hover:text-[var(--text-primary)]"
      >
        ← Add More Items
      </Link>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center shadow-[0_10px_24px_-16px_rgba(0,0,0,0.5)]">
          <p className="text-2xl">☕</p>
          <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">Your cart is empty</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Browse the menu and add your favourites.</p>
          <Link
            href={`/order/table/${tableId}/menu`}
            className="btn-gold mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-bold shadow-[0_4px_14px_rgba(252,176,58,0.25)]"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <>
          {/* Cart items */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_8px_28px_-18px_rgba(0,0,0,0.55)]">
            <div className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <article key={item.menuItemId} className="flex items-center gap-3 p-3.5">
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">{item.itemName}</h2>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{formatCurrency(item.unitPrice)} each</p>
                    <p className="mt-0.5 text-sm font-bold text-[var(--accent-gold)]">{formatCurrency(item.qty * item.unitPrice)}</p>
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

            <label className="block border-t border-[var(--border)] p-3.5 text-xs font-medium text-[var(--text-secondary)]">
              Order notes (optional)
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Less sugar, extra hot, no onion…"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all duration-200 focus:border-[var(--border-warm)] focus:ring-2 focus:ring-[var(--accent-gold-soft)] resize-none"
              />
            </label>
          </div>

          {/* Sticky checkout */}
          <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-20 mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)] backdrop-blur-sm">
            <div className="p-4 pb-0">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Subtotal ({items.reduce((a, i) => a + i.qty, 0)} items)</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-base font-bold text-[var(--text-primary)]">Total</span>
                <span className="text-xl font-bold text-[var(--accent-gold)] tracking-tight">{formatCurrency(subtotal)}</span>
              </div>
            </div>
            <div className="p-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              <Link
                href={`/order/table/${tableId}/details`}
                className="btn-gold inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold shadow-[0_4px_18px_rgba(252,176,58,0.30)] tracking-wide"
              >
                Continue to checkout →
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
