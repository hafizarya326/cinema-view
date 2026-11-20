"use client";

import { memo } from "react";
import { formatRupiah } from "@/lib/booking";
import type { Seat } from "@/types";

const SeatChip = memo(function SeatChip({
  seat,
  isActive,
  onSelect,
}: {
  seat: Seat;
  isActive: boolean;
  onSelect: (seatId: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(seat.id)}
        aria-pressed={isActive}
        className={`inline-flex min-h-10 items-center rounded-full border px-3 text-xs transition-colors ${
          isActive
            ? "border-accent bg-accent text-foreground"
            : "border-border text-muted hover:text-foreground"
        }`}
      >
        {seat.id} · {formatRupiah(seat.price)}
      </button>
    </li>
  );
});

const SeatChips = memo(function SeatChips({
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
        <SeatChip
          key={seat.id}
          seat={seat}
          isActive={seat.id === activeSeatId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
});

export default SeatChips;
