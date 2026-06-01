import { normalizeTable, getOrderDetails } from "@/lib/data";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: { tableId: string };
  searchParams: { orderId?: string };
}) {
  const { tableId } = params;
  const { orderId } = searchParams;

  const normalizedTable = normalizeTable(tableId);

  if (!orderId) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8">
          <h1 className="text-xl font-bold">Invalid Order</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Order reference missing.
          </p>
        </section>
      </main>
    );
  }

  try {
    const order = await getOrderDetails(orderId);

    if (!order) {
      return (
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8">
            <h1 className="text-xl font-bold">Order Not Found</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              We couldn’t find your order.
            </p>
          </section>
        </main>
      );
    }

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8">
          <h1 className="text-2xl font-bold">Order Placed 🎉</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Table {normalizedTable}
          </p>

          <div className="mt-4 text-sm">
            <p>Order ID: {orderId}</p>
          </div>
        </section>
      </main>
    );
  } catch (err) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8">
          <h1 className="text-xl font-bold">Something went wrong</h1>
        </section>
      </main>
    );
  }
}
