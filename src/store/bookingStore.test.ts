import { beforeEach, describe, expect, it } from "vitest";
import { MAX_SEATS_PER_BOOKING } from "@/lib/studio/config";
import { generateSeats } from "@/lib/studio/seats";
import { useBookingStore } from "./bookingStore";
import type { Seat, Showtime } from "@/types";

const seats = generateSeats("showtime-1");
const available = seats.filter((seat) => seat.status === "available");
const occupied = seats.find((seat) => seat.status === "occupied") as Seat;
const unavailable = seats.find((seat) => seat.status === "unavailable") as Seat;

const showtimeA: Showtime = {
  id: "s1",
  movieId: "langit-kedua",
  date: "2026-11-11",
  time: "12:00",
  cinema: "Cinema View Grand",
  studio: "Studio 1",
};
const showtimeB: Showtime = { ...showtimeA, id: "s2", time: "15:00" };

const selectedIds = () => useBookingStore.getState().selectedSeatIds;
const activeId = () => useBookingStore.getState().activeSeatId;
const toggle = (seat: Seat) => useBookingStore.getState().toggleSeat(seat);

beforeEach(() => {
  useBookingStore.setState({
    movie: null,
    showtime: null,
    selectedSeatIds: [],
    activeSeatId: null,
  });
});

describe("toggleSeat", () => {
  it("selects a seat and makes it active", () => {
    toggle(available[0]);

    expect(selectedIds()).toEqual([available[0].id]);
    expect(activeId()).toBe(available[0].id);
  });

  it("deselects a seat that is already selected", () => {
    toggle(available[0]);
    toggle(available[0]);

    expect(selectedIds()).toEqual([]);
    expect(activeId()).toBeNull();
  });

  it("ignores occupied and unavailable seats", () => {
    toggle(occupied);
    toggle(unavailable);

    expect(selectedIds()).toEqual([]);
    expect(activeId()).toBeNull();
  });

  it(`caps the selection at ${MAX_SEATS_PER_BOOKING} seats`, () => {
    for (const seat of available.slice(0, MAX_SEATS_PER_BOOKING + 2)) toggle(seat);

    expect(selectedIds()).toHaveLength(MAX_SEATS_PER_BOOKING);
    expect(activeId()).toBe(available[MAX_SEATS_PER_BOOKING - 1].id);
    expect(selectedIds()).not.toContain(available[MAX_SEATS_PER_BOOKING].id);
  });

  it("still allows removing a seat when the cap is reached", () => {
    for (const seat of available.slice(0, MAX_SEATS_PER_BOOKING)) toggle(seat);
    toggle(available[0]);

    expect(selectedIds()).toHaveLength(MAX_SEATS_PER_BOOKING - 1);
    expect(activeId()).toBe(available[MAX_SEATS_PER_BOOKING - 1].id);
  });

  it("writes the selection to sessionStorage", () => {
    toggle(available[0]);

    expect(sessionStorage.getItem("cinema-view-booking")).toContain(available[0].id);
  });
});

describe("setActiveSeat", () => {
  it("activates only seats that are selected", () => {
    toggle(available[0]);
    toggle(available[1]);

    useBookingStore.getState().setActiveSeat(available[0].id);
    expect(activeId()).toBe(available[0].id);

    useBookingStore.getState().setActiveSeat(available[5].id);
    expect(activeId()).toBe(available[0].id);
  });
});

describe("setShowtime", () => {
  it("clears the selection when the showtime changes", () => {
    useBookingStore.getState().setShowtime(showtimeA);
    toggle(available[0]);
    expect(selectedIds()).toEqual([available[0].id]);

    useBookingStore.getState().setShowtime(showtimeB);
    expect(selectedIds()).toEqual([]);
    expect(activeId()).toBeNull();
  });

  it("keeps the selection when the same showtime is set again", () => {
    useBookingStore.getState().setShowtime(showtimeA);
    toggle(available[0]);
    useBookingStore.getState().setShowtime(showtimeA);

    expect(selectedIds()).toEqual([available[0].id]);
    expect(activeId()).toBe(available[0].id);
  });

  it("can be cleared without picking another showtime", () => {
    useBookingStore.getState().setShowtime(showtimeA);
    useBookingStore.getState().setShowtime(null);

    expect(useBookingStore.getState().showtime).toBeNull();
  });
});

describe("clearSeats", () => {
  it("empties the selection", () => {
    toggle(available[0]);
    toggle(available[1]);
    useBookingStore.getState().clearSeats();

    expect(selectedIds()).toEqual([]);
    expect(activeId()).toBeNull();
  });
});
