"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";import type { ComponentRef, RefObject } from "react";
import * as THREE from "three";
import {
  LOOK_DRAG_SENSITIVITY,
  LOOK_KEY_STEP,
  LOOK_RESET_SMOOTHING,
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_TRANSITION_DURATION,
  CEILING_HEIGHT,
  CEILING_LIGHT_INSET,
  ORBIT_MAX_DISTANCE,
  ORBIT_MAX_POLAR_ANGLE,
  ORBIT_MIN_DISTANCE,
  ORBIT_MIN_POLAR_ANGLE,
  OVERVIEW_CAMERA_POSITION,
  OVERVIEW_CAMERA_TARGET,
  ROOM_DEPTH,
  ROW_COUNT,
  ROW_LABELS,
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
import {
  type CameraMode,
  type LookAngles,
  type Vector3Tuple,
  clampLook,
  easeInOutCubic,
  getLookDirection,
  getModeView,
  interpolatePosition,
} from "@/lib/studio/camera";
import {
  disposeMesh,
  getCeilingBox,
  getFloorSlabBoxes,
  getSeatColor,
  getSeatPosition,
  getWallBoxes,
} from "@/lib/studio/scene";
import { getSeatZ } from "@/lib/studio/seats";
import type { Seat } from "@/types";

/** One slab per row: top surface at rowIndex * RAKE, so the front row stays at floor level. */
function SteppedFloor() {
  return (
    <group>
      {getFloorSlabBoxes().map((box, rowIndex) => (
        <mesh key={ROW_LABELS[rowIndex]} position={box.center}>
          <boxGeometry args={box.size} />
          <meshStandardMaterial color={SCENE_COLORS.floor} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function RoomShell() {
  const wallMaterial = <meshStandardMaterial color={SCENE_COLORS.wall} roughness={1} />;
  const ceiling = getCeilingBox();

  return (
    <group>
      {getWallBoxes().map((box, index) => (
        <mesh key={index} position={box.center}>
          <boxGeometry args={box.size} />
          {wallMaterial}
        </mesh>
      ))}
      <mesh position={ceiling.center}>
        <boxGeometry args={ceiling.size} />
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
        position={[0, CEILING_HEIGHT - CEILING_LIGHT_INSET, getSeatZ(Math.floor(ROW_COUNT / 2))]}
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
  // Scratch objects, allocated once instead of on every seat update.
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    seats.forEach((seat, index) => {
      matrix.setPosition(...getSeatPosition(seat));
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, color.set(getSeatColor(seat, selectedSeatIds.includes(seat.id))));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [seats, selectedSeatIds, matrix, color]);

  // Release the instanced buffers we own when the scene unmounts.
  useEffect(() => {
    const mesh = meshRef.current;
    return () => disposeMesh(mesh);
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, SEAT_COUNT]}>
      <boxGeometry args={[SEAT_WIDTH, SEAT_HEIGHT, SEAT_DEPTH]} />
      <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
    </instancedMesh>
  );
}

type ControlsRef = ComponentRef<typeof OrbitControls>;

/** Reports a lost WebGL context so the page can fall back to the 2D seat map. */
function ContextWatcher({ onContextLost }: { onContextLost?: () => void }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (!onContextLost) return;
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };

    canvas.addEventListener("webglcontextlost", handleLost);
    return () => canvas.removeEventListener("webglcontextlost", handleLost);
  }, [gl, onContextLost]);

  return null;
}

/**
 * Moves the camera between overview and the active seat (1.2s easeInOutCubic).
 * In seat mode the camera stays pinned to the eye and only the gaze turns:
 * drag (mouse or one finger) changes yaw/pitch, clamped to the configured limits.
 */
function CameraRig({
  mode,
  seat,
  controlsRef,
  wrapperRef,
}: {
  mode: CameraMode;
  seat: Seat | null;
  controlsRef: RefObject<ControlsRef | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
}) {
  const camera = useThree((state) => state.camera);
  const transition = useRef<{
    progress: number;
    from: Vector3Tuple | null;
    fromTarget: Vector3Tuple | null;
  }>({ progress: 1, from: null, fromTarget: null });
  const look = useRef<LookAngles>({ yaw: 0, pitch: 0 });
  const lookTarget = useRef<LookAngles>({ yaw: 0, pitch: 0 });
  const drag = useRef({ active: false, x: 0, y: 0 });
  // Resolved once per mode/seat change; the frame loop never allocates vectors.
  const view = useMemo(() => getModeView(mode, seat), [mode, seat]);
  const eye = useMemo(() => getModeView("seat", seat).position, [seat]);
  const gazeTarget = useMemo(() => new THREE.Vector3(), []);

  // New seat or mode: transition from the current pose and ease the gaze back to the default.
  useEffect(() => {
    const controls = controlsRef.current;

    transition.current = {
      progress: 0,
      from: [camera.position.x, camera.position.y, camera.position.z],
      fromTarget: controls
        ? [controls.target.x, controls.target.y, controls.target.z]
        : view.target,
    };
    lookTarget.current = { yaw: 0, pitch: 0 };
    if (controls) controls.enabled = false;
  }, [camera, controlsRef, view]);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    // Input is ignored outside seat view and while the camera is still moving.
    const inputLocked = () => mode !== "seat" || !seat || transition.current.progress < 1;

    const onPointerDown = (event: PointerEvent) => {
      if (inputLocked()) return;
      drag.current = { active: true, x: event.clientX, y: event.clientY };
      element.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag.current.active || inputLocked()) return;

      const deltaX = event.clientX - drag.current.x;
      const deltaY = event.clientY - drag.current.y;
      drag.current.x = event.clientX;
      drag.current.y = event.clientY;

      lookTarget.current = clampLook(
        lookTarget.current.yaw + deltaX * LOOK_DRAG_SENSITIVITY,
        lookTarget.current.pitch - deltaY * LOOK_DRAG_SENSITIVITY,
      );
    };

    const endDrag = (event: PointerEvent) => {
      drag.current.active = false;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    };

    // Keyboard look-around: arrows nudge the gaze, clamped exactly like dragging.
    const onKeyDown = (event: KeyboardEvent) => {
      if (inputLocked()) return;

      let { yaw, pitch } = lookTarget.current;
      if (event.key === "ArrowLeft") yaw -= LOOK_KEY_STEP;
      else if (event.key === "ArrowRight") yaw += LOOK_KEY_STEP;
      else if (event.key === "ArrowUp") pitch += LOOK_KEY_STEP;
      else if (event.key === "ArrowDown") pitch -= LOOK_KEY_STEP;
      else return;

      event.preventDefault();
      lookTarget.current = clampLook(yaw, pitch);
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", endDrag);
    element.addEventListener("pointercancel", endDrag);
    element.addEventListener("keydown", onKeyDown);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", endDrag);
      element.removeEventListener("pointercancel", endDrag);
      element.removeEventListener("keydown", onKeyDown);
    };
  }, [mode, seat, wrapperRef]);

  useFrame((_, delta) => {
    const state = transition.current;

    const smoothing = Math.min(1, delta * LOOK_RESET_SMOOTHING);    look.current = {
      yaw: look.current.yaw + (lookTarget.current.yaw - look.current.yaw) * smoothing,
      pitch: look.current.pitch + (lookTarget.current.pitch - look.current.pitch) * smoothing,
    };

    if (state.progress < 1 && state.from && state.fromTarget) {
      state.progress = Math.min(1, state.progress + delta / CAMERA_TRANSITION_DURATION);
      const eased = easeInOutCubic(state.progress);

      camera.position.set(...interpolatePosition(state.from, view.position, eased));

      const controls = controlsRef.current;
      if (controls) {
        controls.target.set(...interpolatePosition(state.fromTarget, view.target, eased));
        controls.update();
        if (state.progress >= 1) controls.enabled = true;
      }
      return;
    }

    if (mode !== "seat" || !seat) return; // overview is driven by OrbitControls

    camera.position.set(...eye); // pinned to the eye: dragging never moves it
    const direction = getLookDirection(eye, look.current.yaw, look.current.pitch);
    gazeTarget.set(
      eye[0] + direction[0],
      eye[1] + direction[1],
      eye[2] + direction[2],
    );
    camera.lookAt(gazeTarget);
  });

  return null;
}

export default function CinemaScene({
  seats,
  selectedSeatIds,
  activeSeatId,
  mode,
  onContextLost,
}: {
  seats: Seat[];
  selectedSeatIds: string[];
  activeSeatId: string | null;
  mode: CameraMode;
  onContextLost?: () => void;
}) {
  const controlsRef = useRef<ControlsRef>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeSeat = useMemo(
    () => seats.find((seat) => seat.id === activeSeatId) ?? null,
    [seats, activeSeatId],
  );

  return (
    // touch-none keeps one-finger drags from scrolling the page; scroll outside stays normal.
    // Focusable so the arrow keys can turn the gaze in seat view.
    <div
      ref={wrapperRef}
      role="region"
      tabIndex={0}
      aria-label="Pratinjau 3D studio. Klik dan geser untuk melihat sekeliling; saat mode Seat View, gunakan tombol panah untuk memutar pandangan dari kursi terpilih."
      className="size-full touch-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{
          position: OVERVIEW_CAMERA_POSITION,
          fov: CAMERA_FOV,
          near: CAMERA_NEAR,
          far: CAMERA_FAR,
        }}
      >
        <color attach="background" args={[SCENE_COLORS.background]} />
        <ContextWatcher onContextLost={onContextLost} />
        <Lights />
        <RoomShell />
        <SteppedFloor />
        <ScreenPanel />
        <Seats seats={seats} selectedSeatIds={selectedSeatIds} />
        <CameraRig
          mode={mode}
          seat={activeSeat}
          controlsRef={controlsRef}
          wrapperRef={wrapperRef}
        />
        {mode === "overview" && (
          <OrbitControls
            ref={controlsRef}
            makeDefault
            target={OVERVIEW_CAMERA_TARGET}
            enablePan={false}
            minDistance={ORBIT_MIN_DISTANCE}
            maxDistance={ORBIT_MAX_DISTANCE}
            minPolarAngle={ORBIT_MIN_POLAR_ANGLE}
            maxPolarAngle={ORBIT_MAX_POLAR_ANGLE}
          />
        )}
      </Canvas>
    </div>
  );
}
