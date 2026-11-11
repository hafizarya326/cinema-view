# Cinema View — See Your Seat Before You Book

Website pemesanan tiket bioskop dengan pemilihan kursi interaktif dan preview 3D dari sudut pandang kursi. Fitur utama: kamera 3D pindah ke posisi mata penonton di kursi yang dipilih.

## Stack
Next.js (App Router) + React + TypeScript (strict) + Tailwind CSS
Three.js + @react-three/fiber + @react-three/drei
Zustand (state), Vitest + React Testing Library (test)
Tidak ada backend. Semua data dummy/mock. Tanpa auth, payment, admin.

## Aturan kerja
- Kerjakan HANYA fase yang diminta di prompt. Jangan membangun fitur fase lain.
- Semua angka geometri HANYA boleh berasal dari `src/lib/studio/config.ts`. Dilarang hardcode angka geometri di komponen.
- Semua fungsi perhitungan harus pure function dan punya unit test.
- Scene 3D di-lazy-load (next/dynamic, ssr: false). Seat 3D pakai InstancedMesh.
- Jangan install library baru tanpa bilang dulu.
- Setelah selesai tiap tugas: jalankan `npm run lint`, `npm run test`, `npm run build` dan laporkan hasilnya.
- Bahasa UI: Bahasa Indonesia. Kode, nama variabel, komentar: Inggris.

## Sistem koordinat (meter)
- Sumbu X: kiri(-) ke kanan(+), 0 = tengah studio.
- Sumbu Y: ke atas, 0 = lantai baris terdepan.
- Sumbu Z: layar di z = 0, penonton di z positif (makin besar = makin jauh dari layar).
- Kamera menghadap ke arah -Z (ke layar).

## Spesifikasi studio (MVP)
Semua nilai ini hidup di `src/lib/studio/config.ts`:

| Parameter | Nilai |
|---|---|
| Lebar layar | 12.0 m |
| Tinggi layar | 5.0 m |
| Tepi bawah layar (y) | 1.5 m (pusat layar y = 4.0 m) |
| Jumlah baris | 10 (A sampai J, A paling depan) |
| Kursi per baris | 14 |
| Jarak antar kursi (pitch) | 0.55 m |
| Jarak layar ke baris A (z) | 4.0 m |
| Jarak antar baris | 1.1 m |
| Kenaikan lantai per baris (rake) | 0.25 m |
| Tinggi mata dari lantai | 1.15 m |
| FOV kamera | 60 derajat |

Rumus posisi kursi (row index i mulai 0, seat number n mulai 1, N = kursi per baris):
- x = (n - (N + 1) / 2) * pitch
- z = firstRowZ + i * rowSpacing
- floorY = i * rake
- eyeY = floorY + eyeHeight
- Posisi kamera = (x, eyeY, z). Target kamera = (0, screenCenterY, 0) sebagai arah awal.

## Rumus viewing info
Semua di `src/lib/studio/viewing.ts`. Sudut dalam derajat.
- distanceToScreen = jarak 3D dari mata (x, eyeY, z) ke pusat layar (0, 4.0, 0).
- horizontalFov = atan((W/2 - x) / z) + atan((W/2 + x) / z)
- verticalFov = atan((top - eyeY) / z) - atan((bottom - eyeY) / z), top = 6.5, bottom = 1.5
- neckTilt = atan((screenCenterY - eyeY) / z) (sudut dongak ke pusat layar)
- azimuth = atan(x / z) (sudut geser kiri-kanan dari tengah)

Screen visibility score (0 sampai 100):
- fovScore: 1 jika horizontalFov di 30 sampai 50; turun linear ke 0 di 15 dan di 80.
- tiltScore: 1 jika neckTilt <= 15; turun linear ke 0 di 40.
- offsetScore: 1 jika |azimuth| <= 10; turun linear ke 0 di 45.
- score = round(100 * (0.5 * fovScore + 0.3 * tiltScore + 0.2 * offsetScore))
- Label: >= 80 Excellent, 60 sampai 79 Good, 40 sampai 59 Fair, di bawah 40 Poor.

## Kategori dan harga kursi (berdasarkan baris)
| Baris | Kategori | Harga |
|---|---|---|
| A sampai C | Front | Rp40.000 |
| D sampai F | Standard | Rp50.000 |
| G sampai J | Premium | Rp65.000 |

## Data model (TypeScript, di src/types)

  type SeatStatus = "available" | "selected" | "occupied" | "unavailable";
  type SeatCategory = "front" | "standard" | "premium";

  interface Seat {
    id: string;            // contoh: "F7"
    row: string;           // "A" sampai "J"
    number: number;        // 1 sampai 14
    x: number; y: number; z: number; // posisi MATA di meter
    category: SeatCategory;
    price: number;
    status: SeatStatus;    // status dasar; "selected" dihitung dari store
  }

  interface ViewingInfo {
    distance: number; horizontalFov: number; verticalFov: number;
    neckTilt: number; azimuth: number;
    visibilityScore: number;
    visibilityLabel: "Excellent" | "Good" | "Fair" | "Poor";
  }

  interface Movie {
    id: string; title: string; posterUrl: string; genres: string[];
    durationMin: number; rating: string; synopsis: string;
    trailerUrl: string; status: "now_showing" | "coming_soon";
  }

  interface Showtime {
    id: string; movieId: string; date: string; // YYYY-MM-DD
    time: string; // HH:mm
    cinema: string; studio: string;
  }

## Aturan interaksi
- Maksimal 6 kursi per pesanan.
- Pilih banyak kursi: kamera mengikuti active seat (kursi yang terakhir diklik). Kursi terpilih tampil sebagai chip; klik chip untuk pindah active seat.
- Kursi occupied di-seed deterministik dari showtime.id (bukan Math.random langsung), supaya konsisten saat refresh.
- Transisi kamera 1.2 detik, easing easeInOutCubic.
- Rotasi manual dibatasi: yaw +-70 derajat, pitch -30 sampai +30 derajat dari arah default.
- Mobile: drag satu jari untuk rotasi. Tidak ada gyroscope.
- State booking disimpan di sessionStorage lewat Zustand persist.

## Design tokens
- Background #0A0A0B, surface #141416, border #26262B
- Teks #F5F5F7, teks redup #9A9AA3
- Aksen (cinema red) #E50914
- Kursi: available #3F3F46 (abu), selected #22C55E, occupied #7F1D1D, unavailable #27272A dengan pola garis
- Font: Inter. Card: rounded-2xl. Mobile-first.

## Struktur folder
src/app/ (halaman: /, /movies, /movies/[id], /booking/[id], /booking/preview, /checkout)
src/components/ui/, movie/, booking/, seatmap/, preview3d/
src/lib/studio/ (config.ts, seats.ts, viewing.ts, camera.ts)
src/store/ (bookingStore.ts)
src/data/ (movies.ts, showtimes.ts)
src/types/

## Target performa
60 fps di desktop, minimal 30 fps di mobile menengah. Fallback 2D jika WebGL tidak tersedia. Tampilkan loading indicator saat scene dimuat.

## Out of scope

Auth, pembayaran nyata, admin panel, database (Supabase = fase berikutnya), gyroscope, multi-bioskop.