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
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)]">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Order not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">No order reference was provided. Return to the menu to restart your order.</p>
          <Link href={`/order/table/${normalizedTable}/menu`} className="btn-gold mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-bold shadow-[0_4px_14px_rgba(252,176,58,0.25)] tracking-wide">
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
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)]">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Order lookup failed</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">We could not verify your order. Please return to the menu and try again.</p>
            <Link href={`/order/table/${normalizedTable}/menu`} className="btn-gold mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-bold shadow-[0_4px_14px_rgba(252,176,58,0.25)] tracking-wide">
              Back to menu
            </Link>
          </section>
        </main>
      );
    }

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-gold-soft)] text-4xl shadow-[0_0_28px_rgba(252,176,58,0.20)]">
            ☕
          </div>
          <h1 className="mt-6 text-center text-3xl font-bold text-[var(--text-primary)] tracking-tight">Order Confirmed!</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-[var(--text-secondary)]">Your order is on its way. Sit back and enjoy the vibe.</p>

          <div className="mt-6 rounded-2xl border border-[var(--border-warm)] bg-[var(--bg-elevated)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Order</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Table</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">{order.table_number}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Total</span>
              <span className="text-lg font-bold text-[var(--accent-gold)]">
                {order.total.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
              </span>
            </div>
          </div>

          <Link href={`/order/table/${normalizedTable}/menu`} className="btn-gold mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-bold shadow-[0_4px_18px_rgba(252,176,58,0.30)] tracking-wide">
            Order More →
          </Link>
        </section>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)]">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Order lookup failed</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">We could not verify your order. Please return to the menu and try again.</p>
          <Link href={`/order/table/${normalizedTable}/menu`} className="btn-gold mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-bold shadow-[0_4px_14px_rgba(252,176,58,0.25)] tracking-wide">
            Back to menu
          </Link>
        </section>
      </main>
    );
  }
}
