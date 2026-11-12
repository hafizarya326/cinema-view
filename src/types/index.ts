export type MovieStatus = "now_showing" | "coming_soon";

export type SeatStatus = "available" | "selected" | "occupied" | "unavailable";
export type SeatCategory = "front" | "standard" | "premium";
export type VisibilityLabel = "Excellent" | "Good" | "Fair" | "Poor";

export interface Seat {
  id: string; // e.g. "F7"
  row: string; // "A" to "J"
  number: number; // 1 to 14
  x: number;
  y: number;
  z: number; // eye position in meters
  category: SeatCategory;
  price: number;
  status: SeatStatus;
}

export interface ViewingInfo {
  distance: number;
  horizontalFov: number;
  verticalFov: number;
  neckTilt: number;
  azimuth: number;
  visibilityScore: number;
  visibilityLabel: VisibilityLabel;
}


export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  genres: string[];
  durationMin: number;
  rating: string;
  synopsis: string;
  trailerUrl: string;
  status: MovieStatus;
}

export interface Showtime {
  id: string;
  movieId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  cinema: string;
  studio: string;
}
