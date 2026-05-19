import Link from "next/link";

export default function TableNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-4">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)]">
        <p className="text-3xl">🔍</p>
        <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)] tracking-tight">Table not found</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Please scan a valid Cafe Coffee Aroma QR code.</p>
        <Link
          href="/"
          className="btn-gold mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold shadow-[0_4px_14px_rgba(252,176,58,0.25)] tracking-wide"
        >
          Back Home
        </Link>
      </section>
    </main>
  );
}
