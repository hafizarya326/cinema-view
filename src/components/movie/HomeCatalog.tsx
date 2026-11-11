"use client";

import { useState } from "react";
import MovieCard from "@/components/movie/MovieCard";
import SearchInput from "@/components/movie/SearchInput";
import { featuredMovies, filterByStatus, searchMovies } from "@/lib/movies";
import type { Movie } from "@/types";

function Section({ title, movies }: { title: string; movies: Movie[] }) {
  if (movies.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}

export default function HomeCatalog({ movies }: { movies: Movie[] }) {
  const [query, setQuery] = useState("");
  const results = searchMovies(movies, query);

  return (
    <div className="flex flex-col gap-10">
      <SearchInput value={query} onChange={setQuery} placeholder="Cari film di Cinema View..." />

      {query.trim() ? (
        <Section title={`Hasil pencarian (${results.length})`} movies={results} />
      ) : (
        <>
          <Section title="Featured" movies={featuredMovies(movies, 3)} />
          <Section title="Now Showing" movies={filterByStatus(movies, "now_showing")} />
          <Section title="Coming Soon" movies={filterByStatus(movies, "coming_soon")} />
        </>
      )}
    </div>
  );
}
