import "server-only";

type SupportedNotesColumn = "order_notes" | "notes";

export interface OrderNotesSupport {
  enabled: boolean;
  columnName: SupportedNotesColumn | null;
}

let orderNotesSupportPromise: Promise<OrderNotesSupport> | null = null;

export function getOrderNotesSupport(): Promise<OrderNotesSupport> {
  if (!orderNotesSupportPromise) {
    orderNotesSupportPromise = Promise.resolve({ enabled: false, columnName: null });
  }

  return orderNotesSupportPromise;
}
