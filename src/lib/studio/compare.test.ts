import { describe, expect, it } from "vitest";
import { getBestPerColumn } from "./compare";
import { createSeat } from "./seats";

const a1 = createSeat("A", 0, 1); // front: Rp40.000, score 7
const j7 = createSeat("J", 9, 7); // premium: Rp65.000, score 100

describe("getBestPerColumn", () => {
  it("returns empty lists for no seats", () => {
    expect(getBestPerColumn([])).toEqual({ cheapest: [], bestScore: [], smallestTilt: [] });
  });

  it("picks the cheapest price, highest score, and smallest tilt", () => {
    const best = getBestPerColumn([a1, j7]);

    expect(best.cheapest).toEqual(["A1"]);
    expect(best.bestScore).toEqual(["J7"]);
    expect(best.smallestTilt).toEqual(["J7"]);
  });

  it("keeps every seat that ties on the cheapest price", () => {
    const f5 = createSeat("F", 5, 5);
    const f7 = createSeat("F", 5, 7);

    expect(getBestPerColumn([f5, f7]).cheapest).toEqual(["F5", "F7"]);
  });
});
