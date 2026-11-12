"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import SeatChips from "@/components/booking/SeatChips";
import SeatMap from "@/components/seatmap/SeatMap";
import type { CameraMode } from "@/lib/studio/camera";
import { isWebGLAvailable } from "@/lib/studio/scene";
import { generateSeats } from "@/lib/studio/seats";
import { useBookingStore } from "@/store/bookingStore";

const CinemaScene = dynamic(() => import("@/components/preview3d/CinemaScene"), {
  ssr: false,
  loading: () => <Loading label="Memuat scene 3D..." />,
});

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-8 text-sm text-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-border border-t-accent" />
      {label}
    </div>
  );
}

function MissingSchedule() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/movies");
  }, [router]);

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-8 text-sm text-muted">
      <p>Belum ada jadwal tayang yang dipilih. Mengembalikan ke daftar film...</p>
      <Link href="/movies" className="text-foreground underline">
        Ke daftar film
      </Link>
    </div>
  );
}

export default function BookingPreview() {
  const hydrated = useSyncExternalStore(
    (onChange) => useBookingStore.persist.onFinishHydration(onChange),
    () => useBookingStore.persist.hasHydrated(),
    () => false,
  );
  const showtime = useBookingStore((state) => state.showtime);
  const selectedSeatIds = useBookingStore((state) => state.selectedSeatIds);
  const activeSeatId = useBookingStore((state) => state.activeSeatId);
  const toggleSeat = useBookingStore((state) => state.toggleSeat);
  const setActiveSeat = useBookingStore((state) => state.setActiveSeat);
  const [webglAvailable] = useState(isWebGLAvailable);
  const [pickedMode, setPickedMode] = useState<CameraMode | null>(null);

  useEffect(() => {
    void useBookingStore.persist.rehydrate();
  }, []);

  const seats = useMemo(() => (showtime ? generateSeats(showtime.id) : []), [showtime]);
  const selectedSeats = useMemo(
    () => seats.filter((seat) => selectedSeatIds.includes(seat.id)),
    [seats, selectedSeatIds],
  );
  // null means "follow the active seat": a stored selection opens in seat view.
  const mode: CameraMode = pickedMode ?? (activeSeatId ? "seat" : "overview");

  // Wait for sessionStorage before rendering seats, so nothing flashes empty.
  if (!hydrated) return <Loading label="Memuat data kursi..." />;
  if (!showtime) return <MissingSchedule />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span>{showtime.cinema}</span>
        <span>{showtime.studio}</span>
        <span>
          {showtime.date} · {showtime.time}
        </span>
        <span>{selectedSeatIds.length} kursi dipilih</span>
      </div>

      {selectedSeats.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          Belum ada kursi dipilih.{" "}
          <Link href={`/booking/${showtime.movieId}`} className="text-foreground underline">
            Kembali ke peta kursi
          </Link>{" "}
          untuk memilih kursi dulu.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-2xl border border-border p-1 text-sm">
          {(["overview", "seat"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPickedMode(item)}
              aria-pressed={mode === item}
              disabled={item === "seat" && !activeSeatId}
              className={`rounded-xl px-4 py-1.5 transition-colors ${
                mode === item ? "bg-accent text-foreground" : "text-muted hover:text-foreground"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {item === "overview" ? "Overview" : "Seat View"}
            </button>
          ))}
        </div>

        {selectedSeats.length > 0 && (
          <SeatChips
            seats={selectedSeats}
            activeSeatId={activeSeatId}
            onSelect={(seatId) => {
              setActiveSeat(seatId);
              setPickedMode("seat");
            }}
          />
        )}
      </div>

      {webglAvailable ? (
        <div className="h-[60vh] min-h-90 overflow-hidden rounded-2xl border border-border bg-surface">
          <CinemaScene
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            activeSeatId={activeSeatId}
            mode={mode}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            WebGL tidak tersedia di perangkat ini, jadi kami menampilkan peta kursi 2D.
          </p>
          <SeatMap
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            activeSeatId={activeSeatId}
            onToggleSeat={toggleSeat}
          />
        </div>
      )}
    </div>
  );
}
