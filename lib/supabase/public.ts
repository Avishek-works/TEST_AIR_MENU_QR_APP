import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const RESTRICTED_TABLES = new Set(["customers", "bills", "bill_items"]);

const normalizeTableName = (table: string): string => table.trim().replace(/^public\./i, "").replace(/^["']|["']$/g, "").toLowerCase();

const assertPublicTableAccessAllowed = (table: string) => {
  if (RESTRICTED_TABLES.has(normalizeTableName(table))) {
    throw new Error(`[supabase] Restricted table "${table}" must be accessed via createAdminSupabase().`);
  }
};

export const createPublicSupabase = () => {
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const client = createClient(url, anonKey);

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => {
          assertPublicTableAccessAllowed(table);
          return target.from(table);
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  });
};
