import type { Movie } from "@/types";

// Local posters in /public/posters (no hotlinks).
// trailerUrl ids are dummy placeholders; swap for real trailers later.
const TRAILER = "https://www.youtube.com/embed/M7lc1UVf-VE";

export const movies: Movie[] = [
  {
    id: "langit-kedua",
    title: "Langit Kedua",
    posterUrl: "/posters/langit-kedua.svg",
    genres: ["Drama", "Petualangan"],
    durationMin: 128,
    rating: "SU",
    synopsis:
      "Seorang pendaki muda kembali ke kampung halaman untuk menyelesaikan pendakian yang gagal lima tahun lalu, dan menemukan alasan baru untuk pulang.",
    trailerUrl: TRAILER,
    status: "now_showing",
  },
  {
    id: "rembulan-terakhir",
    title: "Rembulan Terakhir",
    posterUrl: "/posters/rembulan-terakhir.svg",
    genres: ["Sci-Fi", "Action"],
    durationMin: 141,
    rating: "13+",
    synopsis:
      "Saat stasiun luar angkasa terakhir kehilangan orbitnya, sekelompok teknisi bertaruh nyawa untuk memindahkan ribuan penumpang ke Bumi.",
    trailerUrl: TRAILER,
    status: "now_showing",
  },
  {
    id: "kopi-pahit-jakarta",
    title: "Kopi Pahit Jakarta",
    posterUrl: "/posters/kopi-pahit-jakarta.svg",
    genres: ["Drama", "Romansa"],
    durationMin: 112,
    rating: "13+",
    synopsis:
      "Dua barista bersaing membuka kedai kopi di gang yang sama, lalu belajar bahwa resep terbaik lahir dari kerja sama, bukan persaingan.",
    trailerUrl: TRAILER,
    status: "now_showing",
  },
  {
    id: "hantu-lantai-tujuh",
    title: "Hantu Lantai Tujuh",
    posterUrl: "/posters/hantu-lantai-tujuh.svg",
    genres: ["Horor", "Thriller"],
    durationMin: 99,
    rating: "17+",
    synopsis:
      "Seorang petugas keamanan gedung kantor mulai menerima laporan dari lantai yang secara resmi tidak pernah dibangun.",
    trailerUrl: TRAILER,
    status: "now_showing",
  },
  {
    id: "bintang-jatuh-di-bali",
    title: "Bintang Jatuh di Bali",
    posterUrl: "/posters/bintang-jatuh-di-bali.svg",
    genres: ["Romansa", "Drama"],
    durationMin: 118,
    rating: "13+",
    synopsis:
      "Dua orang asing bertemu saat hujan meteor di Uluwatu dan sepakat bertemu lagi pada malam yang sama tahun depan.",
    trailerUrl: TRAILER,
    status: "coming_soon",
  },
  {
    id: "robot-kampung",
    title: "Robot Kampung",
    posterUrl: "/posters/robot-kampung.svg",
    genres: ["Animasi", "Keluarga"],
    durationMin: 96,
    rating: "SU",
    synopsis:
      "Robot raksasa pensiunan dari pabrik tua ikut lomba panjat pinang dan mengubah cara satu kampung memandang tetangganya.",
    trailerUrl: TRAILER,
    status: "coming_soon",
  },
  {
    id: "zaman-besi-nusantara",
    title: "Zaman Besi Nusantara",
    posterUrl: "/posters/zaman-besi-nusantara.svg",
    genres: ["Action", "Sejarah"],
    durationMin: 150,
    rating: "13+",
    synopsis:
      "Sepuluh tahun setelah perang besar, seorang pandai besi dipaksa angkat senjata untuk melindungi desa pesisir yang ia tinggalkan.",
    trailerUrl: TRAILER,
    status: "coming_soon",
  },
  {
    id: "senyum-terakhir-kakek",
    title: "Senyum Terakhir Kakek",
    posterUrl: "/posters/senyum-terakhir-kakek.svg",
    genres: ["Drama", "Keluarga"],
    durationMin: 105,
    rating: "SU",
    synopsis:
      "Tiga cucu menghabiskan satu musim liburan terakhir bersama kakek mereka di rumah pertanian, tanpa tahu musim itu akan jadi yang terakhir.",
    trailerUrl: TRAILER,
    status: "coming_soon",
  },
];
