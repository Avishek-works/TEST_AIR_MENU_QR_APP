"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_TABLE_ID, TABLE_OPTIONS } from "@/lib/table-config";

export default function Home() {
  const router = useRouter();
  const [table, setTable] = useState(DEFAULT_TABLE_ID);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  return (
    <main className="home-hero-root mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <div aria-hidden className="home-ambient-glow" />
      <div aria-hidden className="home-steam home-steam-1">☕</div>
      <div aria-hidden className="home-steam home-steam-2">☕</div>
      <div aria-hidden className="home-bean home-bean-1">●</div>
      <div aria-hidden className="home-bean home-bean-2">●</div>

      <div className="home-card-fade-up relative rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)]">
        {/* Brand mark */}
        <div className="home-reveal-delay-1 flex items-center gap-2">
          <span className="text-2xl">☕</span>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-gold)] opacity-90">
            Coffee Aroma
          </p>
        </div>

        <h1 className="home-reveal-delay-2 mt-4 text-3xl font-bold text-[var(--text-primary)] leading-snug tracking-tight sm:text-4xl">
          Welcome to our<br />cozy corner.
        </h1>
        <p className="home-reveal-delay-3 mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Premium coffee, handcrafted pastries, and warm bites — ordered right from your table.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            router.push(`/order/table/${table}/menu`);
          }}
          className="home-reveal-delay-4 mt-6 space-y-4"
        >
          <label className="block">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Table Number</span>
            <div className="relative mt-2">
              <select
                value={table}
                onChange={(event) => setTable(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 pr-11 text-base font-medium text-[var(--text-primary)] outline-none transition-all duration-200 hover:border-[var(--border-warm)] focus:border-[var(--border-warm)] focus:ring-2 focus:ring-[var(--accent-gold-soft)]"
              >
                {TABLE_OPTIONS.map((tableOption) => (
                  <option key={tableOption} value={tableOption} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {tableOption}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[var(--accent-gold)]">
                ▾
              </span>
            </div>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="btn-gold home-premium-button inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl px-5 text-sm font-bold shadow-[0_4px_18px_rgba(252,176,58,0.30)] tracking-wide"
            >
              Start Ordering →
            </button>
            <Link
              href="/order/table/T1/menu"
              className="btn-ghost home-premium-button inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-5 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-warm)] hover:text-[var(--text-primary)]"
            >
              Explore Menu
            </Link>
          </div>
        </form>

        <div className="home-reveal-delay-4 mt-6 flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span>Powered by</span>
          {!logoLoadFailed ? (
            <Image
              src="/branding/evolvnex-logo.png"
              alt="EvolvNex"
              width={84}
              height={18}
              className="h-auto w-[84px] opacity-80"
              onError={() => setLogoLoadFailed(true)}
            />
          ) : (
            <span className="font-medium tracking-wide text-[var(--text-secondary)]">EvolvNex</span>
          )}
        </div>
      </div>
    </main>
  );
}
