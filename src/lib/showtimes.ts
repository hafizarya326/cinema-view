import type { Showtime } from "@/types";

export const SHOWTIME_HOURS = ["12:00", "15:00", "18:00", "21:00"];
export const CINEMA_NAME = "Cinema View Grand";
export const STUDIO_NAME = "Studio 1";

/** Local calendar date as YYYY-MM-DD (no UTC shift). */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function upcomingDateKeys(from: Date, days: number): string[] {
  return Array.from({ length: days }, (_, index) =>
    toDateKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + index)),
  );
}

export function formatDateLabel(dateKey: string): string {
  return fromDateKey(dateKey).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Deterministic ids so the same schedule survives refreshes. */
export function buildShowtimes(dateKeys: string[], movieIds: string[]): Showtime[] {
  return dateKeys.flatMap((date) =>
    movieIds.flatMap((movieId) =>
      SHOWTIME_HOURS.map((time) => ({
        id: `${movieId}-${date}-${time}`,
        movieId,
        date,
        time,
        cinema: CINEMA_NAME,
        studio: STUDIO_NAME,
      })),
    ),
  );
}

export function showtimesForDate(showtimes: Showtime[], movieId: string, dateKey: string): Showtime[] {
  return showtimes.filter((showtime) => showtime.movieId === movieId && showtime.date === dateKey);
}
