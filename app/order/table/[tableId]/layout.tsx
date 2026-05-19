import { StickyCartBar } from "@/components/cart/sticky-cart-bar";
import { TableSession } from "@/components/cart/table-session";

export default async function TableLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;

  return (
    <>
      <TableSession tableId={tableId} />
      <div className="pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</div>
      <StickyCartBar tableId={tableId} />
    </>
  );
}
