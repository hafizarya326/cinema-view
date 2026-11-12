"use client";

import { useEffect, useMemo, useState } from "react";
import SelectedSeatsPanel from "@/components/booking/SelectedSeatsPanel";
import SeatMap from "@/components/seatmap/SeatMap";
import { applyBookedSeats, useIsMounted } from "@/lib/bookings";
import { formatDateLabel, showtimesForDate } from "@/lib/showtimes";
import { generateSeats } from "@/lib/studio/seats";
import { useBookingStore } from "@/store/bookingStore";
import type { Movie, Showtime } from "@/types";

export default function BookingClient({
  movie,
  dateKeys,
  showtimes,
  cinema,
  studio,
}: {
  movie: Movie;
  dateKeys: string[];
  showtimes: Showtime[];
  cinema: string;
  studio: string;
}) {
  const setMovie = useBookingStore((state) => state.setMovie);
  const setShowtime = useBookingStore((state) => state.setShowtime);
  const storedShowtime = useBookingStore((state) => state.showtime);
  const selectedSeatIds = useBookingStore((state) => state.selectedSeatIds);
  const activeSeatId = useBookingStore((state) => state.activeSeatId);
  const toggleSeat = useBookingStore((state) => state.toggleSeat);
  const setActiveSeat = useBookingStore((state) => state.setActiveSeat);
  const clearSeats = useBookingStore((state) => state.clearSeats);

  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const mounted = useIsMounted();

  useEffect(() => {
    useBookingStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    setMovie(movie);
  }, [movie, setMovie]);

  // Ignore a stored showtime that belongs to another movie.
  const showtime = storedShowtime?.movieId === movie.id ? storedShowtime : null;
  const dateKey = pickedDate ?? showtime?.date ?? dateKeys[0];

  // Confirmed seats come back occupied; localStorage is only read after mount.
  const seats = useMemo(() => {
    if (!showtime) return [];
    const base = generateSeats(showtime.id);
    return mounted ? applyBookedSeats(base, showtime.id) : base;
  }, [showtime, mounted]);
  const selectedSeats = useMemo(
    () => seats.filter((seat) => selectedSeatIds.includes(seat.id)),
    [seats, selectedSeatIds],
  );
  const times = showtimesForDate(showtimes, movie.id, dateKey);

  const pickDate = (key: string) => {
    setPickedDate(key);
    if (showtime && showtime.date !== key) setShowtime(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Tanggal</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dateKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => pickDate(key)}
              className={`shrink-0 rounded-2xl border px-4 py-2 text-sm capitalize transition-colors ${
                key === dateKey
                  ? "border-accent bg-accent text-foreground"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {formatDateLabel(key)}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Bioskop</h2>
        <div className="rounded-2xl border border-accent bg-surface px-4 py-3 text-sm">{cinema}</div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Studio</h2>
        <div className="rounded-2xl border border-accent bg-surface px-4 py-3 text-sm">{studio}</div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Jam tayang</h2>
        {times.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-6 text-sm text-muted">
            Belum ada jadwal tayang untuk tanggal ini. Pilih tanggal lain.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {times.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setShowtime(item)}
                className={`rounded-2xl border px-4 py-2 text-sm transition-colors ${
                  item.id === showtime?.id
                    ? "border-accent bg-accent text-foreground"
                    : "border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                {item.time}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted">Pilih kursi</h2>
          {showtime ? (
            <SeatMap
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              activeSeatId={activeSeatId}
              onToggleSeat={toggleSeat}
            />
          ) : (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-surface px-4 py-16 text-sm text-muted">
              Pilih jam tayang dulu untuk melihat peta kursi.
            </div>
          )}
        </section>

        <SelectedSeatsPanel
          seats={selectedSeats}
          activeSeatId={activeSeatId}
          onSelectSeat={setActiveSeat}
          onClear={clearSeats}
        />
      </div>
    </div>
  );
}
