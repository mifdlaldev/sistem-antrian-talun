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
`waktu_selesai` — dalam **satu `db.batch`** dengan klaim berikutnya (transaksi atomik).

### Requirement: Panggil antrian berikutnya (klaim atomik)

Worker HARUS mengklaim baris `menunggu` hari ini urut `id_antrian` ASC via
**`UPDATE ... RETURNING` dengan subquery** (filter `id_layanan` jika petugas spesialis;
tanpa filter jika general) dalam batch yang sama. **Hanya satu petugas yang berhasil**
(yang kalah mendapat nol baris) — bebas double-panggil. Baris terpilih diset
`dilayani` + `id_user`, lalu broadcast. Response: `{ next }` atau `{ next: null }`.

### Requirement: Notifikasi

Berhasil memanggil → toast sukses "Memanggil {nomor_antrian}" via `svelte-sonner`.
Tidak ada antrian → toast info "Antrian Kosong".

### Requirement: Lewati no-show (skip)

`POST /api/antrian/skip` (petugas) HARUS menandai antrian `dilayani` milik petugas
sebagai `batal` + `waktu_batal`, lalu mengklaim antrian berikutnya (klaim atomik yang
sama dengan `next`). Response: `{ dilewati, next }`.

### Requirement: Panggil ulang (recall)

`POST /api/antrian/recall` (petugas) HARUS broadcast ulang tanpa mengubah data —
monitor menampilkan ulang nomor yang sedang dilayani.

### Requirement: Langganan realtime

Dashboard HARUS subscribe via `subscribeAntrian(cb)` (WebSocket ke Durable Object) dan
mem-fetch ulang statistik (sisa antrian, total selesai) pada setiap event.
Unsubscribe HARUS dipanggil saat unmount.
