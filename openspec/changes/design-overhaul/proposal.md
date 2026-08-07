---
id: design-overhaul
title: Perombakan Design — Identitas Pemerintahan Profesional
status: draft
---

# Change: Design Overhaul — Identitas Pemerintahan yang Profesional & Tegas

## Context

Design saat ini (theme emerald/slate) berasal dari iterasi awal tanpa riset. Tujuan:
**profesional, tegas, cocok untuk instansi pemerintahan, UI bagus, UX nyaman**.
Stack design sudah siap: Svelte 5 + shadcn-svelte + Tailwind v4 — semua visual dikendalikan
via CSS tokens di `src/app.css` (shadcn theme variables) + utility classes di tiap halaman.

Behavior, data, API **tidak berubah** — ini murni perombakan visual (token layer + layout
per halaman).

## Research Summary (you.com, 2026)

### 1. Design system pemerintahan (global)
- GOV.UK / USWDS: aksesibel (WCAG 2.1/2.2 **AA**), task-oriented, konsisten, berbasis
  token, mobile-friendly, membangun kepercayaan publik.
- WCAG 2.1 AA sudah menjadi keharusan hukum untuk layanan publik (ADA/Section 508,
  EAA EU). Kontras teks normal **4.5:1**, teks besar/komponen **3:1**.

### 2. Identitas visual pemerintahan Indonesia
- **Biru tua (navy) + kuning emas** adalah identitas resmi (Kemenkum): biru tua =
  amanah, keamanan, keteraturan, kepercayaan diri, inovasi; emas = keagungan,
  keluhuran, kewibawaan.
- Font identitas: **Poppins** (logo kementerian memakai Poppins bold).
- Portal instansi baik (Kemenkeu, DKI Jakarta, Kemenkes): bersih, formal, terstruktur,
  tanpa dekorasi berlebihan.

### 3. UX kiosk antrian
- Target sentuh besar, batasi jumlah pilihan per layar, **konfirmasi visual** setelah
  tiap langkah, minimal tap.
- Layar terbaca dari jarak 2–3 kaki (kiosk) dan jauh (display ruang tunggu).
- Prioritas aksesibilitas: lansia, low vision, keyboard/AT.

### 4. Warna & tipografi
- Navy di atas putih: kontras **16.01:1** (jauh di atas AAA 7:1) — otoritatif.
- Emas terbaik sebagai **aksen minimal** (rule, badge, angka di atas navy, border) —
  bukan teks kecil di atas putih (gagal kontras).
- 3–5 warna inti: primary + 1–2 aksen + netral.
- Hindari `#000` murni untuk bidang besar (gunakan navy/charcoal — kurangi eye strain).
- Angka pakai **tabular-nums** agar sejajar (penting untuk nomor antrian).

## Design Direction (keputusan terukur)

### 1. Palet (via shadcn tokens di `src/app.css`)

| Token | Nilai | Fungsi | Kontras |
|---|---|---|---|
| `--primary` | navy `#1e3a8a` | Tombol utama, header, sidebar aktif | putih di atasnya ≥9:1 (AA) |
| `--primary-hover` | navy lebih tua `#172e6e` | Hover state | — |
| `--accent` | gold `#d4a017` | Aktif state, badge, angka antrian | navy ≥5:1 (AA besar) |
| `--background` | putih `#ffffff` | Surface utama | — |
| `--muted` | slate-100 `#f1f5f9` | Surface sekunder, kartu | — |
| `--muted-foreground` | slate-600 `#475569` | Teks sekunder | ≥4.5:1 di atas putih |
| `--destructive` | red-600 `#dc2626` | Hapus/danger | putih ≥4.5:1 |
| `--ring` | gold/navy | Focus ring | terlihat jelas |

Chart: family biru (primary) + emas + slate, bukan rainbow.

### 2. Tipografi
- **Poppins** (Google Fonts, `display=swap`) — heading (600–800), label, nomor antrian.
- Body: system-ui (performa — tanpa web font untuk paragraf panjang).
- Angka antrian: `font-variant-numeric: tabular-nums` + `tracking-tight`.
- Skala: nomor dilayani `text-7xl`–`text-9xl` (monitor); nomor kiosk `text-6xl`;
  heading halaman `text-2xl`–`text-3xl` bold; label `text-xs` uppercase tracking-wide.

### 3. Per-halaman (design only)

**Kiosk (`/`)** — tujuan: selesai dalam ≤3 tap, dipakai lansia.
- Header band navy dengan logo + identitas; tombol "Monitor Display" gold outline.
- Kartu layanan besar: target sentuh tinggi ≥64px, kode huruf besar (gold, tebal),
  nama layanan bold, deskripsi 1–2 baris.
- Dialog sukses: nomor **text-6xl bold navy** di atas panel emas, nama layanan,
  "Sedang mencetak struk..." (tetap placeholder).
- Card "Nomor Terakhir" — angka besar tabular.

**Monitor (`/monitor`)** — tujuan: terbaca dari jarak jauh, kewibawaan.
- Latar **navy gelap** (`#0f1b3d` family) dengan header emas.
- Nomor dilayani: **putih `text-8xl` + badge emas** di atas panel gelap (kontras
  tinggi, bukan card putih — hindari glare).
- List "Antrian Selanjutnya": kartu semi-transparan putih/10, nomor emas tabular.
- Running text putih di footer navy; jam digital putih besar.

**Login (`/login`)** — tujuan: formal, fokus.
- Card putih terpusat di atas latar navy-tinted; header band navy dengan logo;
  tombol submit navy solid; pesan error toast.

**Admin (`/admin/dashboard`)** — tujuan: tegas, data jelas.
- Sidebar **navy** (dari slate-900), item aktif **gold**, item idle putih/70.
- Stat card: angka besar navy/gold sesuai makna; chart bar navy-gold.
- Tabel bersih: header muted, baris hover ringan; tombol aksi outline navy,
  delete destructive.

**Petugas (`/petugas/dashboard`)** — tujuan: fokus satu aksi.
- Navbar putih dengan identitas; nomor panggilan **`text-8xl` navy tabular**.
- CTA "PANGGIL ANTRIAN"/"SELESAI & LANJUT": **navy solid** (utama) — emas hanya
  aksen kecil (ikon/tag layanan).

### 4. Aksesibilitas (WCAG 2.1 AA)
- Kontras teks ≥4.5:1; komponen/ikon penting ≥3:1; focus ring selalu terlihat.
- Target sentuh ≥44×44px (kiosk ≥64px).
- Nomor antrian `tabular-nums`; teks tidak dipotong (line-clamp aman).
- svelte-check a11y tetap 0 error (sudah enforced).

### 5. Komponen
- Semua perubahan dasar lewat tokens (button, badge, card, table, dialog, input) —
  tanpa menulis ulang komponen shadcn.
- Ikon `@lucide/svelte/icons` konsisten; stroke 2.

## Spec Changes

- `contracts/design-tokens.md` (BARU) — tabel token warna, tipografi, radius, spacing.
- Capabilities: hanya catatan visual per halaman (behavior & skema TIDAK berubah).

## Out of Scope

- Behavior/flow aplikasi (logika antrian, auth, realtime) — tetap.
- Struktur data, API, schema D1 — tetap.
- Penggantian framework/library UI.

## Acceptance Criteria

- [ ] Semua pasangan teks/latar lulus kontras WCAG AA (≥4.5:1 teks normal, ≥3:1 besar).
- [ ] Nomor antrian memakai `tabular-nums`, terbaca dari ≥3 m (monitor) dan 2–3 kaki (kiosk).
- [ ] Kiosk selesai dalam ≤3 tap; target sentuh ≥64px; aksesibel lansia.
- [ ] Semua halaman memakai token konsisten (tidak ada warna hardcode liar).
- [ ] Bundle tetap ringan (Poppins via swap; tanpa dependency UI baru).
- [ ] svelte-check 0 error/0 warning; behavior tidak berubah (test Vitest tetap hijau).

## Effort Estimate

- Token layer + font: kecil (1 file utama `src/app.css` + index.html font link).
- Layout per halaman: 5 halaman × sedang.
- QA aksesibilitas/kontras: menengah.
