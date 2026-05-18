"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatCurrency } from "@/lib/format";

export function CartPageView({ tableId }: { tableId: string }) {
  const { items, subtotal, notes, setNotes, setQty } = useCart();

  return (
    <section>
      <h1 className="text-2xl font-semibold text-white">Your Cart</h1>
      <p className="mt-1 text-sm text-zinc-400">Table {tableId}</p>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-sm text-zinc-400">Your cart is empty.</p>
          <Link
            href={`/order/table/${tableId}/menu`}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-red-600 text-sm font-medium text-white"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <article key={item.menuItemId} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">{item.itemName}</h2>
                    <p className="mt-1 text-xs text-zinc-400">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                  <p className="text-sm font-semibold text-white">{formatCurrency(item.qty * item.unitPrice)}</p>
                </div>
                <div className="mt-3">
                  <QuantityStepper
                    quantity={item.qty}
                    onDecrease={() => setQty(item.menuItemId, item.qty - 1)}
                    onIncrease={() => setQty(item.menuItemId, item.qty + 1)}
                  />
                </div>
              </article>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="text-sm text-zinc-300">Order Notes</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Less sugar, no onion..."
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-red-500/40 placeholder:text-zinc-500 focus:ring"
            />
          </label>

          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between text-sm text-zinc-300">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base font-semibold text-white">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <Link
            href={`/order/table/${tableId}/details`}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-red-600 font-medium text-white"
          >
            Continue
          </Link>
        </>
      )}
    </section>
  );
}
