import {
  LOOK_PITCH_MAX,
  LOOK_PITCH_MIN,
  LOOK_YAW_LIMIT,
  OVERVIEW_CAMERA_POSITION,
  OVERVIEW_CAMERA_TARGET,
  SCREEN_CENTER_Y,
  SCREEN_CENTER_Z,
} from "./config";
import type { Seat } from "@/types";

export type CameraMode = "overview" | "seat";
export type Vector3Tuple = [number, number, number];

/** Seat view puts the camera at the eye position of the seat. */
export function getCameraPosition(seat: Seat): Vector3Tuple {
  return [seat.x, seat.y, seat.z];
}

/** Default gaze: the center of the screen. */
export function getDefaultLookTarget(): Vector3Tuple {
  return [0, SCREEN_CENTER_Y, SCREEN_CENTER_Z];
}

/** 0 -> 0, 0.5 -> 0.5, 1 -> 1, monotonic in between. */
export function easeInOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  if (clamped < 0.5) return 4 * clamped ** 3;
  return 1 - (-2 * clamped + 2) ** 3 / 2;
}

export function interpolatePosition(
  from: Vector3Tuple,
  to: Vector3Tuple,
  t: number,
): Vector3Tuple {
  const progress = Math.min(1, Math.max(0, t));
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
    from[2] + (to[2] - from[2]) * progress,
  ];
}

/** Camera pose for a mode; seat mode falls back to overview without a seat. */
export function getModeView(
  mode: CameraMode,
  seat: Seat | null,
): { position: Vector3Tuple; target: Vector3Tuple } {
  if (mode === "seat" && seat) {
    return { position: getCameraPosition(seat), target: getDefaultLookTarget() };
  }
  return { position: [...OVERVIEW_CAMERA_POSITION], target: [...OVERVIEW_CAMERA_TARGET] };
}

export interface LookAngles {
  yaw: number;
  pitch: number;
}

/** Keeps manual look-around inside the configured limits. */
export function clampLook(yaw: number, pitch: number): LookAngles {
  return {
    yaw: Math.min(LOOK_YAW_LIMIT, Math.max(-LOOK_YAW_LIMIT, yaw)),
    pitch: Math.min(LOOK_PITCH_MAX, Math.max(LOOK_PITCH_MIN, pitch)),
  };
}

const DEG_TO_RAD = Math.PI / 180;

function normalize(vector: Vector3Tuple): Vector3Tuple {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function rotateAboutY(vector: Vector3Tuple, angle: number): Vector3Tuple {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    vector[0] * cos + vector[2] * sin,
    vector[1],
    -vector[0] * sin + vector[2] * cos,
  ];
}

/** Rodrigues rotation of a vector around a unit axis. */
function rotateAboutAxis(vector: Vector3Tuple, axis: Vector3Tuple, angle: number): Vector3Tuple {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dot = vector[0] * axis[0] + vector[1] * axis[1] + vector[2] * axis[2];
  const cross: Vector3Tuple = [
    axis[1] * vector[2] - axis[2] * vector[1],
    axis[2] * vector[0] - axis[0] * vector[2],
    axis[0] * vector[1] - axis[1] * vector[0],
  ];

  return [
    vector[0] * cos + cross[0] * sin + axis[0] * dot * (1 - cos),
    vector[1] * cos + cross[1] * sin + axis[1] * dot * (1 - cos),
    vector[2] * cos + cross[2] * sin + axis[2] * dot * (1 - cos),
  ];
}

/**
 * Unit gaze direction from the eye position: the default gaze (toward the screen
 * center) yawed around the world up axis, then pitched around the view's right axis.
 * Positive yaw turns to the viewer's right, positive pitch looks up.
 */
export function getLookDirection(
  position: Vector3Tuple,
  yaw: number,
  pitch: number,
): Vector3Tuple {
  const target = getDefaultLookTarget();
  const forward = normalize([
    target[0] - position[0],
    target[1] - position[1],
    target[2] - position[2],
  ]);

  const yawed = rotateAboutY(forward, -yaw * DEG_TO_RAD);
  const right = normalize([-yawed[2], 0, yawed[0]]);

  return rotateAboutAxis(yawed, right, pitch * DEG_TO_RAD);
}
