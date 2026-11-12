# Cinema View — See Your Seat Before You Book

Website pemesanan tiket bioskop dengan pemilihan kursi interaktif dan preview 3D dari sudut pandang kursi. Fitur utamanya: kamera 3D pindah ke posisi mata penonton di kursi yang dipilih, jadi kamu bisa melihat pemandangan dari kursimu sebelum memesan.

Semua data bersifat mock: tidak ada backend, autentikasi, pembayaran, atau admin panel. Booking disimpan di `localStorage` sebagai tiruan.

## Stack

- Next.js (App Router) + React + TypeScript (strict)
- Tailwind CSS v4 (token desain di `src/app/globals.css`)
- Three.js + `@react-three/fiber` + `@react-three/drei`
- Zustand (state + persist `sessionStorage`)
- Vitest + React Testing Library

## Cara menjalankan

```bash
npm install      # pasang dependency
npm run dev      # dev server (http://localhost:3000)
npm run test     # jalankan unit test (vitest run)
npm run lint     # eslint
npm run build    # build produksi
npm run start    # jalankan hasil build
```

## Struktur folder

```
src/
  app/                     # route: /, /movies, /movies/[id], /booking/[id],
                           #        /booking/preview, /checkout
  components/
    ui/                    # Navbar, Footer
    movie/                 # katalog + kartu film + input pencarian
    booking/               # panel kursi terpilih, panel viewing info, checkout
    seatmap/               # peta kursi 2D (roving tabindex + tooltip)
    preview3d/             # Canvas 3D, kamera, error boundary scene
  data/                    # movies.ts, showtimes.ts (data mock)
  lib/
    studio/                # config.ts, seats.ts, viewing.ts, camera.ts, scene.ts
    booking.ts             # format harga/angka, label kursi
    bookings.ts            # mock booking storage + applyBookedSeats
    movies.ts, showtimes.ts
  store/                   # bookingStore.ts (Zustand + persist)
  types/                   # tipe bersama
```

## Fitur MVP

- Katalog film dengan pencarian judul dan filter genre.
- Detail film: poster, sinopsis, trailer, tombol booking.
- Pilih tanggal dan jam tayang (jadwal dibuat 7 hari ke depan).
- Peta kursi 2D: status available/selected/occupied/unavailable, tooltip kategori + harga + label visibilitas, navigasi keyboard (panah, Home/End, Enter/Space).
- Preview 3D studio dengan `InstancedMesh` 140 kursi, mode Overview (orbit) dan Seat View (kamera di posisi mata kursi, look-around lewat drag atau tombol panah; batas yaw ±70° dan pitch −30°..+30°). Fallback peta kursi 2D jika WebGL tidak tersedia atau scene gagal.
- Panel info pandangan: jarak ke layar, FOV horizontal/vertikal, neck tilt, skor visibilitas 0–100 beserta label.
- Maksimal 6 kursi per pesanan; kursi terisi di-seed deterministik dari id jadwal.
- Checkout: ringkasan pesanan, validasi ulang ketersediaan kursi, kode booking `CV-XXXXXX`, lalu kursi yang dikonfirmasi tampil terisi di peta kursi dan scene 3D.
- Responsif mobile-first, UI Bahasa Indonesia.

## Spesifikasi studio

Semua angka geometri hidup di [`src/lib/studio/config.ts`](src/lib/studio/config.ts) — komponen tidak boleh meng-hardcode angka geometri.

| Parameter | Nilai |
|---|---|
| Lebar layar | 12.0 m |
| Tinggi layar | 5.0 m |
| Tepi bawah layar (y) | 1.5 m (pusat layar y = 4.0 m) |
| Jumlah baris | 10 (A–J, A paling depan) |
| Kursi per baris | 14 |
| Jarak antar kursi (pitch) | 0.55 m |
| Jarak layar ke baris A (z) | 4.0 m |
| Jarak antar baris | 1.1 m |
| Kenaikan lantai per baris (rake) | 0.25 m |
| Tinggi mata dari lantai | 1.15 m |
| FOV kamera | 60° |

Posisi kursi (row index `i` dari 0, nomor kursi `n` dari 1, `N` = kursi per baris):

- `x = (n - (N + 1) / 2) * SEAT_PITCH`
- `z = FIRST_ROW_Z + i * ROW_SPACING`
- `floorY = i * RAKE`, `eyeY = floorY + EYE_HEIGHT`
- Posisi kamera = `(x, eyeY, z)`, target awal = pusat layar `(0, SCREEN_CENTER_Y, 0)`

Sistem koordinat: sumbu X kiri(−) ke kanan(+), sumbu Y ke atas (0 = lantai baris terdepan), sumbu Z layar di 0 dan penonton di Z positif. Kamera menghadap ke −Z.

Perhitungan sudut dan skor visibilitas (`ViewingInfo`) ada di [`src/lib/studio/viewing.ts`](src/lib/studio/viewing.ts); pose kamera, easing, dan batas look-around ada di [`src/lib/studio/camera.ts`](src/lib/studio/camera.ts). Setiap fungsi perhitungan murni punya unit test.
