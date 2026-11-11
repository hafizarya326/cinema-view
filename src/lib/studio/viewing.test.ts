import { describe, expect, it } from "vitest";
import { generateSeats } from "./seats";
import { getViewingInfo, getVisibilityLabel } from "./viewing";
import type { Seat } from "@/types";

const SHOWTIME = "langit-kedua-2026-11-11-19:00";
const seats = generateSeats(SHOWTIME);

function seatById(id: string): Seat {
  const seat = seats.find((item) => item.id === id);
  if (!seat) throw new Error(`seat ${id} missing`);
  return seat;
}

describe("getViewingInfo", () => {
  it("matches the hand-computed values for A1", () => {
    // A1 = (-3.575, 1.15, 4.0), screen center (0, 4.0, 0)
    const info = getViewingInfo(seatById("A1"));

    expect(info.distance).toBeCloseTo(6.0748, 3);
    expect(info.horizontalFov).toBeCloseTo(98.56, 1);
    expect(info.verticalFov).toBeCloseTo(48.21, 1);
    expect(info.neckTilt).toBeCloseTo(35.46, 1);
    expect(info.azimuth).toBeCloseTo(-41.79, 1);
  });

  it("gives a centered back seat the best score", () => {
    // J7 = (-0.275, 3.4, 13.9): fov 46.7 deg (ideal), tilt 2.5 deg, azimuth 1.1 deg
    const info = getViewingInfo(seatById("J7"));

    expect(info.visibilityScore).toBe(100);
    expect(info.visibilityLabel).toBe("Excellent");
  });

  it("scores the middle row better than the front row and the far corner", () => {
    const middle = getViewingInfo(seatById("F7")); // row index 5
    const front = getViewingInfo(seatById("A7"));
    const farCorner = getViewingInfo(seatById("A1"));

    expect(middle.visibilityScore).toBeGreaterThan(front.visibilityScore);
    expect(middle.visibilityScore).toBeGreaterThan(farCorner.visibilityScore);
    expect(middle.visibilityScore).toBeGreaterThanOrEqual(60);
  });

  it("keeps the front row out of the good seats", () => {
    const frontRow = ["A1", "A7", "A14"].map((id) => getViewingInfo(seatById(id)));

    expect(frontRow.every((info) => ["Poor", "Fair"].includes(info.visibilityLabel))).toBe(true);
  });

  it("scores symmetric seats equally", () => {
    expect(getViewingInfo(seatById("F7")).visibilityScore).toBe(
      getViewingInfo(seatById("F8")).visibilityScore,
    );
  });
});

describe("getVisibilityLabel", () => {
  it("uses the spec bands", () => {
    expect(getVisibilityLabel(80)).toBe("Excellent");
    expect(getVisibilityLabel(79)).toBe("Good");
    expect(getVisibilityLabel(60)).toBe("Good");
    expect(getVisibilityLabel(59)).toBe("Fair");
    expect(getVisibilityLabel(40)).toBe("Fair");
    expect(getVisibilityLabel(39)).toBe("Poor");
  });
});
