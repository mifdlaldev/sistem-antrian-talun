# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| latest (`main`) | ✅ |

## Pelaporan Kerentanan

Jika Anda menemukan kerentanan keamanan pada aplikasi ini, **jangan buka issue publik**.
Laporkan melalui salah satu saluran berikut:

1. **GitHub Security Advisory** — melalui tab *Security* pada repositori ini
   (paling disarankan).
2. **Email maintainer** — hubungi pemilik repositori
   (`mifdlaldev` di GitHub) dengan subjek `[SECURITY] ...`.

Informasi yang perlu disertakan:

- Versi/branch yang terdampak.
- Langkah reproduksi (minimal, jelas, tanpa data sensitif).
- Dampak yang mungkin terjadi.
- (Opsional) saran perbaikan.

Kami berkomitmen merespons laporan dalam 7 hari kerja.

## Kebijakan Keamanan Aplikasi

- Semua akses database hanya melalui API Worker (browser tidak pernah menyentuh D1).
- Password di-hash **PBKDF2-SHA256** (salt acak per akun, 100.000 iterasi).
- Session memakai **cookie `HttpOnly` + `SameSite=Lax` + `Secure`** yang ditandatangani
  HMAC-SHA256 — tidak bisa dibaca/dipalsukan dari JavaScript.
- Endpoint publik dilindungi **Cloudflare Turnstile** (siteverify fail-closed) dan
  **cooldown per IP**.
- Login dibatasi **5 percobaan gagal per IP per 15 menit** (throttle + jitter).
- SQL selalu berparameter (prepared statements) — tahan injeksi.

## Secret & Deployment

- `SESSION_SECRET`, `TURNSTILE_SECRET` dikelola via `wrangler secret put` — tidak pernah
  masuk repositori.
- Ganti semua kredensial default sebelum digunakan secara publik.
