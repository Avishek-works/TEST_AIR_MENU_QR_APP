import Link from "next/link";

export default function TableNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-4">
      <section className="rounded-3xl border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-6 text-center shadow-[0_10px_30px_-20px_rgba(74,44,33,0.08)]">
        <h1 className="text-2xl font-semibold text-[var(--brand-brown)]">Table not found</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Please scan a valid Cafe Coffee Aroma QR code.</p>
        <Link href="/" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--button-bg)] text-[var(--brand-brown)]">
          Back Home
        </Link>
      </section>
    </main>
  );
}
