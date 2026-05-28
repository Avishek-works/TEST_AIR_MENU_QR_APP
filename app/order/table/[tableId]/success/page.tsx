import Link from "next/link";
import { ManualPaymentScreen } from "@/components/order/manual-payment-screen";
import { getOrderDetails, normalizeTable } from "@/lib/data";
import { getUpiPaymentConfig } from "@/lib/config";

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

    const paymentConfig = getUpiPaymentConfig();

    return (
      <ManualPaymentScreen
        tableId={normalizedTable}
        orderId={order.id}
        tableNumber={order.table_number}
        finalAmount={Number(order.final_amount || 0)}
        initialStatus={order.status}
        upiId={paymentConfig.upiId}
        merchantName={paymentConfig.merchantName}
        qrImageUrl={paymentConfig.qrImageUrl || undefined}
      />
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
