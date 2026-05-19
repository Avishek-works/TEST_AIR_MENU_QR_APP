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
        className="flex h-16 items-center justify-between rounded-[1.5rem] bg-[var(--gold)] px-5 text-[var(--button-text)] shadow-[0_8px_32px_rgba(252,176,58,0.30),0_20px_48px_-20px_rgba(0,0,0,0.5)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_8px_36px_rgba(252,176,58,0.40)] active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--button-text)]/15 text-xs font-bold">
            {itemCount}
          </span>
          {itemCount === 1 ? "1 item" : `${itemCount} items`}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-bold">
          View Cart · {formatCurrency(subtotal)}
          <span className="text-base">→</span>
        </span>
      </Link>
    </div>
  );
}
