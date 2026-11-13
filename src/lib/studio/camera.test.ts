import { describe, expect, it } from "vitest";
import { CAMERA_FOV, OVERVIEW_CAMERA_POSITION } from "./config";
import {
  type Vector3Tuple,
  clampLook,
  easeInOutCubic,
  getCameraPosition,
  getDefaultLookTarget,
  getEffectiveFov,
  getLookDirection,
  getModeView,
  interpolatePosition,
  sampleTransitionPath,
} from "./camera";
import { createSeat } from "./seats";

const j7 = createSeat("J", 9, 7); // eye at (-0.275, 3.4, 13.9)
const eye = getCameraPosition(j7);

const normalize = (vector: Vector3Tuple): Vector3Tuple => {
  const length = Math.hypot(...vector);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
};

const angleBetween = (a: Vector3Tuple, b: Vector3Tuple): number => {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return (Math.acos(Math.min(1, Math.max(-1, dot))) * 180) / Math.PI;
};

describe("easeInOutCubic", () => {
  it("hits the anchor points", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("clamps values outside 0..1", () => {
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });

  it("stays monotonic and symmetric", () => {
    const samples = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1].map(easeInOutCubic);
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index]).toBeGreaterThanOrEqual(samples[index - 1]);
    }
    expect(easeInOutCubic(0.25)).toBeCloseTo(1 - easeInOutCubic(0.75), 10);
  });
});

describe("getCameraPosition", () => {
  it("returns the eye position of the seat", () => {
    expect(getCameraPosition(j7)).toEqual([-0.275, 3.4, 13.9]);
  });
});

describe("getDefaultLookTarget", () => {
  it("looks at the screen center", () => {
    expect(getDefaultLookTarget()).toEqual([0, 4.0, 0]);
  });
});

describe("interpolatePosition", () => {
  it("lerps each axis", () => {
    expect(interpolatePosition([0, 0, 0], [2, 4, 6], 0.5)).toEqual([1, 2, 3]);
    expect(interpolatePosition([1, 1, 1], [2, 2, 2], 0)).toEqual([1, 1, 1]);
    expect(interpolatePosition([1, 1, 1], [2, 2, 2], 1)).toEqual([2, 2, 2]);
  });

  it("reaches the seat eye at the end of a transition", () => {
    const from = getDefaultLookTarget();
    const to = getCameraPosition(j7);

    expect(interpolatePosition(from, to, easeInOutCubic(1))).toEqual(to);
  });
});

describe("sampleTransitionPath", () => {
  it("includes both endpoints and hits the requested sample count", () => {
    const path = sampleTransitionPath([1, 1, 1], [2, 2, 2], 5);

    expect(path).toHaveLength(5);
    expect(path[0]).toEqual([1, 1, 1]);
    expect(path[4]).toEqual([2, 2, 2]);
  });

  it("spaces the samples along the easing curve", () => {
    const path = sampleTransitionPath([0, 0, 0], [10, 10, 10], 3);

    expect(path[1][0]).toBeCloseTo(5, 10); // easeInOutCubic(0.5) = 0.5
  });
});

describe("getEffectiveFov", () => {
  it("keeps CAMERA_FOV for landscape and square viewports", () => {
    expect(getEffectiveFov(16 / 9)).toBe(CAMERA_FOV);
    expect(getEffectiveFov(4 / 3)).toBe(CAMERA_FOV);
    expect(getEffectiveFov(1)).toBe(CAMERA_FOV);
  });

  it("widens the vertical FOV on portrait so the horizontal FOV stays CAMERA_FOV", () => {
    const aspect = 9 / 16;
    const vertical = getEffectiveFov(aspect);

    expect(vertical).toBeGreaterThan(CAMERA_FOV);

    const horizontal =
      (2 * Math.atan(aspect * Math.tan((vertical * Math.PI) / 180 / 2)) * 180) / Math.PI;
    expect(horizontal).toBeCloseTo(CAMERA_FOV, 6);
  });
});

describe("getModeView", () => {
  it("uses the seat eye in seat mode", () => {
    expect(getModeView("seat", j7)).toEqual({
      position: [-0.275, 3.4, 13.9],
      target: [0, 4.0, 0],
    });
  });

  it("uses the overview pose in overview mode or without a seat", () => {
    expect(getModeView("overview", j7).position).toEqual([...OVERVIEW_CAMERA_POSITION]);
    expect(getModeView("seat", null).position).toEqual([...OVERVIEW_CAMERA_POSITION]);
  });
});

describe("clampLook", () => {
  it("keeps angles inside the limits untouched", () => {
    expect(clampLook(0, 0)).toEqual({ yaw: 0, pitch: 0 });
    expect(clampLook(30, 10)).toEqual({ yaw: 30, pitch: 10 });
    expect(clampLook(-30, -10)).toEqual({ yaw: -30, pitch: -10 });
  });

  it("keeps angles sitting exactly on the limits", () => {
    expect(clampLook(70, 30)).toEqual({ yaw: 70, pitch: 30 });
    expect(clampLook(-70, -30)).toEqual({ yaw: -70, pitch: -30 });
  });

  it("clamps angles beyond the limits", () => {
    expect(clampLook(120, 45)).toEqual({ yaw: 70, pitch: 30 });
    expect(clampLook(-120, -45)).toEqual({ yaw: -70, pitch: -30 });
  });
});

describe("getLookDirection", () => {
  it("points at the screen center with no look offset", () => {
    const target = getDefaultLookTarget();
    const expected = normalize([
      target[0] - eye[0],
      target[1] - eye[1],
      target[2] - eye[2],
    ]);
    const direction = getLookDirection(eye, 0, 0);

    expect(direction[0]).toBeCloseTo(expected[0], 10);
    expect(direction[1]).toBeCloseTo(expected[1], 10);
    expect(direction[2]).toBeCloseTo(expected[2], 10);
    expect(Math.hypot(...direction)).toBeCloseTo(1, 10);
  });

  it("yaws by exactly the requested angle, to the viewer's right", () => {
    const heading = (vector: Vector3Tuple) => (Math.atan2(vector[0], vector[2]) * 180) / Math.PI;
    // Signed yaw between two gazes, wrapped into (-180, 180].
    const yawBetween = (reference: Vector3Tuple, other: Vector3Tuple) =>
      ((((heading(reference) - heading(other)) % 360) + 540) % 360) - 180;

    const base = getLookDirection(eye, 0, 0);
    const right = getLookDirection(eye, 70, 0);
    const left = getLookDirection(eye, -70, 0);

    // Yaw turns the horizontal heading by exactly the angle (the gaze is slightly tilted up).
    expect(yawBetween(base, right)).toBeCloseTo(70, 3);
    expect(yawBetween(base, left)).toBeCloseTo(-70, 3);
    expect(right[0]).toBeGreaterThan(base[0]);
    expect(left[0]).toBeLessThan(base[0]);
    expect(right[1]).toBeCloseTo(base[1], 10); // yaw alone stays horizontal
  });

  it("pitches by exactly the requested angle without turning the heading", () => {
    const base = getLookDirection(eye, 0, 0);
    const up = getLookDirection(eye, 0, 30);
    const down = getLookDirection(eye, 0, -30);

    expect(angleBetween(base, up)).toBeCloseTo(30, 6);
    expect(angleBetween(base, down)).toBeCloseTo(30, 6);
    expect(up[1]).toBeGreaterThan(base[1]);
    expect(down[1]).toBeLessThan(base[1]);
    expect(Math.atan2(up[0], up[2])).toBeCloseTo(Math.atan2(base[0], base[2]), 10);
  });

  it("combines yaw and pitch", () => {
    const base = getLookDirection(eye, 0, 0);
    const corner = getLookDirection(eye, 70, 30);

    expect(angleBetween(base, corner)).toBeGreaterThan(70);
    expect(corner[0]).toBeGreaterThan(base[0]);
    expect(corner[1]).toBeGreaterThan(base[1]);
  });
});
