import { describe, expect, it } from "vitest";
import {
  CEILING_HEIGHT,
  CEILING_THICKNESS,
  ROOM_DEPTH,
  ROOM_WALL_THICKNESS,
  ROOM_WIDTH,
  ROW_SPACING,
  SCREEN_BOTTOM_Y,
  SCREEN_CENTER_Y,
  SCREEN_CENTER_Z,
  SCREEN_TOP_Y,
  SCREEN_WIDTH,
  SEAT_COUNT,
} from "./config";
import { getCeilingBox, getFloorSlabBoxes, getWallBoxes, type RoomBox } from "./scene";
import { generateSeats } from "./seats";

// Statuses are irrelevant here; only the eye geometry matters.
const seats = generateSeats("sightline-test");

type Vec3 = [number, number, number];

const SCREEN_POINTS: Array<{ name: string; point: Vec3 }> = [
  { name: "center", point: [0, SCREEN_CENTER_Y, SCREEN_CENTER_Z] },
  { name: "top-left", point: [-SCREEN_WIDTH / 2, SCREEN_TOP_Y, 0] },
  { name: "top-right", point: [SCREEN_WIDTH / 2, SCREEN_TOP_Y, 0] },
  { name: "bottom-left", point: [-SCREEN_WIDTH / 2, SCREEN_BOTTOM_Y, 0] },
  { name: "bottom-right", point: [SCREEN_WIDTH / 2, SCREEN_BOTTOM_Y, 0] },
];

/** Slab method: does the segment a→b cross the open interior of the box? */
function segmentHitsBox(a: Vec3, b: Vec3, box: RoomBox): boolean {
  let enter = 0;
  let exit = 1;

  for (let axis = 0; axis < 3; axis += 1) {
    const min = box.center[axis] - box.size[axis] / 2;
    const max = box.center[axis] + box.size[axis] / 2;
    const delta = b[axis] - a[axis];

    if (Math.abs(delta) < 1e-9) {
      if (a[axis] < min || a[axis] > max) return false;
      continue;
    }

    let near = (min - a[axis]) / delta;
    let far = (max - a[axis]) / delta;
    if (near > far) [near, far] = [far, near];

    if (near > enter) enter = near;
    if (far < exit) exit = far;
    if (enter >= exit) return false;
  }

  // enter >= exit (checked per axis) also rejects grazing / endpoint-only touches.
  return enter < exit && enter < 1 && exit > 0;
}

describe("studio sightline (config sanity)", () => {
  it("keeps the ceiling above the screen top", () => {
    expect(CEILING_HEIGHT).toBeGreaterThan(SCREEN_TOP_Y);
  });

  it("keeps the back wall behind the farthest seat + margin", () => {
    const farthestSeatZ = Math.max(...seats.map((seat) => seat.z));
    expect(ROOM_DEPTH).toBeGreaterThan(farthestSeatZ + ROW_SPACING / 2);
  });
});

describe("studio sightline (eyes are inside the room)", () => {
  it("has every seat eye under the ceiling, between the walls, before the back wall", () => {
    expect(seats).toHaveLength(SEAT_COUNT);

    const ceilingBottom = CEILING_HEIGHT - CEILING_THICKNESS / 2;
    const offenders = seats
      .filter((seat) => {
        return !(
          seat.y > 0 &&
          seat.y < ceilingBottom &&
          Math.abs(seat.x) < ROOM_WIDTH / 2 - ROOM_WALL_THICKNESS &&
          seat.z > 0 &&
          seat.z < ROOM_DEPTH - ROOM_WALL_THICKNESS
        );
      })
      .map((seat) => `${seat.id} (${seat.x}, ${seat.y}, ${seat.z})`);

    expect(offenders).toEqual([]);
  });
});

describe("studio sightline (unobstructed view to the screen)", () => {
  it("has no seat eye blocked by the ceiling, walls, or floor slabs in front", () => {
    const offenders: string[] = [];

    for (const seat of seats) {
      const eye: Vec3 = [seat.x, seat.y, seat.z];
      // "In front" = the slab's far edge is closer to the screen than the eye.
      const floorColliders = getFloorSlabBoxes().filter(
        (box) => box.center[2] + box.size[2] / 2 <= seat.z + 1e-9,
      );
      const colliders: Array<{ name: string; box: RoomBox }> = [
        ...getWallBoxes().map((box, index) => ({ name: `wall-${index}`, box })),
        { name: "ceiling", box: getCeilingBox() },
        ...floorColliders.map((box, index) => ({ name: `floor-${index}`, box })),
      ];

      for (const { name, point } of SCREEN_POINTS) {
        for (const collider of colliders) {
          if (segmentHitsBox(eye, point, collider.box)) {
            offenders.push(`${seat.id} -> ${name} hits ${collider.name}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
