import Link from "next/link";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { tableId } = await params;
  const { orderId } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-center">
        <p className="text-5xl">☕</p>
        <h1 className="mt-4 text-2xl font-semibold text-white">Your order has been sent to the counter ☕</h1>
        {orderId ? <p className="mt-2 text-sm text-zinc-500">Order #{orderId.slice(0, 8)}</p> : null}
        <Link
          href={`/order/table/${tableId}/menu`}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-red-600 font-medium text-white transition hover:bg-red-500"
        >
          Order More
        </Link>
      </section>
    </main>
  );
}
