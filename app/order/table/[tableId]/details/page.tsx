import { CustomerDetailsForm } from "@/components/order/customer-details-form";
import { normalizeTable } from "@/lib/data";

export default async function DetailsPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const normalizedTable = normalizeTable(tableId);

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-4">
      <CustomerDetailsForm tableId={normalizedTable} />
    </main>
  );
}
