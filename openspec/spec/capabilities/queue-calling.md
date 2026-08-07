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

### Requirement: Identitas petugas dari session cookie

Petugas HARUS didapat dari `GET /api/auth/me` (cookie httpOnly) saat halaman dimuat
(`id_user`, `nama_lengkap`, `id_layanan`). Jika tidak ada session → redirect `/login`.

### Requirement: Nama penugasan layanan

Dashboard HARUS menampilkan nama layanan tugas dari `GET /api/antrian/petugas`:
jika `id_layanan` terisi → nama layanan tersebut; jika `null` → "SEMUA LAYANAN".

### Requirement: Selesaikan antrian aktif

`POST /api/antrian/next` (Worker, role petugas): jika ada baris `antrian`
ber-`status: "dilayani"` dengan `id_user` = petugas ini, set `status: "selesai"` dan
`waktu_selesai`.

### Requirement: Panggil antrian berikutnya

Worker HARUS mengambil baris `menunggu` hari ini urut `id_antrian` ASC, limit 1.
Jika petugas spesialis (`id_layanan` tidak null) → filter `id_layanan` sama dengan
penugasan. Jika petugas general (`id_layanan` null) → tanpa filter layanan. Baris
terpilih diset `status: "dilayani"` dan `id_user` petugas, lalu broadcast realtime.
Response: `{ next }` atau `{ next: null }`.

### Requirement: Notifikasi

Berhasil memanggil → toast sukses "Memanggil {nomor_antrian}" via `svelte-sonner`.
Tidak ada antrian → toast info "Antrian Kosong".

### Requirement: Langganan realtime

Dashboard HARUS subscribe via `subscribeAntrian(cb)` (WebSocket ke Durable Object) dan
mem-fetch ulang statistik (sisa antrian, total selesai) pada setiap event.
Unsubscribe HARUS dipanggil saat unmount.
