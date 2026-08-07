---
id: queue-monitoring
title: Monitor Display Realtime (TV)
---

## Description

Halaman publik `/monitor`. Menampilkan nomor antrian yang sedang dilayani, lima antrian
menunggu berikutnya, jam digital, dan running text. Ter-update otomatis via Supabase
Realtime (Postgres Changes) tanpa refresh manual.

## Scenario

Petugas memanggil antrian baru → perubahan pada tabel `antrian` → channel
`postgres_changes` menerima event → Monitor mem-fetch ulang → layar menampilkan nomor
baru secara realtime.

## Requirements

### Requirement: Data antrian yang sedang dilayani

Monitor HARUS mengambil antrian `dilayani` hari ini via
`.from("antrian").select("*, layanan(*), users(*)").eq("status", "dilayani")
.eq("tanggal", today).order("waktu_selesai", { ascending: false })`.
CATATAN: join `users(*)` mengembalikan **semua kolom `users` termasuk `password`** ke
halaman publik — kerentanan terdokumentasi, jangan ditiru.

### Requirement: Daftar antrian menunggu

Monitor HARUS mengambil maksimal 5 baris `status: "menunggu"` hari ini, urut
`id_antrian` ascending (FIFO), via `.select("*, layanan(*)")`.

### Requirement: Langganan realtime

Monitor HARUS subscribe `supabase.channel("public:antrian")` dengan
`.on("postgres_changes", { event: "*", schema: "public", table: "antrian" }, ...)`
dan mem-fetch ulang data pada setiap perubahan. Channel HARUS di-remove saat unmount
(`supabase.removeChannel`).

### Requirement: Jam digital

Jam HARUS diperbarui setiap detik via `setInterval`, ditampilkan format `HH:mm:ss`;
tanggal diformat dengan `date-fns` locale `id` (contoh "Jumat, 07 Agustus 2026").

### Requirement: Tampilan

Halaman HARUS menampilkan header berisi logo + identitas kelurahan, area utama berisi
gambar latar `kantorlurahtalun.jpg` + kartu "Panggilan Terakhir", daftar "Antrian
Selanjutnya", dan running text footer.
