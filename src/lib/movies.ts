import type { Movie, MovieStatus } from "@/types";

/** Case-insensitive title search. Blank query returns everything. */
export function searchMovies(movies: Movie[], query: string): Movie[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return movies;
  return movies.filter((movie) => movie.title.toLowerCase().includes(needle));
}

export function filterByStatus(movies: Movie[], status: MovieStatus): Movie[] {
  return movies.filter((movie) => movie.status === status);
}

/** "all" (or empty) returns everything. */
export function filterByGenre(movies: Movie[], genre: string): Movie[] {
  if (!genre || genre === "all") return movies;
  return movies.filter((movie) => movie.genres.includes(genre));
}

export function listGenres(movies: Movie[]): string[] {
  return [...new Set(movies.flatMap((movie) => movie.genres))].sort((a, b) => a.localeCompare(b));
}

export function getMovieById(movies: Movie[], id: string): Movie | undefined {
  return movies.find((movie) => movie.id === id);
}

export function featuredMovies(movies: Movie[], count: number): Movie[] {
  return filterByStatus(movies, "now_showing").slice(0, count);
}
