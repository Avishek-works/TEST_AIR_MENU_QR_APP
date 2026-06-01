import Link from "next/link";
import { normalizeTable } from "@/lib/data";

export default async function TablePage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const normalizedTable = normalizeTable(tableId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-2">
          <span className="text-xl">☕</span>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-gold)] opacity-90">
            Cafe Coffee Aroma
          </p>
        </div>

        <h1 className="mt-4 text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Table {normalizedTable}
        </h1>

        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Browse the menu and place your order.
        </p>

        <Link
          href={`/order/table/${normalizedTable}/menu`}
          className="btn-gold mt-5 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 font-bold"
        >
          Start Ordering →
        </Link>
      </section>
    </main>
  );
}
