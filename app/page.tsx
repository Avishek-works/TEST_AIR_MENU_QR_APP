"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [table, setTable] = useState("T1");
  const normalizedTable = useMemo(() => table.trim().toUpperCase(), [table]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)]">
        {/* Brand mark */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">☕</span>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-gold)] opacity-90">
            Cafe Coffee Aroma
          </p>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-[var(--text-primary)] leading-snug tracking-tight sm:text-4xl">
          Welcome to our<br />cozy corner.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Premium coffee, handcrafted pastries, and warm bites — ordered right from your table.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            router.push(`/order/table/${normalizedTable}/menu`);
          }}
          className="mt-6 space-y-4"
        >
          <label className="block">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Table Number</span>
            <input
              value={table}
              onChange={(event) => setTable(event.target.value)}
              placeholder="T1"
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-base text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all duration-200 focus:border-[var(--border-warm)] focus:ring-2 focus:ring-[var(--accent-gold-soft)]"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="btn-gold inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl px-5 text-sm font-bold shadow-[0_4px_18px_rgba(252,176,58,0.30)] tracking-wide"
            >
              Start Ordering →
            </button>
            <Link
              href="/order/table/T1/menu"
              className="btn-ghost inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-5 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-warm)] hover:text-[var(--text-primary)]"
            >
              Explore Menu
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
