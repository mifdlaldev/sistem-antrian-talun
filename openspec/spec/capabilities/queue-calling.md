---
id: queue-calling
title: Pemanggilan Antrian (Dashboard Petugas)
---

## Description

Halaman `/petugas/dashboard` (role `petugas`). Satu tombol untuk menyelesaikan antrian
aktif milik petugas lalu memanggil antrian berikutnya (FIFO), dengan filter layanan
untuk petugas spesialis.

## Scenario

Petugas menekan "PANGGIL ANTRIAN" → antrian aktif miliknya diset `selesai` +
`waktu_selesai` → baris `menunggu` pertama (urut `id_antrian`, difilter layanan jika
spesialis) diset `dilayani` + `id_user` petugas → statistik dashboard ter-update via
realtime.

## Requirements

### Requirement: Identitas petugas dari localStorage

Petugas HARUS dibaca dari `localStorage["user_session"]` saat halaman dimuat
(`id_user`, `nama_lengkap`, `id_layanan`). Jika tidak ada session → redirect `/login`.
CATATAN: session berbasis localStorage dan forgeable — kerentanan terdokumentasi.

### Requirement: Nama penugasan layanan

Dashboard HARUS menampilkan nama layanan tugas: jika `id_layanan` terisi → nama layanan
tersebut; jika `null` → "SEMUA LAYANAN".

### Requirement: Selesaikan antrian aktif

Jika ada baris `antrian` ber-`status: "dilayani"` dengan `id_user` = petugas ini, sistem
HARUS set `status: "selesai"` dan `waktu_selesai: new Date()`.

### Requirement: Panggil antrian berikutnya

Sistem HARUS mengambil baris `menunggu` hari ini urut `id_antrian` ASC, limit 1.
Jika petugas spesialis (`id_layanan` tidak null) → filter `id_layanan` sama dengan
penugasan. Jika petugas general (`id_layanan` null) → tanpa filter layanan. Baris
terpilih HARUS diset `status: "dilayani"` dan `id_user: petugas.id`.

### Requirement: Notifikasi

Berhasil memanggil → toast sukses "Memanggil {nomor_antrian}" via `svelte-sonner`.
Tidak ada antrian → toast info "Antrian Kosong".

### Requirement: Langganan realtime

Dashboard HARUS subscribe via `subscribeAntrian("dashboard-petugas", cb)` dan
mem-fetch ulang statistik (sisa antrian, total selesai) pada setiap perubahan.
Unsubscribe HARUS dipanggil saat unmount.
