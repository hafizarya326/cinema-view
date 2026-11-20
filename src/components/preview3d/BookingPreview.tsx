"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import SeatChips from "@/components/booking/SeatChips";
import SeatComparison from "@/components/booking/SeatComparison";
import ViewingInfoPanel from "@/components/booking/ViewingInfoPanel";
import SceneErrorBoundary from "@/components/preview3d/SceneErrorBoundary";
import SeatMap from "@/components/seatmap/SeatMap";
import { applyBookedSeats, useIsMounted } from "@/lib/bookings";
import type { CameraMode } from "@/lib/studio/camera";
import { isWebGLAvailable } from "@/lib/studio/scene";
import { generateSeats } from "@/lib/studio/seats";
import { getViewingInfo } from "@/lib/studio/viewing";
import { useBookingStore } from "@/store/bookingStore";
import type { Seat } from "@/types";

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

const PreviewSeatChips = memo(function PreviewSeatChips({
  seats,
  onSelect,
}: {
  seats: Seat[];
  onSelect: (seatId: string) => void;
}) {
  const activeSeatId = useBookingStore((state) => state.activeSeatId);
  return <SeatChips seats={seats} activeSeatId={activeSeatId} onSelect={onSelect} />;
});

const PreviewSeatComparison = memo(function PreviewSeatComparison({
  seats,
  onSelectSeat,
}: {
  seats: Seat[];
  onSelectSeat: (seatId: string) => void;
}) {
  const activeSeatId = useBookingStore((state) => state.activeSeatId);
  return <SeatComparison seats={seats} activeSeatId={activeSeatId} onSelectSeat={onSelectSeat} />;
});

const PreviewCinemaScene = memo(function PreviewCinemaScene({
  seats,
  selectedSeatIds,
  mode,
  onContextLost,
}: {
  seats: Seat[];
  selectedSeatIds: string[];
  mode: CameraMode;
  onContextLost: () => void;
}) {
  const activeSeatId = useBookingStore((state) => state.activeSeatId);
  return (
    <CinemaScene
      seats={seats}
      selectedSeatIds={selectedSeatIds}
      activeSeatId={activeSeatId}
      mode={mode}
      onContextLost={onContextLost}
    />
  );
});

const PreviewActiveSeatSummary = memo(function PreviewActiveSeatSummary({
  seats,
}: {
  seats: Seat[];
}) {
  const activeSeatId = useBookingStore((state) => state.activeSeatId);
  const seat = useMemo(
    () => seats.find((item) => item.id === activeSeatId) ?? null,
    [seats, activeSeatId],
  );

  if (!seat) {
    return (
      <p className="sr-only" data-testid="active-seat-summary">
        Belum ada kursi aktif di pratinjau 3D.
      </p>
    );
  }

  const info = getViewingInfo(seat);
  return (
    <p className="sr-only" data-testid="active-seat-summary">
      Ringkasan kursi aktif: Baris {seat.row} kursi {seat.number} ({seat.id}), skor visibilitas{" "}
      {info.visibilityScore} ({info.visibilityLabel}).
    </p>
  );
});

const PreviewSeatMapFallback = memo(function PreviewSeatMapFallback({
  message,
  seats,
  selectedSeatIds,
  onToggleSeat,
}: {
  message: string;
  seats: Seat[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: Seat) => void;
}) {
  const activeSeatId = useBookingStore((state) => state.activeSeatId);
  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
        {message}
      </p>
      <SeatMap
        seats={seats}
        selectedSeatIds={selectedSeatIds}
        activeSeatId={activeSeatId}
        onToggleSeat={onToggleSeat}
      />
    </div>
  );
});

export default function BookingPreview() {
  const hydrated = useSyncExternalStore(
    (onChange) => useBookingStore.persist.onFinishHydration(onChange),
    () => useBookingStore.persist.hasHydrated(),
    () => false,
  );
  const showtime = useBookingStore((state) => state.showtime);
  const selectedSeatIds = useBookingStore((state) => state.selectedSeatIds);
  // Narrow boolean selector: switching active seat between selected seats won't re-render this shell.
  const hasActiveSeat = useBookingStore((state) => state.activeSeatId !== null);
  const toggleSeat = useBookingStore((state) => state.toggleSeat);
  const setActiveSeat = useBookingStore((state) => state.setActiveSeat);
  const [webglAvailable] = useState(isWebGLAvailable);
  const [pickedMode, setPickedMode] = useState<CameraMode | null>(null);
  const [sceneFailed, setSceneFailed] = useState(false);
  const mounted = useIsMounted();

  useEffect(() => {
    void useBookingStore.persist.rehydrate();
  }, []);

  // Confirmed seats come back occupied in both the 2D fallback and the 3D scene;
  // localStorage is only read after mount so hydration stays identical.
  const seats = useMemo(() => {
    if (!showtime) return [];
    const base = generateSeats(showtime.id);
    return mounted ? applyBookedSeats(base, showtime.id) : base;
  }, [showtime, mounted]);
  const selectedSeats = useMemo(
    () => seats.filter((seat) => selectedSeatIds.includes(seat.id)),
    [seats, selectedSeatIds],
  );
  // null means "follow the active seat": a stored selection opens in seat view.
  const mode: CameraMode = pickedMode ?? (hasActiveSeat ? "seat" : "overview");

  const handleContextLost = useCallback(() => setSceneFailed(true), []);
  const handleSelectChip = useCallback(
    (seatId: string) => {
      setActiveSeat(seatId);
      setPickedMode((prev) => (prev === "overview" ? "seat" : prev));
    },
    [setActiveSeat],
  );

  // Shown when WebGL is missing, when the scene crashes, or when the context is lost.
  const fallbackMessage = webglAvailable
    ? "Tampilan 3D berhenti berjalan, jadi kami menampilkan peta kursi 2D."
    : "WebGL tidak tersedia di perangkat ini, jadi kami menampilkan peta kursi 2D.";
  const seatMapFallback = useMemo(
    () => (
      <PreviewSeatMapFallback
        message={fallbackMessage}
        seats={seats}
        selectedSeatIds={selectedSeatIds}
        onToggleSeat={toggleSeat}
      />
    ),
    [fallbackMessage, seats, selectedSeatIds, toggleSeat],
  );

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
          <Link
            href={`/booking/${showtime.movieId}`}
            className="inline-flex min-h-10 items-center text-foreground underline"
          >
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
              disabled={item === "seat" && !hasActiveSeat}
              className={`rounded-xl px-4 py-1.5 transition-colors ${
                mode === item ? "bg-accent text-foreground" : "text-muted hover:text-foreground"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {item === "overview" ? "Overview" : "Seat View"}
            </button>
          ))}
        </div>

        {selectedSeats.length > 0 && (
          <PreviewSeatChips seats={selectedSeats} onSelect={handleSelectChip} />
        )}
      </div>

      <Link
        href="/checkout"
        aria-disabled={selectedSeatIds.length === 0}
        className={`w-fit rounded-2xl bg-accent px-5 py-3 text-sm font-medium transition-opacity ${
          selectedSeatIds.length === 0 ? "pointer-events-none opacity-40" : "hover:opacity-90"
        }`}
      >
        Lanjut ke Checkout
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Panel lives outside the touch-none canvas wrapper so scrolling it works on mobile. */}
        <div>
          <PreviewActiveSeatSummary seats={seats} />
          {!webglAvailable || sceneFailed ? (
            seatMapFallback
          ) : (
            <SceneErrorBoundary fallback={seatMapFallback}>
              <div className="h-[60vh] min-h-90 overflow-hidden rounded-2xl border border-border bg-surface">
                <PreviewCinemaScene
                  seats={seats}
                  selectedSeatIds={selectedSeatIds}
                  mode={mode}
                  onContextLost={handleContextLost}
                />
              </div>
            </SceneErrorBoundary>
          )}
        </div>

        <ViewingInfoPanel seats={seats} backHref={`/booking/${showtime.movieId}`} />
      </div>

      {/* Outside the touch-none canvas wrapper: horizontal scroll stays inside this box. */}
      <PreviewSeatComparison seats={selectedSeats} onSelectSeat={setActiveSeat} />
    </div>
  );
}
