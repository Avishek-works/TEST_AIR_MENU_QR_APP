import { notFound } from "next/navigation";
import { CustomerDetailsForm } from "@/components/order/customer-details-form";
import { getActiveTable, normalizeTable } from "@/lib/data";

export default async function DetailsPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const normalizedTable = normalizeTable(tableId);
  const table = await getActiveTable(normalizedTable);

  if (!table) notFound();

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-4">
      <CustomerDetailsForm tableId={table.table_number} />
    </main>
  );
}
