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
   schema documented below is **inferred from Supabase queries in the source**, not from a
   SQL migration (there is none in this repo). If you need the authoritative schema,
   inspect the Supabase project directly.

3. **Never invent configuration files, CI workflows, tests, or deployment settings.**
   This project has **no tests, no CI configuration, and no Supabase migration files.**
   Do not claim otherwise.

4. **Never "fix" or "improve" security issues silently** (e.g., plaintext passwords,
   localStorage-based auth). Flag them to the user and get explicit approval first.

5. **Never rewrite working code "for cleanliness" without being asked.** This is a small
   production-deployed codebase. Prefer minimal, targeted changes.

6. **Before editing any file, read it first.** Do not trust memory or a previous agent's
   summary. Use the tooling available (e.g., codegraph, grep, read) to confirm current
   content.

7. **When in doubt, ask.** If a request is ambiguous, or you cannot verify a fact, ask the
   user instead of guessing.

8. **Keep this file accurate.** When you make structural changes (new routes, renamed
   columns, removed dependencies), update AGENTS.md and README.md in the same change.

---

## Project Overview

**Sistem Antrian Digital Kelurahan Desa Talun** — a digital queue (antrian) system for the
Talun Village Office (Kantor Kelurahan Desa Talun), built as a Ujikom (school competency
exam) project for SMKN 1 Sumedang, 2026.

- **Type:** Frontend-only single-page application (SPA). No backend server code exists in
  this repository.
- **Backend / database:** Supabase (PostgreSQL + Realtime), accessed directly from the
  browser via the Supabase JS client with the anon key.
- **Deployment:** Vercel (SPA rewrites, see `vercel.json`).
- **Live URL:** `https://website-antrian-kelurahan-talun.vercel.app`

---

## Tech Stack (verified from `package.json`)

| Package | Version | Purpose |
|---|---|---|
| `react` / `react-dom` | ^19.2.0 | UI framework |
| `vite` | ^7.2.4 | Build tool / dev server |
| `@vitejs/plugin-react` | ^5.1.1 | React plugin |
| `tailwindcss` + `@tailwindcss/vite` | ^4.1.18 | Styling (Tailwind v4, CSS-first config) |
| `react-router-dom` | ^7.13.0 | Routing |
| `@supabase/supabase-js` | ^2.95.3 | Supabase client + Realtime |
| `sweetalert2` | ^11.26.18 | Modals / toasts |
| `recharts` | ^3.7.0 | Admin charts |
| `date-fns` | ^4.1.0 | Date formatting (Monitor clock, Indonesian locale) |
| `lucide-react` | ^0.563.0 | Icons |
| `axios` | ^1.13.4 | **Installed but UNUSED in source** |
| `react-to-print` | ^3.2.0 | **Installed but UNUSED in source** |

---

## Commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server
npm run build        # production build (output: dist/)
npm run preview      # preview the production build
npm run lint         # run ESLint
```

Node/package manager: npm. No test runner is configured.

---

## Project Structure

```
.
├── index.html                 # Vite entry HTML
├── vite.config.js             # Vite + React + Tailwind v4 plugin
├── eslint.config.js           # ESLint 9 flat config
├── vercel.json                # SPA rewrite: all routes → /index.html
├── LICENSE                    # Apache License 2.0
├── AGENTS.md                  # This file — agent guidelines (no hallucination)
├── README.md                  # Project documentation (Indonesian)
├── public/
│   ├── logoinsunmedal.png     # Logo (used in navbar/header)
│   ├── kantorlurahtalun.jpg   # Office photo (Monitor display background)
│   └── vite.svg               # Vite default favicon (unused)
└── src/
    ├── main.jsx               # React entry point (StrictMode)
    ├── App.jsx                # Router definition (see routing table)
    ├── index.css              # Tailwind v4 import + @theme + custom component classes
    ├── lib/
    │   └── supabaseClient.js  # Exports `supabase` client (anon key)
    ├── data/
    │   └── mockData.js        # UNUSED mock data (mockLayanan, mockAntrian)
    ├── components/
    │   ├── ProtectedRoute.jsx # Role guard based on localStorage session
    │   └── StrukAntrian.jsx   # Print receipt component — UNUSED (not wired anywhere)
    └── pages/
        ├── public/
        │   ├── Kiosk.jsx            # / — take a queue number
        │   ├── Monitor.jsx          # /monitor — TV display, realtime
        │   └── Login.jsx            # /login — username/password login
        └── admin/
            ├── AdminDashboard.jsx   # /admin/dashboard — stats + CRUD layanan & users
            └── PetugasDashboard.jsx # /petugas/dashboard — call next queue
```

---

## Routing (verified from `src/App.jsx`)

| Path | Component | Guard |
|---|---|---|
| `/` | `Kiosk` | Public |
| `/monitor` | `Monitor` | Public |
| `/login` | `Login` | Public |
| `/admin/dashboard` | `AdminDashboard` | `ProtectedRoute` with `allowedRoles=["admin"]` |
| `/petugas/dashboard` | `PetugasDashboard` | `ProtectedRoute` with `allowedRoles=["petugas"]` |
| `/dashboard` | Redirect → `/login` | — |
| `*` | 404 "Halaman Tidak Ditemukan" | — |

---

## Environment Variables

Required (read in `src/lib/supabaseClient.js`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`.env` is gitignored, **but a `.env` file was committed to the GitHub repository
(`mifdlaldev/website-antrian-kelurahan-talun`) in the past.** Do not re-introduce secrets.
See Security Notes.

---

## Database Schema (INFERRED from Supabase queries in source — no migration files exist)

### `layanan`
| Column | Notes |
|---|---|
| `id_layanan` | PK, int (ordered ascending) |
| `nama_layanan` | text |
| `kode_huruf` | text, single letter (e.g. "A", "B", "C") — prefix of queue numbers |
| `deskripsi` | text, nullable |

### `antrian`
| Column | Notes |
|---|---|
| `id_antrian` | PK, int (FIFO ordering) |
| `nomor_antrian` | text, format `KODE-001` (e.g. `A-001`) |
| `id_layanan` | FK → `layanan.id_layanan` |
| `id_user` | FK → `users.id_user`, nullable; set to the petugas who is serving |
| `status` | text: `menunggu` \| `dilayani` \| `selesai` |
| `tanggal` | date (stored as `YYYY-MM-DD` ISO string, derived from `new Date().toISOString().split("T")[0]`) |
| `waktu_selesai` | timestamp, nullable; set when status → `selesai` |

### `users`
| Column | Notes |
|---|---|
| `id_user` | PK, int |
| `username` | text |
| `password` | text — **stored as PLAINTEXT** (verified: login compares equality client-side) |
| `nama_lengkap` | text |
| `role` | text: `admin` \| `petugas` |
| `id_layanan` | FK → `layanan.id_layanan`, **nullable**; `null` = "general" petugas (all services) |

> The `antrian` table is joined with `layanan` and `users` via
> `.select("*, layanan(*), users(*)")` in `Monitor.jsx` — meaning the public monitor page
> receives **all columns of `users`**, including `password`.

---

## Key Behaviors (verified)

### Queue number generation (`Kiosk.jsx` → `handleAmbilAntrian`)
1. Counts today's rows in `antrian` where `id_layanan = X` and `tanggal >= today`.
2. `urutan = count + 1`.
3. `nomorBaru = \`${layanan.kode_huruf}-${String(urutan).padStart(3, "0")}\`` (e.g. `A-001`).
4. Inserts row with `status: "menunggu"` and `tanggal: today`.

**This is a count-then-insert, non-atomic. Concurrent requests can produce duplicate
numbers.** Known limitation — do not claim it is race-safe.

### Login (`Login.jsx` → `handleLogin`)
- Queries `users` with `.eq("username", …).eq("password", …)` — plaintext comparison,
  client-side.
- On success, stores the **entire user row** in `localStorage` under key `user_session`.
- No Supabase Auth is used. No tokens. No expiry.

### Auth guard (`ProtectedRoute.jsx`)
- Reads `localStorage.getItem("user_session")`; if absent → redirect `/login`.
- If role not in `allowedRoles` → redirect to `/admin/dashboard` (admin) or
  `/petugas/dashboard` (otherwise).
- **The session is trivially forgeable**: any visitor can
  `localStorage.setItem("user_session", JSON.stringify({ role: "admin" }))`. Known
  limitation.

### Realtime (`Monitor.jsx`, `PetugasDashboard.jsx`)
- `supabase.channel(...)` + `.on("postgres_changes", { event: "*", schema: "public", table: "antrian" }, ...)`.
- Monitor refetches queue data on any change. Petugas dashboard refetches stats.

### Petugas call-next flow (`PetugasDashboard.jsx` → `handleNextAntrian`)
1. If a queue row is currently `dilayani` by this user → set it to `selesai` + `waktu_selesai: new Date()`.
2. Fetch first `menunggu` row ordered by `id_antrian` ASC (FIFO), filtered by `id_layanan`
   if the petugas is a specialist (`id_layanan` not null).
3. Set it to `dilayani` + `id_user: petugas.id`.
4. If petugas is "general" (`id_layanan` null): no service filter — takes whoever came first.

### Admin CRUD (`AdminDashboard.jsx`)
- Tabs: `home` (stats + Recharts charts), `layanan` (CRUD via SweetAlert modals),
  `users` (CRUD petugas via SweetAlert modals).
- Adding a user hardcodes `role: "petugas"`.
- **SweetAlert `html:` fields interpolate user-entered values unescaped**
  (e.g. `value="${item.nama_layanan}"`). Stored-XSS risk. Known limitation — do not
  duplicate this pattern in new code.

---

## Conventions

- **Language:** Indonesian (UI text, comments, variable names: `daftarLayanan`,
  `handleAmbilAntrian`, `fetchDataAntrian`, etc.). Keep it consistent.
- **Components:** `.jsx` files, named or default-exported function components.
- **Styling:** Tailwind utility classes inline. Some legacy class helpers in `src/index.css`
  (`.card`, `.btn-primary`, `.btn-danger`, `.btn-kiosk`, `.input-field`, `.layout-container`)
  plus heavy SweetAlert2 overrides — prefer plain utilities for new code.
- **Icons:** `lucide-react`.
- **Modals/toasts:** `sweetalert2` (imported as `Swal`).
- **Dates:** `date-fns` v4 with `id` locale for display; queue `tanggal` stored as UTC ISO
  date string.
- **State/data fetching:** plain `useState` + `useEffect` with Supabase calls. No data
  fetching library, no state manager, no TypeScript.
- **Font:** Inter (declared via `--font-sans` in `@theme`).

---

## Known Limitations & Current State (verified — keep honest)

| Area | Status |
|---|---|
| Tests | **None.** No test runner configured. |
| CI | **None.** No GitHub Actions / workflows. |
| SQL migrations | **None.** Schema exists only inside the Supabase project. |
| Print receipt (StrukAntrian) | Component + `react-to-print` installed, **not wired**. Kiosk shows "Sedang mencetak struk..." but nothing prints. |
| Auth | localStorage-based, forgeable, no expiry. |
| Passwords | Stored and compared in plaintext. |
| RLS policies | Not present in this repo; all security depends on Supabase Row Level Security configured in the dashboard. Cannot be verified from code. |
| `.env` exposure | Supabase anon key was committed publicly via `.env`. |
| Queue-number uniqueness | Non-atomic count+insert; duplicates possible under concurrency. |
| Unused deps | `axios`, `react-to-print`, `src/data/mockData.js`, `StrukAntrian.jsx`, `public/vite.svg` |
| Date/timezone | `tanggal` uses UTC ISO date — may differ from local (WIB) day around midnight. |

---

## Security Notes

Treat the following as **known vulnerabilities**, not features:

1. Plaintext passwords + client-side credential check.
2. Forgeable localStorage "session".
3. Public monitor page selecting all `users` columns (incl. `password`) via join.
4. Client-side CRUD on `users`/`layanan`/`antrian` via anon key — exposure depends
   entirely on Supabase RLS.
5. Stored XSS via unescaped values in SweetAlert `html:` templates.
6. Committed `.env` with Supabase anon key.

Do not silently "fix" these. Surface them, propose a plan, and get user approval.
