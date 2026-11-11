import MovieCatalog from "@/components/movie/MovieCatalog";
import { movies } from "@/data/movies";

export default function MoviesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Film</h1>
      <MovieCatalog movies={movies} />
    </div>
  );
}
