import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveTable, normalizeTable } from "@/lib/data";

export default async function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const normalizedTable = normalizeTable(tableId);
  const table = await getActiveTable(normalizedTable);

  if (!table) notFound();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl shadow-black/40">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Cafe Coffee Aroma</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Table {table.table_number}</h1>
        <p className="mt-2 text-sm text-zinc-400">Premium brews, bites, and fast QR ordering.</p>
        <Link
          href={`/order/table/${table.table_number}/menu`}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-red-600 font-medium text-white transition hover:bg-red-500"
        >
          Start Ordering
        </Link>
      </section>
    </main>
  );
}
