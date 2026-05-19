import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { createAdminSupabase } from "@/lib/supabase/admin";

export interface CustomerProfileRecord {
  id: string;
  name: string | null;
  email: string | null;
  dob: string | null;
}

export interface CustomerIdRecord {
  id: string;
}

export interface CreateCustomerInput {
  clientId: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
}

export async function findCustomerProfileByPhone(
  clientId: string,
  phone: string,
): Promise<{ data: CustomerProfileRecord | null; error: PostgrestError | null }> {
  const adminSupabase = createAdminSupabase();
  return adminSupabase
    .from("customers")
    .select("id,name,email,dob")
    .eq("client_id", clientId)
    .eq("phone", phone)
    .maybeSingle();
}

export async function findCustomerIdByPhone(
  clientId: string,
  phone: string,
): Promise<{ data: CustomerIdRecord | null; error: PostgrestError | null }> {
  const adminSupabase = createAdminSupabase();
  return adminSupabase
    .from("customers")
    .select("id")
    .eq("client_id", clientId)
    .eq("phone", phone)
    .maybeSingle();
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<{ data: CustomerIdRecord | null; error: PostgrestError | null }> {
  const adminSupabase = createAdminSupabase();
  const payload: {
    client_id: string;
    name: string;
    phone: string;
    is_active: boolean;
    email?: string;
    dob?: string;
  } = {
    client_id: input.clientId,
    name: input.name,
    phone: input.phone,
    is_active: true,
  };

  if (input.email) payload.email = input.email;
  if (input.dob) payload.dob = input.dob;

  return adminSupabase.from("customers").insert(payload).select("id").single();
}

export async function deleteCustomerById(clientId: string, customerId: string): Promise<{ error: PostgrestError | null }> {
  const adminSupabase = createAdminSupabase();
  const { error } = await adminSupabase.from("customers").delete().eq("id", customerId).eq("client_id", clientId);
  return { error };
}
