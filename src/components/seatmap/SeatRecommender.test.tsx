import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import SeatRecommender from "./SeatRecommender";
import { getBestSeats } from "@/lib/studio/recommend";
import { generateSeats } from "@/lib/studio/seats";
import { useBookingStore } from "@/store/bookingStore";

const seats = generateSeats("recommender-test");

function reset(selected: string[] = []) {
  useBookingStore.setState({ selectedSeatIds: selected, activeSeatId: selected[0] ?? null });
}

afterEach(() => reset());

describe("SeatRecommender", () => {
  it("fills the store with the best seats and activates the first", async () => {
    const user = userEvent.setup();
    reset();
    render(<SeatRecommender seats={seats} />);

    await user.click(screen.getByRole("button", { name: "Pilih kursi terbaik" }));

    const best = getBestSeats(seats, 1).seats;
    expect(useBookingStore.getState().selectedSeatIds).toEqual(best.map((seat) => seat.id));
    expect(useBookingStore.getState().activeSeatId).toBe(best[0].id);
  });

  it("asks for confirmation before replacing an existing selection", async () => {
    const user = userEvent.setup();
    reset(["A1"]);
    render(<SeatRecommender seats={seats} />);

    await user.click(screen.getByRole("button", { name: "Pilih kursi terbaik" }));
    expect(screen.getByText(/akan diganti/i)).toBeInTheDocument();
    expect(useBookingStore.getState().selectedSeatIds).toEqual(["A1"]);

    await user.click(screen.getByRole("button", { name: "Ya, ganti" }));
    expect(useBookingStore.getState().selectedSeatIds).toEqual(
      getBestSeats(seats, 1).seats.map((seat) => seat.id),
    );
  });

  it("honors the count input and is reachable by keyboard", async () => {
    const user = userEvent.setup();
    reset();
    render(<SeatRecommender seats={seats} />);

    const input = screen.getByLabelText("Jumlah kursi");
    await user.clear(input);
    await user.type(input, "2");
    await user.keyboard("{Enter}");

    expect(useBookingStore.getState().selectedSeatIds).toHaveLength(2);
  });
});
