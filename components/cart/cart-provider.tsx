"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLineItem, CustomerDraft, OrderType } from "@/lib/types";

const STORAGE_KEY = "cca-cart-v1";
const DEFAULT_ORDER_TYPE: OrderType = "Dine-In";

interface StoredCart {
  tableId: string | null;
  notes: string;
  customer: CustomerDraft;
  items: Record<string, CartLineItem>;
  orderType: OrderType;
}

interface CartContextValue {
  tableId: string | null;
  items: CartLineItem[];
  notes: string;
  customer: CustomerDraft;
  itemCount: number;
  subtotal: number;
  orderType: OrderType;
  setOrderType: (orderType: OrderType) => void;
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
  orderType: DEFAULT_ORDER_TYPE,
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const sanitizeLineItem = (value: unknown): CartLineItem | null => {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CartLineItem>;
  if (!item.menuItemId || !item.itemName || typeof item.unitPrice !== "number") return null;
  const normalizedMenuItemId = item.menuItemId.trim();
  const normalizedItemName = item.itemName.trim();
  if (!normalizedMenuItemId || !normalizedItemName) return null;
  if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) return null;

  const normalizedQty = Math.trunc(typeof item.qty === "number" ? item.qty : 1);
  if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) return null;

  const addons = Array.isArray(item.addons)
    ? item.addons
        .filter(
          (addon): addon is { name: string; price: number } =>
            Boolean(addon) &&
            typeof addon.name === "string" &&
            addon.name.trim().length > 0 &&
            typeof addon.price === "number" &&
            Number.isFinite(addon.price) &&
            addon.price >= 0,
        )
        .map((addon) => ({ name: addon.name.trim(), price: addon.price }))
    : [];

  const lineId = typeof item.lineId === "string" && item.lineId.trim().length > 0 ? item.lineId.trim() : normalizedMenuItemId;

  return {
    menuItemId: normalizedMenuItemId,
    itemName: normalizedItemName,
    unitPrice: item.unitPrice,
    qty: normalizedQty,
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
    lineId,
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

  const rawOrderType = typeof parsed.orderType === "string" ? parsed.orderType : DEFAULT_ORDER_TYPE;
  const orderType = rawOrderType === "Take-Away" || rawOrderType === "Takeaway" ? "Take-Away" : DEFAULT_ORDER_TYPE;

  return {
    tableId: typeof parsed.tableId === "string" ? parsed.tableId : null,
    notes: typeof parsed.notes === "string" ? parsed.notes : "",
    customer: { ...defaultCustomer, ...(parsed.customer ?? {}) },
    items: sanitizedItems,
    orderType,
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
    orderType: cart.orderType,
    setOrderType: (orderType) => setCart((current) => ({ ...current, orderType })),
    setTable: (tableId) =>
      setCart((current) =>
        current.tableId === tableId
          ? current
          : { tableId, notes: "", customer: defaultCustomer, items: {}, orderType: current.orderType },
      ),
    addItem: (item) =>
      setCart((current) => {
        const lineKey = (item.lineId ?? item.menuItemId).trim() || item.menuItemId;
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

        const plainLine = matchingItems.find(([, item]) => (item.addons?.length ?? 0) === 0)?.[0];
        const lineToDecrease =
          plainLine ??
          matchingItems
            .map(([lineId]) => lineId)
            .sort((left, right) => left.localeCompare(right))[0];
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
