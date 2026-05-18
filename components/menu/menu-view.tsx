"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatCurrency } from "@/lib/format";
import type { MenuCategory, MenuItem } from "@/lib/types";

interface MenuViewProps {
  tableNumber: string;
  categories: MenuCategory[];
  items: MenuItem[];
}

export function MenuView({ tableNumber, categories, items }: MenuViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [bestOnly, setBestOnly] = useState(false);
  const { items: cartItems, addItem, setQty } = useCart();

  const qtyById = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((item) => map.set(item.menuItemId, item.qty));
    return map;
  }, [cartItems]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory && item.category_id !== activeCategory) return false;
      if (vegOnly && !item.is_veg) return false;
      if (nonVegOnly && !item.is_non_veg) return false;
      if (bestOnly && !item.is_bestseller) return false;
      if (!normalizedQuery) return true;
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        (item.description ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeCategory, bestOnly, items, nonVegOnly, query, vegOnly]);

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Table {tableNumber}</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">Menu</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search coffee, burger, pizza..."
        className="mt-4 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none ring-red-500/40 placeholder:text-zinc-500 focus:ring"
      />

      <div className="sticky top-0 z-20 mt-4 space-y-3 bg-black/95 pb-3 pt-1 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${
                activeCategory === category.id
                  ? "border-red-500 bg-red-600 text-white"
                  : "border-zinc-700 bg-zinc-900 text-zinc-300"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterButton label="Veg" active={vegOnly} onClick={() => setVegOnly((v) => !v)} />
          <FilterButton label="Non-veg" active={nonVegOnly} onClick={() => setNonVegOnly((v) => !v)} />
          <FilterButton label="Bestseller" active={bestOnly} onClick={() => setBestOnly((v) => !v)} />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400">No menu items found.</div>
      ) : (
        <div className="mt-2 space-y-3 pb-4">
          {filteredItems.map((item) => {
            const qty = qtyById.get(item.id) ?? 0;
            return (
              <article key={item.id} className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
                  <Image
                    src={item.image_url || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500"}
                    alt={item.name}
                    fill
                    sizes="96px"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">{item.name}</h3>
                    <p className="shrink-0 text-sm font-semibold text-zinc-100">{formatCurrency(item.price)}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{item.description || "Freshly prepared."}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.is_veg ? <Badge label="Veg" tone="green" /> : null}
                    {item.is_non_veg ? <Badge label="Non-veg" tone="amber" /> : null}
                    {item.is_bestseller ? <Badge label="Bestseller" tone="red" /> : null}
                  </div>
                  <div className="mt-3">
                    <QuantityStepper
                      quantity={qty}
                      onIncrease={() =>
                        addItem({
                          menuItemId: item.id,
                          itemName: item.name,
                          unitPrice: item.price,
                          imageUrl: item.image_url,
                        })
                      }
                      onDecrease={() => setQty(item.id, qty - 1)}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
        active ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400"
      }`}
    >
      {label}
    </button>
  );
}

function Badge({ label, tone }: { label: string; tone: "green" | "amber" | "red" }) {
  const classes = {
    green: "bg-emerald-900/40 text-emerald-300",
    amber: "bg-amber-900/40 text-amber-300",
    red: "bg-red-900/40 text-red-300",
  };

  return <span className={`rounded-full px-2 py-1 text-[10px] ${classes[tone]}`}>{label}</span>;
}
