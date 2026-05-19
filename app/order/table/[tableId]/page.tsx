import Link from "next/link";
import { normalizeTable } from "@/lib/data";

export default async function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const normalizedTable = normalizeTable(tableId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
      <section className="rounded-[2rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-6 shadow-[0_30px_70px_-36px_rgba(74,44,33,0.04)] backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Cafe Coffee Aroma</p>
        <h1 className="mt-4 text-4xl font-semibold text-[var(--brand-brown)]">Table {normalizedTable}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
           Scan the QR code at the table to get started. You can browse the menu, add items to your cart, and place your order directly from your phone.
        </p>
        <div className="mt-6 rounded-[1.75rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-beige)] p-5 shadow-[0_20px_40px_-26px_rgba(74,44,33,0.06)]">
          <p className="text-sm text-[var(--muted)]">Scan the menu, add favorites, and place your order in minutes.</p>
        </div>
        <Link
          href={`/order/table/${normalizedTable}/menu`}
            className="mt-6 inline-flex min-h-[3rem] w-full items-center justify-center rounded-2xl bg-[var(--button-bg)] px-4 font-semibold text-[var(--brand-brown)] transition hover:brightness-95"
        >
          Start Ordering
        </Link>
      </section>
    </main>
  );
}
