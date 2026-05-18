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

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, type, name, description, image_url, price, is_veg, is_non_veg, is_bestseller",
    )
    .eq("client_id", CLIENT_ID)
    .eq("is_active", true)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  const items = (products ?? []).map((product) => ({
    id: product.id,
    category_id: product.type,
    name: product.name,
    description: product.description,
    image_url: product.image_url,
    price: product.price,
    is_veg: product.is_veg,
    is_non_veg: product.is_non_veg,
    is_bestseller: product.is_bestseller,
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
