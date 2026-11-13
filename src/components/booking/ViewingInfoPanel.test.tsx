import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ViewingInfoPanel from "./ViewingInfoPanel";
import { formatDegrees, formatMeters, formatRupiah, getCategoryLabel } from "@/lib/booking";
import { VISIBILITY_COLORS } from "@/lib/studio/config";
import { getBestSeats } from "@/lib/studio/recommend";
import { generateSeats } from "@/lib/studio/seats";
import { getViewingInfo } from "@/lib/studio/viewing";
import { useBookingStore } from "@/store/bookingStore";

const seats = generateSeats("showtime-1");
const backHref = "/booking/langit-kedua";

function showSeat(seatId: string | null) {
  act(() => {
    useBookingStore.setState({ selectedSeatIds: seatId ? [seatId] : [], activeSeatId: seatId });
  });
}

function getSeat(seatId: string) {
  const seat = seats.find((item) => item.id === seatId);
  if (!seat) throw new Error(`missing test seat ${seatId}`);
  return seat;
}

/** Reads the <dd> of the row whose <dt> is `label`. */
function readRow(label: string): string {
  const dt = screen.getByText(label);
  return dt.parentElement?.querySelector("dd")?.textContent ?? "";
}

afterEach(() => showSeat(null));

describe("ViewingInfoPanel", () => {
  it.each(["A1", "J7"])("shows the getViewingInfo output for %s", (seatId) => {
    showSeat(seatId);
    const seat = getSeat(seatId);
    const info = getViewingInfo(seat);

    render(<ViewingInfoPanel seats={seats} backHref={backHref} />);

    expect(screen.getByText(seatId)).toBeInTheDocument();
    expect(readRow("Baris")).toBe(seat.row);
    expect(readRow("Nomor kursi")).toBe(String(seat.number));
    expect(readRow("Kategori")).toBe(getCategoryLabel(seat.category));
    expect(readRow("Harga")).toBe(formatRupiah(seat.price));
    expect(readRow("Jarak ke layar")).toBe(formatMeters(info.distance));
    expect(readRow("FOV horizontal")).toBe(formatDegrees(info.horizontalFov));
    expect(readRow("FOV vertikal")).toBe(formatDegrees(info.verticalFov));
    expect(readRow("Neck tilt")).toBe(formatDegrees(info.neckTilt));

    const badge = screen.getByText(`${info.visibilityScore} · ${info.visibilityLabel}`);
    expect(badge.parentElement).toHaveStyle({ color: VISIBILITY_COLORS[info.visibilityLabel] });
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it("formats the front-row seat A1 with the expected numbers", () => {
    showSeat("A1");
    const info = getViewingInfo(getSeat("A1"));

    render(<ViewingInfoPanel seats={seats} backHref={backHref} />);

    expect(readRow("Jarak ke layar")).toBe("6.1 m");
    expect(readRow("FOV horizontal")).toBe("98.6°");
    expect(readRow("FOV vertikal")).toBe("48.2°");
    expect(readRow("Neck tilt")).toBe("35.5°");
    expect(
      screen.getByText(`${info.visibilityScore} · ${info.visibilityLabel}`),
    ).toBeInTheDocument();
  });

  it("colors the badge per visibility label", () => {
    showSeat("J7");
    const info = getViewingInfo(getSeat("J7"));

    render(<ViewingInfoPanel seats={seats} backHref={backHref} />);

    expect(
      screen.getByText(`${info.visibilityScore} · ${info.visibilityLabel}`).parentElement,
    ).toHaveStyle({ color: VISIBILITY_COLORS[info.visibilityLabel] });
  });

  it("guides the user to pick a seat when none is active", () => {
    showSeat(null);

    render(<ViewingInfoPanel seats={seats} backHref={backHref} />);

    expect(screen.getByText(/belum ada kursi aktif/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /kembali ke peta kursi/i })).toHaveAttribute(
      "href",
      backHref,
    );
    expect(screen.queryByText("Jarak ke layar")).toBeNull();
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it("flags a sub-optimal seat with the point gap to the best available seat", () => {
    showSeat("A1");

    render(<ViewingInfoPanel seats={seats} backHref={backHref} />);

    expect(screen.getByText(/\d+ poin di bawah kursi terbaik/)).toBeInTheDocument();
  });

  it("says so when the active seat is the best available", () => {
    const best = getBestSeats(seats, 1).seats[0];
    showSeat(best.id);

    render(<ViewingInfoPanel seats={seats} backHref={backHref} />);

    expect(screen.getByText("Ini kursi terbaik yang tersedia")).toBeInTheDocument();
  });

  it("hides the best-seat note when nothing is available", () => {
    showSeat("A1");
    const soldOut = seats.map((seat) => ({ ...seat, status: "occupied" as const }));

    render(<ViewingInfoPanel seats={soldOut} backHref={backHref} />);

    expect(screen.queryByText(/poin di bawah kursi terbaik/)).toBeNull();
    expect(screen.queryByText("Ini kursi terbaik yang tersedia")).toBeNull();
  });
});
