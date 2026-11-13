import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SeatMap from "./SeatMap";
import { formatRupiah, getCategoryLabel } from "@/lib/booking";
import { CATEGORY_PRICES, ROW_LABELS, SEATS_PER_ROW } from "@/lib/studio/config";
import { createSeat } from "@/lib/studio/seats";
import type { Seat, SeatCategory, SeatStatus } from "@/types";

/** Makes the (otherwise layout-less) jsdom element report scroll overflow. */
function stubScrollWidth(scrollWidth: number, clientWidth: number): () => void {
  const previousScroll = Object.getOwnPropertyDescriptor(Element.prototype, "scrollWidth");
  const previousClient = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");
  Object.defineProperty(Element.prototype, "scrollWidth", {
    configurable: true,
    get: () => scrollWidth,
  });
  Object.defineProperty(Element.prototype, "clientWidth", {
    configurable: true,
    get: () => clientWidth,
  });
  return () => {
    if (previousScroll) Object.defineProperty(Element.prototype, "scrollWidth", previousScroll);
    if (previousClient) Object.defineProperty(Element.prototype, "clientWidth", previousClient);
  };
}

function buildSeats(): Seat[] {
  return ROW_LABELS.flatMap((row, rowIndex) =>
    Array.from({ length: SEATS_PER_ROW }, (_, index) => createSeat(row, rowIndex, index + 1)),
  );
}

/** Seat buttons are labelled "Baris F kursi 7, Standard, Rp50.000, tersedia". */
function seatButton(id: string): HTMLElement {
  const row = id.slice(0, 1);
  const number = id.slice(1);
  return screen.getByRole("button", { name: new RegExp(`^Baris ${row} kursi ${number},`) });
}

function focusSeat(id: string): void {
  act(() => seatButton(id).focus());
}

function renderMap(seats: Seat[] = buildSeats()) {
  const onToggleSeat = vi.fn();
  render(
    <SeatMap
      seats={seats}
      selectedSeatIds={[]}
      activeSeatId={null}
      onToggleSeat={onToggleSeat}
    />,
  );
  return { onToggleSeat };
}

function withStatus(status: SeatStatus, id = "F7") {
  return buildSeats().map((seat) => (seat.id === id ? { ...seat, status } : seat));
}

describe("SeatMap keyboard navigation", () => {
  it("keeps exactly one seat tabbable", () => {
    renderMap();

    const buttons = screen.getAllByRole("button", { name: /^Baris / });

    expect(buttons).toHaveLength(ROW_LABELS.length * SEATS_PER_ROW);
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
    expect(seatButton("A1")).toHaveAttribute("tabindex", "0");
    expect(seatButton("F7")).toHaveAttribute("tabindex", "-1");
  });

  it("moves along the row with the left and right arrows", async () => {
    const user = userEvent.setup();
    renderMap();

    focusSeat("F7");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(seatButton("F8"));

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(seatButton("F6"));
  });
  it("moves between rows at the same seat number", async () => {
    const user = userEvent.setup();
    renderMap();

    focusSeat("F7");
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(seatButton("E7"));

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(document.activeElement).toBe(seatButton("G7"));
  });

  it("stops at the edges of the map", async () => {
    const user = userEvent.setup();
    renderMap();

    focusSeat("A1");
    await user.keyboard("{ArrowLeft}{ArrowUp}");
    expect(document.activeElement).toBe(seatButton("A1"));

    focusSeat("J14");
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(document.activeElement).toBe(seatButton("J14"));
  });

  it("jumps to the first and last seat of the row with Home and End", async () => {
    const user = userEvent.setup();
    renderMap();

    focusSeat("F7");
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(seatButton("F1"));

    await user.keyboard("{End}");
    expect(document.activeElement).toBe(seatButton("F14"));
  });

  it("keeps the roving tabindex on the seat that was moved to", async () => {
    const user = userEvent.setup();
    renderMap();

    focusSeat("F7");
    await user.keyboard("{ArrowRight}");

    expect(seatButton("F8")).toHaveAttribute("tabindex", "0");
    expect(seatButton("F7")).toHaveAttribute("tabindex", "-1");
  });

  it("selects with Enter and Space", async () => {
    const user = userEvent.setup();
    const { onToggleSeat } = renderMap();

    focusSeat("F7");
    await user.keyboard("{Enter}");
    expect(onToggleSeat).toHaveBeenCalledWith(expect.objectContaining({ id: "F7" }));

    await user.keyboard(" ");
    expect(onToggleSeat).toHaveBeenCalledTimes(2);
  });

  it.each(["occupied", "unavailable"] as const)("keeps %s seats focusable", async (status) => {
    const user = userEvent.setup();
    const { onToggleSeat } = renderMap(withStatus(status));

    focusSeat("F7");
    expect(document.activeElement).toBe(seatButton("F7"));
    expect(seatButton("F7")).toHaveAttribute("aria-disabled", "true");
    expect(seatButton("F7")).not.toBeDisabled();

    await user.keyboard("{Enter}");
    expect(onToggleSeat).not.toHaveBeenCalled();

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(seatButton("F8"));
  });
});

describe("SeatMap layout aids", () => {
  it("keeps 40px tap targets below lg and shrinks only at lg", () => {
    renderMap();

    expect(seatButton("A1")).toHaveClass("size-10", "lg:size-7");
    expect(seatButton("A1")).not.toHaveClass("sm:size-7");
  });

  it("centers the scroll container on mount", () => {
    const restore = stubScrollWidth(800, 400);
    try {
      renderMap();
      expect(screen.getByTestId("seat-map-scroll").scrollLeft).toBe(200);
    } finally {
      restore();
    }
  });

  it("shows the drag hint (aria-hidden, non-color cue) only when the map can scroll", () => {
    const restore = stubScrollWidth(800, 400);
    try {
      renderMap();
      const hint = screen.getByText(/geser untuk melihat semua kursi/i);
      expect(hint).toHaveAttribute("aria-hidden", "true");
      expect(hint).toHaveTextContent("⟨");
    } finally {
      restore();
    }
  });

  it("hides the drag hint when every seat fits", () => {
    const restore = stubScrollWidth(400, 800);
    try {
      renderMap();
      expect(screen.queryByText(/geser untuk melihat semua kursi/i)).toBeNull();
    } finally {
      restore();
    }
  });

  it("lists the category legend with prices from CATEGORY_PRICES", () => {
    renderMap();

    const categories: SeatCategory[] = ["front", "standard", "premium"];
    for (const category of categories) {
      expect(
        screen.getByText(`${getCategoryLabel(category)} · ${formatRupiah(CATEGORY_PRICES[category])}`),
      ).toBeInTheDocument();
    }
  });
});
