import Link from "next/link";
import { MenuView } from "@/components/menu/menu-view";
import { getMenuData, normalizeTable } from "@/lib/data";

export default async function MenuPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const normalizedTable = normalizeTable(tableId);

  try {
    const menu = await getMenuData();

    return (
      <main className="mx-auto w-full max-w-md px-4 pt-4">
        <MenuView tableNumber={normalizedTable} categories={menu.categories} items={menu.items} />
      </main>
    );
  } catch {
    return (
      <main className="mx-auto w-full max-w-md px-4 pt-4">
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--brand-beige)] p-6 text-center shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]">
          <p className="text-3xl">⚠️</p>
          <p className="mt-4 text-sm font-bold text-[var(--brand-brown)]">Unable to load menu</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">There was a problem fetching the menu. Please check your connection and refresh.</p>
          <Link href="/" className="btn-gold mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-bold shadow-[0_4px_14px_rgba(252,176,58,0.25)] tracking-wide">Go Home</Link>
        </section>
      </main>
    );
  }
}
