import Image from "next/image";
import Link from "next/link";
import type { Movie } from "@/types";

export default function MovieCard({
  movie,
  headingLevel = "h3",
}: {
  movie: Movie;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-accent"
    >
      <Image
        src={movie.posterUrl}
        alt={`Poster ${movie.title}`}
        width={300}
        height={450}
        unoptimized
        className="aspect-2/3 w-full rounded-xl object-cover"
      />
      <div className="flex flex-col gap-1">
        <Heading className="font-medium leading-tight group-hover:text-accent-text">
          {movie.title}
        </Heading>
        <p className="text-xs text-muted">{movie.genres.join(" · ")}</p>
        <p className="text-xs text-muted">
          {movie.durationMin} menit · {movie.rating}
        </p>
      </div>
    </Link>
  );
}
