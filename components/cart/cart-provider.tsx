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
  setQty: (lineId: string, qty: number) => void;
  decreaseMenuItem: (menuItemId: string) => void;
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

const sanitizeLineItem = (value: unknown): CartLineItem | null => {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CartLineItem>;
  if (!item.menuItemId || !item.itemName || typeof item.unitPrice !== "number") return null;
  const addons =
    Array.isArray(item.addons) && item.addons.every((addon) => addon && typeof addon.name === "string" && typeof addon.price === "number")
      ? item.addons.map((addon) => ({ name: addon.name, price: addon.price }))
      : [];
  return {
    menuItemId: item.menuItemId,
    itemName: item.itemName,
    unitPrice: item.unitPrice,
    qty: typeof item.qty === "number" ? item.qty : 1,
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
    lineId: typeof item.lineId === "string" ? item.lineId : item.menuItemId,
    addons,
  };
};

const sanitizeStoredCart = (value: unknown): StoredCart => {
  const parsed = (value && typeof value === "object" ? value : {}) as Partial<StoredCart>;
  const rawItems = parsed.items && typeof parsed.items === "object" ? parsed.items : {};
  const sanitizedItems: Record<string, CartLineItem> = {};

  Object.entries(rawItems).forEach(([key, item]) => {
    const sanitized = sanitizeLineItem(item);
    if (sanitized) sanitizedItems[sanitized.lineId ?? key] = sanitized;
  });

  return {
    tableId: typeof parsed.tableId === "string" ? parsed.tableId : null,
    notes: typeof parsed.notes === "string" ? parsed.notes : "",
    customer: { ...defaultCustomer, ...(parsed.customer ?? {}) },
    items: sanitizedItems,
  };
};

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
      setCart(sanitizeStoredCart(JSON.parse(raw)));
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
        const lineKey = item.lineId ?? item.menuItemId;
        const existing = current.items[lineKey];
        const safeItem = sanitizeLineItem({ ...item, qty: 1 });
        if (!safeItem) return current;
        return {
          ...current,
          items: {
            ...current.items,
            [lineKey]: {
              ...safeItem,
              lineId: lineKey,
              qty: existing ? existing.qty + 1 : 1,
            },
          },
        };
      }),
    setQty: (lineId, qty) =>
      setCart((current) => {
        if (qty <= 0) {
          const next = { ...current.items };
          delete next[lineId];
          return { ...current, items: next };
        }

        const existing = current.items[lineId];
        if (!existing) return current;
        return { ...current, items: { ...current.items, [lineId]: { ...existing, qty } } };
      }),
    decreaseMenuItem: (menuItemId) =>
      setCart((current) => {
        const matchingItems = Object.entries(current.items).filter(([, item]) => item.menuItemId === menuItemId);
        if (!matchingItems.length) return current;

        const lineToDecrease =
          matchingItems.find(([, item]) => (item.addons?.length ?? 0) === 0)?.[0] ?? matchingItems[0][0];
        const existing = current.items[lineToDecrease];
        if (!existing) return current;

        if (existing.qty <= 1) {
          const next = { ...current.items };
          delete next[lineToDecrease];
          return { ...current, items: next };
        }

        return {
          ...current,
          items: { ...current.items, [lineToDecrease]: { ...existing, qty: existing.qty - 1 } },
        };
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
