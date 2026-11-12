import type { Seat, SeatCategory, SeatStatus } from "@/types";

const CATEGORY_LABELS: Record<SeatCategory, string> = {
  front: "Front",
  standard: "Standard",
  premium: "Premium",
};

const STATUS_LABELS: Record<SeatStatus, string> = {
  available: "tersedia",
  selected: "terpilih",
  occupied: "terisi",
  unavailable: "tidak tersedia",
};

/** Rp40.000 — no currency symbol spacing, matches the spec examples. */
export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

export function getCategoryLabel(category: SeatCategory): string {
  return CATEGORY_LABELS[category];
}

export function getSeatStatusLabel(status: SeatStatus): string {
  return STATUS_LABELS[status];
}

/** e.g. "Baris F kursi 7, Premium, Rp65.000, tersedia" */
export function getSeatAriaLabel(seat: Seat, isSelected = false): string {
  const status: SeatStatus = isSelected ? "selected" : seat.status;
  return `Baris ${seat.row} kursi ${seat.number}, ${CATEGORY_LABELS[seat.category]}, ${formatRupiah(seat.price)}, ${STATUS_LABELS[status]}`;
}

export function getSeatsSubtotal(seats: Seat[]): number {
  return seats.reduce((total, seat) => total + seat.price, 0);
}
