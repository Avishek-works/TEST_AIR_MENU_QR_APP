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
        className="flex h-14 items-center justify-between rounded-xl bg-red-600 px-4 text-white shadow-xl shadow-red-950/40"
      >
        <span className="text-sm font-medium">{itemCount} item(s)</span>
        <span className="text-sm font-semibold">View Cart · {formatCurrency(subtotal)}</span>
      </Link>
    </div>
  );
}
