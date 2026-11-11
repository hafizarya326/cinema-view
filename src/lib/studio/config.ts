import type { SeatCategory } from "@/types";

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
