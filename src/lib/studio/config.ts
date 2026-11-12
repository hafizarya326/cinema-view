import type { SeatCategory, SeatStatus, VisibilityLabel } from "@/types";

// Screen
export const SCREEN_WIDTH = 12.0;
export const SCREEN_HEIGHT = 5.0;
export const SCREEN_BOTTOM_Y = 1.5;
export const SCREEN_TOP_Y = SCREEN_BOTTOM_Y + SCREEN_HEIGHT; // 6.5
export const SCREEN_CENTER_Y = SCREEN_BOTTOM_Y + SCREEN_HEIGHT / 2; // 4.0
export const SCREEN_CENTER_Z = 0;

// Auditorium
export const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
export const ROW_COUNT = ROW_LABELS.length; // 10
export const SEATS_PER_ROW = 14;
export const SEAT_PITCH = 0.55;
export const FIRST_ROW_Z = 4.0;
export const ROW_SPACING = 1.1;
export const RAKE = 0.25;
export const EYE_HEIGHT = 1.15;
export const SEAT_COUNT = ROW_COUNT * SEATS_PER_ROW; // 140

// Camera / interaction
export const CAMERA_FOV = 60;
export const MAX_SEATS_PER_BOOKING = 6;

// Seating
export const OCCUPIED_SEAT_RATIO = 0.25;

export const CATEGORY_PRICES: Record<SeatCategory, number> = {
  front: 40000,
  standard: 50000,
  premium: 65000,
};

// Room shell, derived so it always wraps the seat block
export const ROOM_WIDTH = 16.0;
export const ROOM_DEPTH = FIRST_ROW_Z + (ROW_COUNT - 1) * ROW_SPACING + 3.0;
export const CEILING_HEIGHT = (ROW_COUNT - 1) * RAKE + 3.5;
export const ROOM_WALL_THICKNESS = 0.2;

// Seat block used by the 3D scene
export const SEAT_WIDTH = SEAT_PITCH * 0.8;
export const SEAT_DEPTH = 0.5;
export const SEAT_HEIGHT = 0.9;

// Static overview camera (first-person comes later)
export const OVERVIEW_CAMERA_POSITION: [number, number, number] = [
  0,
  (ROW_COUNT - 1) * RAKE + 6.0,
  FIRST_ROW_Z + (ROW_COUNT - 1) * ROW_SPACING + 8.0,
];
export const OVERVIEW_CAMERA_TARGET: [number, number, number] = [0, SCREEN_CENTER_Y, 0];
export const ORBIT_MIN_DISTANCE = 6.0;
export const ORBIT_MAX_DISTANCE = ROOM_DEPTH + 14.0;
export const ORBIT_MIN_POLAR_ANGLE = 0.2;
export const ORBIT_MAX_POLAR_ANGLE = Math.PI / 2.15;

// Seat view: the camera stays at the eye and only looks around
export const LOOK_YAW_LIMIT = 70; // degrees each side of the default gaze
export const LOOK_PITCH_MIN = -30; // degrees
export const LOOK_PITCH_MAX = 30; // degrees
export const LOOK_DRAG_SENSITIVITY = 0.25; // degrees per pixel dragged
export const LOOK_RESET_SMOOTHING = 6; // per second, eases yaw/pitch back to 0
export const CAMERA_TRANSITION_DURATION = 1.2; // seconds, easeInOutCubic

// Colors for the 3D scene (design tokens)
export const SEAT_COLORS: Record<SeatStatus, string> = {
  available: "#3F3F46",
  selected: "#22C55E",
  occupied: "#7F1D1D",
  unavailable: "#27272A",
};

export const SCENE_COLORS = {
  background: "#0A0A0B",
  floor: "#1B1B1F",
  wall: "#141416",
  ceiling: "#101012",
  screen: "#E5E7EB",
};

// Visibility label colors (label tokens, not used by the 3D scene)
export const VISIBILITY_COLORS: Record<VisibilityLabel, string> = {
  Excellent: "#22C55E",
  Good: "#A3E635",
  Fair: "#EAB308",
  Poor: "#E50914",
};
