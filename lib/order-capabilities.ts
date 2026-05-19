import "server-only";

import { createAdminSupabase } from "@/lib/supabase/admin";

const NOTES_COLUMNS = ["order_notes", "notes"] as const;

type SupportedNotesColumn = (typeof NOTES_COLUMNS)[number];

export interface OrderNotesSupport {
  enabled: boolean;
  columnName: SupportedNotesColumn | null;
}

let orderNotesSupportPromise: Promise<OrderNotesSupport> | null = null;

export function getOrderNotesSupport(): Promise<OrderNotesSupport> {
  if (!orderNotesSupportPromise) {
    orderNotesSupportPromise = resolveOrderNotesSupport();
  }

  return orderNotesSupportPromise;
}

async function resolveOrderNotesSupport(): Promise<OrderNotesSupport> {
  try {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .schema("information_schema")
      .from("columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", "bills")
      .in("column_name", [...NOTES_COLUMNS]);

    if (error) {
      console.error("[order] could not inspect notes column support", {
        code: error.code,
        message: error.message,
      });
      return { enabled: false, columnName: null };
    }

    const supportedColumn = NOTES_COLUMNS.find((columnName) =>
      (data ?? []).some((column) => column.column_name === columnName),
    );

    return supportedColumn
      ? { enabled: true, columnName: supportedColumn }
      : { enabled: false, columnName: null };
  } catch (error) {
    console.error("[order] notes capability lookup failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { enabled: false, columnName: null };
  }
}
