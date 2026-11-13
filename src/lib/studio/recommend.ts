import { MAX_SEATS_PER_BOOKING } from "./config";
import { getViewingInfo } from "./viewing";
import type { Seat } from "@/types";

export interface BestSeatsResult {
  /** Best-first: seats[0] is the strongest pick (used as the active seat). */
  seats: Seat[];
  /** Only meaningful for count >= 2: true when the picks share a row and are adjacent. */
  adjacent: boolean;
}

interface RankedSeat {
  seat: Seat;
  score: number;
}

/** score desc, then cheaper price, then closer to the studio center, then id. */
function byRank(a: RankedSeat, b: RankedSeat): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.seat.price !== b.seat.price) return a.seat.price - b.seat.price;
  if (Math.abs(a.seat.x) !== Math.abs(b.seat.x)) return Math.abs(a.seat.x) - Math.abs(b.seat.x);
  return a.seat.id.localeCompare(b.seat.id);
}

function rank(seats: Seat[]): RankedSeat[] {
  return seats
    .map((seat) => ({ seat, score: getViewingInfo(seat).visibilityScore }))
    .sort(byRank);
}

/** Best consecutive run of `want` available seats, best-first, or null if none exists. */
function findAdjacentBlock(seats: Seat[], want: number): RankedSeat[] | null {
  const rows = new Map<string, Seat[]>();
  for (const seat of seats) {
    if (seat.status !== "available") continue;
    const row = rows.get(seat.row);
    if (row) row.push(seat);
    else rows.set(seat.row, [seat]);
  }

  let winner: RankedSeat[] | null = null;

  for (const rowSeats of rows.values()) {
    const sorted = [...rowSeats].sort((a, b) => a.number - b.number);

    for (let start = 0; start + want <= sorted.length; start += 1) {
      const block = sorted.slice(start, start + want);
      const consecutive = block.every(
        (seat, index) => index === 0 || seat.number === block[index - 1].number + 1,
      );
      if (!consecutive) continue;

      const ranked = rank(block);
      if (winner === null || byRank(ranked[0], winner[0]) < 0) winner = ranked;
    }
  }

  return winner;
}

/**
 * Highest visibilityScore seats (via getViewingInfo). For count > 1 the same-row
 * adjacent block wins whenever one exists; otherwise the top-scoring seats are
 * returned with `adjacent: false`. Never returns occupied / unavailable seats.
 */
export function getBestSeats(seats: Seat[], count: number): BestSeatsResult {
  if (!Number.isFinite(count) || count <= 0) return { seats: [], adjacent: false };

  const want = Math.min(Math.max(1, Math.floor(count)), MAX_SEATS_PER_BOOKING);
  const ranked = rank(seats.filter((seat) => seat.status === "available"));

  if (ranked.length === 0) return { seats: [], adjacent: false };
  if (want === 1) return { seats: [ranked[0].seat], adjacent: false };
  if (ranked.length < want) return { seats: ranked.map((item) => item.seat), adjacent: false };

  const block = findAdjacentBlock(seats, want);
  if (block) return { seats: block.map((item) => item.seat), adjacent: true };

  return { seats: ranked.slice(0, want).map((item) => item.seat), adjacent: false };
}
