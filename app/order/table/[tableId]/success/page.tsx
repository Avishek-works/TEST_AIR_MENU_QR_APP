import { normalizeTable, getOrderDetails } from "@/lib/data";

type PageParams = {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{ orderId?: string }>;
};

export default async function SuccessPage({
  params,
  searchParams,
}: PageParams) {
  const { tableId } = await params;
  const { orderId } = await searchParams;

  const normalizedTable = normalizeTable(tableId);

  if (!orderId) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8">
          <h1 className="text-xl font-bold">Invalid Order</h1>
        </section>
      </main>
    );
  }

  const order = await getOrderDetails(orderId);
  const orderTypeLabel =
    order?.order_type === "Take-Away" || order?.order_type === "Takeaway"
      ? "🥡 Takeaway"
      : "🍽 Dine-In";

  if (!order) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8">
          <h1 className="text-xl font-bold">Order Not Found</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8">
        <h1 className="text-2xl font-bold">Order Placed 🎉</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Table {normalizedTable}</p>
        <p className="mt-2 text-sm">Order ID: {orderId}</p>
        <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3 text-sm font-semibold text-[var(--text-primary)]">
          {orderTypeLabel}
        </p>
      </section>
    </main>
  );
}
