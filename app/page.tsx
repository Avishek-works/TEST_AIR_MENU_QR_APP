"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [table, setTable] = useState("T1");
  const normalizedTable = useMemo(() => table.trim().toUpperCase(), [table]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--brand-beige)] p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.08)] backdrop-blur-sm">
        <div className="rounded-[1.75rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-6 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.04)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Cafe Coffee Aroma</p>
          <h1 className="mt-4 text-4xl font-semibold text-[var(--brand-brown)] sm:text-5xl">Welcome to our cozy corner.</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Place your order from the table and enjoy premium coffee, pastries and handcrafted bites.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              router.push(`/order/table/${normalizedTable}`);
            }}
            className="mt-6 space-y-4"
          >
            <label className="block text-sm text-[var(--muted)]">
              Table Number
              <input
                value={table}
                onChange={(event) => setTable(event.target.value)}
                placeholder="T1"
                className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--brand-white)] px-4 py-3 text-base text-[var(--brand-brown)] outline-none transition focus:border-[var(--brand-brown)] focus:ring-2 focus:ring-[var(--brand-brown-opaque)]"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex min-h-[3rem] flex-1 items-center justify-center rounded-2xl bg-[var(--brand-brown)] px-4 font-semibold text-[var(--brand-white)] transition hover:brightness-95"
                style={{ boxShadow: '0 8px 20px rgba(74,44,33,0.12)' }}
              >
                Start Ordering
              </button>
              <Link
                href="/order/table/T1"
                className="inline-flex min-h-[3rem] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--brand-white)] px-4 text-sm font-medium text-[var(--brand-brown)] transition hover:border-[var(--brand-brown)]"
                style={{ boxShadow: '0 6px 18px rgba(74,44,33,0.06)' }}
              >
                Explore Demo Menu
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
