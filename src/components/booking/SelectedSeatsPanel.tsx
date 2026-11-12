"use client";

import Link from "next/link";
import { formatRupiah, getSeatsSubtotal } from "@/lib/booking";
import { MAX_SEATS_PER_BOOKING } from "@/lib/studio/config";
import type { Seat } from "@/types";

export default function SelectedSeatsPanel({
  seats,
  activeSeatId,
  onSelectSeat,
  onClear,
}: {
  seats: Seat[];
  activeSeatId: string | null;
  onSelectSeat: (seatId: string) => void;
  onClear: () => void;
}) {
  const subtotal = getSeatsSubtotal(seats);

  return (
    <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Kursi dipilih</h2>
        <span className="text-xs text-muted">
          {seats.length}/{MAX_SEATS_PER_BOOKING}
        </span>
      </div>

      {seats.length === 0 ? (
        <p className="text-sm text-muted">Belum ada kursi dipilih. Maksimal 6 kursi per pesanan.</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {seats.map((seat) => (
              <li key={seat.id}>
                <button
                  type="button"
                  onClick={() => onSelectSeat(seat.id)}
                  aria-pressed={seat.id === activeSeatId}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
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

          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-medium">{formatRupiah(subtotal)}</span>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted underline transition-colors hover:text-foreground"
          >
            Hapus semua kursi
          </button>
        </>
      )}

      <Link
        href="/booking/preview"
        aria-disabled={seats.length === 0}
        className={`rounded-2xl bg-accent px-5 py-3 text-center text-sm font-medium transition-opacity ${
          seats.length === 0 ? "pointer-events-none opacity-40" : "hover:opacity-90"
        }`}
      >
        Lihat Preview 3D
      </Link>
    </aside>
  );
}
