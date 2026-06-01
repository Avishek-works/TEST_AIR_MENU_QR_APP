import Link from "next/link";
import { getOrderDetails, normalizeTable } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { ORDER_PREPARATION_ETA_LABEL } from "@/lib/table-config";

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

    const hasDiscount = Number(order.discount || 0) > 0;
    const orderDateTime = order.created_at
      ? new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(order.created_at))
      : "—";

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)]">
          <div className="rounded-2xl border border-[var(--border-warm)] bg-[var(--bg-elevated)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-gold)]">Cafe Coffee Aroma</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-primary)]">Payment Received ✅</h1>
            <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">Order Summary</p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-secondary)]">Table</span>
                <span className="font-semibold text-[var(--text-primary)]">{order.table_number}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-secondary)]">Date &amp; Time</span>
                <span className="text-right font-semibold text-[var(--text-primary)]">{orderDateTime}</span>
              </div>
            </div>

            <div className="my-4 border-t border-dashed border-[var(--border)]" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-gold)]">Items</p>
            <div className="mt-3 space-y-2">
              {order.items.map((item, index) => (
                <div key={`${item.product_name}-${index}`} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-[var(--text-secondary)]">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(Number(item.total || 0))}</span>
                </div>
              ))}
            </div>

            <div className="my-4 border-t border-dashed border-[var(--border)]" />

            {hasDiscount ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Subtotal</span>
                  <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(Number(order.total_amount || 0))}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Discount</span>
                  <span className="font-semibold text-[var(--text-primary)]">-{formatCurrency(Number(order.discount || 0))}</span>
                </div>
                <div className="my-4 border-t border-dashed border-[var(--border)]" />
              </>
            ) : null}

            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[var(--text-secondary)]">Total</span>
              <span className="text-xl font-bold text-[var(--accent-gold)]">{formatCurrency(Number(order.final_amount || 0))}</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              All prices are inclusive of applicable taxes.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,rgba(252,176,58,0.12),rgba(37,28,18,0.7))] p-4 shadow-[0_12px_28px_-18px_rgba(252,176,58,0.24)] transition-transform duration-200">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-gold)]">Estimated Preparation Time</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--text-primary)]">{ORDER_PREPARATION_ETA_LABEL}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">We&apos;ll start preparing it right away and serve it fresh at your table.</p>
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
