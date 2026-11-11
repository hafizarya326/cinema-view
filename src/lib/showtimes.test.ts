import { describe, expect, it } from "vitest";
import { getUpcomingShowtimes, SHOWTIME_DAYS } from "@/data/showtimes";
import {
  buildShowtimes,
  formatDateLabel,
  SHOWTIME_HOURS,
  showtimesForDate,
  toDateKey,
  upcomingDateKeys,
} from "./showtimes";

const BASE = new Date(2026, 10, 11); // Wed 11 Nov 2026, local midnight

describe("toDateKey", () => {
  it("formats local dates as YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("upcomingDateKeys", () => {
  it("returns consecutive days across a month boundary", () => {
    expect(upcomingDateKeys(new Date(2026, 10, 30), 3)).toEqual([
      "2026-11-30",
      "2026-12-01",
      "2026-12-02",
    ]);
  });
});

describe("formatDateLabel", () => {
  it("keeps the calendar day regardless of date key timezone parsing", () => {
    expect(formatDateLabel("2026-11-12")).toMatch(/12/);
  });
});

describe("buildShowtimes", () => {
  it("creates one showtime per movie per hour per day", () => {
    const dateKeys = upcomingDateKeys(BASE, 2);
    const showtimes = buildShowtimes(dateKeys, ["langit-kedua"]);

    expect(showtimes).toHaveLength(2 * SHOWTIME_HOURS.length);
    expect(showtimes.every((showtime) => showtime.cinema && showtime.studio)).toBe(true);
  });
});

describe("showtimesForDate", () => {
  it("filters by movie and date", () => {
    const { dateKeys, showtimes } = getUpcomingShowtimes(BASE);
    expect(dateKeys).toHaveLength(SHOWTIME_DAYS);
    expect(showtimesForDate(showtimes, "langit-kedua", dateKeys[0])).toHaveLength(SHOWTIME_HOURS.length);
    expect(showtimesForDate(showtimes, "no-such-movie", dateKeys[0])).toEqual([]);
  });
});
