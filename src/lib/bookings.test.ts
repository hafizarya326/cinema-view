import { beforeEach, describe, expect, it } from "vitest";
import { getSeatsSubtotal } from "@/lib/booking";
import {
  applyBookedSeats,
  generateBookingCode,
  getBookedSeatIds,
  getConflictingSeatIds,
  saveBooking,
} from "./bookings";
import { createSeat, generateSeats } from "./studio/seats";
import type { Booking } from "@/types";

const showtimeId = "langit-kedua-2026-11-12-18:00";
const seats = generateSeats(showtimeId);

function freeSeats(count: number) {
  const free = seats.filter((seat) => seat.status === "available");
  expect(free.length).toBeGreaterThanOrEqual(count);
  return free.slice(0, count);
}

function makeBooking(seatIds: string[], id: string = showtimeId): Booking {
  return {
    code: "CV-ABC123",
    movieId: "langit-kedua",
    movieTitle: "Langit Kedua",
    showtimeId: id,
    cinema: "Cinema View Grand",
    studio: "Studio 1",
    date: "2026-11-12",
    time: "18:00",
    seatIds,
    seatCount: seatIds.length,
    totalPrice: 0,
    createdAt: "2026-11-12T00:00:00.000Z",
  };
}

beforeEach(() => window.localStorage.clear());

describe("getSeatsSubtotal", () => {
  it("sums a mix of categories", () => {
    const front = createSeat("A", 0, 1); // Rp40.000
    const standard = createSeat("D", 3, 1); // Rp50.000
    const premium = createSeat("G", 6, 1); // Rp65.000

    expect(getSeatsSubtotal([front, standard, premium])).toBe(155000);
  });
});

describe("generateBookingCode", () => {
  it("is CV- plus six uppercase alphanumerics", () => {
    for (let index = 0; index < 50; index += 1) {
      const code = generateBookingCode();
      expect(code).toMatch(/^CV-[A-Z0-9]{6}$/);
      expect(code).toHaveLength(9);
    }
  });

  it("uses the injected random source", () => {
    expect(generateBookingCode(() => 0)).toBe("CV-AAAAAA");
    expect(generateBookingCode(() => 0.999999)).toBe("CV-999999");
  });
});

describe("getBookings / getBookedSeatIds / saveBooking", () => {
  it("starts empty and collects seats per showtime", () => {
    expect(getBookedSeatIds(showtimeId)).toEqual([]);

    saveBooking(makeBooking(freeSeats(2).map((seat) => seat.id)));
    saveBooking(makeBooking(["A1"], "another-showtime"));

    expect(getBookedSeatIds(showtimeId)).toEqual(freeSeats(2).map((seat) => seat.id));
    expect(getBookedSeatIds("another-showtime")).toEqual(["A1"]);
  });

  it("survives a corrupt payload", () => {
    window.localStorage.setItem("cinema-view-bookings", "{not json");
    expect(getBookedSeatIds(showtimeId)).toEqual([]);
  });
});

describe("applyBookedSeats", () => {
  it("turns only the booked seats occupied", () => {
    const [first, second] = freeSeats(2);
    saveBooking(makeBooking([first.id]));

    const applied = applyBookedSeats(seats, showtimeId);

    expect(applied.find((seat) => seat.id === first.id)?.status).toBe("occupied");
    expect(applied.find((seat) => seat.id === second.id)?.status).toBe("available");
    expect(applied.filter((seat) => seat.status === "occupied")).toHaveLength(
      seats.filter((seat) => seat.status === "occupied").length + 1,
    );
  });

  it("leaves the seats untouched without bookings for that showtime", () => {
    saveBooking(makeBooking(["A1"]));
    expect(applyBookedSeats(seats, "no-bookings-here")).toEqual(seats);
  });
});

describe("getConflictingSeatIds", () => {
  it("flags a seat that was already booked", () => {
    const [seat] = freeSeats(1);
    saveBooking(makeBooking([seat.id]));

    expect(getConflictingSeatIds([seat], showtimeId)).toEqual([seat.id]);
  });

  it("flags a seat that is not available in the map", () => {
    const taken = seats.find((seat) => seat.status === "occupied");
    expect(taken).toBeDefined();
    expect(getConflictingSeatIds([taken!], showtimeId)).toEqual([taken!.id]);
  });

  it("passes seats that are still free", () => {
    expect(getConflictingSeatIds(freeSeats(2), showtimeId)).toEqual([]);
  });
});
