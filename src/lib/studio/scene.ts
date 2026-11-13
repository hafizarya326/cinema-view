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
  SCREEN_BOTTOM_Y,
  SCREEN_CENTER_Y,
  SCREEN_CENTER_Z,
  SCREEN_FRAME_DEPTH,
  SCREEN_FRAME_THICKNESS,
  SCREEN_HEIGHT,
  SCREEN_TOP_Y,
  SCREEN_WIDTH,
  SEAT_ARMREST_HEIGHT,
  SEAT_ARMREST_TOP_Y,
  SEAT_ARMREST_WIDTH,
  SEAT_BACKREST_TOP_Y,
  SEAT_BACKREST_THICKNESS,
  SEAT_COLORS,
  SEAT_CUSHION_HEIGHT,
  SEAT_CUSHION_TOP_Y,
  SEAT_DEPTH,
  SEAT_HEIGHT,
  SEAT_WIDTH,
  STEP_LIGHT_DEPTH,
  STEP_LIGHT_HEIGHT,
  STEP_LIGHT_INSET,
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

/**
 * Chair parts in local coordinates, relative to the seat instance origin
 * (getSeatPosition). Backrest sits behind the cushion (+Z), facing the screen.
 * Used directly to build the merged chair geometry.
 */
export function getSeatPartBoxes(): RoomBox[] {
  const toLocalY = (floorY: number) => floorY - SEAT_HEIGHT / 2;

  const cushionBottom = SEAT_CUSHION_TOP_Y - SEAT_CUSHION_HEIGHT;
  const armrestBottom = SEAT_ARMREST_TOP_Y - SEAT_ARMREST_HEIGHT;
  const armrestX = SEAT_WIDTH / 2 - SEAT_ARMREST_WIDTH / 2;
  const backrestZ = SEAT_DEPTH / 2 + SEAT_BACKREST_THICKNESS / 2;

  return [
    {
      center: [0, toLocalY((cushionBottom + SEAT_CUSHION_TOP_Y) / 2), 0],
      size: [SEAT_WIDTH, SEAT_CUSHION_HEIGHT, SEAT_DEPTH],
    },
    {
      center: [0, toLocalY((SEAT_CUSHION_TOP_Y + SEAT_BACKREST_TOP_Y) / 2), backrestZ],
      size: [SEAT_WIDTH, SEAT_BACKREST_TOP_Y - SEAT_CUSHION_TOP_Y, SEAT_BACKREST_THICKNESS],
    },
    {
      center: [-armrestX, toLocalY((armrestBottom + SEAT_ARMREST_TOP_Y) / 2), 0],
      size: [SEAT_ARMREST_WIDTH, SEAT_ARMREST_HEIGHT, SEAT_DEPTH],
    },
    {
      center: [armrestX, toLocalY((armrestBottom + SEAT_ARMREST_TOP_Y) / 2), 0],
      size: [SEAT_ARMREST_WIDTH, SEAT_ARMREST_HEIGHT, SEAT_DEPTH],
    },
  ];
}

/** World-space AABBs of a seat's cushion, backrest, and two armrests. */
export function getSeatBoxes(seat: Seat): RoomBox[] {
  const [ox, oy, oz] = getSeatPosition(seat);

  return getSeatPartBoxes().map((box) => ({
    center: [box.center[0] + ox, box.center[1] + oy, box.center[2] + oz],
    size: box.size,
  }));
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

/**
 * Thin black frame around the screen. Inner edges sit exactly on the screen
 * bounds and the depth goes behind the screen plane, so it never covers the
 * visible area from any seat.
 */
export function getScreenFrameBoxes(): RoomBox[] {
  const t = SCREEN_FRAME_THICKNESS;
  const d = SCREEN_FRAME_DEPTH;
  const z = SCREEN_CENTER_Z - d / 2;
  const outerWidth = SCREEN_WIDTH + 2 * t;
  const outerHeight = SCREEN_HEIGHT + 2 * t;

  return [
    { center: [-SCREEN_WIDTH / 2 - t / 2, SCREEN_CENTER_Y, z], size: [t, outerHeight, d] },
    { center: [SCREEN_WIDTH / 2 + t / 2, SCREEN_CENTER_Y, z], size: [t, outerHeight, d] },
    { center: [0, SCREEN_TOP_Y + t / 2, z], size: [outerWidth, t, d] },
    { center: [0, SCREEN_BOTTOM_Y - t / 2, z], size: [outerWidth, t, d] },
  ];
}

/** One dim strip light per step edge, laid on the tread just behind the nose. */
export function getStepLightBoxes(): RoomBox[] {
  const innerWidth = ROOM_WIDTH - ROOM_WALL_THICKNESS * 2;

  return ROW_LABELS.map((_, rowIndex) => {
    const zFrom = rowIndex === 0 ? 0 : getSeatZ(rowIndex) - ROW_SPACING / 2;

    return {
      center: [
        0,
        rowIndex * RAKE + STEP_LIGHT_HEIGHT / 2,
        zFrom + STEP_LIGHT_INSET + STEP_LIGHT_DEPTH / 2,
      ],
      size: [innerWidth, STEP_LIGHT_HEIGHT, STEP_LIGHT_DEPTH],
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
