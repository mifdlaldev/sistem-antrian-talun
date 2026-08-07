---
id: queue-hardening
title: Analisis Mendalam — Problem Flow & Solusi (Queue Hardening)
status: in-progress
---

# Change: Queue Hardening — Analisis Problem & Solusi

## Status Implementasi (diperbarui)

| Item | Status |
|---|---|
| P1 (INSERT...RETURNING) | ✅ Diimplementasikan |
| P2/P3 (klaim atomik + batch) | ✅ Diimplementasikan |
| P5 (cooldown IP 60s + client) | ✅ Diimplementasikan |
| P7 (totalMenunggu) | ✅ Diimplementasikan |
| P8 (GET /api/antrian/last) | ✅ Diimplementasikan |
| P9 (refetch on reconnect) | ✅ Diimplementasikan |
| P12 (zona WIB) | ✅ Diimplementasikan |
| P4 (rate limit WAF/Turnstile) | ⏳ Belum (config dashboard) |
| P13 (skip/batal/recall) | ⏳ Belum (butuh redesign status) |
| P10 (login rate limit) | ⏳ Belum (WAF dashboard) |
| P6, P11, P14, P15 | ⏳ Belum (prioritas rendah) |

## Context

Analisis mendalam alur sistem antrian (Kiosk → Monitor → Petugas → Admin) terhadap
skenario nyata: **>100 pengguna bersamaan**, navigasi antar halaman, pengambilan
nomor ganda, dan masalah operasional lainnya. Berbasis verifikasi kode aktual +
riset best practice (2026). Belum ada perubahan kode — dokumen ini adalah peta
masalah sebelum eksekusi.

## Metode

1. **Verifikasi kode**: `worker/src/routes/*.ts`, `worker/src/queue.ts`,
   `src/lib/realtime.ts`, `src/routes/Kiosk.svelte`, `Monitor.svelte`.
2. **Riset (you.com, 2026)**: manajemen antrian publik (no-show, skip/recall,
   visibilitas tunggu) & pencegahan abuse kiosk (rate limiting, Turnstile).

---

## Daftar Problem

### A. Kritikal — Data & Konkurensi

#### P1. Query-back nomor setelah INSERT bisa salah pengguna (race)
- **Lokasi**: `POST /api/antrian` (`worker/src/routes/antrian.ts`).
- **Akar**: INSERT atomik `MAX(SUBSTR(...))` **aman** (SQLite serialisasi single
  statement). TAPI setelah insert, response diambil via
  `SELECT nomor_antrian ... ORDER BY id_antrian DESC LIMIT 1`. Saat 2+ request
  paralel, query-back bisa mengembalikan nomor **antrian pengguna lain** (INSERT B
  commit sebelum SELECT A jalan).
- **Dampak**: 2 pengguna melihat nomor sama/salah. Ringan tapi krusial di jam ramai.
- **Solusi**: hapus query-back — gunakan **`INSERT ... RETURNING nomor_antrian`**
  (D1/SQLite mendukung) atau hitung nomor deterministik tanpa query kedua.
- **Prioritas**: **P0**.

#### P2. Race "call-next" antar petugas (double panggil)
- **Lokasi**: `POST /api/antrian/next`.
- **Akar**: baca antrian `menunggu` pertama (`SELECT ... LIMIT 1`) lalu `UPDATE`
  terpisah. Dua petugas klik bersamaan → keduanya dapat baris sama → double panggil.
- **Solusi**: klaim atomik satu statement —
  `UPDATE antrian SET status='dilayani', id_user=? WHERE id_antrian = (SELECT id_antrian FROM antrian WHERE status='menunggu' [AND id_layanan=?] ORDER BY id_antrian LIMIT 1) RETURNING *`
  — hanya satu petugas yang berhasil (changes=0 untuk yang kalah).
- **Prioritas**: **P0**.

#### P3. Selesai + panggil berikutnya tidak transaksional
- **Lokasi**: `POST /api/antrian/next`.
- **Akar**: set `selesai` lalu cari berikutnya sebagai dua operasi terpisah. Crash di
  tengah → antrian aktif tidak pernah selesai, antrian berikutnya tidak dipanggil.
- **Solusi**: bungkus dalam **satu batch D1** (`db.batch([...])` = satu transaksi)
  atau statement atomik.
- **Prioritas**: P1.

### B. Konkurensi >100 Pengguna & Skala

#### P4. Tanpa rate limiting pada endpoint publik
- **Lokasi**: `POST /api/antrian`, `POST /api/auth/login`.
- **Akar**: tidak ada proteksi — bot/skrip bisa spam nomor antrian atau brute-force
  login.
- **Riset**: praktik Cloudflare — rate limiting rule per IP + Turnstile (invisible)
  untuk form publik; login pakai tiered rate limit (gagal berulang → blokir).
- **Solusi (bertingkat)**:
  1. **Cloudflare WAF Rate Limiting** (config dashboard, gratis) untuk
     `/api/antrian` (mis. 10 req/menit/IP) & `/api/auth/login` (5 gagal/15 menit).
  2. **Turnstile invisible** di Kiosk (sebelum ambil nomor) — anti-bot tanpa
     mengganggu warga.
  3. Cooldown **per IP + per perangkat** (lihat P5).
- **Prioritas**: P1.

#### P5. Pengambilan nomor ganda tanpa kendali (1 orang = N nomor)
- **Lokasi**: `POST /api/antrian`.
- **Akar**: endpoint publik tanpa identitas, tanpa cooldown — satu orang bisa ambil
  nomor tak terbatas (layanan sama) → menyabot antrian & membingungkan petugas.
- **Pertanyaan keputusan** (perlu konfirmasi):
  1. **Cooldown perangkat/kiosk** — 1 nomor per layanan per X detik (mis. 30–60 dtk)
     per `CF-Connecting-IP` (+ localStorage timestap perangkat).
  2. **Identitas opsional** — input NIK opsional; 1 NIK = 1 nomor per layanan per
     hari (serupa antrian RS).
  3. **Bebas** — biarkan seperti sekarang (kiosk di kantor, pengawas ada).
- **Prioritas**: P1 (perlu keputusan user).

#### P6. Format nomor `%03d` terbatas 999/hari/layanan
- **Lokasi**: insert atomik (`printf('%s-%03d', ...)`).
- **Akar**: >999 warga untuk satu layanan sehari → `A-1000` (4 digit) merusak asumsi
  3 digit (padding + display).
- **Dampak**: tidak fatal (MAX parse tetap benar), tapi tampilan tidak konsisten.
- **Solusi**: `%04d` (KODE-0001) atau batas kuota layanan ("kuota penuh").
- **Prioritas**: P2 (skala kelurahan kecil, catat saja).

#### P7. Monitor tidak menampilkan total antrian / estimasi tunggu
- **Lokasi**: `GET /api/antrian/display` (LIMIT 5).
- **Akar**: hanya 5 berikutnya — warga tidak tahu total menunggu atau perkiraan waktu.
- **Riset**: visibilitas tunggu mengurangi kecemasan (NN/g, Qminder).
- **Solusi**: tambah `totalMenunggu` (+ `dilayaniCount`); tampil "X antrian lagi".
  Estimasi waktu (avg layanan × posisi) — opsional P2.
- **Prioritas**: P1.

### C. State & UX

#### P8. "Nomor Terakhir Diambil" hilang saat pindah halaman & antar kiosk tidak sinkron
- **Lokasi**: `Kiosk.svelte` — `antrianTerakhir` state lokal komponen.
- **Akar**: SPA unmount Kiosk saat pindah route → state hilang. Setiap perangkat
  kiosk hanya tahu nomor yang diambil di perangkat itu.
- **Solusi**: sumber kebenaran **server-side** — `GET /api/antrian/last` (nomor
  terakhir hari ini, `ORDER BY id_antrian DESC LIMIT 1`) + update via WebSocket
  (`subscribeAntrian`). "Nomor Terakhir" konsisten antar halaman & antar perangkat.
- **Prioritas**: **P0** (langsung terlihat user).

#### P9. WebSocket tidak refetch saat reconnect
- **Lokasi**: `src/lib/realtime.ts`.
- **Akar**: callback hanya dipicu `onmessage`. Jika WS putus lalu sambung ulang
  tanpa event baru, data bisa basi (mis. monitor diam saat koneksi drop).
- **Solusi**: refetch pada `onopen` (koneksi awal & reconnect) di samping `onmessage`.
- **Prioritas**: P1.

### D. Keamanan

#### P10. Login tanpa proteksi brute-force
- **Lokasi**: `POST /api/auth/login`.
- **Akar**: verifikasi PBKDF2 sudah baik, tapi tanpa rate limit per IP — bisa
  brute-force berulang.
- **Solusi**: rate limiting Cloudflare (5 gagal/15 menit/IP) + `Sleep`/jitter pada
  gagal. (Repo `survei-kepuasan-talun` sudah menerapkan pola ini.)
- **Prioritas**: P1.

#### P11. Default credentials seed
- **Lokasi**: `worker/migrations/0002_seed.sql`.
- **Akar**: `admin`/`admin123`, `petugas1`/`petugas123` diketahui publik (di repo).
- **Solusi**: ganti password via dashboard admin **sebelum** dipakai publik + catat
  di README. (Sudah tercatat; tetap prioritas operasional.)
- **Prioritas**: P1 (opsi).

### E. Data & Operasional

#### P12. Tanggal UTC vs WIB (perbedaan hari sekitar tengah malam)
- **Lokasi**: `worker/src/queue.ts` — `todayIso()` memakai
  `date.toISOString().slice(0,10)` (UTC).
- **Akar**: 00:00–07:00 WIB masih hari UTC sebelumnya → antrian masuk "hari kemarin"
  → tampilan/stats hari ini (WIB) tidak menampilkannya. Kantor buka 08:00 WIB,
  dampak kecil tapi nyata saat jam operasional awal/hari berbeda.
- **Solusi**: `todayIso()` hitung tanggal **Asia/Jakarta**:
  `new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date)`
  (format `YYYY-MM-DD`). Berlaku konsisten insert + display + stats.
- **Prioritas**: P1.

#### P13. Tidak ada skip/batal/recall (no-show)
- **Lokasi**: seluruh alur petugas.
- **Akar**: warga mengambil nomor lalu tidak hadir → antrian macet; petugas tidak
  bisa melewati nomor yang tidak datang atau memanggil ulang.
- **Riset**: sistem antrian profesional (Qminder, Vizitor) mencatat & menangani
  no-show, skip, recall.
- **Solusi**: status baru `batal` + aksi petugas: **Lewati** (skip → `batal` +
  panggil berikutnya) & **Panggil Ulang** (recall nomor dilayani). Log semua aksi.
- **Prioritas**: P1.

#### P14. Tidak ada jejak audit per antrian
- **Lokasi**: tabel `antrian` (hanya `waktu_selesai`).
- **Akar**: tidak tahu kapan nomor dibuat/dipanggil/diselesaikan/diskip (riwayat
  interaksi hilang).
- **Riset**: tiap interaksi token dicatat (kapan dibuat, dipanggil, selesai, no-show).
- **Solusi**: kolom `waktu_panggil`, `waktu_buat` (default `tanggal` saja saat ini —
  tambah timestamp), status `batal`; cukup untuk rekap & sengketa "saya diskip".
- **Prioritas**: P2.

#### P15. Tabel `antrian` tumbuh tanpa batas
- **Akar**: D1 free 5 GB; ratusan baris/hari — butuh bertahun-tahun untuk penuh,
  tapi data lama tidak berguna.
- **Solusi**: cron Worker harian hapus antrian `selesai/batal` > 90 hari (atau biarkan
  — catat sebagai trade-off).
- **Prioritas**: P3.

### F. Peningkatan (opsional, setelah P0-P1)

- Estimasi waktu tunggu (rata-rata durasi layanan × posisi).
- Cek status nomor via QR / halaman publik `/status` (nomor → posisi).
- Suara/panggilan TTS saat petugas memanggil (aksesibilitas lansia).
- Session cookie sliding expiration (12 jam diperpanjang saat aktif).

---

## Analisis "Handle Nomor >100 Pengguna" (jawaban langsung)

| Aspek | Kondisi sekarang | Verdict |
|---|---|---|
| **Uniknya nomor** | Insert atomik `MAX(SUBSTR)` per layanan+tanggal | ✅ **Aman** (SQLite serialisasi) |
| **Reset harian** | Berbasis `tanggal` | ✅ Aman (perbaiki zona WIB, P12) |
| **Nomor yang dikembalikan** | Query-back `DESC LIMIT 1` | ❌ Race (P1) → `RETURNING` |
| **Panggilan berikutnya** | Read-then-update | ❌ Race (P2) → klaim atomik |
| **Abuse/spam** | Tanpa proteksi | ❌ (P4/P5) → rate limit + Turnstile |
| **Visibilitas** | 5 menunggu saja | ⚠️ (P7) → total + estimasi |
| **No-show** | Tidak ada skip/recall | ❌ (P13) |

## Prioritas Eksekusi (usulan)

- **P0** (segera): P1 (RETURNING), P2 (klaim atomik), P8 (nomor terakhir server-side).
- **P1**: P3 (batch transaksi), P4 (rate limit + Turnstile), P7 (total menunggu),
  P9 (refetch on reconnect), P10 (login rate limit), P12 (zona WIB), P13 (skip/batal/recall),
  P5 (keputusan pengguna: cooldown/NIK/bebas).
- **P2**: P6 (format 4 digit), P11 (ganti seed), P14 (jejak audit).
- **P3**: P15 (cleanup antrian).

## Out of Scope (saat ini)

- Perubahan design visual (sudah selesai di design-overhaul).
- Pindah stack/arsitektur (sudah selesai di migrasi Cloudflare).
- Fitur non-antrian (pendaftaran akun publik, pembayaran, dll.).

## Acceptance Criteria (per item, ditentukan saat eksekusi)

- [ ] `POST /api/antrian` mengembalikan nomor benar di bawah 50 request paralel (stress test lokal).
- [ ] 2 petugas klik bersamaan → hanya 1 berhasil memanggil.
- [ ] "Nomor Terakhir Diambil" konsisten antar halaman/perangkat + update realtime.
- [ ] `POST /api/antrian` & login terlindungi rate limit (IP).
- [ ] Tanggal antrian benar menurut zona WIB.
- [ ] Petugas bisa skip (no-show) & panggil ulang.
- [ ] Test Vitest diperluas; svelte-check/biome tetap 0; bundle tetap ringan.
