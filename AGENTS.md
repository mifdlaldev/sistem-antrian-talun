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

3. **Never invent configuration files, CI workflows, or deployment settings.**
   This project has **Vitest tests** (`src/lib/*.test.ts`) but **no CI configuration and
   no Supabase migration files.** Do not claim otherwise.

4. **Never "fix" or "improve" security issues silently** (e.g., plaintext passwords,
   localStorage-based auth). Flag them to the user and get explicit approval first.

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

- **Type:** Frontend-only single-page application (SPA). No backend server code exists in
  this repository.
- **Backend / database:** Supabase (PostgreSQL + Realtime), accessed directly from the
  browser via the anon key using `@supabase/postgrest-js` and `@supabase/realtime-js`
  (NOT the monolithic `@supabase/supabase-js`).
- **Deployment:** Vercel (SPA rewrites, see `vercel.json`).
- **Live URL:** `https://website-antrian-kelurahan-talun.vercel.app`

---

## Tech Stack (verified from `package.json`)

| Package | Version | Purpose |
|---|---|---|
| `svelte` | ^5.56.8 | UI framework (runes mode) |
| `vite` | ^8.2.0 | Build tool / dev server |
| `typescript` | ~6.0.2 | Static typing (strict mode) |
| `@sveltejs/vite-plugin-svelte` | ^7.2.0 | Svelte Vite plugin |
| `tailwindcss` + `@tailwindcss/vite` | ^4.3.3 | Styling (Tailwind v4, CSS-first config) |
| `@supabase/postgrest-js` | latest | Supabase PostgREST client (queries) |
| `@supabase/realtime-js` | latest | Supabase Realtime (websocket) |
| `valibot` | ^1.4.2 | Runtime validation + schema inference |
| `bits-ui` | ^2.18.1 | Headless UI primitives (shadcn-svelte base) |
| `@lucide/svelte` | ^1.30.0 | Icons |
| `svelte-sonner` | ^1.1.1 | Toasts |
| `clsx` / `tailwind-merge` / `tailwind-variants` | — | shadcn-svelte helpers |
| `@biomejs/biome` | ^2.5.7 | Lint + format (Rust) |
| `vitest` | ^4.1.10 | Unit tests |
| `husky` + `lint-staged` | — | Pre-commit hooks |

**REMOVED in the Svelte migration (do not re-add):** `react`, `react-dom`,
`react-router-dom`, `@supabase/supabase-js`, `date-fns`, `recharts`, `sweetalert2`,
`axios`, `react-to-print`, `lucide-react`.

---

## Commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server
npm run build        # production build (output: dist/)
npm run preview      # preview the production build
npm run check        # svelte-check (type + a11y) + tsc for node config
npm test             # run Vitest (unit tests)
npm run lint         # biome check
npm run lint:fix     # biome check --write
npm run format       # biome format --write
```

Pre-commit hook: `lint-staged` runs `biome check --write` on staged files.

---

## Project Structure

```
.
├── index.html                 # Vite entry HTML
├── vite.config.ts             # Vite + Svelte + Tailwind v4 + $lib alias + Vitest config
├── svelte.config.js           # vitePreprocess
├── tsconfig.json              # Solution config: app + node + $lib paths
├── tsconfig.app.json          # App TS (strict, noUncheckedIndexedAccess, $lib paths)
├── tsconfig.node.json         # Node-side TS (vite config)
├── biome.json                 # Lint/format (excludes *.svelte + *.css)
├── components.json            # shadcn-svelte config
├── vercel.json                # SPA rewrite: all routes → /index.html
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
└── src/
    ├── main.ts                # Entry point (mount App)
    ├── App.svelte             # Custom path-based SPA router + role guard + Toaster
    ├── app.css                # Tailwind v4 + shadcn theme tokens
    ├── lib/
    │   ├── supabaseClient.ts  # PostgrestClient + RealtimeClient + subscribeAntrian()
    │   ├── schemas.ts         # Valibot schemas: layanan, antrian, users + joined types
    │   ├── queue.ts           # todayIso(), buildNomorAntrian() — pure, tested
    │   ├── session.ts         # getSession/setSession/clearSession (localStorage)
    │   ├── router.ts          # navigate() — pushState + popstate
    │   ├── utils.ts           # cn() + shadcn type helpers
    │   ├── queue.test.ts      # Vitest tests for queue.ts + schemas.ts
    │   ├── components/
    │   │   ├── BarChart.svelte    # Zero-dependency SVG bar chart (admin)
    │   │   └── ui/                # shadcn-svelte components (button, card, dialog, ...)
    │   └── routes/
    │       ├── Kiosk.svelte           # / — take a queue number
    │       ├── Monitor.svelte         # /monitor — TV display, realtime
    │       ├── Login.svelte           # /login — username/password login
    │       ├── AdminDashboard.svelte  # /admin/dashboard — stats + CRUD
    │       └── PetugasDashboard.svelte # /petugas/dashboard — call next queue
    └── routes/ (dir)           # (page components live in src/lib/routes — see above)
```

> Note: page components are in `src/lib/routes/` (not `src/routes/`). Do not assume a
> SvelteKit file-based router — this is a custom SPA router in `App.svelte`.

---

## Routing (verified from `src/App.svelte`)

Custom path-based router. `App.svelte` reads `window.location.pathname`, listens to
`popstate`, and renders a component per path. Navigation uses `navigate(path)` from
`$lib/router.ts`.

| Path | Component | Guard |
|---|---|---|
| `/` | `Kiosk` | Public |
| `/monitor` | `Monitor` | Public |
| `/login` | `Login` | Public |
| `/admin/dashboard` | `AdminDashboard` | session exists + role `admin` |
| `/petugas/dashboard` | `PetugasDashboard` | session exists + role `petugas` |
| `/dashboard` | Redirect → `/login` | — |
| any other | 404 "Halaman Tidak Ditemukan" | — |

Guard behavior: `resolveTarget(path)` checks `getSession()`; mismatched role redirects to
the caller's own dashboard; no session redirects to `/login`.

---

## Environment Variables

Required (read in `src/lib/supabaseClient.ts`):

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
| `tanggal` | date (stored as `YYYY-MM-DD` ISO string via `todayIso()`) |
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

> `Monitor.svelte` still queries `.select("*, layanan(*), users(*)")` — the public monitor
> page receives **all columns of `users`**, including `password`. Known vulnerability.

---

## Key Behaviors (verified)

### Queue number generation (`Kiosk.svelte` → `handleAmbilAntrian`)
1. Counts today's rows in `antrian` where `id_layanan = X` and `tanggal >= today`.
2. `urutan = count + 1`.
3. `nomor = buildNomorAntrian(layanan.kode_huruf, urutan)` → `\`${kodeHuruf}-${String(urutan).padStart(3, "0")}\``.
4. Inserts row with `status: "menunggu"` and `tanggal: todayIso()`.
5. Shows a shadcn `Dialog` ("Berhasil") that auto-closes after 4 seconds.

**Count-then-insert is non-atomic. Concurrent requests can produce duplicate numbers.**
Known limitation — do not claim it is race-safe.

### Login (`Login.svelte` → `handleLogin`)
- Queries `users` with `.eq("username", …).eq("password", …)` — plaintext comparison,
  client-side.
- On success, validates with `UserSchema` (Valibot) and stores the **entire user row** in
  `localStorage` under key `user_session` (via `setSession`).
- No Supabase Auth is used. No tokens. No expiry.

### Auth guard (`App.svelte` → `resolveTarget`)
- Reads session via `getSession()` (`localStorage["user_session"]`, Valibot-validated).
- If absent → `/login`. If role not allowed → redirect to own dashboard.
- **The session is trivially forgeable**: any visitor can
  `localStorage.setItem("user_session", JSON.stringify({ role: "admin" }))`. Known
  limitation.

### Realtime (`Monitor.svelte`, `PetugasDashboard.svelte`)
- `subscribeAntrian(channelName, cb)` in `supabaseClient.ts` wraps
  `RealtimeClient.channel(name).on("postgres_changes", { event: "*", schema: "public", table: "antrian" }, cb)`.
- Returns an unsubscribe function; both pages call it in `onMount` cleanup.

### Petugas call-next flow (`PetugasDashboard.svelte` → `handleNextAntrian`)
1. If a queue row is currently `dilayani` by this user → set it to `selesai` + `waktu_selesai: new Date()`.
2. Fetch first `menunggu` row ordered by `id_antrian` ASC (FIFO), filtered by `id_layanan`
   if the petugas is a specialist (`id_layanan` not null).
3. Set it to `dilayani` + `id_user: petugas.id`.
4. General petugas (`id_layanan` null): no service filter — takes whoever came first.

### Admin CRUD (`AdminDashboard.svelte`)
- Custom sidebar tabs (home/layanan/users) with shadcn `Table`, `Dialog`, `AlertDialog`,
  `NativeSelect`. Toasts via `svelte-sonner`.
- Adding a user hardcodes `role: "petugas"`.
- Charts: zero-dependency SVG (`BarChart.svelte`) — Recharts was removed.

---

## Conventions

- **Language:** Indonesian (UI text, comments, variable names: `daftarLayanan`,
  `handleAmbilAntrian`, `fetchDataAntrian`, etc.). Keep it consistent.
- **Components:** `.svelte` files, Svelte 5 **runes** (`$state`, `$derived`, `$props`,
  `$effect`). No legacy `export let` unless necessary.
- **Aliases:** `$lib` → `src/lib` (vite + tsconfig). `@` → `src` (vite only).
- **Styling:** Tailwind utility classes. shadcn theme tokens via `--color-*` variables
  (`bg-background`, `text-foreground`, `bg-primary`, `bg-muted`, etc.) from `app.css`.
- **UI components:** shadcn-svelte in `src/lib/components/ui/`. Toasts via `svelte-sonner`
  (`import { toast } from 'svelte-sonner'`).
- **Icons:** `@lucide/svelte/icons` (named imports).
- **Modals:** shadcn `Dialog` / `AlertDialog` — do NOT reintroduce SweetAlert.
- **Validation:** Valibot schemas in `src/lib/schemas.ts`. Validate at boundaries
  (Supabase responses, localStorage session).
- **State/data fetching:** Svelte 5 runes + `onMount` + direct PostgrestClient calls. No
  state manager.
- **Strictness:** TS strict + `noUncheckedIndexedAccess`. `tsc`/svelte-check must pass.
  Biome for `.ts/.js/.json` (`.svelte` + `.css` handled by svelte-check / Tailwind).
- **Dates:** `Intl.DateTimeFormat` with `id-ID` locale (date-fns was removed).
- **Font:** system font stack (shadcn default).

---

## Known Limitations & Current State (verified — keep honest)

| Area | Status |
|---|---|
| Tests | **Vitest**: 4 tests in `src/lib/queue.test.ts` (queue + schemas). No component tests. |
| CI | **None.** No GitHub Actions / workflows. |
| SQL migrations | **None.** Schema exists only inside the Supabase project. |
| Print receipt | Removed with React migration (`StrukAntrian`/`react-to-print` gone). Kiosk dialog still shows "Sedang mencetak struk..." — no real printing. |
| Auth | localStorage-based, forgeable, no expiry. |
| Passwords | Stored and compared in plaintext. |
| RLS policies | Not present in this repo; all security depends on Supabase Row Level Security. Cannot be verified from code. |
| `.env` exposure | Supabase anon key was committed publicly via `.env` in the past. |
| Queue-number uniqueness | Non-atomic count+insert; duplicates possible under concurrency. |
| Bundle size | ~348 KB min / ~104 KB gzip JS (Svelte 5 + bits-ui + Supabase clients). |
| Date/timezone | `tanggal` uses UTC ISO date — may differ from local (WIB) day around midnight. |

---

## Security Notes

Treat the following as **known vulnerabilities**, not features:

1. Plaintext passwords + client-side credential check.
2. Forgeable localStorage "session".
3. Public monitor page selecting all `users` columns (incl. `password`) via join.
4. Client-side CRUD on `users`/`layanan`/`antrian` via anon key — exposure depends
   entirely on Supabase RLS.
5. Committed `.env` with Supabase anon key (in the past).

Do not silently "fix" these. Surface them, propose a plan, and get user approval.
