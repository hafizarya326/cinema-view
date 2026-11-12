"use client";

import { useRef, useState } from "react";
import { formatRupiah, getCategoryLabel, getSeatAriaLabel, getSeatStatusLabel } from "@/lib/booking";
import { ROW_LABELS, SEATS_PER_ROW, VISIBILITY_COLORS } from "@/lib/studio/config";
import { getViewingInfo } from "@/lib/studio/viewing";
import type { Seat, SeatStatus } from "@/types";

const SEAT_BG: Record<SeatStatus, string> = {
  available: "bg-seat-available",
  selected: "bg-seat-selected",
  occupied: "bg-seat-occupied",
  unavailable: "bg-seat-unavailable",
};

const UNAVAILABLE_PATTERN = {
  backgroundImage: "repeating-linear-gradient(45deg, #3f3f46 0 2px, transparent 2px 5px)",
};

const LEGEND: SeatStatus[] = ["available", "selected", "occupied", "unavailable"];

/** Keys handled by the roving tabindex; Enter/Space keep the native button behaviour. */
const NAV_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);

export default function SeatMap({
  seats,
  selectedSeatIds,
  activeSeatId,
  onToggleSeat,
}: {
  seats: Seat[];
  selectedSeatIds: string[];
  activeSeatId: string | null;
  onToggleSeat: (seat: Seat) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  // Exactly one seat is tabbable: the last one focused, or the first seat.
  const tabbableId = focusId ?? seats[0]?.id ?? null;

  const rows = ROW_LABELS.map((row) =>
    seats.filter((seat) => seat.row === row).sort((a, b) => a.number - b.number),
  );

  /** Arrow / Home / End move the roving focus; selection is untouched. */
  const moveFocus = (seat: Seat, key: string) => {
    const rowIndex = ROW_LABELS.indexOf(seat.row);
    let nextRow = rowIndex;
    let nextNumber = seat.number;

    if (key === "ArrowRight") nextNumber = Math.min(SEATS_PER_ROW, seat.number + 1);
    else if (key === "ArrowLeft") nextNumber = Math.max(1, seat.number - 1);
    else if (key === "ArrowDown") nextRow = Math.min(ROW_LABELS.length - 1, rowIndex + 1);
    else if (key === "ArrowUp") nextRow = Math.max(0, rowIndex - 1);
    else if (key === "Home") nextNumber = 1;
    else nextNumber = SEATS_PER_ROW; // End

    const nextId = `${ROW_LABELS[nextRow]}${nextNumber}`;
    setFocusId(nextId);
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-seat-id="${nextId}"]`)?.focus();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        <p className="text-center text-xs uppercase tracking-widest text-muted">Layar</p>
        <div className="mx-auto h-2 w-3/4 rounded-full bg-foreground/25" />

        <div className="overflow-x-auto px-1 pt-14 pb-3">
          <div ref={gridRef} role="group" aria-label="Peta kursi" className="mx-auto w-fit">
            <div className="mb-2 flex items-center gap-1">
              <span className="w-4 shrink-0" />
              {Array.from({ length: SEATS_PER_ROW }, (_, index) => (
                <span
                  key={index}
                  className="grid size-6 shrink-0 place-items-center text-[10px] text-muted sm:size-7"
                >
                  {index + 1}
                </span>
              ))}
            </div>

            {rows.map((rowSeats, rowIndex) => (
              <div key={ROW_LABELS[rowIndex]} className="mb-1 flex items-center gap-1">
                <span className="w-4 shrink-0 text-xs text-muted">{ROW_LABELS[rowIndex]}</span>
                {rowSeats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const status: SeatStatus = isSelected ? "selected" : seat.status;
                  const blocked = status === "occupied" || status === "unavailable";
                  const info = getViewingInfo(seat);
                  // Keep the tooltip inside the scroll area at both ends of a row.
                  const tooltipAlign =
                    seat.number <= 3
                      ? "left-0"
                      : seat.number >= SEATS_PER_ROW - 2
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2";

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      data-seat-id={seat.id}
                      tabIndex={seat.id === tabbableId ? 0 : -1}
                      aria-label={getSeatAriaLabel(seat, isSelected)}
                      aria-pressed={isSelected}
                      aria-disabled={blocked}
                      onClick={() => {
                        if (!blocked) onToggleSeat(seat);
                      }}
                      onFocus={() => setFocusId(seat.id)}
                      onKeyDown={(event) => {
                        if (!NAV_KEYS.has(event.key)) return;
                        event.preventDefault();
                        moveFocus(seat, event.key);
                      }}
                      className={`group relative size-6 shrink-0 rounded-md transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface sm:size-7 ${
                        SEAT_BG[status]
                      } ${blocked ? "cursor-not-allowed opacity-80" : "hover:scale-110"} ${
                        seat.id === activeSeatId ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""
                      }`}
                      style={status === "unavailable" ? UNAVAILABLE_PATTERN : undefined}
                    >
                      {/* CSS-only tooltip: shows on hover or keyboard focus, never blocks clicks. */}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden w-max rounded-xl border border-border bg-background px-2 py-1 text-[10px] leading-tight text-foreground shadow-lg group-hover:block group-focus-visible:block ${tooltipAlign}`}
                      >
                        {getCategoryLabel(seat.category)} · {formatRupiah(seat.price)} ·{" "}
                        <span style={{ color: VISIBILITY_COLORS[info.visibilityLabel] }}>
                          {info.visibilityLabel}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        {LEGEND.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span className={`size-3 rounded-sm ${SEAT_BG[status]}`} aria-hidden="true" />
            {getSeatStatusLabel(status)}
          </li>
        ))}
      </ul>
    </div>
  );
}
