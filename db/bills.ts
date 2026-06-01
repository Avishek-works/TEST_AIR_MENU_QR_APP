import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { createAdminSupabase } from "@/lib/supabase/admin";

type NotesColumn = "order_notes" | "notes";

export interface CreateBillInput {
  clientId: string;
  customerId: string;
  tableNumber: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  status: string;
  notesColumn?: NotesColumn | null;
  notes?: string;
}

export interface BillInsertRecord {
  id: string;
  client_id: string;
}

export interface OrderDetailsRecord {
  id: string;
  table_number: string;
  total_amount: number;
  discount: number;
  final_amount: number;
  created_at: string;
  items: {
    product_name: string;
    quantity: number;
    total: number;
  }[];
}

export async function createBill(
  input: CreateBillInput,
): Promise<{ data: BillInsertRecord | null; error: PostgrestError | null }> {
  const adminSupabase = createAdminSupabase();
  const payload: {
    client_id: string;
    customer_id: string;
    table_number: string;
    total_amount: number;
    discount: number;
    final_amount: number;
    status: string;
    order_notes?: string;
    notes?: string;
  } = {
    client_id: input.clientId,
    customer_id: input.customerId,
    table_number: input.tableNumber,
    total_amount: input.totalAmount,
    discount: input.discount,
    final_amount: input.finalAmount,
    status: input.status,
  };

  if (input.notesColumn && input.notes) {
    payload[input.notesColumn] = input.notes;
  }

  return adminSupabase.from("bills").insert(payload).select("id,client_id").single();
}

export async function deleteBillById(billId: string): Promise<{ error: PostgrestError | null }> {
  const adminSupabase = createAdminSupabase();
  const { error } = await adminSupabase.from("bills").delete().eq("id", billId);
  return { error };
}

export async function getBillOrderDetails(
  orderId: string,
): Promise<{ data: OrderDetailsRecord | null; error: PostgrestError | null }> {
  const adminSupabase = createAdminSupabase();
  const { data: bill, error: billError } = await adminSupabase
    .from("bills")
    .select("id,table_number,total_amount,discount,final_amount,created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (billError || !bill) {
    return { data: null, error: billError };
  }

  const { data: billItems, error: billItemsError } = await adminSupabase
    .from("bill_items")
    .select("quantity,total,products(name)")
    .eq("bill_id", orderId);

  if (billItemsError) {
    return { data: null, error: billItemsError };
  }

  const items = (billItems ?? []).map((item) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    return {
      product_name: typeof product?.name === "string" && product.name.trim() ? product.name : "Item",
      quantity: Number(item.quantity || 0),
      total: Number(item.total || 0),
    };
  });

  return { data: { ...bill, items }, error: null };
}
