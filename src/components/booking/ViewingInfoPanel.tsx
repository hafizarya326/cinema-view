"use client";

import Link from "next/link";
import { formatDegrees, formatMeters, formatRupiah, getCategoryLabel } from "@/lib/booking";
import { VISIBILITY_COLORS } from "@/lib/studio/config";
import { getViewingInfo } from "@/lib/studio/viewing";
import { useBookingStore } from "@/store/bookingStore";
import type { Seat } from "@/types";

/**
 * Viewing numbers come straight from getViewingInfo (src/lib/studio/viewing.ts);
 * nothing is recalculated here, only formatted.
 */
export default function ViewingInfoPanel({
  seats,
  backHref,
}: {
  seats: Seat[];
  backHref: string;
}) {
  const activeSeatId = useBookingStore((state) => state.activeSeatId);
  const seat = seats.find((item) => item.id === activeSeatId);

  if (!seat) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold">Info Pandangan</h2>
        <p className="text-sm text-muted">
          Belum ada kursi aktif. Pilih kursi di peta kursi supaya jarak, sudut pandang, dan skor
          visibilitas bisa dihitung.
        </p>
        <Link href={backHref} className="w-fit text-sm text-foreground underline">
          Kembali ke peta kursi
        </Link>
      </section>
    );
  }

  const info = getViewingInfo(seat);
  const visibilityColor = VISIBILITY_COLORS[info.visibilityLabel];

  const rows = [
    { label: "Baris", value: seat.row },
    { label: "Nomor kursi", value: String(seat.number) },
    { label: "Kategori", value: getCategoryLabel(seat.category) },
    { label: "Harga", value: formatRupiah(seat.price) },
    { label: "Jarak ke layar", value: formatMeters(info.distance) },
    { label: "FOV horizontal", value: formatDegrees(info.horizontalFov) },
    { label: "FOV vertikal", value: formatDegrees(info.verticalFov) },
    { label: "Neck tilt", value: formatDegrees(info.neckTilt) },
  ];

  return (
    <section className="flex h-fit flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Info Pandangan</h2>
        <span className="text-xs text-muted">{seat.id}</span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm lg:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col">
            <dt className="text-xs text-muted">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      <div
        className="flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-sm"
        style={{ borderColor: visibilityColor, color: visibilityColor }}
      >
        <span>Screen visibility</span>
        <span className="font-semibold">
          {info.visibilityScore} · {info.visibilityLabel}
        </span>
      </div>
    </section>
  );
}
