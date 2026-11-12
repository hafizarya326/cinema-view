import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { EYE_HEIGHT, SEAT_HEIGHT } from "./config";
import { createSeat } from "./seats";
import { disposeMesh, getSeatColor, getSeatPosition, isWebGLAvailable } from "./scene";

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

describe("disposeMesh", () => {
  it("disposes geometry, materials and their textures", () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const texture = new THREE.Texture();
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    const geometrySpy = vi.spyOn(geometry, "dispose");
    const materialSpy = vi.spyOn(material, "dispose");
    const textureSpy = vi.spyOn(texture, "dispose");

    disposeMesh(mesh);

    expect(geometrySpy).toHaveBeenCalledOnce();
    expect(materialSpy).toHaveBeenCalledOnce();
    expect(textureSpy).toHaveBeenCalledOnce();
  });

  it("handles a multi-material mesh and a null mesh", () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()];
    const mesh = new THREE.Mesh(geometry, materials);
    const spies = materials.map((material) => vi.spyOn(material, "dispose"));

    disposeMesh(mesh);
    disposeMesh(null);

    expect(spies[0]).toHaveBeenCalledOnce();
    expect(spies[1]).toHaveBeenCalledOnce();
  });
});
