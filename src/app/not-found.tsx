import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-sm text-muted">Film atau halaman yang kamu cari tidak tersedia.</p>
      <Link
        href="/movies"
        className="rounded-2xl bg-accent px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Lihat daftar film
      </Link>
    </div>
  );
}
