import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { movies } from "@/data/movies";
import { getMovieById } from "@/lib/movies";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/movies/[id]">): Promise<Metadata> {
  const { id } = await params;
  const movie = getMovieById(movies, id);

  if (!movie) return { title: "Film tidak ditemukan — Cinema View" };

  return {
    title: `${movie.title} — Cinema View`,
    description: movie.synopsis,
  };
}

export default async function MovieDetailPage({ params }: PageProps<"/movies/[id]">) {
  const { id } = await params;
  const movie = getMovieById(movies, id);

  if (!movie) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/movies"
        className="inline-flex min-h-10 items-center text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Kembali ke daftar film
      </Link>

      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <Image
          src={movie.posterUrl}
          alt={`Poster ${movie.title}`}
          width={300}
          height={450}
          unoptimized
          className="aspect-2/3 w-full max-w-[300px] rounded-2xl border border-border object-cover"
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold">{movie.title}</h1>
            <p className="text-sm text-muted">{movie.genres.join(" · ")}</p>
            <p className="text-sm text-muted">
              {movie.durationMin} menit · Rating {movie.rating} ·{" "}
              {movie.status === "now_showing" ? "Sedang tayang" : "Segera tayang"}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-muted">{movie.synopsis}</p>

          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-surface">
            <iframe
              src={movie.trailerUrl}
              title={`Trailer ${movie.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="size-full"
            />
          </div>

          <Link
            href={`/booking/${movie.id}`}
            className="w-full rounded-2xl bg-accent px-5 py-3 text-center text-sm font-medium transition-opacity hover:opacity-90 sm:w-fit sm:px-10"
          >
            Booking
          </Link>
        </div>
      </div>
    </div>
  );
}
