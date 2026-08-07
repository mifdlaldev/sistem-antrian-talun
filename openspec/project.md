# Project: Sistem Antrian Digital Kelurahan Desa Talun

## Description

Sistem antrian digital (digital queue) untuk Kantor Kelurahan Desa Talun, Kecamatan
Sumedang Utara, Kabupaten Sumedang. Proyek Ujikom SMKN 1 Sumedang 2026.

Pengunjung mengambil nomor antrian melalui kiosk, petugas memanggil antrian dari panel
loket, dan layar TV ruang tunggu menampilkan status antrian secara realtime.

## Mission & Goals

- Digitalisasi pengambilan nomor antrian di kantor kelurahan.
- Menampilkan nomor antrian realtime di layar TV tanpa refresh manual.
- Memungkinkan petugas memanggil antrian berikutnya (FIFO) dari panel loket.
- Memungkinkan admin mengelola layanan, akun petugas, dan melihat statistik.

## Scope

IN SCOPE:

- Kiosk publik (`/`) untuk mengambil nomor antrian.
- Monitor display TV (`/monitor`) realtime.
- Login username/password (`/login`).
- Dashboard petugas (`/petugas/dashboard`) untuk memanggil antrian.
- Dashboard admin (`/admin/dashboard`) — statistik, grafik, CRUD layanan & petugas.

OUT OF SCOPE / TIDAK ADA (jangan diklaim ada):

- Backend server. Frontend-only SPA — semua query Supabase dari browser.
- Supabase Auth. Tidak dipakai; session berbasis localStorage.
- Print struk. Belum terimplementasi — popup hanya placeholder.
- Tests dan CI. Tidak ada test runner, tidak ada workflow.
- Migrasi SQL. Skema hanya ada di dashboard Supabase, tidak di repo.
- Koneksi Supabase tidak dapat diverifikasi dari repo (butuh RLS di dashboard).

## Constraints

- **Frontend:** React 19, Vite 7, Tailwind CSS v4 (CSS-first via `@theme`), React Router 7.
- **Backend:** Supabase (PostgreSQL + Realtime) diakses langsung dari browser via anon key.
- **Deploy:** Vercel dengan SPA rewrite (`vercel.json`).
- **Bahasa:** Indonesia untuk UI, komentar, dan nama variabel.
- **Keamanan (terdokumentasi, jangan disembunyikan):** password plaintext, session
  localStorage forgeable, join `users(*)` di halaman publik, stored XSS di SweetAlert,
  `.env` pernah ter-commit. Lihat `capabilities` dan `contracts` terkait.
- **Nomor antrian:** count-then-insert non-atomic — duplikat mungkin saat konkurensi.

## Conventions

- Komponen `.jsx`, function component, default export.
- Styling: Tailwind utility classes inline. Beberapa class helper legacy di
  `src/index.css` (`.card`, `.btn-primary`, `.btn-danger`, `.btn-kiosk`,
  `.input-field`, `.layout-container`) — prefer utility classes untuk kode baru.
- Modal/toast: `sweetalert2` diimport sebagai `Swal`.
- Ikon: `lucide-react`.
- Tanggal: `date-fns` v4 dengan locale `id` untuk display; kolom `tanggal` disimpan
  sebagai string ISO UTC `YYYY-MM-DD`.
- State/data: `useState` + `useEffect` + panggilan Supabase langsung. Tanpa state
  manager, tanpa library data-fetching, tanpa TypeScript.

## Glossary

| Istilah | Arti |
|---|---|
| Kiosk | Halaman publik untuk mengambil nomor antrian |
| Monitor | Layar TV ruang tunggu (realtime display) |
| Antrian | Satu baris di tabel `antrian` (nomor + status) |
| Menunggu / Dilayani / Selesai | Nilai `status` antrian |
| Petugas general | Petugas dengan `id_layanan` null — melayani semua layanan |
| Petugas spesialis | Petugas dengan `id_layanan` terisi — hanya layanan itu |
| Struk | Bukti nomor antrian — komponen ada tapi BELUM ter-wire ke print |
