import { notFound } from "next/navigation";
import { connection } from "next/server";
import BookingClient from "@/components/booking/BookingClient";
import { movies } from "@/data/movies";
import { getUpcomingShowtimes } from "@/data/showtimes";
import { getMovieById } from "@/lib/movies";
import { CINEMA_NAME, STUDIO_NAME } from "@/lib/showtimes";

export const instant = false;

export default async function BookingPage({ params }: PageProps<"/booking/[id]">) {
  // Schedule is relative to today, so this route renders per request.
  await connection();

  const { id } = await params;
  const movie = getMovieById(movies, id);

  if (!movie) notFound();

  const { dateKeys, showtimes } = getUpcomingShowtimes();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{movie.title}</h1>
        <p className="text-sm text-muted">
          {movie.genres.join(" · ")} · {movie.durationMin} menit · {movie.rating}
        </p>
        <p className="text-sm text-muted">Pilih jadwal tayang, lalu lanjut ke pemilihan kursi.</p>
      </div>

      <BookingClient
        movie={movie}
        dateKeys={dateKeys}
        showtimes={showtimes}
        cinema={CINEMA_NAME}
        studio={STUDIO_NAME}
      />
    </div>
  );
}
