import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl shadow-red-950/20">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Cafe Coffee Aroma</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Scan. Sip. Smile.</h1>
        <p className="mt-2 text-sm text-zinc-400">Start a demo order from table T1.</p>
        <Link
          href="/order/table/T1"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-red-600 font-medium text-white transition hover:bg-red-500"
        >
          Start Ordering
        </Link>
      </div>
    </main>
  );
}
