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
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md p-3">
      <Link
        href={`/order/table/${tableId}/cart`}
        className="flex h-16 items-center justify-between rounded-[1.5rem] bg-[var(--brand-brown)] px-5 text-[var(--brand-white)] shadow-[0_20px_46px_-20px_rgba(74,44,33,0.18)] transition hover:brightness-95"
      >
        <span className="text-sm font-semibold">{itemCount} item(s)</span>
        <span className="text-sm font-semibold">Cart · {formatCurrency(subtotal)}</span>
      </Link>
    </div>
  );
}
