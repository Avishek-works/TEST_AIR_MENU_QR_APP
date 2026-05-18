import Link from "next/link";
import { getOrderDetails, normalizeTable } from "@/lib/data";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { tableId } = await params;
  const { orderId } = await searchParams;
  const normalizedTable = normalizeTable(tableId);

  if (!orderId) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-8 shadow-[0_35px_90px_-42px_rgba(74,44,33,0.04)]">
          <h1 className="text-2xl font-semibold text-[var(--brand-brown)]">Order not found</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">No order reference was provided. Return to the menu to restart your order.</p>
          <Link href={`/order/table/${normalizedTable}/menu`} className="mt-8 inline-flex min-h-[3rem] w-full items-center justify-center rounded-2xl bg-[var(--brand-brown)] px-4 text-sm font-semibold text-[var(--brand-white)] transition hover:brightness-95">
            Back to menu
          </Link>
        </section>
      </main>
    );
  }

  try {
    const order = await getOrderDetails(orderId);
    if (!order) {
      return (
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
          <section className="rounded-[2rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-8 shadow-[0_35px_90px_-42px_rgba(74,44,33,0.04)]">
            <h1 className="text-2xl font-semibold text-[var(--brand-brown)]">Order lookup failed</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">We could not verify your order. Please return to the menu and try again.</p>
            <Link href={`/order/table/${normalizedTable}/menu`} className="mt-6 inline-flex min-h-[3rem] w-full items-center justify-center rounded-2xl bg-[var(--brand-brown)] px-4 text-sm font-semibold text-[var(--brand-white)] transition hover:brightness-95">
              Back to menu
            </Link>
          </section>
        </main>
      );
    }

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-8 shadow-[0_35px_90px_-42px_rgba(74,44,33,0.04)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-brown-opaque)] text-4xl shadow-[0_12px_30px_-18px_rgba(74,44,33,0.06)]">
            ☕
          </div>
          <h1 className="mt-6 text-center text-3xl font-semibold text-[var(--brand-brown)]">Order Confirmed</h1>
          <p className="mt-3 text-center text-sm leading-6 text-[var(--muted)]">Your order is on its way to the counter. Relax and enjoy the cozy coffee vibes.</p>
          <div className="mt-6 rounded-[1.75rem] bg-[var(--brand-beige)] p-4 text-sm text-[var(--muted)] shadow-[0_8px_20px_-16px_rgba(74,44,33,0.06)]">
            <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
            <p className="mt-2 text-[var(--muted)]">Table {order.table_number}</p>
            <p className="mt-2 font-semibold text-[var(--brand-brown)]">Total {order.total.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p>
          </div>
          <Link href={`/order/table/${normalizedTable}/menu`} className="mt-8 inline-flex min-h-[3rem] w-full items-center justify-center rounded-2xl bg-[var(--brand-brown)] px-4 text-sm font-semibold text-[var(--brand-white)] transition hover:brightness-95">
            Order More
          </Link>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-8 shadow-[0_35px_90px_-42px_rgba(74,44,33,0.04)]">
          <h1 className="text-2xl font-semibold text-[var(--brand-brown)]">Order lookup failed</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">We could not verify your order. Please return to the menu and try again.</p>
          <Link href={`/order/table/${normalizedTable}/menu`} className="mt-6 inline-flex min-h-[3rem] w-full items-center justify-center rounded-2xl bg-[var(--brand-brown)] px-4 text-sm font-semibold text-[var(--brand-white)] transition hover:brightness-95">
            Back to menu
          </Link>
        </section>
      </main>
    );
  }
}
