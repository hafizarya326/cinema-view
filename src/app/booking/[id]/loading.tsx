export default function BookingLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <span className="sr-only">Memuat jadwal dan peta kursi...</span>

      <div className="flex flex-col gap-2">
        <div className="h-9 w-2/3 animate-pulse rounded-full bg-surface" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-surface" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="h-4 w-24 animate-pulse rounded-full bg-surface" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-11 w-24 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    </div>
  );
}
