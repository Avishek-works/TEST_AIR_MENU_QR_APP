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

const ALL_CATEGORY = "__all__";
const NON_VEG_KEYWORDS = ["chicken", "mutton", "fish", "egg", "prawn", "shrimp", "ham", "bacon", "sausage", "pepperoni"];
const BESTSELLER_KEYWORDS = ["latte", "cappuccino", "espresso", "americano", "mocha", "cold coffee", "brownie", "croissant"];

const NAME_IMAGE_RULES = [
  { keywords: ["espresso", "americano"], image: "/menu/coffee-espresso.svg" },
  { keywords: ["latte", "cappuccino", "mocha"], image: "/menu/coffee-latte.svg" },
  { keywords: ["tea", "green tea", "masala"], image: "/menu/tea.svg" },
  { keywords: ["croissant", "muffin", "pastry", "cake"], image: "/menu/bakery.svg" },
  { keywords: ["sandwich", "burger", "wrap", "fries", "pasta"], image: "/menu/snacks.svg" },
];

const CATEGORY_IMAGE_RULES = [
  { keys: ["coffee", "beverage"], image: "/menu/coffee-espresso.svg" },
  { keys: ["tea"], image: "/menu/tea.svg" },
  { keys: ["bakery", "dessert"], image: "/menu/bakery.svg" },
  { keys: ["snack", "food", "starter", "meal"], image: "/menu/snacks.svg" },
];

function isNonVeg(name: string) {
  const normalized = name.toLowerCase();
  return NON_VEG_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function isBestseller(name: string) {
  const normalized = name.toLowerCase();
  return BESTSELLER_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function getMenuImage(item: MenuItem) {
  const normalizedName = item.name.toLowerCase();
  const normalizedCategory = item.category_id.toLowerCase();

  for (const rule of NAME_IMAGE_RULES) {
    if (rule.keywords.some((keyword) => normalizedName.includes(keyword))) return rule.image;
  }

  for (const rule of CATEGORY_IMAGE_RULES) {
    if (rule.keys.some((key) => normalizedCategory.includes(key))) return rule.image;
  }

  return "/menu/default.svg";
}

export function MenuView({ tableNumber, categories, items }: MenuViewProps) {
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
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

  const enrichedItems = useMemo(
    () =>
      items.map((item) => {
        const nonVeg = isNonVeg(item.name);
        return {
          ...item,
          uiIsNonVeg: nonVeg,
          uiIsVeg: !nonVeg,
          uiIsBestseller: isBestseller(item.name),
          uiImage: getMenuImage(item),
        };
      }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return enrichedItems.filter((item) => {
      if (activeCategory !== ALL_CATEGORY && item.category_id !== activeCategory) return false;
      if (vegOnly && !item.uiIsVeg) return false;
      if (nonVegOnly && !item.uiIsNonVeg) return false;
      if (bestOnly && !item.uiIsBestseller) return false;

      if (!normalizedQuery) return true;
      return item.name.toLowerCase().includes(normalizedQuery) || (item.description ?? "").toLowerCase().includes(normalizedQuery);
    });
  }, [activeCategory, bestOnly, enrichedItems, nonVegOnly, query, vegOnly]);

  return (
    <section>
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--brand-beige)] p-4">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Table {tableNumber}</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--brand-brown)]">Order Menu</h1>
        <p className="mt-1 text-xs text-[var(--muted)]">Fast picks for your dark coffeehouse table service.</p>
      </div>

      <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--brand-beige)] p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--brand-white)] px-3 py-2 text-sm text-[var(--brand-brown)] outline-none transition focus:border-[var(--muted)]"
        />

        <div className="mt-3 flex gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryChip
            active={activeCategory === ALL_CATEGORY}
            label="All"
            onClick={() => setActiveCategory(ALL_CATEGORY)}
          />
          {sortedCategories.map((category) => (
            <CategoryChip
              key={category.id}
              active={activeCategory === category.id}
              label={category.name}
              onClick={() => setActiveCategory(category.id)}
            />
          ))}
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterButton
            label="Veg"
            active={vegOnly}
            onClick={() => {
              const next = !vegOnly;
              setVegOnly(next);
              if (next) setNonVegOnly(false);
            }}
          />
          <FilterButton
            label="Non-Veg"
            active={nonVegOnly}
            onClick={() => {
              const next = !nonVegOnly;
              setNonVegOnly(next);
              if (next) setVegOnly(false);
            }}
          />
          <FilterButton label="Bestseller" active={bestOnly} onClick={() => setBestOnly((prev) => !prev)} />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--brand-beige)] p-4 text-xs text-[var(--muted)]">
          No items match your filters.
        </div>
      ) : (
        <div className="mt-4 space-y-2 pb-4">
          {filteredItems.map((item) => {
            const qty = qtyById.get(item.id) ?? 0;
            return (
              <article key={item.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--brand-beige)] p-2.5">
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-[var(--brand-white)]">
                  <Image src={item.uiImage} alt={item.name} fill sizes="72px" loading="lazy" className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-sm font-semibold text-[var(--brand-brown)]">{item.name}</h3>
                  <p className="mt-1 text-base font-semibold text-[var(--muted)]">{formatCurrency(item.price)}</p>
                  <p className="line-clamp-1 text-[11px] text-[var(--muted)] opacity-80">{item.description || item.category_id}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.uiIsVeg ? <Badge label="Veg" /> : null}
                    {item.uiIsNonVeg ? <Badge label="Non-Veg" /> : null}
                    {item.uiIsBestseller ? <Badge label="Top" /> : null}
                  </div>
                </div>

                <div className="shrink-0">
                  <QuantityStepper
                    quantity={qty}
                    onIncrease={() =>
                      addItem({
                        menuItemId: item.id,
                        itemName: item.name,
                        unitPrice: item.price,
                        imageUrl: item.uiImage,
                      })
                    }
                    onDecrease={() => setQty(item.id, qty - 1)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-[var(--muted)] bg-[var(--button-bg)] text-[var(--brand-brown)]"
          : "border-[var(--border)] bg-[var(--brand-white)] text-[var(--muted)]"
      }`}
    >
      {label}
    </button>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-[var(--button-bg)] text-[var(--brand-brown)]" : "bg-[var(--brand-white)] text-[var(--muted)]"
      }`}
    >
      {label}
    </button>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-[var(--brand-white)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">{label}</span>;
}
