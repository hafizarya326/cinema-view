import {
  SCREEN_BOTTOM_Y,
  SCREEN_CENTER_Y,
  SCREEN_CENTER_Z,
  SCREEN_TOP_Y,
  SCREEN_WIDTH,
} from "./config";
import type { Seat, ViewingInfo } from "@/types";

// Score bands from the spec.
const FOV_IDEAL_MIN = 30;
const FOV_IDEAL_MAX = 50;
const FOV_ZERO_MIN = 15;
const FOV_ZERO_MAX = 80;
const TILT_IDEAL_MAX = 15;
const TILT_ZERO = 40;
const AZIMUTH_IDEAL_MAX = 10;
const AZIMUTH_ZERO = 45;

const WEIGHT_FOV = 0.5;
const WEIGHT_TILT = 0.3;
const WEIGHT_OFFSET = 0.2;

const toDegrees = (radians: number) => (radians * 180) / Math.PI;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function fovScore(horizontalFov: number): number {
  if (horizontalFov >= FOV_IDEAL_MIN && horizontalFov <= FOV_IDEAL_MAX) return 1;
  if (horizontalFov < FOV_IDEAL_MIN) {
    return clamp01((horizontalFov - FOV_ZERO_MIN) / (FOV_IDEAL_MIN - FOV_ZERO_MIN));
  }
  return clamp01((FOV_ZERO_MAX - horizontalFov) / (FOV_ZERO_MAX - FOV_IDEAL_MAX));
}

function tiltScore(neckTilt: number): number {
  if (neckTilt <= TILT_IDEAL_MAX) return 1;
  return clamp01((TILT_ZERO - neckTilt) / (TILT_ZERO - TILT_IDEAL_MAX));
}

function offsetScore(azimuth: number): number {
  const offset = Math.abs(azimuth);
  if (offset <= AZIMUTH_IDEAL_MAX) return 1;
  return clamp01((AZIMUTH_ZERO - offset) / (AZIMUTH_ZERO - AZIMUTH_IDEAL_MAX));
}

export function getVisibilityLabel(score: number): ViewingInfo["visibilityLabel"] {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

/** All angles in degrees. Seat carries the eye position in meters. */
export function getViewingInfo(seat: Seat): ViewingInfo {
  const { x, y, z } = seat;

  const distance = Math.hypot(x, y - SCREEN_CENTER_Y, z - SCREEN_CENTER_Z);
  const horizontalFov = toDegrees(
    Math.atan((SCREEN_WIDTH / 2 - x) / z) + Math.atan((SCREEN_WIDTH / 2 + x) / z),
  );
  const verticalFov = toDegrees(
    Math.atan((SCREEN_TOP_Y - y) / z) - Math.atan((SCREEN_BOTTOM_Y - y) / z),
  );
  const neckTilt = toDegrees(Math.atan((SCREEN_CENTER_Y - y) / z));
  const azimuth = toDegrees(Math.atan(x / z));

  const visibilityScore = Math.round(
    100 *
      (WEIGHT_FOV * fovScore(horizontalFov) +
        WEIGHT_TILT * tiltScore(neckTilt) +
        WEIGHT_OFFSET * offsetScore(azimuth)),
  );

  return {
    distance,
    horizontalFov,
    verticalFov,
    neckTilt,
    azimuth,
    visibilityScore,
    visibilityLabel: getVisibilityLabel(visibilityScore),
  };
}
