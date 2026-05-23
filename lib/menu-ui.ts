import type {
  MenuImageByCategoryMap,
  MenuImageByIdMap,
  MenuImageBySlugMap,
  MenuPresentationItem,
  RawMenuItem,
} from "@/lib/types";

const NON_ALPHANUMERIC = /[^a-z0-9]+/g;

export const ALL_CATEGORY = "__all__" as const;
export const MENU_DEFAULT_IMAGE = "/menu/default.svg";
const SUPABASE_PUBLIC_OBJECT_BASE_URL = "https://ltbqxyvdtrrlohdfrprf.supabase.co/storage/v1/object/public/";
const PRODUCT_IMAGE_URL_CACHE = new Map<string, string>();

export const NON_VEG_KEYWORDS = [
  "chicken",
  "mutton",
  "fish",
  "egg",
  "prawn",
  "shrimp",
  "ham",
  "bacon",
  "sausage",
  "pepperoni",
] as const;

export const BESTSELLER_KEYWORDS = [
  "latte",
  "cappuccino",
  "espresso",
  "americano",
  "mocha",
  "cold coffee",
  "brownie",
  "croissant",
] as const;

export const IMAGE_BY_ITEM_ID: MenuImageByIdMap = {};

export const IMAGE_BY_SLUG: MenuImageBySlugMap = {
  espresso: "/menu/coffee-espresso.svg",
  americano: "/menu/coffee-espresso.svg",
  latte: "/menu/coffee-latte.svg",
  cappuccino: "/menu/coffee-latte.svg",
  mocha: "/menu/coffee-latte.svg",
  tea: "/menu/tea.svg",
  "green-tea": "/menu/tea.svg",
  "masala-tea": "/menu/tea.svg",
  croissant: "/menu/bakery.svg",
  muffin: "/menu/bakery.svg",
  pastry: "/menu/bakery.svg",
  cake: "/menu/bakery.svg",
  sandwich: "/menu/snacks.svg",
  burger: "/menu/snacks.svg",
  wrap: "/menu/snacks.svg",
  fries: "/menu/snacks.svg",
  pasta: "/menu/snacks.svg",
};

export const IMAGE_BY_CATEGORY: MenuImageByCategoryMap = {
  coffee: "/menu/coffee-espresso.svg",
  beverages: "/menu/coffee-espresso.svg",
  beverage: "/menu/coffee-espresso.svg",
  "coffee-beverages": "/menu/coffee-espresso.svg",
  "coffee-and-beverages": "/menu/coffee-espresso.svg",
  tea: "/menu/tea.svg",
  bakery: "/menu/bakery.svg",
  dessert: "/menu/bakery.svg",
  snacks: "/menu/snacks.svg",
  snack: "/menu/snacks.svg",
  food: "/menu/snacks.svg",
  starter: "/menu/snacks.svg",
  meal: "/menu/snacks.svg",
};

const CATEGORY_ORDER_RULES = [
  ["coffee", "espresso", "cappuccino", "latte", "mocha", "americano"],
  ["tea"],
  ["cold", "frappe", "iced", "mocktail", "shake", "smoothie", "slush", "beverage", "cooler", "juice"],
  ["small bites", "snack", "starter", "burger", "sandwich", "wrap", "fries"],
  ["pizza"],
  ["pasta"],
  ["dessert", "bakery", "sweet", "cake", "pastry"],
] as const;

function normalizeForKeywordCheck(text: string) {
  return text.toLowerCase().replace(NON_ALPHANUMERIC, " ").trim();
}

export function toSlug(value: string) {
  return value.toLowerCase().trim().replace(NON_ALPHANUMERIC, "-").replace(/^-+|-+$/g, "");
}

export function hasKeyword(text: string, keywords: readonly string[]) {
  const normalizedText = normalizeForKeywordCheck(text);
  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeForKeywordCheck(keyword);
    if (!normalizedKeyword) return false;
    const pattern = new RegExp(`(^|\\s)${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`);
    return pattern.test(normalizedText);
  });
}

export function toTitleCaseLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

export function sortCategoryNames(categoryNames: string[]) {
  return [...categoryNames].sort((left, right) => {
    const leftRank = getCategoryRank(left);
    const rightRank = getCategoryRank(right);

    if (leftRank !== rightRank) return leftRank - rightRank;

    return categoryNames.indexOf(left) - categoryNames.indexOf(right);
  });
}

function getCategoryRank(categoryName: string) {
  const normalizedCategory = normalizeForKeywordCheck(categoryName);
  const matchingIndex = CATEGORY_ORDER_RULES.findIndex((keywords) =>
    keywords.some((keyword) => normalizedCategory.includes(normalizeForKeywordCheck(keyword))),
  );

  return matchingIndex === -1 ? CATEGORY_ORDER_RULES.length : matchingIndex;
}

export function resolveMenuImage(item: RawMenuItem) {
  if (item.image_url) return item.image_url;

  if (IMAGE_BY_ITEM_ID[item.id]) return IMAGE_BY_ITEM_ID[item.id];

  const itemSlug = toSlug(item.name);
  if (itemSlug && IMAGE_BY_SLUG[itemSlug]) return IMAGE_BY_SLUG[itemSlug];

  const categorySlug = toSlug(item.category_id);
  if (categorySlug && IMAGE_BY_CATEGORY[categorySlug]) return IMAGE_BY_CATEGORY[categorySlug];

  return MENU_DEFAULT_IMAGE;
}

export function getProductImageUrl(imageUrl: string | null | undefined) {
  const normalizedImageUrl = imageUrl?.trim();

  if (!normalizedImageUrl) return "/placeholder.png";
  const cachedImageUrl = PRODUCT_IMAGE_URL_CACHE.get(normalizedImageUrl);
  if (cachedImageUrl) return cachedImageUrl;

  if (/^https?:\/\//i.test(normalizedImageUrl)) {
    PRODUCT_IMAGE_URL_CACHE.set(normalizedImageUrl, normalizedImageUrl);
    return normalizedImageUrl;
  }

  const normalizedStoragePath = normalizedImageUrl.replace(/^\/+/, "");
  const resolvedUrl = `${SUPABASE_PUBLIC_OBJECT_BASE_URL}${normalizedStoragePath}`;
  PRODUCT_IMAGE_URL_CACHE.set(normalizedImageUrl, resolvedUrl);
  return resolvedUrl;
}

export function enrichMenuItems(items: RawMenuItem[]): MenuPresentationItem[] {
  return items.map((item) => {
    const uiIsNonVeg = hasKeyword(item.name, NON_VEG_KEYWORDS);

    return {
      ...item,
      uiIsNonVeg,
      uiIsVeg: !uiIsNonVeg,
      uiIsBestseller: hasKeyword(item.name, BESTSELLER_KEYWORDS),
      uiImage: resolveMenuImage(item),
    };
  });
}
