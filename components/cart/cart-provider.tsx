"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLineItem, CustomerDraft } from "@/lib/types";

const STORAGE_KEY = "cca-cart-v1";

interface StoredCart {
  tableId: string | null;
  notes: string;
  customer: CustomerDraft;
  items: Record<string, CartLineItem>;
}

interface CartContextValue {
  tableId: string | null;
  items: CartLineItem[];
  notes: string;
  customer: CustomerDraft;
  itemCount: number;
  subtotal: number;
  setTable: (tableId: string) => void;
  addItem: (item: Omit<CartLineItem, "qty">) => void;
  setQty: (menuItemId: string, qty: number) => void;
  setNotes: (notes: string) => void;
  setCustomer: (customer: Partial<CustomerDraft>) => void;
  clearCart: () => void;
}

const defaultCustomer: CustomerDraft = { name: "", phone: "", email: "", dob: "" };

const emptyCart: StoredCart = {
  tableId: null,
  notes: "",
  customer: defaultCustomer,
  items: {},
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<StoredCart>(emptyCart);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredCart;
      setCart({
        tableId: parsed.tableId ?? null,
        notes: parsed.notes ?? "",
        customer: { ...defaultCustomer, ...(parsed.customer ?? {}) },
        items: parsed.items ?? {},
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const items = useMemo(() => Object.values(cart.items), [cart.items]);
  const itemCount = useMemo(() => items.reduce((acc, item) => acc + item.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0), [items]);

  const value: CartContextValue = {
    tableId: cart.tableId,
    items,
    notes: cart.notes,
    customer: cart.customer,
    itemCount,
    subtotal,
    setTable: (tableId) =>
      setCart((current) =>
        current.tableId === tableId ? current : { tableId, notes: "", customer: defaultCustomer, items: {} },
      ),
    addItem: (item) =>
      setCart((current) => {
        const existing = current.items[item.menuItemId];
        return {
          ...current,
          items: {
            ...current.items,
            [item.menuItemId]: {
              ...item,
              qty: existing ? existing.qty + 1 : 1,
            },
          },
        };
      }),
    setQty: (menuItemId, qty) =>
      setCart((current) => {
        if (qty <= 0) {
          const next = { ...current.items };
          delete next[menuItemId];
          return { ...current, items: next };
        }

        const existing = current.items[menuItemId];
        if (!existing) return current;
        return { ...current, items: { ...current.items, [menuItemId]: { ...existing, qty } } };
      }),
    setNotes: (notes) => setCart((current) => ({ ...current, notes })),
    setCustomer: (customer) =>
      setCart((current) => ({ ...current, customer: { ...current.customer, ...customer } })),
    clearCart: () => setCart((current) => ({ ...current, notes: "", items: {} })),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
