import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import SeatComparison from "./SeatComparison";
import { formatDegrees, formatMeters, formatRupiah } from "@/lib/booking";
import { createSeat } from "@/lib/studio/seats";
import { getViewingInfo } from "@/lib/studio/viewing";
import { useBookingStore } from "@/store/bookingStore";

const a1 = createSeat("A", 0, 1);
const j7 = createSeat("J", 9, 7);
const seats = [a1, j7];

/** Mirrors BookingPreview: the active seat comes from the store. */
function Table() {
  const activeSeatId = useBookingStore((state) => state.activeSeatId);
  const setActiveSeat = useBookingStore((state) => state.setActiveSeat);
  return <SeatComparison seats={seats} activeSeatId={activeSeatId} onSelectSeat={setActiveSeat} />;
}

function showSeat(seatId: string | null) {
  useBookingStore.setState({ selectedSeatIds: seats.map((seat) => seat.id), activeSeatId: seatId });
}

afterEach(() => useBookingStore.setState({ selectedSeatIds: [], activeSeatId: null }));

describe("SeatComparison", () => {
  it("renders the getViewingInfo numbers for A1 and J7", () => {
    showSeat("A1");
    render(<Table />);

    for (const seat of seats) {
      const info = getViewingInfo(seat);
      expect(screen.getByText(formatRupiah(seat.price))).toBeInTheDocument();
      expect(screen.getByText(formatMeters(info.distance))).toBeInTheDocument();
      expect(screen.getByText(formatDegrees(info.horizontalFov))).toBeInTheDocument();
      expect(screen.getByText(formatDegrees(info.neckTilt))).toBeInTheDocument();
      expect(screen.getByText(String(info.visibilityScore))).toBeInTheDocument();
      expect(screen.getByText(info.visibilityLabel)).toBeInTheDocument();
    }
  });

  it("marks the active seat with text, not only a color", () => {
    showSeat("A1");
    render(<Table />);

    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kursi A1, aktif" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("switches the active seat when a row is clicked", async () => {
    const user = userEvent.setup();
    showSeat("A1");
    render(<Table />);

    await user.click(screen.getByText("Premium")); // J7 row

    expect(useBookingStore.getState().activeSeatId).toBe("J7");
  });

  it("renders nothing for zero or one seat", () => {
    const { container, rerender } = render(
      <SeatComparison seats={[]} activeSeatId={null} onSelectSeat={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<SeatComparison seats={[a1]} activeSeatId="A1" onSelectSeat={() => {}} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
