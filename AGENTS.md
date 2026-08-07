# AGENTS.md — Agent Guidelines for This Repository

This file exists to prevent AI agents from hallucinating. **Everything stated below was
verified against the actual source code on disk at the time of writing.** If a statement
here conflicts with code you read, the code wins — update this file, never the reverse.

---

## HARD RULES — No Hallucination, No Exceptions

1. **Never claim a feature exists that you have not verified in the source code.** If you
   have not read the relevant file, say so. Do not infer behavior from the README, from
   comments, or from what the app *looks* like it should do.

2. **Never invent database columns, tables, APIs, routes, or environment variables.**
   Everything you reference must be traceable to code in this repository. The database
   schema is defined in **D1 migrations** (`worker/migrations/`) — read them for the
   authoritative schema.

3. **Never invent configuration files, CI workflows, or deployment settings.**
   This project has **Vitest tests** (`src/lib/*.test.ts`, `worker/src/*.test.ts`) but
   **no CI configuration.** Deployment uses `wrangler.jsonc` + `wrangler deploy`.

4. **Never "fix" or "improve" security issues silently.** Flag them to the user and get
   explicit approval first.

5. **Never rewrite working code "for cleanliness" without being asked.** Prefer minimal,
   targeted changes.

6. **Before editing any file, read it first.** Do not trust memory or a previous agent's
   summary. Use the tooling available (e.g., codegraph, grep, read) to confirm current
   content.

7. **When in doubt, ask.** If a request is ambiguous, or you cannot verify a fact, ask the
   user instead of guessing.

8. **Keep this file accurate.** When you make structural changes (new routes, renamed
   columns, removed dependencies), update AGENTS.md and README.md in the same change.

9. **Read `openspec/` before changing behavior.** The OpenSpec directory is the
   authoritative specification of the current system (capabilities + contracts). When
   `openspec/` conflicts with code you read, the code wins — update both.

---

## Project Overview

**Sistem Antrian Digital Kelurahan Desa Talun** — a digital queue (antrian) system for the
Talun Village Office (Kantor Kelurahan Desa Talun), built as a Ujikom (school competency
exam) project for SMKN 1 Sumedang, 2026.

- **Type:** Svelte 5 SPA frontend + Cloudflare Worker API, deployed as one Worker.
- **Backend:** Cloudflare Workers (Hono) + **D1** (SQLite) + **Durable Objects**
  (realtime hub). All database access is server-side — the browser never talks to the DB.
- **Deployment:** `wrangler deploy` — static assets (dist/) + API in one Worker.
- **Live URL:** `https://website-antrian-kelurahan-talun.mifdlaltsaqibalf25.workers.dev`
  (URL lama Vercel: `website-antrian-kelurahan-talun.vercel.app`).

---

## Tech Stack (verified from `package.json`)

| Package | Version | Purpose |
|---|---|---|
| `svelte` | ^5.56.8 | UI framework (runes mode) |
| `vite` | ^8.2.0 | Build tool / dev server |
| `typescript` | ~6.0.2 | Static typing (strict mode) |
| `@sveltejs/vite-plugin-svelte` | ^7.2.0 | Svelte Vite plugin |
| `tailwindcss` + `@tailwindcss/vite` | ^4.3.3 | Styling (Tailwind v4, CSS-first config) |
| `hono` | latest | API framework di Worker |
| `wrangler` | ^4.120.0 | Cloudflare CLI (dev, deploy, D1, DO) |
| `@cloudflare/workers-types` | — | Type definitions Worker |
| `valibot` | ^1.4.2 | Runtime validation (shared client + worker) |
| `bits-ui` | ^2.18.1 | Headless UI primitives (shadcn-svelte base) |
| `@lucide/svelte` | ^1.30.0 | Icons |
| `svelte-sonner` | ^1.1.1 | Toasts |
| `clsx` / `tailwind-merge` / `tailwind-variants` | — | shadcn-svelte helpers |
| `@biomejs/biome` | ^2.5.7 | Lint + format (Rust) |
| `vitest` | ^4.1.10 | Unit tests |
| `husky` + `lint-staged` | — | Pre-commit hooks |

**REMOVED (do not re-add):** `@supabase/supabase-js`, `@supabase/postgrest-js`,
`@supabase/realtime-js`, `react`, `react-dom`, `react-router-dom`, `date-fns`,
`recharts`, `sweetalert2`, `axios`, `react-to-print`, `lucide-react`.

---

## Commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server (frontend only)
npm run dev:worker   # wrangler dev --local (Worker + D1 + DO + assets)
npm run build        # production build frontend (output: dist/)
npm run check        # svelte-check + tsc (node config) + tsc (worker config)
npm test             # run Vitest (unit tests)
npm run lint         # biome check
npm run lint:fix     # biome check --write
npm run format       # biome format --write
npm run db:migrate:local   # apply D1 migrations ke database lokal
npm run db:migrate:remote  # apply D1 migrations ke database production
npm run deploy       # build frontend + wrangler deploy
```

Pre-commit hook: `lint-staged` runs `biome check --write` on staged files.

---

## Project Structure

```
.
├── index.html                 # Vite entry HTML
├── vite.config.ts             # Vite + Svelte + Tailwind v4 + $lib alias + Vitest config
├── svelte.config.js           # vitePreprocess
├── tsconfig.json              # Solution config: app + node + worker
├── tsconfig.app.json          # App TS (strict, noUncheckedIndexedAccess, $lib paths)
├── tsconfig.node.json         # Node-side TS (vite config)
├── tsconfig.worker.json       # Worker TS (@cloudflare/workers-types)
├── biome.json                 # Lint/format (excludes *.svelte + *.css)
├── components.json            # shadcn-svelte config
├── wrangler.jsonc             # Cloudflare Worker config (D1 + DO + assets)
├── .dev.vars                  # Secret lokal (gitignored) — SESSION_SECRET
├── LICENSE                    # Apache License 2.0
├── AGENTS.md                  # This file — agent guidelines (no hallucination)
├── README.md                  # Project documentation (Indonesian)
├── openspec/                  # OpenSpec specs — authoritative description of current behavior
│   ├── project.md             # Project overview, scope, constraints, conventions
│   └── spec/
│       ├── capabilities/      # queue-taking, queue-monitoring, queue-calling, authentication, admin-management
│       └── contracts/         # database-schema, session
├── public/
│   ├── logoinsunmedal.png     # Logo (used in navbar/header)
│   └── kantorlurahtalun.jpg   # Office photo (Monitor display background)
├── worker/
│   ├── migrations/
│   │   ├── 0001_init.sql      # Skema D1: layanan, antrian, users
│   │   └── 0002_seed.sql      # Seed: admin + petugas (password PBKDF2-hashed)
│   └── src/
│       ├── index.ts           # Hono app + SPA fallback ke ASSETS
│       ├── env.ts             # Env bindings (DB, REALTIME, SESSION_SECRET, ASSETS)
│       ├── auth.ts            # PBKDF2 hash, cookie HMAC-signed, middleware role
│       ├── queue.ts           # todayIso(), buildNomorAntrian() — pure, tested
│       ├── realtime.ts        # Durable Object hub (WebSocket + broadcast)
│       └── routes/
│           ├── auth.ts        # POST /login, POST /logout, GET /me
│           ├── layanan.ts     # CRUD layanan
│           ├── antrian.ts     # create (atomik), display, petugas, next
│           ├── users.ts       # CRUD users (admin)
│           └── stats.ts       # GET /dashboard (admin)
└── src/
    ├── main.ts                # Entry point (mount App)
    ├── App.svelte             # Custom path-based SPA router + role guard + Toaster
    ├── app.css                # Tailwind v4 + shadcn theme tokens
    ├── lib/
    │   ├── api.ts             # fetch wrapper (GET/POST/PUT/DELETE + ApiError)
    │   ├── realtime.ts        # subscribeAntrian() — WebSocket + auto-reconnect
    │   ├── schemas.ts         # Valibot schemas: layanan, antrian, users (tanpa password)
    │   ├── session.ts         # getCurrentUser/login/logout (cookie httpOnly)
    │   ├── router.ts          # navigate() — pushState + popstate
    │   ├── utils.ts           # cn() + shadcn type helpers
    │   ├── components/
    │   │   ├── BarChart.svelte    # Zero-dependency SVG bar chart (admin)
    │   │   └── ui/                # shadcn-svelte components (button, card, dialog, ...)
    │   └── routes/
    │       ├── Kiosk.svelte           # / — take a queue number
    │       ├── Monitor.svelte         # /monitor — TV display, realtime
    │       ├── Login.svelte           # /login — username/password login
    │       ├── AdminDashboard.svelte  # /admin/dashboard — stats + CRUD
    │       └── PetugasDashboard.svelte # /petugas/dashboard — call next queue
```

> Page components live in `src/lib/routes/` (not `src/routes/`). Do not assume a
> SvelteKit file-based router — this is a custom SPA router in `App.svelte`.

---

## Routing & API

### Frontend routes (`App.svelte`)

| Path | Component | Guard |
|---|---|---|
| `/` | `Kiosk` | Public |
| `/monitor` | `Monitor` | Public |
| `/login` | `Login` | Public |
| `/admin/dashboard` | `AdminDashboard` | session cookie + role `admin` |
| `/petugas/dashboard` | `PetugasDashboard` | session cookie + role `petugas` |
| `/dashboard` | Redirect → `/login` | — |
| any other | 404 "Halaman Tidak Ditemukan" | — |

Guard: `App.svelte` fetches `GET /api/auth/me` (cookie dikirim otomatis) pada setiap
perubahan path. Role tidak cocok → redirect ke dashboard sendiri.

### API endpoints (`worker/src/`)

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| POST | `/api/auth/login` | public | Verifikasi PBKDF2, set cookie httpOnly |
| POST | `/api/auth/logout` | public | Hapus cookie |
| GET | `/api/auth/me` | session | Data user (tanpa hash) |
| GET | `/api/layanan` | public | Daftar layanan |
| POST | `/api/layanan` | admin | Tambah layanan |
| PUT | `/api/layanan/:id` | admin | Update layanan |
| DELETE | `/api/layanan/:id` | admin | Hapus layanan |
| POST | `/api/antrian` | public | Buat nomor antrian (**atomik**, single statement) |
| GET | `/api/antrian/display` | public | dilayani + 5 menunggu (join layanan/users) |
| GET | `/api/antrian/petugas` | petugas | sedangDilayani, sisaAntrian, totalSelesai |
| POST | `/api/antrian/next` | petugas | Selesaikan aktif + panggil berikutnya (FIFO) |
| GET | `/api/users` | admin | Daftar users (join layanan) |
| POST | `/api/users` | admin | Tambah petugas (role hardcode `petugas`) |
| PUT | `/api/users/:id` | admin | Update user (password opsional) |
| DELETE | `/api/users/:id` | admin | Hapus user |
| GET | `/api/stats/dashboard` | admin | stats + weekly + layananStats |
| GET | `/api/realtime` | public | WebSocket upgrade → Durable Object hub |

Semua route non-API → static assets (SPA fallback).

---

## Environment & Secrets

- **`SESSION_SECRET`** — secret untuk menandatangani cookie session (HMAC-SHA256).
  Lokal: `.dev.vars` (gitignored). Produksi: `wrangler secret put SESSION_SECRET`.
- **Tidak ada lagi variabel `VITE_*`** — frontend tidak menyentuh database; semua query
  lewat API same-origin (`/api/*`).

---

## Database Schema (D1 — dari `worker/migrations/0001_init.sql`)

### `layanan`
| Column | Notes |
|---|---|
| `id_layanan` | INTEGER PK AUTOINCREMENT |
| `nama_layanan` | TEXT NOT NULL |
| `kode_huruf` | TEXT NOT NULL, single letter ("A") — prefix nomor |
| `deskripsi` | TEXT |

### `antrian`
| Column | Notes |
|---|---|
| `id_antrian` | INTEGER PK AUTOINCREMENT (FIFO ordering) |
| `nomor_antrian` | TEXT, format `KODE-001` |
| `id_layanan` | FK → `layanan.id_layanan` |
| `id_user` | FK → `users.id_user`, nullable; petugas yang melayani |
| `status` | TEXT CHECK: `menunggu` \| `dilayani` \| `selesai` |
| `tanggal` | TEXT `YYYY-MM-DD` |
| `waktu_selesai` | TEXT (ISO), set saat `selesai` |

### `users`
| Column | Notes |
|---|---|
| `id_user` | INTEGER PK AUTOINCREMENT |
| `username` | TEXT NOT NULL UNIQUE |
| `password_hash` | TEXT — **PBKDF2-SHA256, BUKAN plaintext** |
| `nama_lengkap` | TEXT NOT NULL |
| `role` | TEXT CHECK: `admin` \| `petugas` |
| `id_layanan` | FK → `layanan.id_layanan`, nullable (`null` = general) |

Index: `antrian(tanggal)`, `antrian(status)`, `antrian(id_layanan, tanggal)`.

Seed (`0002_seed.sql`): `admin`/`admin123` (role admin), `petugas1`/`petugas123`
(petugas, layanan A). **Default credentials — WAJIB diganti setelah deploy.**

---

## Key Behaviors (verified)

### Queue number generation (`POST /api/antrian`)
- Insert **atomik satu statement**: nomor dihitung dari `MAX(SUBSTR(nomor_antrian, 3))`
  per layanan+tanggal dalam `INSERT ... SELECT`. **Tidak ada race condition**
  (perbaikan dari versi Supabase count-then-insert).
- Broadcast ke realtime hub, lalu return `{ nomor_antrian, nama_layanan }`.

### Login (`POST /api/auth/login`)
- Query `users` by username → `verifyPassword` (PBKDF2, constant-time compare).
- Sukses → cookie `session` httpOnly, SameSite=Lax, Secure (prod), 12 jam,
  berisi `{ id_user, role, exp }` yang di-HMAC-SHA256 dengan `SESSION_SECRET`.

### Auth guard (`App.svelte`)
- Fetch `GET /api/auth/me` per path change; cookie dikirim otomatis.
- Session **tidak forgeable** dari client (cookie httpOnly, signature server-side).

### Realtime (`Durable Object` → `worker/src/realtime.ts`)
- Client: `GET /api/realtime` → WebSocket upgrade ke `RealtimeHub` (Hibernation API).
- Mutasi antrian → Worker panggil `broadcast(env)` → DO kirim `refresh` ke semua WS.
- Frontend `subscribeAntrian(cb)` (auto-reconnect 3s) → `cb` refetch data.

### Petugas call-next flow (`POST /api/antrian/next`)
1. Jika ada antrian `dilayani` oleh petugas ini → set `selesai` + `waktu_selesai`.
2. Ambil `menunggu` pertama urut `id_antrian` ASC (FIFO), filter `id_layanan` jika
   petugas spesialis; tanpa filter jika general.
3. Set `dilayani` + `id_user` → broadcast → return `{ next }`.

### Admin CRUD
- `layanan` & `users` CRUD via API admin-only. Password di-hash PBKDF2 server-side.
- Chart: zero-dependency SVG (`BarChart.svelte`).

---

## Conventions

- **Language:** Indonesian (UI text, comments, variable names: `daftarLayanan`,
  `handleAmbilAntrian`, `fetchDataAntrian`, etc.). Keep it consistent.
- **Components:** `.svelte` files, Svelte 5 **runes** (`$state`, `$derived`, `$props`,
  `$effect`). No legacy `export let`.
- **Worker:** Hono + TypeScript strict. Routes per-domain di `worker/src/routes/`.
- **Aliases:** `$lib` → `src/lib` (vite + tsconfig). `@` → `src` (vite only).
- **Styling:** Tailwind utility classes. shadcn theme tokens (`bg-background`, ...).
- **UI components:** shadcn-svelte in `src/lib/components/ui/`. Toasts `svelte-sonner`.
  Modals `Dialog`/`AlertDialog`. Icons `@lucide/svelte/icons`.
- **Validation:** Valibot (`src/lib/schemas.ts`) — shared antara client dan worker.
  Validate at boundaries (API responses di client, request body di worker).
- **Strictness:** TS strict + `noUncheckedIndexedAccess` (app + worker). svelte-check
  dan `tsc -p tsconfig.worker.json` harus 0 error. Biome untuk `.ts/.js/.json`.
- **Dates:** `Intl.DateTimeFormat` locale `id-ID`; `tanggal` sebagai ISO `YYYY-MM-DD`.

---

## Known Limitations & Current State (verified — keep honest)

| Area | Status |
|---|---|
| Tests | **Vitest**: queue + schemas (`src/lib/*.test.ts`, `worker/src/queue.test.ts`). No component tests. |
| CI | **None.** No GitHub Actions / workflows. |
| Deploy | Belum di-deploy ke Cloudflare (butuh akun + `wrangler login` + set secret + migrate remote). |
| Realtime | DO WebSocket — teruji lokal (`wrangler dev`), belum teruji di edge. |
| Seed credentials | `admin`/`admin123`, `petugas1`/`petugas123` — WAJIB diganti sebelum produksi. |
| Queue-number uniqueness | **Aman** — insert atomik single-statement (perbaikan dari Supabase). |
| Print receipt | Tidak ada (Kiosk dialog "Sedang mencetak struk..." placeholder). |
| Bundle size | ~274 KB min / ~83 KB gzip JS. |
| Date/timezone | `tanggal` pakai UTC ISO — bisa beda hari dengan WIB sekitar tengah malam. |
| D1 free tier | 5 GB storage, 5M baris dibaca/hari — cukup untuk skala kantor kelurahan. |

---

## Security Notes

Migrasi Cloudflare **memperbaiki** kerentanan era Supabase:

| Kerentanan lama | Status sekarang |
|---|---|
| Password plaintext + cek client-side | ✅ PBKDF2-SHA256, cek server-side |
| Session localStorage forgeable | ✅ Cookie httpOnly HMAC-signed |
| Monitor bocorkan `users.password` | ✅ Server-side projection, password tidak pernah dikirim |
| Anon key publik + akses DB dari browser | ✅ DB hanya diakses Worker (binding D1) |
| Stored XSS (SweetAlert html) | ✅ Form `bind:value`, Svelte escape otomatis |

Tetap perlu perhatian: default credentials seed, `SESSION_SECRET` harus kuat &
di-rotate, batas free tier D1/DO. Jangan turunkan level keamanan ini tanpa persetujuan.
