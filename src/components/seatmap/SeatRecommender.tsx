"use client";

import { useState } from "react";
import { MAX_SEATS_PER_BOOKING } from "@/lib/studio/config";
import { getBestSeats } from "@/lib/studio/recommend";
import { useBookingStore } from "@/store/bookingStore";
import type { Seat } from "@/types";

const clampCount = (value: number) =>
  Math.min(MAX_SEATS_PER_BOOKING, Math.max(1, Math.trunc(value) || 1));

/** Fills the store with the highest-scoring available seats for the chosen size. */
export default function SeatRecommender({ seats }: { seats: Seat[] }) {
  const selectedSeatIds = useBookingStore((state) => state.selectedSeatIds);
  const selectSeats = useBookingStore((state) => state.selectSeats);
  const [count, setCount] = useState("1");
  const [confirming, setConfirming] = useState(false);

  const apply = () => {
    const { seats: best } = getBestSeats(seats, clampCount(Number(count)));
    if (best.length === 0) return;
    selectSeats(best);
    setConfirming(false);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // A light confirmation before an existing selection is thrown away.
        if (selectedSeatIds.length > 0 && !confirming) setConfirming(true);
        else apply();
      }}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor="best-seat-count" className="flex flex-col gap-1 text-xs text-muted">
          Jumlah kursi
          <input
            id="best-seat-count"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_SEATS_PER_BOOKING}
            value={count}
            onChange={(event) => {
              setCount(event.target.value);
              setConfirming(false);
            }}
            className="min-h-10 w-20 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>

        <button
          type="submit"
          className="min-h-10 rounded-2xl bg-accent px-4 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
        >
          Pilih kursi terbaik
        </button>
      </div>

      {confirming && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent px-3 py-2 text-xs text-muted">
          <span>Kursi terpilih saat ini akan diganti. Lanjutkan?</span>
          <button
            type="button"
            onClick={apply}
            className="min-h-10 rounded-xl bg-accent px-3 text-xs font-medium text-foreground"
          >
            Ya, ganti
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-10 rounded-xl border border-border px-3 text-xs text-foreground"
          >
            Batal
          </button>
        </div>
      )}
    </form>
  );
}
