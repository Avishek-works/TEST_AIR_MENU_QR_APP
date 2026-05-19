import { unstable_noStore as noStore } from "next/cache";
import type { MenuCategory, MenuItem, RestaurantTable } from "@/lib/types";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createPublicSupabase } from "@/lib/supabase/public";
import { CLIENT_ID } from "@/lib/config";

export const normalizeTable = (tableId: string) => tableId.trim().toUpperCase();

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
    .order("name");

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
    active: product.is_active,
  })) as MenuItem[];

  const categoryNames = Array.from(new Set(items.map((item) => item.category_id))).sort((a, b) => a.localeCompare(b));
  const categories = categoryNames.map((type, index) => ({ id: type, name: type, sort_order: index + 1 }));

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
