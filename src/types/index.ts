export type MovieStatus = "now_showing" | "coming_soon";

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
