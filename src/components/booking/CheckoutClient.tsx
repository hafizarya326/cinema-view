"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { movies } from "@/data/movies";
import { formatRupiah, getCategoryLabel, getSeatsSubtotal } from "@/lib/booking";
import {
  generateBookingCode,
  getConflictingSeatIds,
  saveBooking,
} from "@/lib/bookings";
import { getMovieById } from "@/lib/movies";
import { formatDateLabel } from "@/lib/showtimes";
import { generateSeats } from "@/lib/studio/seats";
import { useBookingStore } from "@/store/bookingStore";
import type { Booking, Seat } from "@/types";

function OrderSummary({
  title,
  cinema,
  studio,
  date,
  time,
  seats,
}: {
  title: string;
  cinema: string;
  studio: string;
  date: string;
  time: string;
  seats: Seat[];
}) {
  const total = getSeatsSubtotal(seats);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
      <dl className="flex flex-col gap-3 text-sm">
        {[
          { label: "Judul film", value: title },
          { label: "Bioskop", value: cinema },
          { label: "Studio", value: studio },
          { label: "Tanggal", value: formatDateLabel(date) },
          { label: "Jam", value: time },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <dt className="text-xs text-muted">{row.label}</dt>
            <dd className="text-right">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
        <h3 className="text-xs text-muted">Kursi</h3>
        <ul className="flex flex-col gap-2">
          {seats.map((seat) => (
            <li key={seat.id} className="flex items-center justify-between gap-3">
              <span>
                Baris {seat.row} nomor {seat.number}
                <span className="text-muted"> · {getCategoryLabel(seat.category)}</span>
              </span>
              <span className="text-muted">{formatRupiah(seat.price)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted">{seats.length} tiket</span>
        <span className="font-medium">{formatRupiah(total)}</span>
      </div>
    </div>
  );
}

export default function CheckoutClient() {
  // Store data and localStorage are client-only, so the server and the first
  // client render both show the loading text.
  const hydrated = useSyncExternalStore(
    (onChange) => useBookingStore.persist.onFinishHydration(onChange),
    () => useBookingStore.persist.hasHydrated(),
    () => false,
  );
  const showtime = useBookingStore((state) => state.showtime);
  const selectedSeatIds = useBookingStore((state) => state.selectedSeatIds);
  const removeSeats = useBookingStore((state) => state.removeSeats);
  const clearSeats = useBookingStore((state) => state.clearSeats);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  useEffect(() => {
    void useBookingStore.persist.rehydrate();
  }, []);

  const seats = useMemo(() => (showtime ? generateSeats(showtime.id) : []), [showtime]);

  if (!hydrated) return <p className="text-sm text-muted">Memuat pesanan...</p>;

  if (confirmed) {
    const confirmedSeats = seats.filter((seat) => confirmed.seatIds.includes(seat.id));
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 rounded-2xl border border-seat-selected bg-surface p-4">
          <span className="text-xs text-muted">Kode booking</span>
          <span className="text-2xl font-semibold tracking-wider">{confirmed.code}</span>
          <span className="text-sm text-muted">
            Simpan kode ini untuk menukar tiket di bioskop.
          </span>
        </div>

        <OrderSummary
          title={confirmed.movieTitle}
          cinema={confirmed.cinema}
          studio={confirmed.studio}
          date={confirmed.date}
          time={confirmed.time}
          seats={confirmedSeats}
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/movies" className="rounded-2xl bg-accent px-5 py-3 text-sm font-medium">
            Pesan film lain
          </Link>
        </div>
      </div>
    );
  }

  if (!showtime || selectedSeatIds.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        <p>
          Belum ada kursi yang dipilih, jadi belum ada yang bisa dikonfirmasi. Mulai dari memilih
          film dan jadwal tayang dulu.
        </p>
        <Link
          href="/movies"
          className="inline-flex min-h-10 items-center text-foreground underline"
        >
          Pilih film
        </Link>
      </div>
    );
  }

  const selectedSeats = seats.filter((seat) => selectedSeatIds.includes(seat.id));
  const title = getMovieById(movies, showtime.movieId)?.title ?? showtime.movieId;

  const confirm = () => {
    // Seats may have been taken (or booked elsewhere) since they were picked.
    const taken = getConflictingSeatIds(selectedSeats, showtime.id);
    if (taken.length > 0) {
      setConflicts(taken);
      removeSeats(taken);
      return;
    }

    const booking = saveBooking({
      code: generateBookingCode(),
      movieId: showtime.movieId,
      movieTitle: title,
      showtimeId: showtime.id,
      cinema: showtime.cinema,
      studio: showtime.studio,
      date: showtime.date,
      time: showtime.time,
      seatIds: selectedSeats.map((seat) => seat.id),
      seatCount: selectedSeats.length,
      totalPrice: getSeatsSubtotal(selectedSeats),
      createdAt: new Date().toISOString(),
    });

    clearSeats();
    setConflicts([]);
    setConfirmed(booking);
  };

  return (
    <div className="flex flex-col gap-4">
      {conflicts.length > 0 && (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-2xl border border-seat-occupied bg-surface p-4 text-sm"
        >
          <p>
            Kursi berikut sudah tidak tersedia: {conflicts.join(", ")}. Kursi itu sudah dihapus dari
            pilihan, silakan pilih kursi lain.
          </p>
          <Link
            href={`/booking/${showtime.movieId}`}
            className="inline-flex min-h-10 items-center text-foreground underline"
          >
            Kembali ke peta kursi
          </Link>
        </div>
      )}

      <OrderSummary
        title={title}
        cinema={showtime.cinema}
        studio={showtime.studio}
        date={showtime.date}
        time={showtime.time}
        seats={selectedSeats}
      />

      <button
        type="button"
        onClick={confirm}
        className="w-fit rounded-2xl bg-accent px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Konfirmasi Pesanan
      </button>
    </div>
  );
}
