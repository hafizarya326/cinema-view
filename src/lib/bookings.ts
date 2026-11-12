import { useSyncExternalStore } from "react";
import type { Booking, Seat } from "@/types";

export const BOOKINGS_STORAGE_KEY = "cinema-view-bookings";

const CODE_PREFIX = "CV-";
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;

/** Random booking code like CV-4F9K2Q. */
export function generateBookingCode(random: () => number = Math.random): string {
  let code = CODE_PREFIX;
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** All mock bookings. Safe during SSR and when storage is blocked. */
export function getBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
}

export function getBookedSeatIds(showtimeId: string): string[] {
  return getBookings()
    .filter((booking) => booking.showtimeId === showtimeId)
    .flatMap((booking) => booking.seatIds);
}

/** Appends a booking. A blocked storage just means the booking is not persisted. */
export function saveBooking(booking: Booking): Booking {
  try {
    window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify([...getBookings(), booking]));
  } catch {
    // ponytail: mock storage only; swap for the API call in the backend phase.
  }
  return booking;
}

/** Single source of truth for confirmed seats: used by the 2D map and the 3D scene. */
export function applyBookedSeats(seats: Seat[], showtimeId: string): Seat[] {
  const booked = new Set(getBookedSeatIds(showtimeId));
  if (booked.size === 0) return seats;
  return seats.map((seat) => (booked.has(seat.id) ? { ...seat, status: "occupied" } : seat));
}

/** Seats that can no longer be booked: not available in the map, or already booked. */
export function getConflictingSeatIds(seats: Seat[], showtimeId: string): string[] {
  const booked = new Set(getBookedSeatIds(showtimeId));
  return seats
    .filter((seat) => seat.status !== "available" || booked.has(seat.id))
    .map((seat) => seat.id);
}

const noopSubscribe = () => () => {};

/**
 * false during SSR and the first client render, true afterwards. Mirrors the
 * server snapshot so hydration never sees localStorage-only data.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
