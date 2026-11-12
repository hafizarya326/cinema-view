import { describe, expect, it } from "vitest";
import { EYE_HEIGHT, SEAT_HEIGHT } from "./config";
import { createSeat } from "./seats";
import { getSeatColor, getSeatPosition, isWebGLAvailable } from "./scene";

const a1 = createSeat("A", 0, 1); // floor y = 0
const j7 = createSeat("J", 9, 7); // floor y = 9 * 0.25 = 2.25

describe("getSeatPosition", () => {
  it("sits the block on the row floor", () => {
    expect(a1.y - EYE_HEIGHT).toBeCloseTo(0, 10);
    expect(getSeatPosition(a1)).toEqual([a1.x, SEAT_HEIGHT / 2, a1.z]);

    expect(j7.y - EYE_HEIGHT).toBeCloseTo(2.25, 10);
    expect(getSeatPosition(j7)).toEqual([j7.x, 2.25 + SEAT_HEIGHT / 2, j7.z]);
  });
});

describe("getSeatColor", () => {
  it("uses the design tokens per status", () => {
    expect(getSeatColor(a1, false)).toBe("#3F3F46");
    expect(getSeatColor({ ...a1, status: "occupied" }, false)).toBe("#7F1D1D");
    expect(getSeatColor({ ...a1, status: "unavailable" }, false)).toBe("#27272A");
  });

  it("lets the store selection win", () => {
    expect(getSeatColor({ ...a1, status: "occupied" }, true)).toBe("#22C55E");
  });
});

describe("isWebGLAvailable", () => {
  it("reports no WebGL when the canvas has no context", () => {
    // jsdom has no canvas implementation; stub it instead of relying on its warning.
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => null;

    expect(isWebGLAvailable()).toBe(false);

    HTMLCanvasElement.prototype.getContext = original;
  });
});
