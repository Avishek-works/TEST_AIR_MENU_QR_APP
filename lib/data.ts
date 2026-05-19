import { unstable_noStore as noStore } from "next/cache";
import { sortCategoryNames } from "@/lib/menu-ui";
import type { MenuCategory, RawMenuItem } from "@/lib/types";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createPublicSupabase } from "@/lib/supabase/public";

export const normalizeTable = (tableId: string) => tableId.trim().toUpperCase();

export async function getMenuData(): Promise<{ categories: MenuCategory[]; items: RawMenuItem[] }> {
  noStore();
  const supabase = createPublicSupabase();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, type");

  if (error) {
    console.error("[getMenuData] products query error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  const items = (products ?? []).map((product) => ({
    id: product.id,
    category_id: product.type ?? "Uncategorized",
    name: product.name,
    description: "",
    image_url: null,
    price: product.price,
    is_veg: false,
    is_non_veg: false,
    is_bestseller: false,
    active: true,
  })) as RawMenuItem[];

  const categoryNames = sortCategoryNames(Array.from(new Set(items.map((item) => item.category_id))));
  const categories = categoryNames.map((type, index) => ({ id: type, name: type, sort_order: index + 1 }));

  return { categories, items };
}

export async function getOrderDetails(orderId: string) {
  noStore();
  const adminSupabase = createAdminSupabase();

  const { data, error } = await adminSupabase
    .from("bills")
    .select("id,table_number,final_amount")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
