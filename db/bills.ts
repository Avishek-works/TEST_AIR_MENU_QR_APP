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
  final_amount: number;
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
  return adminSupabase.from("bills").select("id,table_number,final_amount").eq("id", orderId).maybeSingle();
}
