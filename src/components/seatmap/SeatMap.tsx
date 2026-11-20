"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatRupiah, getCategoryLabel, getSeatAriaLabel, getSeatStatusLabel } from "@/lib/booking";
import { CATEGORY_PRICES, ROW_LABELS, SEATS_PER_ROW, VISIBILITY_COLORS } from "@/lib/studio/config";
import { getViewingInfo } from "@/lib/studio/viewing";
import type { Seat, SeatCategory, SeatStatus, ViewingInfo } from "@/types";

const SEAT_BG: Record<SeatStatus, string> = {
  available: "bg-seat-available",
  selected: "bg-seat-selected",
  occupied: "bg-seat-occupied",
  unavailable: "bg-seat-unavailable",
};

const UNAVAILABLE_PATTERN = {
  backgroundImage:
    "repeating-linear-gradient(45deg, var(--color-seat-available) 0 2px, transparent 2px 5px)",
};

const LEGEND: SeatStatus[] = ["available", "selected", "occupied", "unavailable"];
const CATEGORY_LEGEND: SeatCategory[] = ["front", "standard", "premium"];

/** Keys handled by the roving tabindex; Enter/Space keep the native button behaviour. */
const NAV_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);

/** Non-color status glyphs so seat status is never communicated by color alone. */
function SeatStatusMark({ status, compact = false }: { status: SeatStatus; compact?: boolean }) {
  const iconClass = compact ? "size-3" : "size-3.5 lg:size-3";

  if (status === "selected") {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        data-seat-mark="selected"
        className={`${iconClass} text-background`}
      >
        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
      </svg>
    );
  }

  if (status === "occupied") {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
        data-seat-mark="occupied"
        className={`${iconClass} text-foreground`}
      >
        <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />
      </svg>
    );
  }

  return null;
}

const SeatButton = memo(function SeatButton({
  seat,
  isSelected,
  isActive,
  isTabbable,
  visibilityLabel,
  onToggleSeat,
  onFocusSeat,
  onMoveFocus,
}: {
  seat: Seat;
  isSelected: boolean;
  isActive: boolean;
  isTabbable: boolean;
  visibilityLabel: ViewingInfo["visibilityLabel"];
  onToggleSeat: (seat: Seat) => void;
  onFocusSeat: (seatId: string) => void;
  onMoveFocus: (seat: Seat, key: string) => void;
}) {
  const status: SeatStatus = isSelected ? "selected" : seat.status;
  const blocked = status === "occupied" || status === "unavailable";
  // Keep the tooltip inside the scroll area at both ends of a row.
  const tooltipAlign =
    seat.number <= 3
      ? "left-0"
      : seat.number >= SEATS_PER_ROW - 2
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <button
      type="button"
      data-seat-id={seat.id}
      tabIndex={isTabbable ? 0 : -1}
      aria-label={getSeatAriaLabel(seat, isSelected)}
      aria-pressed={isSelected}
      aria-disabled={blocked}
      onClick={() => {
        if (!blocked) onToggleSeat(seat);
      }}
      onFocus={() => onFocusSeat(seat.id)}
      onKeyDown={(event) => {
        if (!NAV_KEYS.has(event.key)) return;
        event.preventDefault();
        onMoveFocus(seat, event.key);
      }}
      className={`group relative grid size-10 shrink-0 place-items-center rounded-md transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1 focus-visible:ring-offset-surface lg:size-7 ${
        SEAT_BG[status]
      } ${blocked ? "cursor-not-allowed opacity-80" : "hover:scale-110"} ${
        isActive ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""
      }`}
      style={status === "unavailable" ? UNAVAILABLE_PATTERN : undefined}
    >
      <SeatStatusMark status={status} />
      {/* CSS-only tooltip: shows on hover or keyboard focus, never blocks clicks. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden w-max rounded-xl border border-border bg-background px-2 py-1 text-[10px] leading-tight text-foreground shadow-lg group-hover:block group-focus-visible:block ${tooltipAlign}`}
      >
        {getCategoryLabel(seat.category)} · {formatRupiah(seat.price)} ·{" "}
        <span style={{ color: VISIBILITY_COLORS[visibilityLabel] }}>{visibilityLabel}</span>
      </span>
    </button>
  );
});

const SeatMap = memo(function SeatMap({
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  // Exactly one seat is tabbable: the last one focused, or the first seat.
  const tabbableId = focusId ?? seats[0]?.id ?? null;

  // After mount: center the map so the middle seats are visible, and track whether
  // the row overflows (drives the scroll hint). Runs client-only, so no SSR mismatch.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const measure = () => setCanScroll(element.scrollWidth - element.clientWidth > 1);

    element.scrollLeft = Math.max(0, (element.scrollWidth - element.clientWidth) / 2);
    measure();

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const rows = useMemo(
    () =>
      ROW_LABELS.map((row) =>
        seats.filter((seat) => seat.row === row).sort((a, b) => a.number - b.number),
      ),
    [seats],
  );
  const visibilityById = useMemo(
    () => new Map(seats.map((seat) => [seat.id, getViewingInfo(seat).visibilityLabel])),
    [seats],
  );
  const selectedSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);
  const selectedSummary = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const seat of seats) {
      if (selectedSet.has(seat.id)) {
        count += 1;
        total += seat.price;
      }
    }
    return { count, total };
  }, [seats, selectedSet]);

  /** Arrow / Home / End move the roving focus; selection is untouched. */
  const moveFocus = useCallback((seat: Seat, key: string) => {
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
  }, []);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        <p className="text-center text-xs uppercase tracking-widest text-muted">Layar</p>
        <div className="mx-auto h-2 w-3/4 rounded-full bg-foreground/25" />

        <div
          ref={scrollRef}
          data-testid="seat-map-scroll"
          className="overflow-x-auto px-1 pt-14 pb-3"
        >
          <div ref={gridRef} role="group" aria-label="Peta kursi" className="mx-auto w-fit">
            <div className="mb-2 flex items-center gap-1">
              <span className="w-4 shrink-0" />
              {Array.from({ length: SEATS_PER_ROW }, (_, index) => (
                <span
                  key={index}
                  className="grid size-10 shrink-0 place-items-center text-[10px] text-muted lg:size-7"
                >
                  {index + 1}
                </span>
              ))}
            </div>

            {rows.map((rowSeats, rowIndex) => (
              <div key={ROW_LABELS[rowIndex]} className="mb-1 flex items-center gap-1">
                <span className="w-4 shrink-0 text-xs text-muted">{ROW_LABELS[rowIndex]}</span>
                {rowSeats.map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSet.has(seat.id)}
                    isActive={seat.id === activeSeatId}
                    isTabbable={seat.id === tabbableId}
                    visibilityLabel={visibilityById.get(seat.id) ?? "Fair"}
                    onToggleSeat={onToggleSeat}
                    onFocusSeat={setFocusId}
                    onMoveFocus={moveFocus}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {canScroll && (
        <p aria-hidden="true" className="text-center text-xs text-muted lg:hidden">
          ⟨ Geser untuk melihat semua kursi ⟩
        </p>
      )}

      <p aria-live="polite" aria-atomic="true" data-testid="seat-selection-live" className="sr-only">
        {selectedSummary.count === 0
          ? "Belum ada kursi dipilih."
          : `${selectedSummary.count} kursi dipilih, total ${formatRupiah(selectedSummary.total)}.`}
      </p>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        {LEGEND.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span
              className={`inline-grid size-4 place-items-center rounded-sm ${SEAT_BG[status]}`}
              style={status === "unavailable" ? UNAVAILABLE_PATTERN : undefined}
              aria-hidden="true"
            >
              <SeatStatusMark status={status} compact />
            </span>
            {getSeatStatusLabel(status)}
          </li>
        ))}
      </ul>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        {CATEGORY_LEGEND.map((category) => (
          <li key={category}>
            {getCategoryLabel(category)} · {formatRupiah(CATEGORY_PRICES[category])}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default SeatMap;
