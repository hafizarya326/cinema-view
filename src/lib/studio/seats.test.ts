import { describe, expect, it } from "vitest";
import { CATEGORY_PRICES, ROW_LABELS, SEAT_COUNT, SEATS_PER_ROW } from "./config";
import { FIXED_UNAVAILABLE_SEAT_IDS, generateSeats } from "./seats";
import type { Seat } from "@/types";

const SHOWTIME = "langit-kedua-2026-11-11-19:00";

function seatById(seats: Seat[], id: string): Seat {
  const seat = seats.find((item) => item.id === id);
  if (!seat) throw new Error(`seat ${id} missing`);
  return seat;
}

describe("generateSeats", () => {
  it("builds every seat of the auditorium", () => {
    const seats = generateSeats(SHOWTIME);

    expect(seats).toHaveLength(SEAT_COUNT);
    expect(new Set(seats.map((seat) => seat.id)).size).toBe(SEAT_COUNT);
    expect(seats[0].id).toBe("A1");
    expect(seats[seats.length - 1].id).toBe("J14");
  });

  it("places seats by the spec formula", () => {
    const seats = generateSeats(SHOWTIME);

    // A1: x = (1 - 15/2) * 0.55 = -3.575, y = 1.15, z = 4.0
    const a1 = seatById(seats, "A1");
    expect(a1.x).toBeCloseTo(-3.575, 10);
    expect(a1.y).toBeCloseTo(1.15, 10);
    expect(a1.z).toBeCloseTo(4.0, 10);

    // A14: x = (14 - 7.5) * 0.55 = 3.575
    const a14 = seatById(seats, "A14");
    expect(a14.x).toBeCloseTo(3.575, 10);
    expect(a14.y).toBeCloseTo(1.15, 10);
    expect(a14.z).toBeCloseTo(4.0, 10);

    // J7: x = (7 - 7.5) * 0.55 = -0.275, y = 9 * 0.25 + 1.15 = 3.4, z = 4.0 + 9 * 1.1 = 13.9
    const j7 = seatById(seats, "J7");
    expect(j7.x).toBeCloseTo(-0.275, 10);
    expect(j7.y).toBeCloseTo(3.4, 10);
    expect(j7.z).toBeCloseTo(13.9, 10);
  });

  it("numbers rows A-J with 14 seats each", () => {
    const seats = generateSeats(SHOWTIME);

    for (const [rowIndex, row] of ROW_LABELS.entries()) {
      const rowSeats = seats.filter((seat) => seat.row === row);
      expect(rowSeats).toHaveLength(SEATS_PER_ROW);
      expect(rowSeats.map((seat) => seat.number)).toEqual(
        Array.from({ length: SEATS_PER_ROW }, (_, index) => index + 1),
      );
      expect(rowSeats[0].z).toBeCloseTo(4.0 + rowIndex * 1.1, 10);
      expect(rowSeats[0].y).toBeCloseTo(rowIndex * 0.25 + 1.15, 10);
    }
  });

  it("assigns category and price per row band", () => {
    const seats = generateSeats(SHOWTIME);
    const expected = {
      A: "front",
      B: "front",
      C: "front",
      D: "standard",
      E: "standard",
      F: "standard",
      G: "premium",
      H: "premium",
      I: "premium",
      J: "premium",
    } as const;

    for (const [row, category] of Object.entries(expected)) {
      const rowSeats = seats.filter((seat) => seat.row === row);
      expect(rowSeats.every((seat) => seat.category === category)).toBe(true);
      expect(rowSeats.every((seat) => seat.price === CATEGORY_PRICES[category])).toBe(true);
    }

    expect(CATEGORY_PRICES).toEqual({ front: 40000, standard: 50000, premium: 65000 });
  });

  it("seeds the same occupied seats for the same showtime", () => {
    const first = generateSeats(SHOWTIME);
    const second = generateSeats(SHOWTIME);

    expect(second).toEqual(first);
    expect(generateSeats("other-showtime-id").map((seat) => seat.status)).not.toEqual(
      first.map((seat) => seat.status),
    );
  });

  it("marks ~25% occupied and keeps the fixed seats unavailable", () => {
    const seats = generateSeats(SHOWTIME);
    const occupied = seats.filter((seat) => seat.status === "occupied");
    const unavailable = seats.filter((seat) => seat.status === "unavailable");

    expect(occupied.length / seats.length).toBeGreaterThan(0.2);
    expect(occupied.length / seats.length).toBeLessThan(0.3);
    expect(unavailable.map((seat) => seat.id).sort()).toEqual([...FIXED_UNAVAILABLE_SEAT_IDS].sort());
    expect(occupied.some((seat) => FIXED_UNAVAILABLE_SEAT_IDS.includes(seat.id))).toBe(false);
    expect(
      seats.every((seat) => seat.status === "available" || seat.status === "occupied" || seat.status === "unavailable"),
    ).toBe(true);
    expect(occupied.length + unavailable.length).toBeLessThan(seats.length);
  });
});
