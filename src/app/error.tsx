"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">Terjadi kesalahan</h1>
      <p className="text-sm text-muted">
        Halaman ini gagal dimuat. Coba lagi, atau kembali ke daftar film.
      </p>
      {error.digest ? <p className="text-xs text-muted">Kode: {error.digest}</p> : null}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-2xl bg-accent px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          Coba lagi
        </button>
        <Link
          href="/movies"
          className="rounded-2xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Daftar film
        </Link>
      </div>
    </div>
  );
}
