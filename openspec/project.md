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

- Backend server terpisah. SPA + API di SATU Cloudflare Worker.
- Supabase. Telah dimigrasi ke Cloudflare D1 + Durable Objects.
- Print struk. Belum terimplementasi — popup hanya placeholder.
- CI. Tidak ada workflow GitHub Actions.
- Deploy ke Cloudflare. Kode siap, deploy butuh `wrangler login` + langkah di README.

## Constraints

- **Frontend:** Svelte 5 (runes), Vite 8, TypeScript strict + `noUncheckedIndexedAccess`,
  Tailwind CSS v4 (CSS-first via `@theme`), shadcn-svelte (bits-ui) untuk UI,
  `@lucide/svelte` untuk ikon, `svelte-sonner` untuk toast.
- **Backend:** Cloudflare Workers (Hono) + D1 (SQLite) + Durable Objects (realtime hub).
  Semua akses DB server-side via binding; browser tidak menyentuh DB.
- **Validasi:** Valibot (`src/lib/schemas.ts`, `worker/src/routes/*`) — schema
  inference + runtime validation di boundary (request body di Worker, respons di client).
- **Kualitas:** svelte-check 0 error/0 warning + `tsc -p tsconfig.worker.json`,
  Biome lint+format (`.ts/.js/.json`), Vitest, Husky + lint-staged pre-commit.
- **Deploy:** `wrangler deploy` (config `wrangler.jsonc` — assets dist/ + API).
- **Bahasa:** Indonesia untuk UI, komentar, dan nama variabel.
- **Keamanan:** password PBKDF2 server-side, session cookie httpOnly HMAC-signed,
  DB hanya diakses Worker. Jangan turunkan level ini tanpa persetujuan.
- **Nomor antrian:** insert atomik single-statement di Worker — race-safe.

## Conventions

- Komponen `.svelte` (Svelte 5 runes: `$state`, `$derived`, `$props`, `$effect`),
  TypeScript `lang="ts"`.
- Alias `$lib` → `src/lib` (vite + tsconfig); `@` → `src` (vite only).
- Styling: Tailwind utility classes + tokens tema shadcn (`bg-background`,
  `text-foreground`, dll. dari `src/app.css`).
- UI: shadcn-svelte di `src/lib/components/ui/`. Modal pakai `Dialog`/`AlertDialog`,
  toast `svelte-sonner`, ikon `@lucide/svelte/icons`. DILARANG reintroduce SweetAlert.
- Worker: Hono + TypeScript strict, route per-domain di `worker/src/routes/`,
  validasi body dengan Valibot.
- State/data: runes + `onMount` + `api.get/post/put/delete` (`$lib/api.ts`). Tanpa
  state manager, tanpa library data-fetching.
- Realtime: `subscribeAntrian(cb)` (`$lib/realtime.ts`) — WebSocket ke Durable Object.
- Router: custom path-based di `App.svelte` (`resolveTarget` + `navigate()`),
  bukan SvelteKit.
- Tanggal: `Intl.DateTimeFormat` locale `id-ID`. Kolom `tanggal` disimpan sebagai
  string ISO UTC `YYYY-MM-DD` via `todayIso()` (`worker/src/queue.ts`).

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
