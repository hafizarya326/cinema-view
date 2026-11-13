import {
  CEILING_HEIGHT,
  CEILING_THICKNESS,
  EYE_HEIGHT,
  RAKE,
  ROOM_DEPTH,
  ROOM_WALL_THICKNESS,
  ROOM_WIDTH,
  ROW_COUNT,
  ROW_LABELS,
  ROW_SPACING,
  SEAT_COLORS,
  SEAT_HEIGHT,
} from "./config";
import { getSeatZ } from "./seats";
import type { Mesh } from "three";
import type { Seat } from "@/types";

/** Axis-aligned box in meters, in the same coordinates as the studio. */
export interface RoomBox {
  center: [number, number, number];
  size: [number, number, number];
}

/** Where the seat block sits in 3D: the row floor is always EYE_HEIGHT below the eye. */
export function getSeatPosition(seat: Seat): [number, number, number] {
  const floorY = seat.y - EYE_HEIGHT;
  return [seat.x, floorY + SEAT_HEIGHT / 2, seat.z];
}

/** Left, right, and back walls. Single source of truth for the scene and the sightline test. */
export function getWallBoxes(): RoomBox[] {
  return [
    {
      center: [-ROOM_WIDTH / 2 + ROOM_WALL_THICKNESS / 2, CEILING_HEIGHT / 2, ROOM_DEPTH / 2],
      size: [ROOM_WALL_THICKNESS, CEILING_HEIGHT, ROOM_DEPTH],
    },
    {
      center: [ROOM_WIDTH / 2 - ROOM_WALL_THICKNESS / 2, CEILING_HEIGHT / 2, ROOM_DEPTH / 2],
      size: [ROOM_WALL_THICKNESS, CEILING_HEIGHT, ROOM_DEPTH],
    },
    {
      center: [0, CEILING_HEIGHT / 2, ROOM_DEPTH - ROOM_WALL_THICKNESS / 2],
      size: [ROOM_WIDTH, CEILING_HEIGHT, ROOM_WALL_THICKNESS],
    },
  ];
}

/** The ceiling slab, spanning the full room. */
export function getCeilingBox(): RoomBox {
  return {
    center: [0, CEILING_HEIGHT, ROOM_DEPTH / 2],
    size: [ROOM_WIDTH, CEILING_THICKNESS, ROOM_DEPTH],
  };
}

/** One stepped slab per row; the front row stays at floor level. */
export function getFloorSlabBoxes(): RoomBox[] {
  const innerWidth = ROOM_WIDTH - ROOM_WALL_THICKNESS * 2;

  return ROW_LABELS.map((_, rowIndex) => {
    const top = rowIndex * RAKE;
    const zFrom = rowIndex === 0 ? 0 : getSeatZ(rowIndex) - ROW_SPACING / 2;
    const zTo = rowIndex === ROW_COUNT - 1 ? ROOM_DEPTH : getSeatZ(rowIndex) + ROW_SPACING / 2;

    return {
      center: [0, top - RAKE / 2, (zFrom + zTo) / 2],
      size: [innerWidth, RAKE, zTo - zFrom],
    };
  });
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
