"use client";

import { useState } from "react";
import { formatDateLabel, showtimesForDate } from "@/lib/showtimes";
import type { Movie, Showtime } from "@/types";

export default function SchedulePicker({
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
  const [dateKey, setDateKey] = useState(dateKeys[0]);
  const [time, setTime] = useState<string | null>(null);

  const times = showtimesForDate(showtimes, movie.id, dateKey);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Tanggal</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dateKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setDateKey(key);
                setTime(null);
              }}
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
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {times.map((showtime) => (
            <button
              key={showtime.id}
              type="button"
              onClick={() => setTime(showtime.time)}
              className={`rounded-2xl border px-4 py-2 text-sm transition-colors ${
                showtime.time === time
                  ? "border-accent bg-accent text-foreground"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {showtime.time}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Pilih kursi</h2>
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-surface px-4 py-16 text-sm text-muted">
          Peta kursi tersedia di fase berikutnya.
        </div>
      </section>
    </div>
  );
}
