"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatCurrency } from "@/lib/format";
import { ALL_CATEGORY, MENU_DEFAULT_IMAGE, enrichMenuItems, resolveMenuImage } from "@/lib/menu-ui";
import type { CategoryFilter, MenuCategory, MenuPresentationItem, RawMenuItem } from "@/lib/types";

interface MenuViewProps {
  tableNumber: string;
  categories: MenuCategory[];
  items: RawMenuItem[];
}

export function MenuView({ tableNumber, categories, items }: MenuViewProps) {
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(ALL_CATEGORY);
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

  const enrichedItems = useMemo(() => enrichMenuItems(items), [items]);

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
      {/* Header */}
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.55)]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent-gold)] opacity-90">Table {tableNumber}</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Order Menu</h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Select your picks from the table.</p>
      </div>

      {/* Search + Filters */}
      <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-[0_6px_20px_-12px_rgba(0,0,0,0.45)]">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm select-none">
            ⌕
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] pl-8 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all duration-200 focus:border-[var(--border-warm)] focus:ring-2 focus:ring-[var(--accent-gold-soft)]"
          />
        </div>

        {/* Category chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto whitespace-nowrap scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

        {/* Filter pills */}
        <div className="mt-2 flex gap-2 overflow-x-auto whitespace-nowrap scroll-smooth pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <FilterButton
            label="🌿 Veg"
            active={vegOnly}
            onClick={() => {
              const next = !vegOnly;
              setVegOnly(next);
              if (next) setNonVegOnly(false);
            }}
          />
          <FilterButton
            label="🍗 Non-Veg"
            active={nonVegOnly}
            onClick={() => {
              const next = !nonVegOnly;
              setNonVegOnly(next);
              if (next) setVegOnly(false);
            }}
          />
          <FilterButton label="⭐ Bestseller" active={bestOnly} onClick={() => setBestOnly((prev) => !prev)} />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">No items match your filters.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5 pb-4">
          {filteredItems.map((item) => {
            const qty = qtyById.get(item.id) ?? 0;
            return (
              <MenuItemCard
                key={item.id}
                item={item}
                qty={qty}
                onAdd={() =>
                  addItem({
                    menuItemId: item.id,
                    itemName: item.name,
                    unitPrice: item.price,
                    imageUrl: item.uiImage,
                  })
                }
                onDecrease={() => setQty(item.id, qty - 1)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ─── Menu Item Card ─────────────────────────────────────────────────── */

function MenuItemCard({
  item,
  qty,
  onAdd,
  onDecrease,
}: {
  item: MenuPresentationItem;
  qty: number;
  onAdd: () => void;
  onDecrease: () => void;
}) {
  return (
    <article className="group flex items-center gap-3 rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-surface)] p-3 transition duration-200 hover:border-[var(--border-warm)] hover:shadow-[0_12px_36px_-18px_rgba(0,0,0,0.55)] hover:-translate-y-[0.5px]">
      {/* Image */}
      <div className="relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-3xl bg-[#1C140C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_10px_24px_-16px_rgba(0,0,0,0.45)]">
        <MenuItemImage src={item.uiImage} alt={item.name} categoryId={item.category_id} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)] leading-snug">{item.name}</h3>
        {item.description ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
        ) : null}
        <p className="mt-1 text-[15px] font-bold text-[var(--accent-gold)] tracking-tight">{formatCurrency(item.price)}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.uiIsVeg ? <Badge label="Veg" color="green" /> : null}
          {item.uiIsNonVeg ? <Badge label="Non-Veg" color="red" /> : null}
          {item.uiIsBestseller ? <Badge label="★ Top Pick" color="gold" /> : null}
        </div>
      </div>

      {/* Qty stepper */}
      <div className="shrink-0">
        <QuantityStepper
          quantity={qty}
          onIncrease={onAdd}
          onDecrease={onDecrease}
        />
      </div>
    </article>
  );
}

/* ─── Menu Item Image with fallback ────────────────────────────────────── */

function MenuItemImage({ src, alt, categoryId }: { src: string; alt: string; categoryId: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    if (imgSrc !== MENU_DEFAULT_IMAGE) {
      // Try to fall back to category image, then default
      const fallback = resolveMenuImage({ id: "", name: "", category_id: categoryId, description: null, image_url: null, price: 0, is_veg: false, is_non_veg: false, is_bestseller: false, active: true });
      setImgSrc(fallback !== src ? fallback : MENU_DEFAULT_IMAGE);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes="80px"
      loading="lazy"
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      onError={handleError}
      unoptimized={imgSrc.startsWith("http")}
    />
  );
}

/* ─── Category Chip ──────────────────────────────────────────────────── */

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
        active
          ? "border-[var(--accent-gold)] bg-[var(--bg-elevated)] text-[var(--accent-gold)] shadow-[0_0_8px_rgba(252,176,58,0.14)]"
          : "border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-warm)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
      {active && (
        <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[var(--accent-gold)] transition-all duration-200" />
      )}
    </button>
  );
}

/* ─── Filter Button ──────────────────────────────────────────────────── */

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        active
          ? "border-[var(--accent-gold)] bg-[var(--bg-elevated)] text-[var(--accent-gold)]"
          : "border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-warm)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Badge ──────────────────────────────────────────────────────────── */

function Badge({ label, color }: { label: string; color: "green" | "red" | "gold" }) {
  const styles = {
    green: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40",
    red: "bg-red-950/60 text-red-400 border border-red-800/40",
    gold: "bg-[var(--bg-primary)] text-[var(--accent-gold)] border border-[var(--border-warm)]",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[color]}`}>{label}</span>
  );
}
