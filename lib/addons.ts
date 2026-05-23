import type { AddonOption } from "@/lib/types";

const normalizeCategoryName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const CATEGORY_ADDONS_MAP: Record<string, AddonOption[]> = {
  burgers: [
    { name: "Cheese", price: 20 },
    { name: "Peri Peri", price: 20 },
  ],
  burger: [
    { name: "Cheese", price: 20 },
    { name: "Peri Peri", price: 20 },
  ],
  sandwich: [
    { name: "Cheese", price: 20 },
    { name: "Peri Peri", price: 20 },
  ],
  sandwiches: [
    { name: "Cheese", price: 20 },
    { name: "Peri Peri", price: 20 },
  ],
  pizza: [
    { name: "Cheese", price: 30 },
    { name: "Peri Peri", price: 20 },
  ],
  pizzas: [
    { name: "Cheese", price: 30 },
    { name: "Peri Peri", price: 20 },
  ],
  "hot coffees": [
    { name: "Hazelnut", price: 30 },
    { name: "Vanilla", price: 30 },
    { name: "Irish", price: 40 },
  ],
  "hot coffee": [
    { name: "Hazelnut", price: 30 },
    { name: "Vanilla", price: 30 },
    { name: "Irish", price: 40 },
  ],
  frappe: [
    { name: "Hazelnut", price: 30 },
    { name: "Vanilla", price: 30 },
    { name: "Irish", price: 40 },
  ],
  frappes: [
    { name: "Hazelnut", price: 30 },
    { name: "Vanilla", price: 30 },
    { name: "Irish", price: 40 },
  ],
};

export function getCategoryAddons(categoryName: string): AddonOption[] {
  const normalizedCategory = normalizeCategoryName(categoryName);
  if (!normalizedCategory) return [];
  return CATEGORY_ADDONS_MAP[normalizedCategory] ?? [];
}
