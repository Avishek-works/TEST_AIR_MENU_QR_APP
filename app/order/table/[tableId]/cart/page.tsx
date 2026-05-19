import { CartPageView } from "@/components/cart/cart-page";
import { normalizeTable } from "@/lib/data";

export default async function CartPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const normalizedTable = normalizeTable(tableId);

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-4">
      <CartPageView tableId={normalizedTable} />
    </main>
  );
}
