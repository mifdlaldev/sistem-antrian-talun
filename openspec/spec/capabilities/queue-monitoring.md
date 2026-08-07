---
id: queue-monitoring
title: Monitor Display Realtime (TV)
---

## Description

Halaman publik `/monitor`. Menampilkan nomor antrian yang sedang dilayani, lima antrian
menunggu berikutnya, jam digital, dan running text. Ter-update otomatis via Durable Object WebSocket
Realtime (Postgres Changes) tanpa refresh manual.

## Scenario

Petugas memanggil antrian baru → perubahan pada tabel `antrian` → channel
`postgres_changes` menerima event → Monitor mem-fetch ulang → layar menampilkan nomor
baru secara realtime.

## Requirements

### Requirement: Data antrian yang sedang dilayani

Monitor HARUS mengambil antrian `dilayani` hari ini via `GET /api/antrian/display`
(Worker melakukan join server-side `layanan` + `users`, **hanya kolom yang dipilih** —
`password_hash` tidak pernah dikirim).

### Requirement: Daftar antrian menunggu

Monitor HARUS mengambil maksimal 5 baris `status: "menunggu"` hari ini, urut
`id_antrian` ascending (FIFO) — disediakan oleh endpoint display yang sama.

### Requirement: Langganan realtime

Monitor HARUS subscribe via `subscribeAntrian(cb)` dari `$lib/realtime` — WebSocket ke
`/api/realtime` (Durable Object `RealtimeHub`) — dan mem-fetch ulang data pada setiap
event. Auto-reconnect 3 detik. Unsubscribe HARUS dipanggil saat unmount.

### Requirement: Jam digital

Jam HARUS diperbarui setiap detik via `setInterval`, ditampilkan format `HH:mm:ss`;
tanggal diformat dengan `Intl.DateTimeFormat` locale `id-ID` (contoh "Jumat, 07 Agustus
2026").

### Requirement: Tampilan

Halaman HARUS menampilkan header berisi logo + identitas kelurahan, area utama berisi
gambar latar `kantorlurahtalun.jpg` + kartu "Panggilan Terakhir", daftar "Antrian
Selanjutnya", dan running text footer.
