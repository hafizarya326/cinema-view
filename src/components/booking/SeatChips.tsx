"use client";

import { formatRupiah } from "@/lib/booking";
import type { Seat } from "@/types";

export default function SeatChips({
  seats,
  activeSeatId,
  onSelect,
}: {
  seats: Seat[];
  activeSeatId: string | null;
  onSelect: (seatId: string) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {seats.map((seat) => (
        <li key={seat.id}>
          <button
            type="button"
            onClick={() => onSelect(seat.id)}
            aria-pressed={seat.id === activeSeatId}
            className={`inline-flex min-h-10 items-center rounded-full border px-3 text-xs transition-colors ${
              seat.id === activeSeatId
                ? "border-accent bg-accent text-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {seat.id} · {formatRupiah(seat.price)}
          </button>
        </li>
      ))}
    </ul>
  );
}
