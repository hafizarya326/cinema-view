"use client";

import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { PerspectiveCamera } from "@react-three/drei/core/PerspectiveCamera";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ComponentRef, RefObject } from "react";
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  Matrix4,
  SRGBColorSpace,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
  type Mesh,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  LOOK_DAMPING,
  LOOK_DRAG_SENSITIVITY,
  LOOK_KEY_STEP,
  CAMERA_FAR,
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
  REDUCED_MOTION_TRANSITION_DURATION,
  ROOM_DEPTH,
  ROW_COUNT,
  ROW_LABELS,
  SCENE_COLORS,
  SCREEN_CENTER_Y,
  SCREEN_CENTER_Z,
  SCREEN_GLOW_DISTANCE,
  SCREEN_GLOW_INTENSITY,
  SCREEN_GLOW_Z,
  SCREEN_HEIGHT,
  SCREEN_PATTERN,
  SCREEN_WIDTH,
  SEAT_COUNT,
} from "@/lib/studio/config";
import {
  type CameraMode,
  type LookAngles,
  type Vector3Tuple,
  clampLook,
  easeInOutCubic,
  getEffectiveFov,
  getLookDirection,
  getModeView,
  interpolatePosition,
} from "@/lib/studio/camera";
import {
  disposeMesh,
  getCeilingBox,
  getFloorSlabBoxes,
  getScreenFrameBoxes,
  getSeatColor,
  getSeatPartBoxes,
  getSeatPosition,
  getStepLightBoxes,
  getWallBoxes,
} from "@/lib/studio/scene";
import { getSeatZ } from "@/lib/studio/seats";
import type { Seat } from "@/types";

const FLOOR_SLAB_BOXES = getFloorSlabBoxes();
const WALL_BOXES = getWallBoxes();
const CEILING_BOX = getCeilingBox();
const SCREEN_FRAME_BOXES = getScreenFrameBoxes();
const STEP_LIGHT_BOXES = getStepLightBoxes();

/** Dark carpet floor, one stepped slab per row (front row stays at floor level). */
const SteppedFloor = memo(function SteppedFloor() {
  return (
    <group>
      {FLOOR_SLAB_BOXES.map((box, rowIndex) => (
        <mesh key={ROW_LABELS[rowIndex]} position={box.center}>
          <boxGeometry args={box.size} />
          <meshStandardMaterial color={SCENE_COLORS.carpet} roughness={1} />
        </mesh>
      ))}
    </group>
  );
});

/** Paneled walls (side vs back tone) plus a dark ceiling. */
const RoomShell = memo(function RoomShell() {
  return (
    <group>
      {WALL_BOXES.map((box, index) => (
        <mesh key={index} position={box.center}>
          <boxGeometry args={box.size} />
          <meshStandardMaterial
            color={index === 2 ? SCENE_COLORS.wallPanel : SCENE_COLORS.wall}
            roughness={1}
          />
        </mesh>
      ))}
      <mesh position={CEILING_BOX.center}>
        <boxGeometry args={CEILING_BOX.size} />
        <meshStandardMaterial color={SCENE_COLORS.ceiling} roughness={1} />
      </mesh>
    </group>
  );
});

/** Procedural screen surface: vertical gradient plus test-pattern bars. */
function createScreenTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_PATTERN.width;
  canvas.height = SCREEN_PATTERN.height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, SCENE_COLORS.screenTop);
  gradient.addColorStop(0.55, SCENE_COLORS.screenMid);
  gradient.addColorStop(1, SCENE_COLORS.screenBottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const barWidth = canvas.width / SCREEN_PATTERN.bars;
  context.fillStyle = SCENE_COLORS.screenBar;
  for (let index = 0; index < SCREEN_PATTERN.bars; index += 2) {
    context.fillRect(index * barWidth, canvas.height * 0.72, barWidth, canvas.height * 0.28);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Emissive screen with a thin black frame that stays outside the visible area. */
const ScreenPanel = memo(function ScreenPanel() {
  const meshRef = useRef<Mesh>(null);
  const texture = useMemo(() => createScreenTexture(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    return () => disposeMesh(mesh);
  }, []);

  return (
    <group>
      <mesh ref={meshRef} position={[0, SCREEN_CENTER_Y, SCREEN_CENTER_Z]}>
        <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
        <meshStandardMaterial
          map={texture}
          emissive={SCENE_COLORS.screenEmissive}
          emissiveMap={texture}
          emissiveIntensity={1.1}
          toneMapped={false}
          roughness={1}
        />
      </mesh>

      {SCREEN_FRAME_BOXES.map((box, index) => (
        <mesh key={index} position={box.center}>
          <boxGeometry args={box.size} />
          <meshStandardMaterial color={SCENE_COLORS.screenFrame} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
});

/** One instanced mesh: a dim strip light on every step edge. */
const StepLights = memo(function StepLights() {
  const meshRef = useRef<InstancedMesh>(null);
  const matrix = useMemo(() => new Matrix4(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    STEP_LIGHT_BOXES.forEach((box, index) => {
      matrix.setPosition(...box.center);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrix]);

  useEffect(() => {
    const mesh = meshRef.current;
    return () => disposeMesh(mesh);
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STEP_LIGHT_BOXES.length]}>
      <boxGeometry args={STEP_LIGHT_BOXES[0].size} />
      <meshStandardMaterial
        color={SCENE_COLORS.stepLight}
        emissive={SCENE_COLORS.stepLight}
        emissiveIntensity={0.6}
        toneMapped={false}
      />
    </instancedMesh>
  );
});

const Lights = memo(function Lights() {
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
      <pointLight
        position={[0, SCREEN_CENTER_Y, SCREEN_GLOW_Z]}
        color={SCENE_COLORS.screenGlow}
        intensity={SCREEN_GLOW_INTENSITY}
        distance={SCREEN_GLOW_DISTANCE}
        decay={2}
      />
    </>
  );
});

/** Merge cushion, backrest, and both armrests into one geometry (single draw call). */
function createChairGeometry(): BufferGeometry {
  const parts = getSeatPartBoxes().map((box) => {
    const geometry = new BoxGeometry(...box.size);
    geometry.translate(...box.center);
    return geometry;
  });

  const merged = mergeGeometries(parts);
  parts.forEach((geometry) => geometry.dispose());
  return merged;
}

/** All 140 seats in a single InstancedMesh, tinted per status. */
const Seats = memo(function Seats({
  seats,
  selectedSeatIds,
}: {
  seats: Seat[];
  selectedSeatIds: string[];
}) {
  const meshRef = useRef<InstancedMesh>(null);
  // Scratch objects, allocated once instead of on every seat update.
  const matrix = useMemo(() => new Matrix4(), []);
  const color = useMemo(() => new Color(), []);
  const geometry = useMemo(() => createChairGeometry(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const selectedSet = new Set(selectedSeatIds);
    seats.forEach((seat, index) => {
      matrix.setPosition(...getSeatPosition(seat));
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, color.set(getSeatColor(seat, selectedSet.has(seat.id))));
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
    <instancedMesh ref={meshRef} args={[geometry, undefined, SEAT_COUNT]}>
      <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
    </instancedMesh>
  );
});

type ControlsRef = ComponentRef<typeof OrbitControls>;

/** Reports a lost WebGL context so the page can fall back to the 2D seat map. */
const ContextWatcher = memo(function ContextWatcher({
  onContextLost,
}: {
  onContextLost?: () => void;
}) {
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
});

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the user asked the OS to reduce motion. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia(REDUCED_MOTION_QUERY);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
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
  const reducedMotion = usePrefersReducedMotion();
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
  const gazeTarget = useMemo(() => new Vector3(), []);

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

    // Damped look: the gaze chases the clamped target without allocating.
    const smoothing = Math.min(1, delta * LOOK_DAMPING);
    look.current.yaw += (lookTarget.current.yaw - look.current.yaw) * smoothing;
    look.current.pitch += (lookTarget.current.pitch - look.current.pitch) * smoothing;

    if (state.progress < 1 && state.from && state.fromTarget) {
      const duration = reducedMotion
        ? REDUCED_MOTION_TRANSITION_DURATION
        : CAMERA_TRANSITION_DURATION;
      state.progress = Math.min(1, state.progress + delta / duration);
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

/**
 * Default camera. CAMERA_FOV is the horizontal reference angle, so this widens
 * the vertical FOV on portrait viewports to keep the whole screen width in view.
 */
const ResponsiveCamera = memo(function ResponsiveCamera() {
  const size = useThree((state) => state.size);
  const aspect = size.width / Math.max(1, size.height);

  return (
    <PerspectiveCamera
      makeDefault
      position={OVERVIEW_CAMERA_POSITION}
      fov={getEffectiveFov(aspect)}
      near={CAMERA_NEAR}
      far={CAMERA_FAR}
    />
  );
});

interface SceneStats {
  fps: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

const DEBUG_SAMPLE_INTERVAL_MS = 400;
const noopSubscribe = () => () => {};

/** Active only with ?debug=1; server snapshot is always false to prevent hydration mismatch. */
function useDebugOverlayEnabled(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("debug") === "1",
    () => false,
  );
}

/** Samples renderer.info and FPS inside the render loop. Mounted only when ?debug=1. */
const SceneStatsProbe = memo(function SceneStatsProbe({
  listenerRef,
}: {
  listenerRef: RefObject<((stats: SceneStats) => void) | null>;
}) {
  const bucket = useRef({ frames: 0, lastTime: 0 });

  useFrame((state) => {
    const now = performance.now();
    const current = bucket.current;
    if (current.lastTime === 0) {
      current.lastTime = now;
      return;
    }

    current.frames += 1;
    const elapsed = now - current.lastTime;
    if (elapsed < DEBUG_SAMPLE_INTERVAL_MS) return;

    const { render, memory } = state.gl.info;
    listenerRef.current?.({
      fps: Math.round((current.frames * 1000) / elapsed),
      calls: render.calls,
      triangles: render.triangles,
      geometries: memory.geometries,
      textures: memory.textures,
    });

    current.frames = 0;
    current.lastTime = now;
  });

  return null;
});

/** Small HUD displaying renderer.info metrics and FPS; updates stay isolated from CinemaScene. */
const SceneDebugOverlay = memo(function SceneDebugOverlay({
  listenerRef,
}: {
  listenerRef: RefObject<((stats: SceneStats) => void) | null>;
}) {
  const [stats, setStats] = useState<SceneStats | null>(null);

  useEffect(() => {
    listenerRef.current = setStats;
    return () => {
      listenerRef.current = null;
    };
  }, [listenerRef]);

  return (
    <aside
      data-testid="scene-debug-overlay"
      aria-label="Statistik scene 3D"
      className="pointer-events-none absolute top-3 left-3 z-10 rounded-xl border border-border bg-background/85 px-3 py-2 font-mono text-xs leading-relaxed text-foreground backdrop-blur-sm"
    >
      <dl className="grid grid-cols-[auto_auto] gap-x-3">
        <dt className="text-muted">FPS</dt>
        <dd className="text-right tabular-nums">{stats ? stats.fps : "—"}</dd>
        <dt className="text-muted">Draw call</dt>
        <dd className="text-right tabular-nums">{stats ? stats.calls : "—"}</dd>
        <dt className="text-muted">Triangle</dt>
        <dd className="text-right tabular-nums">{stats ? stats.triangles : "—"}</dd>
        <dt className="text-muted">Geometri</dt>
        <dd className="text-right tabular-nums">{stats ? stats.geometries : "—"}</dd>
        <dt className="text-muted">Texture</dt>
        <dd className="text-right tabular-nums">{stats ? stats.textures : "—"}</dd>
      </dl>
    </aside>
  );
});

const CinemaScene = memo(function CinemaScene({
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
  const statsListenerRef = useRef<((stats: SceneStats) => void) | null>(null);
  const descriptionId = useId();
  const debugEnabled = useDebugOverlayEnabled();
  const activeSeat = useMemo(
    () => seats.find((seat) => seat.id === activeSeatId) ?? null,
    [seats, activeSeatId],
  );

  return (
    // touch-none keeps one-finger drags from scrolling the page; scroll outside stays normal.
    // Focusable so the arrow keys can turn the gaze in seat view; Escape or Tab exits focus.
    <div
      ref={wrapperRef}
      role="region"
      tabIndex={0}
      aria-label="Pratinjau 3D studio"
      aria-describedby={descriptionId}
      onKeyDown={(event) => {
        // Attached directly on the wrapper so Escape exits focus immediately, even before Canvas mounts.
        if (event.key === "Escape") event.currentTarget.blur();
      }}
      className="relative size-full touch-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <p id={descriptionId} className="sr-only">
        Geser layar dengan mouse atau satu jari untuk melihat sekeliling. Saat mode Seat View,
        gunakan tombol panah untuk memutar pandangan dari kursi terpilih. Tekan Escape atau Tab
        untuk keluar dari pratinjau 3D.
      </p>
      <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={[SCENE_COLORS.background]} />
        <ResponsiveCamera />
        <ContextWatcher onContextLost={onContextLost} />
        <Lights />
        <RoomShell />
        <SteppedFloor />
        <StepLights />
        <ScreenPanel />
        <Seats seats={seats} selectedSeatIds={selectedSeatIds} />
        <CameraRig
          mode={mode}
          seat={activeSeat}
          controlsRef={controlsRef}
          wrapperRef={wrapperRef}
        />
        {debugEnabled && <SceneStatsProbe listenerRef={statsListenerRef} />}
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
      {debugEnabled && <SceneDebugOverlay listenerRef={statsListenerRef} />}
    </div>
  );
});

export default CinemaScene;
