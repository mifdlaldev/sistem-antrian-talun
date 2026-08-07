---
id: admin-management
title: Manajemen Admin (Dashboard & CRUD)
---

## Description

Halaman `/admin/dashboard` (role `admin`). Menampilkan statistik harian + grafik
(bar chart SVG zero-dependency), CRUD tabel `layanan`, dan CRUD tabel `users`
(petugas) — semua interaksi form via shadcn `Dialog`/`AlertDialog`.

## Scenario

Admin membuka dashboard → melihat statistik & grafik → menambah layanan baru → mengedit
data petugas → menghapus layanan yang tidak lagi dipakai.

## Requirements

### Requirement: Statistik harian

Tab `home` HARUS menampilkan jumlah antrian hari ini (`tanggal = today`): total,
`menunggu`, dan `selesai` — dari `GET /api/stats/dashboard` (role admin).

### Requirement: Grafik

Tab `home` HARUS menampilkan grafik tren 7 hari terakhir dan distribusi antrian per
layanan hari ini — **zero-dependency SVG** (`BarChart.svelte`), bukan recharts.

### Requirement: CRUD layanan

CRUD via API admin-only (`POST/PUT/DELETE /api/layanan`) dengan shadcn `Dialog`:
- Tambah: `nama_layanan` + `kode_huruf` wajib, `deskripsi` opsional.
- Edit: form diisi nilai saat ini.
- Hapus: ditolak Worker (409) jika layanan masih punya baris `antrian` (FK) —
  pesan error ditampilkan via toast.

### Requirement: CRUD petugas (users)

CRUD via API admin-only (`/api/users`) dengan shadcn `Dialog`:
- Tambah user HARUS hardcode `role: "petugas"`; `id_layanan` dari `NativeSelect`
  (kosong = `null` = general).
- Password di-hash **PBKDF2 server-side** (`hashPassword` di Worker).
- Edit: password hanya di-update jika admin mengisi kolom password baru.
- Hapus: konfirmasi `AlertDialog`, lalu delete.

### Requirement: Data join layanan

Daftar petugas HARUS diambil dari `GET /api/users` (Worker melakukan
`LEFT JOIN layanan` untuk nama layanan tugas).

### Requirement: Risiko stored XSS (jangan ditiru)

Versi React lama meng-interpolasi nilai input pengguna ke template `html:` SweetAlert
tanpa escape. Migrasi Svelte TIDAK mengikuti pola ini — form memakai `bind:value` ke
state, dan data ditampilkan sebagai teks ter-escape otomatis oleh Svelte. Kode baru
DILARANG meng-interpolasi input pengguna sebagai HTML mentah.

### Requirement: Logout

Tombol keluar HARUS `clearSession()` + redirect `/login`.
