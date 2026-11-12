"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import {
  CAMERA_FOV,
  CEILING_HEIGHT,
  ORBIT_MAX_DISTANCE,
  ORBIT_MAX_POLAR_ANGLE,
  ORBIT_MIN_DISTANCE,
  ORBIT_MIN_POLAR_ANGLE,
  OVERVIEW_CAMERA_POSITION,
  OVERVIEW_CAMERA_TARGET,
  RAKE,
  ROOM_DEPTH,
  ROOM_WALL_THICKNESS,
  ROOM_WIDTH,
  ROW_COUNT,
  ROW_LABELS,
  ROW_SPACING,
  SCENE_COLORS,
  SCREEN_CENTER_Y,
  SCREEN_CENTER_Z,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  SEAT_COUNT,
  SEAT_DEPTH,
  SEAT_HEIGHT,
  SEAT_WIDTH,
} from "@/lib/studio/config";
import { getSeatColor, getSeatPosition } from "@/lib/studio/scene";
import { getSeatZ } from "@/lib/studio/seats";
import type { Seat } from "@/types";

const INNER_WIDTH = ROOM_WIDTH - ROOM_WALL_THICKNESS * 2;

/** One slab per row: top surface at rowIndex * RAKE, so the front row stays at floor level. */
function SteppedFloor() {
  return (
    <group>
      {ROW_LABELS.map((row, rowIndex) => {
        const top = rowIndex * RAKE;
        const zFrom = rowIndex === 0 ? 0 : getSeatZ(rowIndex) - ROW_SPACING / 2;
        const zTo = rowIndex === ROW_COUNT - 1 ? ROOM_DEPTH : getSeatZ(rowIndex) + ROW_SPACING / 2;

        return (
          <mesh key={row} position={[0, top - RAKE / 2, (zFrom + zTo) / 2]}>
            <boxGeometry args={[INNER_WIDTH, RAKE, zTo - zFrom]} />
            <meshStandardMaterial color={SCENE_COLORS.floor} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function RoomShell() {
  const wallMaterial = <meshStandardMaterial color={SCENE_COLORS.wall} roughness={1} />;

  return (
    <group>
      <mesh position={[-ROOM_WIDTH / 2 + ROOM_WALL_THICKNESS / 2, CEILING_HEIGHT / 2, ROOM_DEPTH / 2]}>
        <boxGeometry args={[ROOM_WALL_THICKNESS, CEILING_HEIGHT, ROOM_DEPTH]} />
        {wallMaterial}
      </mesh>
      <mesh position={[ROOM_WIDTH / 2 - ROOM_WALL_THICKNESS / 2, CEILING_HEIGHT / 2, ROOM_DEPTH / 2]}>
        <boxGeometry args={[ROOM_WALL_THICKNESS, CEILING_HEIGHT, ROOM_DEPTH]} />
        {wallMaterial}
      </mesh>
      <mesh position={[0, CEILING_HEIGHT / 2, ROOM_DEPTH - ROOM_WALL_THICKNESS / 2]}>
        <boxGeometry args={[ROOM_WIDTH, CEILING_HEIGHT, ROOM_WALL_THICKNESS]} />
        {wallMaterial}
      </mesh>
      {/* Ceiling plane rotated so its front face points down into the room. */}
      <mesh position={[0, CEILING_HEIGHT, ROOM_DEPTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color={SCENE_COLORS.ceiling} roughness={1} />
      </mesh>
    </group>
  );
}

function ScreenPanel() {
  return (
    <mesh position={[0, SCREEN_CENTER_Y, SCREEN_CENTER_Z]}>
      <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
      <meshStandardMaterial
        color={SCENE_COLORS.screen}
        emissive={SCENE_COLORS.screen}
        emissiveIntensity={1.2}
        toneMapped={false}
      />
    </mesh>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <hemisphereLight args={[SCENE_COLORS.ceiling, SCENE_COLORS.background, 0.35]} />
      <pointLight
        position={[0, CEILING_HEIGHT - 0.4, getSeatZ(Math.floor(ROW_COUNT / 2))]}
        intensity={25}
        distance={ROOM_DEPTH * 2}
        decay={2}
      />
    </>
  );
}

/** All 140 seats in a single InstancedMesh, tinted per status. */
function Seats({ seats, selectedSeatIds }: { seats: Seat[]; selectedSeatIds: string[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    seats.forEach((seat, index) => {
      matrix.setPosition(...getSeatPosition(seat));
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, color.set(getSeatColor(seat, selectedSeatIds.includes(seat.id))));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [seats, selectedSeatIds]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, SEAT_COUNT]}>
      <boxGeometry args={[SEAT_WIDTH, SEAT_HEIGHT, SEAT_DEPTH]} />
      <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
    </instancedMesh>
  );
}

export default function CinemaScene({
  seats,
  selectedSeatIds,
}: {
  seats: Seat[];
  selectedSeatIds: string[];
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true }}
      camera={{ position: OVERVIEW_CAMERA_POSITION, fov: CAMERA_FOV, near: 0.1, far: 500 }}
    >
      <color attach="background" args={[SCENE_COLORS.background]} />
      <Lights />
      <RoomShell />
      <SteppedFloor />
      <ScreenPanel />
      <Seats seats={seats} selectedSeatIds={selectedSeatIds} />
      <OrbitControls
        makeDefault
        target={OVERVIEW_CAMERA_TARGET}
        enablePan={false}
        minDistance={ORBIT_MIN_DISTANCE}
        maxDistance={ORBIT_MAX_DISTANCE}
        minPolarAngle={ORBIT_MIN_POLAR_ANGLE}
        maxPolarAngle={ORBIT_MAX_POLAR_ANGLE}
      />
    </Canvas>
  );
}
