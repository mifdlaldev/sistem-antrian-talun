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
| Supabase | Backend: PostgreSQL + Realtime, via `postgrest-js` + `realtime-js` (tanpa `supabase-js` monolitik) |
| Valibot | Validasi runtime + inferensi skema |
| Biome | Lint + format (Rust, sangat cepat) |
| Vitest | Unit tests |
| svelte-sonner | Toast notification |
| @lucide/svelte | Icon |
| Husky + lint-staged | Pre-commit hooks |

## Persyaratan

- Node.js (npm) — versi yang mendukung Vite 8
- Proyek Supabase dengan tabel `layanan`, `antrian`, dan `users` (lihat [Skema Database](#skema-database))

## Cara Menjalankan

```bash
npm install        # install dependencies
npm run dev        # jalankan dev server (Vite)
npm run build      # build produksi (output: dist/)
npm run preview    # preview hasil build
npm run check      # type-check (svelte-check + tsc)
npm test           # jalankan unit test (Vitest)
npm run lint       # biome check
npm run lint:fix   # biome check --write
npm run format     # biome format --write
```

## Quality Gates

Proyek ini menerapkan standar ketat ("sangat ringan, sangat ketat, sangat cepat"):

- **Type-check:** `svelte-check` (TS strict) harus 0 error, 0 warning.
- **Lint + format:** Biome (untuk `.ts/.js/.json`; `.svelte`/`.css` ditangani
  svelte-check/Tailwind).
- **Test:** Vitest untuk logika murni (`src/lib/queue.test.ts`).
- **Pre-commit:** Husky + lint-staged menjalankan `biome check --write` otomatis.
- **Bundle:** ~348 KB min / ~104 KB gzip JS (tanpa React, tanpa recharts, tanpa
  SweetAlert).

## Konfigurasi Environment

Buat file `.env` di root proyek (jangan di-commit ke git):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Kedua variabel dibaca di `src/lib/supabaseClient.js`.

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
| `username` | text |
| `password` | text (lihat [Catatan Keamanan](#catatan-keamanan)) |
| `nama_lengkap` | text |
| `role` | text: `admin` / `petugas` |
| `id_layanan` | FK → `layanan.id_layanan`, nullable; `null` = petugas umum (semua layanan) |

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
├── public/
│   ├── logoinsunmedal.png
│   └── kantorlurahtalun.jpg
└── src/
    ├── main.ts              # Entry point
    ├── App.svelte           # SPA router custom + guard role + Toaster
    ├── app.css              # Tailwind v4 + tokens tema shadcn
    ├── lib/
    │   ├── supabaseClient.ts    # PostgrestClient + RealtimeClient + subscribeAntrian()
    │   ├── schemas.ts           # Skema Valibot (layanan, antrian, users)
    │   ├── queue.ts             # todayIso(), buildNomorAntrian()
    │   ├── session.ts           # Session localStorage (get/set/clear)
    │   ├── router.ts            # navigate() (pushState + popstate)
    │   ├── queue.test.ts        # Unit test Vitest
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

Setiap fakta di sana terverifikasi dari source code. Skema database ditandai **inferred**
karena tidak ada migrasi SQL di repo ini.

## Deployment (Vercel)

Proyek di-deploy ke Vercel sebagai SPA. File `vercel.json` berisi rewrite semua route
ke `/index.html`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Setel environment variable `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di
pengaturan proyek Vercel sebelum build.

## Status & Batasan yang Diketahui

- **Belum ada CI/CD configuration** di repository (kualitas dicek via script lokal:
  `npm run check`, `npm test`, `npm run lint`).
- **Print struk belum berfungsi** — Kiosk menampilkan "Sedang mencetak struk..." namun
  tidak ada implementasi pencetakan nyata (komponen `StrukAntrian` React dihapus saat
  migrasi).
- **Nomor antrian bisa dobel** saat dua permintaan bersamaan (count-then-insert
  non-atomic).
- **Komponen UI belum diuji** — test Vitest hanya mencakup logika murni
  (`queue.ts`, `schemas.ts`).

## Catatan Keamanan

Proyek ini dibuat untuk keperluan uji kompetensi dan **memiliki beberapa kelemahan
keamanan yang sudah diketahui**:

1. **Password tersimpan plaintext** dan dicek langsung dari browser
   (query `.eq("password", ...)` di client).
2. **Session menggunakan localStorage** yang mudah dipalsukan — tidak menggunakan
   Supabase Auth.
3. **Halaman Monitor publik** men-select semua kolom `users` (termasuk `password`)
   lewat join.
4. **Semua operasi data dari client memakai anon key** — keamanan bergantung penuh
   pada Row Level Security (RLS) di Supabase.
5. **`.env` pernah ter-commit** ke GitHub (anon key terekspos). Jangan commit ulang.
6. **Risiko stored XSS** pada modal SweetAlert (nilai input tidak di-escape).

Jangan mengubah hal di atas secara diam-diam; laporkan dan diskusikan dulu.

## Lisensi

Proyek ini dilisensikan di bawah **Apache License 2.0** — lihat file [LICENSE](LICENSE).

© 2026 — Proyek Ujikom SMKN 1 Sumedang.
