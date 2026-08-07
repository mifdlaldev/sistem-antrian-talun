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
| React 19 | UI framework |
| Vite 7 | Build tool & dev server |
| Tailwind CSS v4 | Styling (konfigurasi CSS-first via `@theme`) |
| React Router 7 | Routing SPA |
| Supabase | Backend: PostgreSQL + Realtime + JS Client (anon key) |
| SweetAlert2 | Modal & notifikasi |
| Recharts | Grafik dashboard admin |
| date-fns | Format tanggal (locale `id`) |
| lucide-react | Icon |

## Persyaratan

- Node.js (npm) — versi yang mendukung Vite 7
- Proyek Supabase dengan tabel `layanan`, `antrian`, dan `users` (lihat [Skema Database](#skema-database))

## Cara Menjalankan

```bash
npm install        # install dependencies
npm run dev        # jalankan dev server (Vite)
npm run build      # build produksi (output: dist/)
npm run preview    # preview hasil build
npm run lint       # jalankan ESLint
```

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
├── public/
│   ├── logoinsunmedal.png
│   └── kantorlurahtalun.jpg
└── src/
    ├── main.jsx
    ├── App.jsx            # Definisi routing
    ├── index.css          # Tailwind v4 + custom classes
    ├── lib/
    │   └── supabaseClient.js
    ├── data/
    │   └── mockData.js    # (belum dipakai)
    ├── components/
    │   ├── ProtectedRoute.jsx
    │   └── StrukAntrian.jsx   # (belum dipakai)
    └── pages/
        ├── public/   # Kiosk, Monitor, Login
        └── admin/    # AdminDashboard, PetugasDashboard
```

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

- **Belum ada tes otomatis** dan **belum ada CI/CD configuration** di repository.
- **Print struk belum berfungsi** — Kiosk menampilkan "Sedang mencetak struk..." namun
  komponen `StrukAntrian` & pustaka `react-to-print` belum dihubungkan (belum ter-wire).
- **Nomor antrian bisa dobel** saat dua permintaan bersamaan (count-then-insert
  non-atomic).
- **Dependency yang belum terpakai:** `axios`, `react-to-print`, `src/data/mockData.js`,
  `src/components/StrukAntrian.jsx`.

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
