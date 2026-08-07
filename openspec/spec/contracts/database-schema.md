---
id: database-schema
title: Skema Database D1 (Cloudflare)
---

## Description

Skema database **Cloudflare D1** (SQLite) — definisi otoritatif di
`worker/migrations/0001_init.sql` (skema) dan `0002_seed.sql` (seed). Semua akses
database hanya terjadi **server-side di Worker** (binding `DB`); browser tidak pernah
menyentuh DB langsung.

## Table: layanan

| Field | Type | Required | Notes |
|---|---|---|---|
| `id_layanan` | INTEGER | ya | Primary key AUTOINCREMENT |
| `nama_layanan` | TEXT | ya | Contoh: "Layanan KTP & KK" |
| `kode_huruf` | TEXT | ya | Satu huruf (contoh "A") — prefix nomor antrian |
| `deskripsi` | TEXT | tidak | Opsional |

## Table: antrian

| Field | Type | Required | Notes |
|---|---|---|---|
| `id_antrian` | INTEGER | ya | Primary key AUTOINCREMENT, urutan FIFO |
| `nomor_antrian` | TEXT | ya | Format `KODE-001` (contoh `A-001`) |
| `id_layanan` | INTEGER | ya | Foreign key → `layanan.id_layanan` |
| `id_user` | INTEGER | tidak | FK → `users.id_user`; diisi petugas yang melayani |
| `status` | TEXT | ya | `menunggu` \| `dilayani` \| `selesai` (CHECK) |
| `tanggal` | TEXT | ya | ISO `YYYY-MM-DD` (**zona WIB**, `todayIso()`) |
| `waktu_selesai` | TEXT | tidak | ISO timestamp, diisi saat status → `selesai` |
| `ip` | TEXT | tidak | IP pengambil (`CF-Connecting-IP`) — untuk cooldown anti-duplikat |
| `waktu_buat` | INTEGER | tidak | Epoch ms saat nomor dibuat — untuk cooldown & audit |

Index: `antrian(tanggal)`, `antrian(status)`, `antrian(id_layanan, tanggal)`.

## Table: users

| Field | Type | Required | Notes |
|---|---|---|---|
| `id_user` | INTEGER | ya | Primary key AUTOINCREMENT |
| `username` | TEXT | ya | UNIQUE |
| `password_hash` | TEXT | ya | **PBKDF2-SHA256** format `pbkdf2:sha256:iterasi:salt:hash` |
| `nama_lengkap` | TEXT | ya | |
| `role` | TEXT | ya | `admin` \| `petugas` (CHECK) |
| `id_layanan` | INTEGER | tidak | FK → `layanan.id_layanan`; `null` = petugas general |

## Seed (`0002_seed.sql`)

`admin`/`admin123` (role admin), `petugas1`/`petugas123` (petugas, layanan A).
**Default credentials — WAJIB diganti setelah deploy.**

## Catatan Query (Worker)

- `POST /api/antrian`: insert **atomik satu statement** + `RETURNING nomor_antrian`
  (`MAX(SUBSTR(nomor_antrian, 3))` per layanan+tanggal) — tanpa race, tanpa query-back.
- `POST /api/antrian`: **cooldown 60 detik per IP per layanan** (kolom `ip` +
  `waktu_buat`) → 429.
- `POST /api/antrian/next`: selesaikan aktif + **klaim atomik**
  `UPDATE ... RETURNING` dalam satu `db.batch` — hanya satu petugas yang menang.
- `GET /api/antrian/display`: join `layanan` + `users` (projection server-side,
  `password_hash` tidak pernah dikirim) + `totalMenunggu`.
- `GET /api/users`: `LEFT JOIN layanan` untuk nama layanan tugas.
