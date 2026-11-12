import { EYE_HEIGHT, SEAT_COLORS, SEAT_HEIGHT } from "./config";
import type { Seat } from "@/types";

/** Where the seat block sits in 3D: the row floor is always EYE_HEIGHT below the eye. */
export function getSeatPosition(seat: Seat): [number, number, number] {
  const floorY = seat.y - EYE_HEIGHT;
  return [seat.x, floorY + SEAT_HEIGHT / 2, seat.z];
}

export function getSeatColor(seat: Seat, isSelected: boolean): string {
  return isSelected ? SEAT_COLORS.selected : SEAT_COLORS[seat.status];
}

export function isWebGLAvailable(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
