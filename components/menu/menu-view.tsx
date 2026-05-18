"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );
  const [activeCategory, setActiveCategory] = useState<string>(sortedCategories[0]?.id ?? "");

  useEffect(() => {
    if (!activeCategory && sortedCategories.length) {
      setActiveCategory(sortedCategories[0].id);
    }
  }, [activeCategory, sortedCategories]);
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
      <div className="rounded-[2rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.04)]">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Table {tableNumber}</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--brand-brown)]">Explore the menu</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Handcrafted drinks and gourmet bites designed for a premium coffee house experience.
        </p>
      </div>

      <div className="mt-5 rounded-[1.75rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-beige)] p-4 shadow-[0_12px_28px_-18px_rgba(74,44,33,0.06)]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for latte, bakery or flavors"
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--brand-white)] px-4 py-3 text-sm text-[var(--brand-brown)] outline-none transition focus:border-[var(--brand-brown)] focus:ring-2 focus:ring-[var(--brand-brown-opaque)]"
        />

        <div className="mt-4 space-y-3">
          <div className="flex gap-3 overflow-x-auto scroll-smooth pb-1">
            {sortedCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeCategory === category.id
                    ? "border-[var(--brand-brown-opaque)] bg-[var(--brand-brown)] text-[var(--brand-white)] shadow-[0_10px_20px_-12px_rgba(74,44,33,0.8)]"
                    : "border-[var(--border)] bg-[var(--brand-beige)] text-[var(--brand-brown)]"
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
      </div>

      {filteredItems.length === 0 ? (
        <div className="mt-6 rounded-[1.75rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-beige)] p-6 text-sm text-[var(--muted)]">
          No items match your search.
        </div>
      ) : (
        <div className="mt-6 space-y-4 pb-6">
          {filteredItems.map((item) => {
            const qty = qtyById.get(item.id) ?? 0;
            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[1.75rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-beige)] shadow-[0_12px_25px_-14px_rgba(74,44,33,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(74,44,33,0.08)]"
              >
                <div className="relative h-44 w-full overflow-hidden bg-[var(--brand-beige)]">
                  <Image
                    src={item.image_url || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500"}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    loading="lazy"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-lg font-semibold text-[var(--brand-brown)]">{item.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description || "Freshly prepared."}</p>
                    </div>
                    <p className="shrink-0 whitespace-nowrap rounded-full bg-[var(--brand-brown)] px-3 py-1 text-sm font-semibold text-[var(--brand-white)]">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {item.is_veg ? <Badge label="Veg" tone="green" /> : null}
                    {item.is_non_veg ? <Badge label="Non-veg" tone="amber" /> : null}
                    {item.is_bestseller ? <Badge label="Bestseller" tone="red" /> : null}
                  </div>
                  <div className="mt-4">
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
      className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[var(--brand-brown)] text-[var(--brand-white)] shadow-[0_8px_20px_-16px_rgba(74,44,33,0.7)]"
          : "bg-[var(--brand-beige)] text-[var(--brand-brown)] hover:brightness-95"
      }`}
    >
      {label}
    </button>
  );
}

function Badge({ label, tone }: { label: string; tone: "green" | "amber" | "red" }) {
  const classes = {
    green: "bg-[var(--brand-brown)]/15 text-[var(--brand-brown)]",
    amber: "bg-[var(--brand-brown)]/15 text-[var(--brand-brown)]",
    red: "bg-[var(--brand-brown)]/15 text-[var(--brand-brown)]",
  };

  return <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${classes[tone]}`}>{label}</span>;
}
