---
id: database-schema
title: Skema Database Supabase
---

## Description

Skema tabel Supabase (PostgreSQL, schema `public`) yang digunakan aplikasi.
**INFERRED dari query Supabase di source code — tidak ada migrasi SQL di repository
ini.** Untuk skema otoritatif, periksa langsung di dashboard Supabase project.

## Table: layanan

| Field | Type | Required | Notes |
|---|---|---|---|
| `id_layanan` | int | ya | Primary key, diurutkan ascending |
| `nama_layanan` | text | ya | Contoh: "Layanan KTP & KK" |
| `kode_huruf` | text | ya | Satu huruf (contoh "A") — prefix nomor antrian |
| `deskripsi` | text | tidak | Opsional |

## Table: antrian

| Field | Type | Required | Notes |
|---|---|---|---|
| `id_antrian` | int | ya | Primary key, urutan FIFO |
| `nomor_antrian` | text | ya | Format `KODE-001` (contoh `A-001`) |
| `id_layanan` | int | ya | Foreign key → `layanan.id_layanan` |
| `id_user` | int | tidak | Foreign key → `users.id_user`; diisi petugas yang melayani |
| `status` | text | ya | `menunggu` \| `dilayani` \| `selesai` |
| `tanggal` | date | ya | String ISO `YYYY-MM-DD` (UTC) |
| `waktu_selesai` | timestamp | tidak | Diisi saat status → `selesai` |

## Table: users

| Field | Type | Required | Notes |
|---|---|---|---|
| `id_user` | int | ya | Primary key |
| `username` | text | ya | |
| `password` | text | ya | **PLAINTEXT** — jangan klaim ter-hash |
| `nama_lengkap` | text | ya | |
| `role` | text | ya | `admin` \| `petugas` |
| `id_layanan` | int | tidak | FK → `layanan.id_layanan`; `null` = petugas general |

## Catatan Referensi Query

- `Monitor.svelte`: `.select("*, layanan(*), users(*)")` — join `users(*)` mengembalikan
  semua kolom `users` (termasuk `password`) ke halaman publik.
- `AdminDashboard.svelte`: `.select("*, layanan(nama_layanan)")` untuk daftar petugas.
- `Kiosk.svelte`: insert antrian dengan `id_layanan`, `nomor_antrian`, `status`,
  `tanggal` — tanpa `id_user` (diisi belakangan oleh petugas).
- Client query: `@supabase/postgrest-js` (`PostgrestClient`), realtime via
  `@supabase/realtime-js` (`subscribeAntrian`).
