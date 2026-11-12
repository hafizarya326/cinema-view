import type { Metadata } from "next";
import MovieCatalog from "@/components/movie/MovieCatalog";
import { movies } from "@/data/movies";

export const metadata: Metadata = {
  title: "Film — Cinema View",
  description: "Jelajahi film yang sedang tayang dan segera tayang di Cinema View.",
};

export default function MoviesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Film</h1>
      <MovieCatalog movies={movies} />
    </div>
  );
}
