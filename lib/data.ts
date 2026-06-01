import { unstable_noStore as noStore } from "next/cache";
import { getBillOrderDetails } from "@/db/bills";
import { listProductsForMenu } from "@/db/orders";
import { getConfiguredClientId } from "@/lib/config";
import { sortCategoryNames } from "@/lib/menu-ui";
import type { MenuCategory, RawMenuItem } from "@/lib/types";

export const normalizeTable = (tableId: string) => tableId.trim().toUpperCase();

export async function getMenuData(): Promise<{ categories: MenuCategory[]; items: RawMenuItem[] }> {
  noStore();
  const clientId = getConfiguredClientId();
  if (!clientId) {
    throw new Error("Missing or invalid restaurant client ID.");
  }

  const { data: products, error } = await listProductsForMenu(clientId);
  console.log("[getMenuData] products response data:", products);

  if (error) {
    console.error("[getMenuData] products query error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  const items = (products ?? []).map((product) => {
    console.log("[getMenuData] product.image_url:", product.image_url);
    return {
      id: product.id,
      category_id: product.type ?? "Uncategorized",
      name: product.name,
      description: "",
      image_url: product.image_url ?? null,
      price: product.price,
      is_veg: false,
      is_non_veg: false,
      is_bestseller: false,
      active: true,
    };
  }) as RawMenuItem[];

  const categoryNames = sortCategoryNames(Array.from(new Set(items.map((item) => item.category_id))));
  const categories = categoryNames.map((type, index) => ({ id: type, name: type, sort_order: index + 1 }));

  return { categories, items };
}

export async function getOrderDetails(orderReference: string) {
  noStore();
  const { data, error } = await getBillOrderDetails(orderReference);

  if (error) {
    throw error;
  }

  return data;
}
