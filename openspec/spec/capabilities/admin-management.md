---
id: admin-management
title: Manajemen Admin (Dashboard & CRUD)
---

## Description

Halaman `/admin/dashboard` (role `admin`). Menampilkan statistik harian + grafik
(Recharts), CRUD tabel `layanan`, dan CRUD tabel `users` (petugas) — semua interaksi
form via modal SweetAlert.

## Scenario

Admin membuka dashboard → melihat statistik & grafik → menambah layanan baru → mengedit
data petugas → menghapus layanan yang tidak lagi dipakai.

## Requirements

### Requirement: Statistik harian

Tab `home` HARUS menampilkan jumlah antrian hari ini (`tanggal = today`): total,
`menunggu`, dan `selesai` (count queries `head: true`).

### Requirement: Grafik

Tab `home` HARUS menampilkan grafik tren 7 hari terakhir (recharts) dan distribusi
antrian per layanan hari ini.

### Requirement: CRUD layanan

Insert/update/delete tabel `layanan` via modal SweetAlert:
- Tambah: `nama_layanan` + `kode_huruf` wajib, `deskripsi` opsional.
- Edit: form diisi nilai saat ini.
- Hapus: ditolak oleh Supabase jika layanan masih punya baris `antrian` (FK) —
  pesan error ditampilkan.

### Requirement: CRUD petugas (users)

Insert/update/delete tabel `users` via modal SweetAlert:
- Tambah user HARUS hardcode `role: "petugas"`; `id_layanan` dari dropdown (kosong =
  `null` = general).
- Password disimpan **plaintext**.
- Edit: password hanya di-update jika admin mengisi kolom password baru.
- Hapus: konfirmasi SweetAlert, lalu delete.

### Requirement: Data join layanan

Daftar petugas HARUS diambil dengan join nama layanan
(`.select("*, layanan(nama_layanan)")`).

### Requirement: Risiko stored XSS (jangan ditiru)

Modal edit HARUS meng-interpolasi nilai input pengguna (misal
`value="${item.nama_layanan}"`, `value="${user.username}"`) ke template `html:`
SweetAlert **tanpa escape**. Ini risiko stored XSS terdokumentasi. Kode baru DILARANG
mengikuti pola ini.

### Requirement: Logout

Tombol keluar HARUS konfirmasi via SweetAlert, lalu `localStorage.removeItem` +
redirect `/login`.
