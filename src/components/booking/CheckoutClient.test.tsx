import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import CheckoutClient from "./CheckoutClient";
import { formatRupiah, getSeatsSubtotal } from "@/lib/booking";
import { getBookings } from "@/lib/bookings";
import { generateSeats } from "@/lib/studio/seats";
import { useBookingStore } from "@/store/bookingStore";
import type { Showtime } from "@/types";

const showtime: Showtime = {
  id: "langit-kedua-2026-11-12-18:00",
  movieId: "langit-kedua",
  date: "2026-11-12",
  time: "18:00",
  cinema: "Cinema View Grand",
  studio: "Studio 1",
};

const seats = generateSeats(showtime.id);
const picked = seats.filter((seat) => seat.status === "available").slice(0, 2);

function setBooking(showtimeValue: Showtime | null, seatIds: string[]) {
  act(() => {
    useBookingStore.setState({
      showtime: showtimeValue,
      selectedSeatIds: seatIds,
      activeSeatId: seatIds.at(-1) ?? null,
    });
  });
}

beforeEach(() => window.localStorage.clear());
afterEach(() => setBooking(null, []));

describe("CheckoutClient", () => {
  it("points to the movie list when nothing is selected", async () => {
    setBooking(null, []);

    render(<CheckoutClient />);

    expect(await screen.findByText(/belum ada kursi yang dipilih/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pilih film/i })).toHaveAttribute("href", "/movies");
  });

  it("saves the booking, shows the code, and clears the seats", async () => {
    setBooking(showtime, picked.map((seat) => seat.id));

    render(<CheckoutClient />);

    fireEvent.click(await screen.findByRole("button", { name: /konfirmasi pesanan/i }));

    const code = screen.getByText(/^CV-[A-Z0-9]{6}$/);
    expect(screen.getByText("Langit Kedua")).toBeInTheDocument();
    expect(screen.getByText("2 tiket")).toBeInTheDocument();
    expect(screen.getByText(formatRupiah(getSeatsSubtotal(picked)))).toBeInTheDocument();

    const saved = getBookings();
    expect(saved).toHaveLength(1);
    expect(saved[0].code).toBe(code.textContent);
    expect(saved[0].seatIds).toEqual(picked.map((seat) => seat.id));
    expect(saved[0].totalPrice).toBe(getSeatsSubtotal(picked));

    expect(useBookingStore.getState().selectedSeatIds).toEqual([]);
  });
});
