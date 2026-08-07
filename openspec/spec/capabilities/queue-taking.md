---
id: queue-taking
title: Pengambilan Nomor Antrian (Kiosk)
---

## Description

Halaman publik `/` (Kiosk). Pengunjung memilih layanan dari tabel `layanan`; sistem
membuat baris baru di tabel `antrian` dengan nomor urut harian per layanan, lalu
menampilkan nomor dalam popup SweetAlert.

## Scenario

Pengunjung membuka halaman utama → daftar layanan dimuat dari Supabase → menekan tombol
layanan → sistem menghitung antrian hari ini untuk layanan itu → membuat nomor baru
(format `KODE-001`) → menyimpan ke tabel `antrian` → menampilkan popup "Berhasil".

## Requirements

### Requirement: Daftar layanan dimuat dari Supabase

Kiosk HARUS memuat semua baris `layanan` urut `id_layanan` ascending saat halaman
dibuka (`onMount` + `supabase.from("layanan").select("*").order("id_layanan")`).
Loading state ditampilkan selama fetch.

### Requirement: Penghitungan nomor antrian per hari per layanan

Sistem HARUS menghitung jumlah baris `antrian` hari ini untuk layanan terpilih
(`.eq("id_layanan", X).gte("tanggal", today)`) lalu `urutan = count + 1`.
Ini count-then-insert **non-atomic** — nomor dobel mungkin terjadi saat dua permintaan
bersamaan. DILARANG mengklaim race-safe.

### Requirement: Format nomor antrian

Nomor HARUS berbentuk `${layanan.kode_huruf}-${String(urutan).padStart(3, "0")}`
(contoh `A-001`).

### Requirement: Insert baris antrian

Baris baru HARUS berisi `nomor_antrian`, `id_layanan`, `status: "menunggu"`,
`tanggal: today` (string ISO `YYYY-MM-DD` dari `new Date().toISOString().split("T")[0]`).

### Requirement: Popup hasil

Popup shadcn `Dialog` HARUS menampilkan nomor antrian, nama layanan, dan teks
"Sedang mencetak struk...". Teks tersebut adalah **placeholder** — tidak ada pencetakan
nyata.
