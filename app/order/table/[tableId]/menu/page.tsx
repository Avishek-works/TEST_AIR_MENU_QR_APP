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
        <section className="rounded-[1.75rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-6 text-center shadow-[0_18px_40px_-24px_rgba(74,44,33,0.04)]">
          <p className="text-sm font-semibold text-[var(--brand-brown)]">Unable to load menu</p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">There was a problem fetching the menu. Please check your connection and refresh.</p>
          <Link href="/" className="mt-6 inline-flex min-h-[3rem] w-full items-center justify-center rounded-2xl bg-[var(--button-bg)] px-4 text-sm font-semibold text-[var(--brand-brown)] transition hover:brightness-95">Go Home</Link>
        </section>
      </main>
    );
  }
}
