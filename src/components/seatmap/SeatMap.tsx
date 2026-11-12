"use client";

import { getSeatAriaLabel, getSeatStatusLabel } from "@/lib/booking";
import { ROW_LABELS, SEATS_PER_ROW } from "@/lib/studio/config";
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
  const rows = ROW_LABELS.map((row) =>
    seats.filter((seat) => seat.row === row).sort((a, b) => a.number - b.number),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        <p className="text-center text-xs uppercase tracking-widest text-muted">Layar</p>
        <div className="mx-auto h-2 w-3/4 rounded-full bg-foreground/25" />

        <div className="overflow-x-auto pb-2">
          <div role="group" aria-label="Peta kursi" className="mx-auto w-fit">
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

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      aria-label={getSeatAriaLabel(seat, isSelected)}
                      aria-pressed={isSelected}
                      aria-disabled={blocked}
                      onClick={() => {
                        if (!blocked) onToggleSeat(seat);
                      }}
                      className={`size-6 shrink-0 rounded-md transition-transform sm:size-7 ${
                        SEAT_BG[status]
                      } ${blocked ? "cursor-not-allowed opacity-80" : "hover:scale-110"} ${
                        seat.id === activeSeatId ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""
                      }`}
                      style={status === "unavailable" ? UNAVAILABLE_PATTERN : undefined}
                    />
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
