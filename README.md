# Sistem Antrian Digital Kelurahan Desa Talun

Aplikasi web pengambilan nomor antrian digital untuk Kantor Kelurahan Desa Talun.
Dibangun sebagai proyek **Ujikom SMKN 1 Sumedang 2026**.

- **Live:** [website-antrian-kelurahan-talun.vercel.app](https://website-antrian-kelurahan-talun.vercel.app)
- **Repository:** [mifdlaldev/website-antrian-kelurahan-talun](https://github.com/mifdlaldev/website-antrian-kelurahan-talun)

---

## Fitur

- **Kiosk Antrian** (`/`) — warga memilih layanan dan mengambil nomor antrian otomatis
  (format `A-001`, `B-002`, dst.)
- **Monitor Display TV** (`/monitor`) — layar ruang tunggu realtime: menampilkan nomor
  yang sedang dilayani, 5 antrian berikutnya, jam digital, dan running text, tanpa perlu
  refresh manual
- **Login Petugas/Admin** (`/login`) — masuk ke panel berdasarkan username & password
- **Dashboard Petugas** (`/petugas/dashboard`) — memanggil antrian berikutnya (FIFO),
  menyelesaikan antrian aktif, dengan filter layanan untuk petugas spesialis
- **Dashboard Admin** (`/admin/dashboard`) — statistik harian & tren 7 hari, grafik
  antrian per layanan, kelola layanan (CRUD), kelola akun petugas (CRUD)
- **Realtime** — semua perubahan antrian langsung ter-update di Monitor & dashboard
  petugas via Supabase Realtime (Postgres Changes)

## Teknologi

| Teknologi | Keterangan |
|---|---|
| Svelte 5 | UI framework (runes) — runtime ~1.6 KB |
| Vite 8 | Build tool & dev server |
| TypeScript | Strict mode + `noUncheckedIndexedAccess` |
| Tailwind CSS v4 | Styling (konfigurasi CSS-first via `@theme`) |
| shadcn-svelte | Komponen UI (dibangun di atas bits-ui / Melt UI) |
| Cloudflare Workers | Runtime API (Hono) + static assets, satu Worker |
| Hono | Framework API di Worker (routing, middleware) |
| D1 (SQLite) | Database — diakses hanya server-side via binding |
| Durable Objects | Realtime hub (WebSocket pub/sub) |
| Valibot | Validasi runtime + inferensi skema (client + worker) |
| Biome | Lint + format (Rust, sangat cepat) |
| Vitest | Unit tests |
| svelte-sonner | Toast notification |
| @lucide/svelte | Icon |
| Husky + lint-staged | Pre-commit hooks |

## Persyaratan

- Node.js (npm) — versi yang mendukung Vite 8
- Akun Cloudflare (untuk deploy; dev lokal tanpa akun)

## Cara Menjalankan

```bash
npm install            # install dependencies
npm run dev            # frontend saja (Vite dev server)
npm run dev:worker     # full stack: Worker + D1 + DO + assets (wrangler dev --local)
npm run db:migrate:local  # apply migrasi D1 ke database lokal
npm run build          # build produksi frontend (output: dist/)
npm run check          # type-check (svelte-check + tsc app + tsc worker)
npm test               # jalankan unit test (Vitest)
npm run lint           # biome check
npm run lint:fix       # biome check --write
npm run format         # biome format --write
```

## Quality Gates

Proyek ini menerapkan standar ketat ("sangat ringan, sangat ketat, sangat cepat"):

- **Type-check:** `svelte-check` (TS strict) + `tsc -p tsconfig.worker.json` — 0 error,
  0 warning.
- **Lint + format:** Biome (untuk `.ts/.js/.json`; `.svelte`/`.css` ditangani
  svelte-check/Tailwind).
- **Test:** Vitest untuk logika murni (`worker/src/queue.test.ts`, `src/lib/schemas.ts`).
- **Pre-commit:** Husky + lint-staged menjalankan `biome check --write` otomatis.
- **Bundle:** ~274 KB min / ~83 KB gzip JS.
- **Keamanan:** DB hanya diakses Worker, session cookie httpOnly HMAC-signed, password
  PBKDF2 (bukan plaintext).

## Konfigurasi Environment

Lokal: buat file `.dev.vars` di root (gitignored, sudah ada):

```
SESSION_SECRET=secret_acak_yang_panjang
```

Produksi: set sebagai secret Cloudflare:

```bash
npx wrangler secret put SESSION_SECRET
```

Tidak ada variabel `VITE_*` — frontend berkomunikasi dengan API same-origin (`/api/*`).

## Skema Database

> **Catatan:** tidak ada file migrasi SQL di repository ini. Skema di bawah ini
> disimpulkan (inferred) dari query Supabase di dalam source code. Untuk skema
> otoritatif, cek langsung di dashboard Supabase.

### Tabel `layanan`

| Kolom | Keterangan |
|---|---|
| `id_layanan` | PK, int |
| `nama_layanan` | text (misal: "Layanan KTP & KK") |
| `kode_huruf` | text, huruf tunggal (misal: "A") — prefix nomor antrian |
| `deskripsi` | text, opsional |

### Tabel `antrian`

| Kolom | Keterangan |
|---|---|
| `id_antrian` | PK, int (urutan FIFO) |
| `nomor_antrian` | text, format `KODE-001` |
| `id_layanan` | FK → `layanan.id_layanan` |
| `id_user` | FK → `users.id_user`, diisi petugas yang melayani |
| `status` | text: `menunggu` / `dilayani` / `selesai` |
| `tanggal` | date (`YYYY-MM-DD`) |
| `waktu_selesai` | timestamp, diisi saat status → `selesai` |

### Tabel `users`

| Kolom | Keterangan |
|---|---|
| `id_user` | PK, int |
| `username` | text, UNIQUE |
| `password_hash` | text — **PBKDF2-SHA256, bukan plaintext** |
| `nama_lengkap` | text |
| `role` | text: `admin` / `petugas` |
| `id_layanan` | FK → `layanan.id_layanan`, nullable; `null` = petugas umum (semua layanan) |

> Skema otoritatif ada di `worker/migrations/0001_init.sql` + `0002_seed.sql`.
> Seed: `admin`/`admin123`, `petugas1`/`petugas123` — **WAJIB diganti sebelum produksi**.

## Routing

| Path | Halaman |
|---|---|
| `/` | Kiosk (ambil antrian) — publik |
| `/monitor` | Monitor display TV — publik |
| `/login` | Login — publik |
| `/admin/dashboard` | Dashboard admin (role: `admin`) |
| `/petugas/dashboard` | Dashboard petugas (role: `petugas`) |
| `/dashboard` | Redirect ke `/login` |
| `*` | 404 |

## Struktur Proyek

```
├── openspec/            # Spesifikasi resmi proyek (dibaca AI agent agar tidak halusinasi)
│   ├── project.md       # Gambaran proyek, scope, constraints
│   └── spec/
│       ├── capabilities/   # queue-taking, queue-monitoring, queue-calling, authentication, admin-management
│       └── contracts/      # database-schema, session
├── worker/              # Cloudflare Worker (Hono + D1 + DO realtime)
│   ├── migrations/      #   Skema D1 (0001_init, 0002_seed)
│   └── src/             #   index.ts, auth.ts, realtime.ts, routes/
├── public/
│   ├── logoinsunmedal.png
│   └── kantorlurahtalun.jpg
└── src/
    ├── main.ts              # Entry point
    ├── App.svelte           # SPA router custom + guard role + Toaster
    ├── app.css              # Tailwind v4 + tokens tema shadcn
    ├── lib/
    │   ├── api.ts               # Fetch wrapper (GET/POST/PUT/DELETE)
    │   ├── realtime.ts          # subscribeAntrian() — WebSocket + auto-reconnect
    │   ├── schemas.ts           # Skema Valibot (layanan, antrian, users)
    │   ├── session.ts           # getCurrentUser/login/logout (cookie httpOnly)
    │   ├── router.ts            # navigate() (pushState + popstate)
    │   ├── components/
    │   │   ├── BarChart.svelte  # Chart SVG zero-dependency
    │   │   └── ui/              # Komponen shadcn-svelte (button, card, dialog, dll)
    │   └── routes/
    │       ├── Kiosk.svelte
    │       ├── Monitor.svelte
    │       ├── Login.svelte
    │       ├── AdminDashboard.svelte
    │       └── PetugasDashboard.svelte
```

## Dokumentasi Spesifikasi (OpenSpec)

Direktori [`openspec/`](openspec/) berisi spesifikasi resmi sistem yang sedang berjalan
saat ini — ditulis agar AI agent (dan manusia) tidak berhalusinasi:

- `openspec/project.md` — gambaran proyek, scope, constraints, konvensi
- `openspec/spec/capabilities/` — kemampuan sistem: pengambilan antrian, monitoring,
  pemanggilan, autentikasi, manajemen admin
- `openspec/spec/contracts/` — kontrak data: skema database (inferred) dan session

Setiap fakta di sana terverifikasi dari source code. Skema database bersumber dari
migrasi D1 (`worker/migrations/`).

## Deployment (Cloudflare Workers)

Frontend (dist/) dan API (Worker) di-deploy menjadi **satu Worker** via `wrangler deploy`
— config ada di `wrangler.jsonc` (D1 + Durable Objects + static assets).

Langkah deploy pertama (butuh akun Cloudflare):

```bash
npx wrangler login                          # login ke akun Cloudflare
npx wrangler d1 create website-antrian-kelurahan-talun   # buat database D1
# salin database_id hasil di atas ke wrangler.jsonc (ganti placeholder all-zero)
npx wrangler secret put SESSION_SECRET      # secret untuk menandatangani cookie
npx wrangler d1 migrations apply website-antrian-kelurahan-talun --remote  # migrasi + seed
npm run deploy                              # build frontend + wrangler deploy
```

Setelah deploy: ganti password default seed (`admin`/`admin123`,
`petugas1`/`petugas123`) via dashboard admin, dan set custom domain jika perlu.

## Status & Batasan yang Diketahui

- **Belum ada CI/CD configuration** di repository (kualitas dicek via script lokal:
  `npm run check`, `npm test`, `npm run lint`).
- **Belum di-deploy ke Cloudflare** — butuh `wrangler login` + langkah deploy di atas.
- **Realtime** (Durable Object WebSocket) teruji lokal (`wrangler dev`), belum teruji di
  edge.
- **Print struk belum berfungsi** — Kiosk menampilkan "Sedang mencetak struk..." namun
  tidak ada implementasi pencetakan nyata.
- **Komponen UI belum diuji** — test Vitest hanya mencakup logika murni
  (`worker/src/queue.test.ts`, `src/lib/schemas.ts`).
- **Seed credentials default** — wajib diganti sebelum produksi.
- **`tanggal` pakai UTC ISO** — bisa beda hari dengan WIB sekitar tengah malam.

## Catatan Keamanan

Migrasi dari Supabase ke Cloudflare **memperbaiki kerentanan lama**:

| Kerentanan lama (Supabase) | Status sekarang |
|---|---|
| Password plaintext + dicek di browser | ✅ PBKDF2-SHA256 server-side (Worker) |
| Session localStorage forgeable | ✅ Cookie httpOnly + HMAC-signed |
| Monitor publik bocorkan `users.password` | ✅ Server-side projection, password tak pernah dikirim |
| Anon key publik + akses DB dari browser | ✅ DB hanya diakses Worker (binding D1) |
| Stored XSS (SweetAlert `html:`) | ✅ Svelte escape otomatis |

Yang tetap perlu diperhatikan: default credentials seed, kekuatan/rotasi
`SESSION_SECRET`, batas free tier (D1 5 GB, DO 1M request/bulan, Workers 100K
request/hari). Jangan menurunkan level keamanan ini tanpa persetujuan.

## Lisensi

Proyek ini dilisensikan di bawah **Apache License 2.0** — lihat file [LICENSE](LICENSE).

© 2026 — Proyek Ujikom SMKN 1 Sumedang.
