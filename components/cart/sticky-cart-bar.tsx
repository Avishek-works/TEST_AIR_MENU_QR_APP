"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/format";

export function StickyCartBar({ tableId }: { tableId: string }) {
  const pathname = usePathname();
  const { itemCount, subtotal } = useCart();

  if (itemCount === 0) return null;
  if (pathname.endsWith("/cart") || pathname.endsWith("/details") || pathname.endsWith("/success")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
      <Link
        href={`/order/table/${tableId}/cart`}
        className="flex h-16 items-center justify-between rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 text-[var(--text-primary)] shadow-[0_14px_36px_-20px_rgba(0,0,0,0.55)] transition duration-200 hover:-translate-y-[0.5px] hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.55)] active:scale-[0.99]"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-primary)] text-xs font-bold">
            {itemCount}
          </span>
          {itemCount === 1 ? "1 item" : `${itemCount} items`}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)]">
          View Cart · <span className="text-[var(--accent-gold)]">{formatCurrency(subtotal)}</span>
          <span className="text-base">→</span>
        </span>
      </Link>
    </div>
  );
}
