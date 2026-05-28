"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPublicSupabase } from "@/lib/supabase/public";

function formatAmount(amount: number) {
  return Number(amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

function toStatusValue(value: string | null | undefined) {
  return String(value || "").trim().toUpperCase();
}

function isPreparationStatus(status: string | null | undefined) {
  const normalized = toStatusValue(status);
  return normalized === "ACCEPTED" || normalized === "PREPARING";
}

export function ManualPaymentScreen({
  tableId,
  orderId,
  tableNumber,
  finalAmount,
  initialStatus,
  upiId,
  merchantName,
  qrImageUrl,
}: {
  tableId: string;
  orderId: string;
  tableNumber: string;
  finalAmount: number;
  initialStatus: string;
  upiId: string;
  merchantName: string;
  qrImageUrl?: string;
}) {
  const [hasMarkedPaid, setHasMarkedPaid] = useState(false);
  const [isPreparing, setIsPreparing] = useState(isPreparationStatus(initialStatus));
  const [copyMessage, setCopyMessage] = useState("");

  const displayOrderRef = orderId.slice(0, 8).toUpperCase();
  const deepUpiLink = useMemo(() => {
    const query = new URLSearchParams({
      pa: upiId,
      pn: merchantName,
      am: finalAmount.toFixed(2),
      tn: orderId,
    });
    return `upi://pay?${query.toString()}`;
  }, [upiId, merchantName, finalAmount, orderId]);

  useEffect(() => {
    if (isPreparing) return;

    const supabase = createPublicSupabase();
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bills",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const nextStatus = toStatusValue((payload.new as { status?: string } | null)?.status);
          if (isPreparationStatus(nextStatus)) {
            setIsPreparing(true);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isPreparing, orderId]);

  const copyUpiId = async () => {
    if (!upiId) return;
    try {
      await navigator.clipboard.writeText(upiId);
      setCopyMessage("UPI ID copied");
    } catch {
      setCopyMessage("Unable to copy UPI ID");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)]">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Complete payment</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Pay using UPI and confirm once done.</p>

        <div className="mt-5 rounded-2xl border border-[var(--border-warm)] bg-[var(--bg-elevated)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Amount</span>
            <span className="text-xl font-bold text-[var(--accent-gold)]">{formatAmount(finalAmount)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Table</span>
            <span className="text-xs font-bold text-[var(--text-primary)]">{tableNumber}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Order Ref</span>
            <span className="text-xs font-bold text-[var(--text-primary)]">#{displayOrderRef}</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <p className="text-[11px] font-medium text-[var(--text-secondary)]">UPI ID</p>
          <p className="mt-1 break-all text-sm font-semibold text-[var(--text-primary)]">{upiId}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyUpiId}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-xs font-semibold text-[var(--text-primary)]"
            >
              Copy UPI ID
            </button>
            <a
              href={deepUpiLink}
              className="btn-gold inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-xs font-bold tracking-wide"
            >
              Open UPI App
            </a>
          </div>
          {copyMessage ? <p className="mt-2 text-[11px] text-[var(--text-secondary)]">{copyMessage}</p> : null}
        </div>

        {qrImageUrl ? (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">Scan QR (optional)</p>
            <img src={qrImageUrl} alt="UPI payment QR code" className="mt-3 w-full rounded-xl border border-[var(--border)]" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setHasMarkedPaid(true)}
          disabled={hasMarkedPaid}
          className={`btn-gold mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-bold tracking-wide transition-opacity ${
            hasMarkedPaid ? "opacity-60" : "opacity-100"
          }`}
        >
          {hasMarkedPaid ? "Waiting for confirmation..." : "I Have Paid"}
        </button>

        {hasMarkedPaid ? (
          <p className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            Payment confirmation pending from restaurant
          </p>
        ) : null}

        {isPreparing ? (
          <p className="mt-3 rounded-xl border border-[var(--border-warm)] bg-[var(--bg-elevated)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
            Order is being prepared
          </p>
        ) : null}

        <Link
          href={`/order/table/${tableId}/menu`}
          className="btn-ghost mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-secondary)]"
        >
          Back to menu
        </Link>
      </section>
    </main>
  );
}
