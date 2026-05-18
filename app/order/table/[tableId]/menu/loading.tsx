import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingMenu() {
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-10 w-full" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </main>
  );
}
