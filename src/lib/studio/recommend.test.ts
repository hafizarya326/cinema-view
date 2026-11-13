import { describe, expect, it } from "vitest";
import { ROW_LABELS, SEATS_PER_ROW } from "./config";
import { getBestSeats } from "./recommend";
import { createSeat } from "./seats";
import { getViewingInfo } from "./viewing";
import type { Seat } from "@/types";

const ALL: Seat[] = ROW_LABELS.flatMap((row, rowIndex) =>
  Array.from({ length: SEATS_PER_ROW }, (_, index) => createSeat(row, rowIndex, index + 1)),
);

/** Everything occupied except the listed ids (keeps geometry real). */
function arena(availableIds: string[]): Seat[] {
  const available = new Set(availableIds);
  return ALL.map((seat) => ({
    ...seat,
    status: available.has(seat.id) ? "available" : "occupied",
  }));
}

function ids(seats: Seat[]): string[] {
  return seats.map((seat) => seat.id).sort();
}

function topByScore(seats: Seat[], count: number): string[] {
  return [...seats]
    .filter((seat) => seat.status === "available")
    .sort((a, b) => getViewingInfo(b).visibilityScore - getViewingInfo(a).visibilityScore)
    .slice(0, count)
    .map((seat) => seat.id);
}

describe("getBestSeats", () => {
  it("picks the single highest-scoring available seat for count 1", () => {
    const seats = arena(["A1", "F7", "J7"]);
    const result = getBestSeats(seats, 1);

    expect(result.adjacent).toBe(false);
    expect(result.seats.map((seat) => seat.id)).toEqual(topByScore(seats, 1));
  });

  it("prefers an adjacent same-row pair over a higher single seat", () => {
    // J7 alone scores highest, but count 2 must prefer the E5/E6 block.
    const result = getBestSeats(arena(["E5", "E6", "J7"]), 2);

    expect(result.adjacent).toBe(true);
    expect(ids(result.seats)).toEqual(["E5", "E6"]);
  });

  it("returns a same-row block of four consecutive seats when asked for four", () => {
    const result = getBestSeats(arena(["E5", "E6", "E7", "E8", "J7"]), 4);

    expect(result.adjacent).toBe(true);
    expect(ids(result.seats)).toEqual(["E5", "E6", "E7", "E8"]);
  });

  it("falls back to the best combination when no seats are adjacent", () => {
    const seats = arena(["A1", "A3", "A5"]);
    const result = getBestSeats(seats, 2);

    expect(result.adjacent).toBe(false);
    expect(result.seats).toHaveLength(2);
    expect(result.seats.every((seat) => seat.status === "available")).toBe(true);
  });

  it("returns every available seat (with adjacent false) when there are not enough", () => {
    const result = getBestSeats(arena(["F7", "J7"]), 4);

    expect(result.adjacent).toBe(false);
    expect(ids(result.seats)).toEqual(["F7", "J7"]);
  });

  it("clamps the count to the booking limit of 6", () => {
    const available = Array.from({ length: 14 }, (_, index) => `E${index + 1}`).slice(0, 6);
    const result = getBestSeats(arena([...available, "J1", "J2", "J3"]), 9);

    expect(result.seats).toHaveLength(6);
    expect(result.seats.every((seat) => seat.status === "available")).toBe(true);
  });

  it("returns nothing for a non-positive count or an empty auditorium", () => {
    expect(getBestSeats(arena(["J7"]), 0)).toEqual({ seats: [], adjacent: false });
    expect(getBestSeats(arena([]), 3)).toEqual({ seats: [], adjacent: false });
  });
});
