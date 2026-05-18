import { unstable_noStore as noStore } from "next/cache";
import type { MenuCategory, MenuItem, RestaurantTable } from "@/lib/types";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createPublicSupabase } from "@/lib/supabase/public";
import { CLIENT_ID } from "@/lib/config";

export const normalizeTable = (tableId: string) => tableId.trim().toUpperCase();
const MENU_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500";

export async function getActiveTable(tableId: string): Promise<RestaurantTable | null> {
  noStore();
  const supabase = createPublicSupabase();

  const { data } = await supabase
    .from("restaurant_tables")
    .select("id,table_number,active")
    .eq("table_number", tableId)
    .eq("active", true)
    .maybeSingle();

  return data;
}

export async function getMenuData(): Promise<{ categories: MenuCategory[]; items: MenuItem[] }> {
  noStore();
  const supabase = createPublicSupabase();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, type, client_id, is_active")
    .eq("client_id", CLIENT_ID)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[getMenuData] products query error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
  console.log("[getMenuData] fetched products count:", products?.length ?? 0);
  console.log("[getMenuData] first fetched product:", products?.[0] ?? null);

  const items = (products ?? []).map((product) => ({
    id: product.id,
    category_id: product.type ?? "Uncategorized",
    name: product.name,
    description: "",
    image_url: MENU_FALLBACK_IMAGE,
    price: product.price,
    is_veg: false,
    is_non_veg: false,
    is_bestseller: false,
    active: product.is_active,
  })) as MenuItem[];

  const categoryNames = Array.from(new Set(items.map((item) => item.category_id))).sort((a, b) => a.localeCompare(b));
  const categories = categoryNames.map((type, index) => ({ id: type, name: type, sort_order: index + 1 }));

  console.log("[getMenuData] grouped categories:", categories.length);

  return { categories, items };
}

export async function getOrderDetails(orderId: string) {
  noStore();
  const supabase = createAdminSupabase();

  const { data, error } = await supabase
    .from("qr_orders")
    .select("id,table_number,total")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
