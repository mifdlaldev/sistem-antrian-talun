<p align="center">
  <img src="public/logoinsunmedal.png" alt="Logo Kelurahan Talun" width="110" />
</p>

<h1 align="center">Sistem Antrian Digital Kelurahan Talun</h1>

<p align="center">
  <a href="https://github.com/mifdlaldev/website-antrian-kelurahan-talun/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mifdlaldev/website-antrian-kelurahan-talun" alt="License" /></a>
  <img src="https://img.shields.io/badge/Svelte-5-FF3E00" alt="Svelte 5" />
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020" alt="Cloudflare Workers" />
  <img src="https://img.shields.io/badge/Database-D1-F38020" alt="Cloudflare D1" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6" alt="TypeScript" />
</p>

<p align="center">
  <em>Aplikasi pengambilan nomor antrian digital untuk pelayanan publik di <strong>Kantor Kelurahan Talun, Kecamatan Sumedang Utara, Kabupaten Sumedang, Jawa Barat</strong>.</em>
</p>

## Tentang

Sistem Antrian Digital menggantikan pengambilan antrian manual (kertas) yang rentan
salah urut dan menyulitkan pemantauan. Melalui aplikasi ini, warga mengambil nomor
antrian sendiri dari **kiosk layar sentuh**, petugas memanggil nomor dari panel loket,
dan nomor yang sedang dilayani tampil **real-time** di monitor ruang tunggu.

Arsitektur dirancang ringan dan aman: SPA Svelte 5 + API Hono yang berjalan dalam satu
[Cloudflare Worker](https://workers.cloudflare.com) dengan database [D1](https://developers.cloudflare.com/d1/)
(SQLite) dan real-time via **Durable Objects**. Semua akses database hanya terjadi di
sisi server.

> **Status**: Berjalan di Cloudflare Workers. URL live:
> [website-antrian-kelurahan-talun.mifdlaltsaqibalf25.workers.dev](https://website-antrian-kelurahan-talun.mifdlaltsaqibalf25.workers.dev)

## Fitur

### Halaman Publik (Warga)
- **Kiosk** (`/`) — pilih layanan dan ambil nomor antrian otomatis (format `A-001`)
  dalam ≤3 langkah, target sentuh besar, ramah pengguna lansia
- **Monitor Display** (`/monitor`) — papan antrian real-time: nomor dilayani, 5 antrian
  berikutnya, jam digital, running text; update instan tanpa refresh manual
- Responsif di ponsel, tablet, hingga layar TV

### Dashboard Admin
- Login dengan sesi aman (cookie `HttpOnly`, password ter-hash)
- Statistik harian + tren 7 hari + distribusi antrian per layanan (grafik SVG ringan)
- Kelola layanan (tambah, ubah, hapus)
- Kelola akun petugas (tambah, ubah, hapus, penugasan layanan)

### Dashboard Petugas
- Panel panggilan antrian satu tombol (FIFO)
- Filter otomatis per layanan untuk petugas spesialis
- Rekap sisa antrian dan total selesai hari ini

## Keamanan

- **Semua akses database lewat API Worker** — browser tidak pernah memegang kredensial
  database.
- Password di-hash dengan **PBKDF2-SHA256** (salt acak per akun), tidak pernah disimpan
  mentah.
- Sesi login menggunakan **cookie `HttpOnly` + `SameSite=Lax` + `Secure`** — tidak bisa
  dibaca/diubah JavaScript (bukan localStorage).
- **Validasi input di sisi server** dengan [Valibot](https://valibot.dev) — klien tidak
  pernah dipercaya.
- SQL berparameter (prepared statements) — tahan injeksi.
- Nomor antrian dibuat dengan **insert atomik satu statement** — bebas duplikasi saat
  kiosk digunakan bersamaan.
- **Cooldown 60 detik per IP per layanan** — mencegah pengambilan nomor ganda
  beruntun (di samping cooldown perangkat di sisi klien).
- **Cloudflare Turnstile** pada kiosk — verifikasi anti-bot (siteverify server-side,
  action + hostname diperiksa, fail-closed 403).
- Tanggal antrian menggunakan **zona WIB** (`Asia/Jakarta`) — konsisten dengan jam
  operasional kantor.

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | [Svelte](https://svelte.dev) 5 (runes), [Vite](https://vite.dev) 8, TypeScript strict |
| Styling | [Tailwind CSS](https://tailwindcss.com) 4, [shadcn-svelte](https://shadcn-svelte.com) (bits-ui) |
| Routing | Custom SPA router (zero-dependency) |
| API | [Hono](https://hono.dev) di [Cloudflare Workers](https://workers.cloudflare.com) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| Realtime | [Durable Objects](https://developers.cloudflare.com/durable-objects/) (WebSocket hub) |
| Validasi | [Valibot](https://valibot.dev) (client + server) |
| Kualitas | Biome (lint/format), Vitest (unit test), Husky + lint-staged |

## Struktur Proyek

```
├── src/                      # Frontend Svelte 5 + TypeScript
│   ├── App.svelte            # Router SPA + guard role + Toaster
│   ├── lib/
│   │   ├── api.ts            # Klien API (fetch ke /api)
│   │   ├── realtime.ts       # subscribeAntrian() — WebSocket + auto-reconnect
│   │   ├── schemas.ts        # Skema Valibot bersama
│   │   ├── session.ts        # getCurrentUser/login/logout (cookie httpOnly)
│   │   ├── components/       # BarChart SVG + komponen UI (shadcn-svelte)
│   │   └── routes/           # Kiosk, Monitor, Login, AdminDashboard, PetugasDashboard
├── worker/                   # Cloudflare Worker (API)
│   ├── src/
│   │   ├── index.ts          # Entry Hono + SPA fallback
│   │   ├── auth.ts           # PBKDF2, sesi cookie HMAC, middleware role
│   │   ├── realtime.ts       # Durable Object hub (WebSocket + broadcast)
│   │   ├── queue.ts          # todayIso(), buildNomorAntrian()
│   │   └── routes/           # auth, layanan, antrian, users, stats
│   └── migrations/           # Skema SQL D1 (0001_init, 0002_seed)
├── docs/
│   └── API.md                # Dokumentasi endpoint API
├── openspec/                 # Spesifikasi sistem (capabilities + contracts)
└── wrangler.jsonc            # Konfigurasi Worker (D1 + DO + static assets)
```

Dokumentasi lengkap endpoint API: [docs/API.md](docs/API.md).

## Persyaratan

- Node.js 20+ dan npm
- Akun [Cloudflare](https://dash.cloudflare.com) dengan hak akses Workers + D1
  (untuk deploy; pengembangan lokal tidak membutuhkan akun)

## Instalasi Lokal

```bash
# 1. Clone repositori
git clone https://github.com/mifdlaldev/website-antrian-kelurahan-talun.git
cd website-antrian-kelurahan-talun

# 2. Install dependensi
npm install

# 3. Secret lokal (buat file .dev.vars di root — jangan di-commit)
#    SESSION_SECRET=secret_acak_yang_panjang

# 4. Terapkan migrasi database ke D1 lokal
npm run db:migrate:local

# 5. Jalankan full stack (Worker + D1 + DO + static assets)
npm run dev:worker
# Buka http://localhost:8787
```

Akun default hasil seed: `admin` / `admin123` (admin) dan `petugas1` / `petugas123`
(petugas). **Ganti segera sebelum digunakan secara publik.**

## Deployment

```bash
# 1. Login Cloudflare (buka browser, klik Allow)
npx wrangler login

# 2. Buat database D1, lalu isi database_id hasilnya ke wrangler.jsonc
npx wrangler d1 create website-antrian-kelurahan-talun

# 3. Set secret session
npx wrangler secret put SESSION_SECRET

# 4. Terapkan migrasi ke database remote
npm run db:migrate:remote

# 5. Build frontend + deploy Worker (static assets + API dalam satu Worker)
npm run deploy
```

## Kualitas

```bash
npm run check   # svelte-check (0 error/0 warning) + tsc (app + worker)
npm test        # unit test (Vitest)
npm run lint    # biome check
```

Bundle produksi: ~277 KB min / ~84 KB gzip (tanpa React, tanpa recharts, tanpa
SweetAlert).

## Lisensi

Dilisensikan di bawah [Apache License 2.0](LICENSE).

© 2026 Kantor Kelurahan Desa Talun.
