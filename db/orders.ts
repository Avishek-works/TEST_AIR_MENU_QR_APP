import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createPublicSupabase } from "@/lib/supabase/public";

export interface BillItemInsertInput {
  billId: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ProductRecord {
  id: string;
  name: string;
  price: number;
  type: string | null;
}

export async function createBillItems(items: BillItemInsertInput[]): Promise<{ error: PostgrestError | null }> {
  const adminSupabase = createAdminSupabase();
  const payload = items.map((item) => ({
    bill_id: item.billId,
    product_id: item.productId,
    quantity: item.quantity,
    price: item.price,
    total: item.total,
  }));

  const { error } = await adminSupabase.from("bill_items").insert(payload);
  return { error };
}

export async function listProductsForMenu(): Promise<{ data: ProductRecord[] | null; error: PostgrestError | null }> {
  const publicSupabase = createPublicSupabase();
  return publicSupabase.from("products").select("id,name,price,type");
}
