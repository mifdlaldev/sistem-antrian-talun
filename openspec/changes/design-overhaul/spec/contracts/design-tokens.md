---
id: design-tokens
title: Design Tokens — Identitas Pemerintahan (Navy + Gold)
---

# Contract: Design Tokens

Desain token tunggal untuk seluruh UI. Diimplementasikan sebagai CSS variables shadcn
di `src/app.css` + utility Tailwind. Berbasis riset: identitas pemerintahan Indonesia
(biru tua + emas, Kemenkum) dan WCAG 2.1 AA.

## Warna

### Primary (Navy) — kepercayaan, ketertiban, tegas

| Token | Nilai | Penggunaan |
|---|---|---|
| `--primary` | `oklch(0.33 0.14 260)` ≈ `#1e3a8a` | Tombol utama, header, sidebar, link |
| `--primary-foreground` | `#ffffff` | Teks di atas primary (kontras ≥9:1) |
| `--primary-hover` | `#172e6e` | Hover tombol utama |
| `--primary-soft` | navy-50 `#eff6ff`-ish | Background panel header, chip ringan |

### Accent (Gold) — kewibawaan, aksen minimal

| Token | Nilai | Penggunaan |
|---|---|---|
| `--accent` | `#d4a017` | Badge aktif, angka di atas navy, border aksen |
| `--accent-foreground` | navy `#1e3a8a` | Teks di atas permukaan emas (kontras ≥5:1) |
| `--accent-soft` | emas 12% di atas navy | Chip "dilayani", highlight |

> Larangan: teks kecil emas di atas putih (gagal kontras). Emas untuk aksen/angka
> di atas navy atau fill dengan teks navy.

### Surface & Netral (Slate)

| Token | Nilai | Penggunaan |
|---|---|---|
| `--background` | `#ffffff` | Surface utama |
| `--foreground` | slate-900 `#0f172a` | Teks utama (≥12:1 di atas putih) |
| `--card` | `#ffffff` | Kartu |
| `--muted` | slate-100 `#f1f5f9` | Surface sekunder, hover |
| `--muted-foreground` | slate-600 `#475569` | Teks sekunder (≥4.5:1) |
| `--border` | slate-200 `#e2e8f0` | Border (≥3:1 vs latar) |
| `--input` | slate-200 | Field input |
| `--ring` | gold `#d4a017` | Focus ring (terlihat di navy & putih) |

### Semantik

| Token | Nilai | Penggunaan |
|---|---|---|
| `--destructive` | red-600 `#dc2626` | Hapus, danger (foreground putih ≥4.5:1) |
| `--success` | green-600 `#16a34a` | Toast sukses, status selesai |
| `--warning` | amber-500 `#f59e0b` | Menunggu, peringatan |

### Chart (bar chart SVG)

Urutan: `#1e3a8a` (navy), `#d4a017` (gold), `#64748b` (slate), `#3b82f6` (blue-500),
`#a8a29e` (stone). Hindari rainbow.

## Tipografi

| Level | Font | Berat | Ukuran |
|---|---|---|---|
| Nomor antrian (monitor) | Poppins | 700 | `text-7xl`–`text-9xl`, `tabular-nums` |
| Nomor antrian (kiosk) | Poppins | 700 | `text-6xl`, `tabular-nums` |
| Heading halaman | Poppins | 600–700 | `text-2xl`–`text-3xl` |
| Label / kicker | Poppins | 600 | `text-xs`, `uppercase`, `tracking-widest` |
| Body | system-ui | 400–500 | `text-sm`–`text-base` |

- `font-display`: Poppins (`display=swap` via Google Fonts, subset latin).
- `font-body`: system-ui stack (tanpa web font — performa).
- Nomor selalu `font-variant-numeric: tabular-nums`.

## Radius & Spacing

- `--radius`: `0.5rem` (konsisten, tegas — tidak terlalu bulat).
- Kartu kiosk: `rounded-xl`; tombol `rounded-lg`; badge `rounded-full` (status).
- Spacing mengikuti scale Tailwind (4/6/8...); kiosk memakai gap lebih besar (kartu ≥64px).

## Dark Surface (Monitor & header)

- Navy gelap: `#0f1b3d` family (bukan `#000`).
- Teks putih di atas navy gelap: ≥12:1.
- Nomor emas di atas navy gelap: ≥5:1 (large text).

## Implementasi

1. Update CSS variables di `src/app.css` (light theme; dark theme opsional tetap disediakan).
2. Link Poppins di `index.html` (preconnect + `display=swap`).
3. Update `BarChart.svelte` default colors ke urutan chart di atas.
4. Halaman memakai token (`bg-primary`, `text-accent`, `bg-muted`, dll.) — tidak ada
   warna hex hardcode baru.
