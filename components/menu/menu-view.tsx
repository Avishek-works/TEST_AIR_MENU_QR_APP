"use client";

import Image from "next/image";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { getCategoryAddons } from "@/lib/addons";
import {
  MENU_DEFAULT_IMAGE,
  enrichMenuItems,
  getProductImageUrl,
  resolveMenuImage,
  toTitleCaseLabel,
} from "@/lib/menu-ui";
import type { AddonOption, MenuCategory, MenuPresentationItem, RawMenuItem } from "@/lib/types";

interface MenuViewProps {
  tableNumber: string;
  categories: MenuCategory[];
  items: RawMenuItem[];
}

const sectionIdForCategory = (categoryId: string) => `menu-category-${categoryId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
const ABOVE_THE_FOLD_IMAGE_COUNT = 5;
const IMAGE_PRELOAD_MARGIN = "260px 0px";

const lineIdForItem = (itemId: string, addons: AddonOption[]) => {
  if (!addons.length) return itemId;
  const token = addons
    .map((addon) => `${addon.name}:${addon.price}`)
    .sort()
    .join("|");
  return `${itemId}::${token}`;
};

export function MenuView({ tableNumber, categories, items }: MenuViewProps) {
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [bestOnly, setBestOnly] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [customizingItem, setCustomizingItem] = useState<MenuPresentationItem | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [sectionScrollOffset, setSectionScrollOffset] = useState(132);
  const { items: cartItems, addItem, decreaseMenuItem, setQty } = useCart();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const stickyBarRef = useRef<HTMLDivElement | null>(null);

  const qtyById = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((item) => map.set(item.menuItemId, (map.get(item.menuItemId) ?? 0) + item.qty));
    return map;
  }, [cartItems]);

  const plainLineByMenuId = useMemo(() => {
    const map = new Map<string, { lineId: string; qty: number }>();
    cartItems.forEach((item) => {
      if ((item.addons?.length ?? 0) > 0) return;
      const lineId = item.lineId ?? item.menuItemId;
      map.set(item.menuItemId, { lineId, qty: item.qty });
    });
    return map;
  }, [cartItems]);

  const enrichedItems = useMemo(() => enrichMenuItems(items), [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return enrichedItems.filter((item) => {
      if (vegOnly && !item.uiIsVeg) return false;
      if (nonVegOnly && !item.uiIsNonVeg) return false;
      if (bestOnly && !item.uiIsBestseller) return false;

      if (!normalizedQuery) return true;
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.category_id.toLowerCase().includes(normalizedQuery) ||
        (item.description ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [bestOnly, enrichedItems, nonVegOnly, query, vegOnly]);

  const groupedItems = useMemo(() => {
    const categoryById = new Map(sortedCategories.map((category) => [category.id, category]));
    const itemsByCategory = new Map<string, MenuPresentationItem[]>();

    filteredItems.forEach((item) => {
      const existingItems = itemsByCategory.get(item.category_id) ?? [];
      existingItems.push(item);
      itemsByCategory.set(item.category_id, existingItems);
    });

    const orderedGroups = sortedCategories
      .filter((category) => itemsByCategory.has(category.id))
      .map((category) => ({
        id: category.id,
        label: toTitleCaseLabel(category.name),
        items: itemsByCategory.get(category.id) ?? [],
      }));

    itemsByCategory.forEach((categoryItems, categoryId) => {
      if (categoryById.has(categoryId)) return;
      orderedGroups.push({
        id: categoryId,
        label: toTitleCaseLabel(categoryId || "Uncategorized"),
        items: categoryItems,
      });
    });

    return orderedGroups;
  }, [filteredItems, sortedCategories]);

  const visibleCategoryIds = useMemo(() => new Set(groupedItems.map((group) => group.id)), [groupedItems]);
  const itemPositionById = useMemo(() => {
    const positions = new Map<string, number>();
    let index = 0;
    groupedItems.forEach((group) => {
      group.items.forEach((item) => {
        if (!positions.has(item.id)) {
          positions.set(item.id, index);
          index += 1;
        }
      });
    });
    return positions;
  }, [groupedItems]);

  const selectedAddonList = useMemo(() => {
    if (!customizingItem) return [];
    const addons = getCategoryAddons(customizingItem.category_id);
    return addons.filter((addon) => selectedAddons[`${addon.name}:${addon.price}`]);
  }, [customizingItem, selectedAddons]);

  useEffect(() => {
    if (!groupedItems.length) {
      setActiveSection(null);
      return;
    }
    if (activeSection && visibleCategoryIds.has(activeSection)) return;
    setActiveSection(groupedItems[0].id);
  }, [activeSection, groupedItems, visibleCategoryIds]);

  useEffect(() => {
    const stickyElement = stickyBarRef.current;
    if (!stickyElement || typeof window === "undefined") return;

    const updateOffset = () => {
      const nextOffset = Math.ceil(stickyElement.getBoundingClientRect().height) + 20;
      setSectionScrollOffset((current) => (current === nextOffset ? current : nextOffset));
    };

    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(stickyElement);
    window.addEventListener("resize", updateOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOffset);
    };
  }, [sortedCategories.length, visibleCategoryIds.size]);

  const scrollToCategory = (categoryId: string) => {
    const section = sectionRefs.current[categoryId];
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(categoryId);
  };

  const openCustomizerForItem = (item: MenuPresentationItem) => {
    if (getCategoryAddons(item.category_id).length === 0) {
      addItem({
        menuItemId: item.id,
        lineId: item.id,
        itemName: item.name,
        unitPrice: item.price,
        imageUrl: item.uiImage,
      });
      return;
    }
    setCustomizingItem(item);
    setSelectedAddons({});
  };

  const confirmCustomization = () => {
    if (!customizingItem) return;
    const addons = selectedAddonList;
    const addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
    addItem({
      menuItemId: customizingItem.id,
      lineId: lineIdForItem(customizingItem.id, addons),
      itemName: customizingItem.name,
      unitPrice: customizingItem.price + addonTotal,
      imageUrl: customizingItem.uiImage,
      addons,
    });
    setCustomizingItem(null);
    setSelectedAddons({});
  };

  return (
    <section>
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.55)]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent-gold)] opacity-90">Table {tableNumber}</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Order Menu</h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Select your picks from the table.</p>
      </div>

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

        <div className="mt-2 flex gap-2 overflow-x-auto whitespace-nowrap scroll-smooth pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <FilterButton
            label="Veg"
            indicator="veg"
            active={vegOnly}
            onClick={() => {
              const next = !vegOnly;
              setVegOnly(next);
              if (next) setNonVegOnly(false);
            }}
          />
          <FilterButton
            label="Non-Veg"
            indicator="non-veg"
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

      <div
        ref={stickyBarRef}
        className="sticky top-[calc(env(safe-area-inset-top)+0.5rem)] z-30 mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-2 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.65)]"
      >
        <div className="flex flex-wrap gap-2">
          {sortedCategories
            .filter((category) => visibleCategoryIds.has(category.id))
            .map((category) => (
              <CategoryChip
                key={category.id}
                active={activeSection === category.id}
                label={toTitleCaseLabel(category.name)}
                onClick={() => scrollToCategory(category.id)}
              />
            ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">No items match your filters.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-5 pb-4">
          {groupedItems.map((group) => (
            <section
              key={group.id}
              id={sectionIdForCategory(group.id)}
              ref={(node) => {
                sectionRefs.current[group.id] = node;
              }}
              style={{ scrollMarginTop: `${sectionScrollOffset}px` }}
              className="space-y-2.5"
            >
              <div className="flex items-center gap-3 px-1">
                <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-gold)]">
                  {group.label}
                </h2>
                <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(252,176,58,0.22),transparent)]" />
              </div>

              {group.items.map((item) => {
                const qty = qtyById.get(item.id) ?? 0;
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    qty={qty}
                    position={itemPositionById.get(item.id) ?? Number.MAX_SAFE_INTEGER}
                    onAdd={() => openCustomizerForItem(item)}
                    onDecrease={() => {
                      if (qty <= 1) {
                        decreaseMenuItem(item.id);
                        return;
                      }
                      const plainLine = plainLineByMenuId.get(item.id);
                      if (plainLine) {
                        setQty(plainLine.lineId, plainLine.qty - 1);
                        return;
                      }
                      decreaseMenuItem(item.id);
                    }}
                  />
                );
              })}
            </section>
          ))}
        </div>
      )}

      {customizingItem ? (
        <AddonCustomizerSheet
          item={customizingItem}
          selected={selectedAddons}
          onChange={(next) => setSelectedAddons(next)}
          onClose={() => {
            setCustomizingItem(null);
            setSelectedAddons({});
          }}
          onConfirm={confirmCustomization}
        />
      ) : null}
    </section>
  );
}

const MenuItemCard = memo(function MenuItemCard({
  item,
  qty,
  position,
  onAdd,
  onDecrease,
}: {
  item: MenuPresentationItem;
  qty: number;
  position: number;
  onAdd: () => void;
  onDecrease: () => void;
}) {
  const imageSrc = useMemo(
    () => (item.image_url ? getProductImageUrl(item.image_url) : item.uiImage || "/placeholder.png"),
    [item.image_url, item.uiImage],
  );
  const prioritizeLoad = position < ABOVE_THE_FOLD_IMAGE_COUNT;

  return (
    <article className="group flex items-center gap-3 rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-surface)] p-3 transition duration-200 hover:border-[var(--border-warm)] hover:shadow-[0_12px_36px_-18px_rgba(0,0,0,0.55)] hover:-translate-y-[0.5px]">
      <div className="relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-3xl bg-[#1C140C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_10px_24px_-16px_rgba(0,0,0,0.45)]">
        <MenuItemImage
          src={imageSrc}
          alt={item.name}
          categoryId={item.category_id}
          prioritizeLoad={prioritizeLoad}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)] leading-snug">
          {toTitleCaseLabel(item.name)}
        </h3>
        {item.description ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">
            {toTitleCaseLabel(item.description)}
          </p>
        ) : null}
        <p className="mt-1 text-[15px] font-bold text-[var(--accent-gold)] tracking-tight">{formatCurrency(item.price)}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {item.uiIsVeg ? <FoodIndicator kind="veg" compact /> : null}
          {item.uiIsNonVeg ? <FoodIndicator kind="non-veg" compact /> : null}
          {item.uiIsBestseller ? <Badge label="★ Top Pick" color="gold" /> : null}
        </div>
      </div>

      <div className="shrink-0">
        <QuantityStepper
          quantity={qty}
          onIncrease={onAdd}
          onDecrease={onDecrease}
        />
      </div>
    </article>
  );
}, areMenuItemCardPropsEqual);

function areMenuItemCardPropsEqual(
  previous: Readonly<{
    item: MenuPresentationItem;
    qty: number;
    position: number;
    onAdd: () => void;
    onDecrease: () => void;
  }>,
  next: Readonly<{
    item: MenuPresentationItem;
    qty: number;
    position: number;
    onAdd: () => void;
    onDecrease: () => void;
  }>,
) {
  return previous.item === next.item && previous.qty === next.qty && previous.position === next.position;
}

function AddonCustomizerSheet({
  item,
  selected,
  onChange,
  onClose,
  onConfirm,
}: {
  item: MenuPresentationItem;
  selected: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const addons = getCategoryAddons(item.category_id);
  const selectedPrice = addons.reduce((sum, addon) => sum + (selected[`${addon.name}:${addon.price}`] ? addon.price : 0), 0);
  const finalPrice = item.price + selectedPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-2 pb-0 sm:px-4 sm:pb-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close customization"
      />
      <section className="relative w-full max-w-[32rem] rounded-t-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-14px_36px_-20px_rgba(0,0,0,0.8)] sm:rounded-3xl sm:p-5 sm:pb-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Customize</p>
        <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">{toTitleCaseLabel(item.name)}</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Select optional add-ons</p>

        <div className="mt-3 space-y-2">
          {addons.map((addon) => {
            const key = `${addon.name}:${addon.price}`;
            const checked = Boolean(selected[key]);
            return (
              <label
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 transition-colors duration-150 hover:border-[var(--border-warm)]"
              >
                <span className="flex items-center gap-2.5 text-sm text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange({ ...selected, [key]: !checked })}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border-warm)] accent-[var(--accent-gold)]"
                  />
                  {addon.name}
                </span>
                <span className="text-sm font-semibold text-[var(--accent-gold)]">+{formatCurrency(addon.price)}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-sm font-semibold text-[var(--text-secondary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-gold inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold shadow-[0_4px_14px_rgba(252,176,58,0.25)]"
          >
            Add {formatCurrency(finalPrice)}
          </button>
        </div>
      </section>
    </div>
  );
}

function MenuItemImage({
  src,
  alt,
  categoryId,
  prioritizeLoad,
}: {
  src: string;
  alt: string;
  categoryId: string;
  prioritizeLoad: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(src || "/placeholder.png");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(prioritizeLoad);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setImgSrc(src || "/placeholder.png");
    setIsLoaded(false);
    if (prioritizeLoad) {
      setIsNearViewport(true);
    }
  }, [prioritizeLoad, src]);

  useEffect(() => {
    if (prioritizeLoad || isNearViewport) return;
    const target = rootRef.current;
    if (!target || typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: IMAGE_PRELOAD_MARGIN, threshold: 0.01 },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [isNearViewport, prioritizeLoad]);

  const handleError = () => {
    if (imgSrc !== MENU_DEFAULT_IMAGE) {
      const fallback = resolveMenuImage({
        id: "",
        name: "",
        category_id: categoryId,
        description: null,
        image_url: null,
        price: 0,
        is_veg: false,
        is_non_veg: false,
        is_bestseller: false,
        active: true,
      });
      setImgSrc(fallback !== src ? fallback : MENU_DEFAULT_IMAGE);
      setIsLoaded(false);
    }
  };

  return (
    <div ref={rootRef} className="relative h-full w-full">
      {!isLoaded ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
      {isNearViewport ? (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          sizes="80px"
          loading={prioritizeLoad ? "eager" : "lazy"}
          priority={prioritizeLoad}
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
        />
      ) : null}
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
        active
          ? "border-[var(--accent-gold)] bg-[var(--bg-elevated)] text-[var(--accent-gold)] shadow-[0_0_8px_rgba(252,176,58,0.14)]"
          : "border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-warm)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

function FilterButton({
  label,
  indicator,
  active,
  onClick,
}: {
  label: string;
  indicator?: "veg" | "non-veg";
  active: boolean;
  onClick: () => void;
}) {
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
      {indicator ? <FoodIndicator kind={indicator} compact /> : null}
      {label}
    </button>
  );
}

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

function FoodIndicator({
  kind,
  compact = false,
}: {
  kind: "veg" | "non-veg";
  compact?: boolean;
}) {
  const indicatorStyles =
    kind === "veg"
      ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-400"
      : "border-red-500/70 bg-red-500/10 text-red-400";

  return (
    <span
      aria-label={kind === "veg" ? "Vegetarian" : "Non-vegetarian"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${indicatorStyles}`}
    >
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-current">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {!compact ? <span>{kind === "veg" ? "Veg" : "Non-Veg"}</span> : null}
    </span>
  );
}
