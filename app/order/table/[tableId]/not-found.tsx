import Link from "next/link";

export default function TableNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-4">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Table not found</h1>
        <p className="mt-2 text-sm text-zinc-400">Please scan a valid Cafe Coffee Aroma QR code.</p>
        <Link href="/" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-red-600 text-white">
          Back Home
        </Link>
      </section>
    </main>
  );
}
