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

- **Frontend:** Svelte 5 (runes), Vite 8, TypeScript strict + `noUncheckedIndexedAccess`,
  Tailwind CSS v4 (CSS-first via `@theme`), shadcn-svelte (bits-ui) untuk UI,
  `@lucide/svelte` untuk ikon, `svelte-sonner` untuk toast.
- **Backend:** Supabase (PostgreSQL + Realtime) diakses langsung dari browser via
  anon key — menggunakan `@supabase/postgrest-js` + `@supabase/realtime-js`
  (BUKAN `@supabase/supabase-js`).
- **Validasi:** Valibot (`src/lib/schemas.ts`) — schema inference + runtime validation.
- **Kualitas:** svelte-check 0 error/0 warning, Biome lint+format (`.ts/.js/.json`),
  Vitest untuk logika murni, Husky + lint-staged pre-commit.
- **Deploy:** Vercel dengan SPA rewrite (`vercel.json`).
- **Bahasa:** Indonesia untuk UI, komentar, dan nama variabel.
- **Keamanan (terdokumentasi, jangan disembunyikan):** password plaintext, session
  localStorage forgeable, join `users(*)` di halaman publik. Lihat `capabilities` dan
  `contracts` terkait.
- **Nomor antrian:** count-then-insert non-atomic — duplikat mungkin saat konkurensi.

## Conventions

- Komponen `.svelte` (Svelte 5 runes: `$state`, `$derived`, `$props`, `$effect`),
  TypeScript `lang="ts"`.
- Alias `$lib` → `src/lib` (vite + tsconfig); `@` → `src` (vite only).
- Styling: Tailwind utility classes + tokens tema shadcn (`bg-background`,
  `text-foreground`, dll. dari `src/app.css`).
- UI: shadcn-svelte di `src/lib/components/ui/`. Modal pakai `Dialog`/`AlertDialog`,
  toast `svelte-sonner`, ikon `@lucide/svelte/icons`. DILARANG reintroduce SweetAlert.
- Validasi: Valibot schema di `src/lib/schemas.ts`, divalidasi di boundary
  (respons Supabase, session localStorage).
- State/data: runes + `onMount` + panggilan `PostgrestClient` langsung. Tanpa state
  manager, tanpa library data-fetching.
- Router: custom path-based di `App.svelte` (`resolveTarget` + `navigate()`),
  bukan SvelteKit.
- Tanggal: `Intl.DateTimeFormat` locale `id-ID`. Kolom `tanggal` disimpan sebagai
  string ISO UTC `YYYY-MM-DD` via `todayIso()`.

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
