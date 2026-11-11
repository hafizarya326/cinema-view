import type { Showtime } from "@/types";
import { buildShowtimes, upcomingDateKeys } from "@/lib/showtimes";
import { movies } from "./movies";

export const SHOWTIME_DAYS = 7;

/** One cinema, one studio, four showtimes per movie per day, 7 days ahead. */
export function getUpcomingShowtimes(from: Date = new Date()): {
  dateKeys: string[];
  showtimes: Showtime[];
} {
  const dateKeys = upcomingDateKeys(from, SHOWTIME_DAYS);
  return { dateKeys, showtimes: buildShowtimes(dateKeys, movies.map((movie) => movie.id)) };
}
