"use client";

import { useState } from "react";
import MovieCard from "@/components/movie/MovieCard";
import SearchInput from "@/components/movie/SearchInput";
import { filterByGenre, listGenres, searchMovies } from "@/lib/movies";
import type { Movie } from "@/types";

export default function MovieCatalog({ movies }: { movies: Movie[] }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");

  const genres = listGenres(movies);
  const results = filterByGenre(searchMovies(movies, query), genre);

  const chipClass = (active: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border px-4 text-xs transition-colors ${
      active
        ? "border-accent bg-accent text-foreground"
        : "border-border bg-surface text-muted hover:text-foreground"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <SearchInput value={query} onChange={setQuery} placeholder="Cari judul film..." />

      <div className="flex flex-wrap gap-2">
        <button type="button" className={chipClass(genre === "all")} onClick={() => setGenre("all")}>
          Semua genre
        </button>
        {genres.map((item) => (
          <button
            key={item}
            type="button"
            className={chipClass(genre === item)}
            onClick={() => setGenre(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-muted">Tidak ada film yang cocok.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
