"use client";

import { formatDegrees, formatMeters, formatRupiah, getCategoryLabel } from "@/lib/booking";
import { getBestPerColumn } from "@/lib/studio/compare";
import { VISIBILITY_COLORS } from "@/lib/studio/config";
import { getViewingInfo } from "@/lib/studio/viewing";
import type { Seat } from "@/types";

/** Non-color cue for the best value in a column (icon + screen-reader text). */
function BestMark({ label }: { label: string }) {
  return (
    <span className="ml-1 align-super text-[10px] text-muted">
      <span aria-hidden="true">★</span>
      <span className="sr-only"> {label}</span>
    </span>
  );
}

/**
 * Side-by-side comparison of the selected seats. Every number is formatted from
 * getViewingInfo; nothing is recalculated. Hidden below two seats.
 */
export default function SeatComparison({
  seats,
  activeSeatId,
  onSelectSeat,
}: {
  seats: Seat[];
  activeSeatId: string | null;
  onSelectSeat: (seatId: string) => void;
}) {
  const best = getBestPerColumn(seats);

  if (seats.length < 2) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted">Bandingkan kursi</h2>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="px-4 pt-4 text-left text-xs text-muted">
            Perbandingan {seats.length} kursi terpilih. Tekan nama kursi untuk menjadikannya kursi
            aktif. ★ menandai nilai terbaik tiap kolom.
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th scope="col" className="px-4 py-2">
                Kursi
              </th>
              <th scope="col" className="px-4 py-2">
                Kategori
              </th>
              <th scope="col" className="px-4 py-2">
                Harga
              </th>
              <th scope="col" className="px-4 py-2">
                Jarak
              </th>
              <th scope="col" className="px-4 py-2">
                HFOV
              </th>
              <th scope="col" className="px-4 py-2">
                Tilt
              </th>
              <th scope="col" className="px-4 py-2">
                Skor
              </th>
              <th scope="col" className="px-4 py-2">
                Label
              </th>
            </tr>
          </thead>
          <tbody>
            {seats.map((seat) => {
              const info = getViewingInfo(seat);
              const isActive = seat.id === activeSeatId;

              return (
                <tr
                  key={seat.id}
                  onClick={() => onSelectSeat(seat.id)}
                  className={`cursor-pointer border-b border-border last:border-0 ${
                    isActive ? "bg-accent/10" : "hover:bg-background"
                  }`}
                >
                  <th scope="row" className="px-4 py-2 text-left font-medium">
                    <button
                      type="button"
                      onClick={() => onSelectSeat(seat.id)}
                      aria-pressed={isActive}
                      aria-label={`Kursi ${seat.id}${isActive ? ", aktif" : ""}`}
                      className="min-h-10 rounded-lg text-left underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {seat.id}
                    </button>
                    {isActive && <span className="ml-2 text-xs text-accent">Aktif</span>}
                  </th>
                  <td className="px-4 py-2">{getCategoryLabel(seat.category)}</td>
                  <td className="px-4 py-2">
                    <span>{formatRupiah(seat.price)}</span>
                    {best.cheapest.includes(seat.id) && <BestMark label="harga termurah" />}
                  </td>
                  <td className="px-4 py-2">
                    <span>{formatMeters(info.distance)}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span>{formatDegrees(info.horizontalFov)}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span>{formatDegrees(info.neckTilt)}</span>
                    {best.smallestTilt.includes(seat.id) && <BestMark label="tilt terkecil" />}
                  </td>
                  <td className="px-4 py-2">
                    <span>{info.visibilityScore}</span>
                    {best.bestScore.includes(seat.id) && <BestMark label="skor tertinggi" />}
                  </td>
                  <td className="px-4 py-2" style={{ color: VISIBILITY_COLORS[info.visibilityLabel] }}>
                    <span>{info.visibilityLabel}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
