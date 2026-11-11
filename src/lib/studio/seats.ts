import {
  CATEGORY_PRICES,
  EYE_HEIGHT,
  FIRST_ROW_Z,
  OCCUPIED_SEAT_RATIO,
  RAKE,
  ROW_LABELS,
  ROW_SPACING,
  SEATS_PER_ROW,
  SEAT_PITCH,
} from "./config";
import type { Seat, SeatCategory } from "@/types";

/** Seats that are never bookable, regardless of showtime. */
export const FIXED_UNAVAILABLE_SEAT_IDS = ["D7", "G9"];

export function getSeatId(row: string, seatNumber: number): string {
  return `${row}${seatNumber}`;
}

/** n starts at 1, 0 is the studio center. */
export function getSeatX(seatNumber: number, seatsPerRow: number = SEATS_PER_ROW): number {
  return (seatNumber - (seatsPerRow + 1) / 2) * SEAT_PITCH;
}

export function getSeatZ(rowIndex: number): number {
  return FIRST_ROW_Z + rowIndex * ROW_SPACING;
}

/** Eye height above the front-row floor (includes the rake of the row). */
export function getEyeY(rowIndex: number): number {
  return rowIndex * RAKE + EYE_HEIGHT;
}

/** A-C front, D-F standard, G-J premium. */
export function getCategoryForRowIndex(rowIndex: number): SeatCategory {
  if (rowIndex <= 2) return "front";
  if (rowIndex <= 5) return "standard";
  return "premium";
}

export function createSeat(row: string, rowIndex: number, seatNumber: number): Seat {
  const category = getCategoryForRowIndex(rowIndex);
  return {
    id: getSeatId(row, seatNumber),
    row,
    number: seatNumber,
    x: getSeatX(seatNumber),
    y: getEyeY(rowIndex),
    z: getSeatZ(rowIndex),
    category,
    price: CATEGORY_PRICES[category],
    status: "available",
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32: small deterministic PRNG so the same showtime seeds the same seats. */
function createRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 140 seats, ~25% occupied deterministically from the showtime id, plus fixed unavailable seats. */
export function generateSeats(showtimeId: string): Seat[] {
  const seats = ROW_LABELS.flatMap((row, rowIndex) =>
    Array.from({ length: SEATS_PER_ROW }, (_, index) => createSeat(row, rowIndex, index + 1)),
  );

  const random = createRandom(hashString(showtimeId));
  const pickOrder = seats.map((_, index) => index);
  for (let index = pickOrder.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    [pickOrder[index], pickOrder[swapWith]] = [pickOrder[swapWith], pickOrder[index]];
  }

  const occupied = new Set(pickOrder.slice(0, Math.round(seats.length * OCCUPIED_SEAT_RATIO)));
  const unavailable = new Set(FIXED_UNAVAILABLE_SEAT_IDS);

  return seats.map((seat, index) => {
    if (unavailable.has(seat.id)) return { ...seat, status: "unavailable" };
    if (occupied.has(index)) return { ...seat, status: "occupied" };
    return seat;
  });
}
