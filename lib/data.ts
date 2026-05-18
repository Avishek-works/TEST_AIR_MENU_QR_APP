import { unstable_noStore as noStore } from "next/cache";
import type { MenuCategory, MenuItem, RestaurantTable } from "@/lib/types";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createPublicSupabase } from "@/lib/supabase/public";

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

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("menu_categories").select("id,name,sort_order").order("sort_order", { ascending: true }),
    supabase.from("menu_items").select("*").eq("active", true).order("name", { ascending: true }),
  ]);

  return { categories: categories ?? [], items: items ?? [] };
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
