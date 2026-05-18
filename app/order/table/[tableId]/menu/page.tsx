import { notFound } from "next/navigation";
import { MenuView } from "@/components/menu/menu-view";
import { getActiveTable, getMenuData, normalizeTable } from "@/lib/data";

export default async function MenuPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const normalizedTable = normalizeTable(tableId);
  const [table, menu] = await Promise.all([getActiveTable(normalizedTable), getMenuData()]);

  if (!table) notFound();

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-4">
      <MenuView tableNumber={table.table_number} categories={menu.categories} items={menu.items} />
    </main>
  );
}
