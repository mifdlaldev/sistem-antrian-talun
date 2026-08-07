---
id: queue-taking
title: Pengambilan Nomor Antrian (Kiosk)
---

## Description

Halaman publik `/` (Kiosk). Pengunjung memilih layanan dari tabel `layanan`; sistem
membuat baris baru di tabel `antrian` dengan nomor urut harian per layanan, lalu
menampilkan nomor dalam popup SweetAlert.

## Scenario

Pengunjung membuka halaman utama → daftar layanan dimuat dari API → menekan tombol
layanan → sistem menghitung antrian hari ini untuk layanan itu → membuat nomor baru
(format `KODE-001`) → menyimpan ke tabel `antrian` → menampilkan popup "Berhasil".

## Requirements

### Requirement: Daftar layanan dimuat dari API

Kiosk HARUS memuat semua baris `layanan` urut `id_layanan` ascending saat halaman
dibuka (`onMount` + `api.get('/api/layanan')`). Loading state ditampilkan selama fetch.

### Requirement: Penghitungan nomor antrian (server-side, atomik)

Nomor antrian HARUS dihitung **di Worker** (`POST /api/antrian`) dengan **insert atomik
satu statement + `RETURNING nomor_antrian`** — nomor dari `MAX(SUBSTR(nomor_antrian, 3))`
per layanan+tanggal, dikembalikan langsung tanpa query-back (bebas race).

### Requirement: Cooldown anti-duplikat

Worker HARUS menerapkan **cooldown 60 detik per IP per layanan** (`CF-Connecting-IP`,
kolom `ip` + `waktu_buat`): jika ada pengambilan dari IP sama untuk layanan sama dalam
60 detik → response **429** dengan pesan tunggu. Client HARUS punya cooldown
localStorage serupa (pesan "Mohon tunggu X detik").

### Requirement: Format nomor antrian

Nomor HARUS berbentuk `buildNomorAntrian(kode_huruf, urutan)` di `worker/src/queue.ts`
→ `${kodeHuruf}-${String(urutan).padStart(3, "0")}` (contoh `A-001`).

### Requirement: Insert baris antrian

Worker HARUS menyimpan `nomor_antrian`, `id_layanan`, `status: "menunggu"`,
`tanggal` (ISO `YYYY-MM-DD` UTC via `todayIso()`), lalu broadcast ke realtime hub.
Response: `{ nomor_antrian, nama_layanan }`.

### Requirement: Popup hasil

Popup shadcn `Dialog` HARUS menampilkan nomor antrian, nama layanan, dan teks
"Sedang mencetak struk...". Teks tersebut adalah **placeholder** — tidak ada pencetakan
nyata.
