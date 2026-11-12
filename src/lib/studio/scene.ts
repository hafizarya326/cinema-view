import { EYE_HEIGHT, SEAT_COLORS, SEAT_HEIGHT } from "./config";
import type { Mesh } from "three";
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

type Disposable = { isTexture?: boolean; dispose: () => void };

/** Frees GPU resources: geometry, every material, and any texture they reference. */
export function disposeMesh(mesh: Mesh | null): void {
  if (!mesh) return;

  mesh.geometry.dispose();

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) {
    for (const value of Object.values(material as unknown as Record<string, unknown>)) {
      if (typeof value === "object" && value !== null && (value as Disposable).isTexture) {
        (value as Disposable).dispose();
      }
    }
    material.dispose();
  }
}
