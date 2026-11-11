import { describe, expect, it } from "vitest";
import { movies } from "@/data/movies";
import { featuredMovies, filterByGenre, getMovieById, listGenres, searchMovies } from "./movies";

describe("searchMovies", () => {
  it("matches by title, ignoring case and padding", () => {
    expect(searchMovies(movies, "  langit ").map((movie) => movie.id)).toEqual(["langit-kedua"]);
  });

  it("returns everything for a blank query", () => {
    expect(searchMovies(movies, "   ")).toHaveLength(movies.length);
  });

  it("returns nothing when nothing matches", () => {
    expect(searchMovies(movies, "zzz")).toEqual([]);
  });
});

describe("filterByGenre", () => {
  it("keeps only movies in the genre", () => {
    const drama = filterByGenre(movies, "Drama");
    expect(drama.length).toBeGreaterThan(0);
    expect(drama.every((movie) => movie.genres.includes("Drama"))).toBe(true);
  });

  it("treats all as no filter", () => {
    expect(filterByGenre(movies, "all")).toHaveLength(movies.length);
  });
});

describe("listGenres", () => {
  it("lists unique genres sorted", () => {
    const genres = listGenres(movies);
    expect(new Set(genres).size).toBe(genres.length);
    expect(genres).toEqual([...genres].sort((a, b) => a.localeCompare(b)));
  });
});

describe("getMovieById", () => {
  it("finds a movie and misses unknown ids", () => {
    expect(getMovieById(movies, "robot-kampung")?.title).toBe("Robot Kampung");
    expect(getMovieById(movies, "no-such-movie")).toBeUndefined();
  });
});

describe("featuredMovies", () => {
  it("returns now showing movies only, capped by count", () => {
    const featured = featuredMovies(movies, 3);
    expect(featured).toHaveLength(3);
    expect(featured.every((movie) => movie.status === "now_showing")).toBe(true);
  });
});
