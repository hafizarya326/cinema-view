import { getViewingInfo } from "./viewing";
import type { Seat } from "@/types";

export interface BestColumns {
  /** Ids of seats with the lowest price. */
  cheapest: string[];
  /** Ids of seats with the highest visibility score. */
  bestScore: string[];
  /** Ids of seats with the smallest neck tilt. */
  smallestTilt: string[];
}

/**
 * Which seats hold the best value in each compared column. Ties list every seat
 * sharing the best value. Empty input gives empty lists. Scores come only from
 * getViewingInfo; nothing is recomputed here.
 */
export function getBestPerColumn(seats: Seat[]): BestColumns {
  if (seats.length === 0) return { cheapest: [], bestScore: [], smallestTilt: [] };

  const entries = seats.map((seat) => ({
    id: seat.id,
    price: seat.price,
    score: getViewingInfo(seat).visibilityScore,
    tilt: getViewingInfo(seat).neckTilt,
  }));

  const cheapestPrice = Math.min(...entries.map((entry) => entry.price));
  const bestScore = Math.max(...entries.map((entry) => entry.score));
  const smallestTilt = Math.min(...entries.map((entry) => entry.tilt));

  const pick = (matches: (entry: (typeof entries)[number]) => boolean) =>
    entries.filter(matches).map((entry) => entry.id);

  return {
    cheapest: pick((entry) => entry.price === cheapestPrice),
    bestScore: pick((entry) => entry.score === bestScore),
    smallestTilt: pick((entry) => entry.tilt === smallestTilt),
  };
}
