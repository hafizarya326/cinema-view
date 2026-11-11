import Link from "next/link";
import HomeCatalog from "@/components/movie/HomeCatalog";
import { movies } from "@/data/movies";
import { featuredMovies } from "@/lib/movies";

export default function HomePage() {
  const hero = featuredMovies(movies, 1)[0];

  return (
    <div className="flex flex-col gap-12">
      <section className="overflow-hidden rounded-2xl border border-border bg-linear-to-br from-[#1e3a8a] via-[#141416] to-[#7f1d1d] p-6 sm:p-10">
        <p className="text-xs uppercase tracking-widest text-muted">Sedang tayang</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{hero.title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">{hero.synopsis}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/booking/${hero.id}`}
            className="rounded-2xl bg-accent px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Pesan Tiket
          </Link>
          <Link
            href={`/movies/${hero.id}`}
            className="rounded-2xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Lihat Detail
          </Link>
        </div>
      </section>

      <HomeCatalog movies={movies} />
    </div>
  );
}
