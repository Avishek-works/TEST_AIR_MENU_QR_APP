"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";

export function TableSession({ tableId }: { tableId: string }) {
  const { setTable } = useCart();

  useEffect(() => {
    setTable(tableId);
  }, [setTable, tableId]);

  return null;
}
