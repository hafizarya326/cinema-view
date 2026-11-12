export default function MovieDetailLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <span className="sr-only">Memuat detail film...</span>
      <div className="h-4 w-40 animate-pulse rounded-full bg-surface" />

      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <div className="aspect-2/3 w-full max-w-[300px] animate-pulse rounded-2xl border border-border bg-surface" />

        <div className="flex flex-col gap-4">
          <div className="h-9 w-2/3 animate-pulse rounded-full bg-surface" />
          <div className="h-4 w-1/3 animate-pulse rounded-full bg-surface" />
          <div className="h-24 w-full animate-pulse rounded-2xl bg-surface" />
          <div className="aspect-video w-full animate-pulse rounded-2xl border border-border bg-surface" />
          <div className="h-12 w-40 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    </div>
  );
}
