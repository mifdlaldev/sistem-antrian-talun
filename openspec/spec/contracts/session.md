---
id: session
title: Session Cookie (httpOnly, HMAC-signed)
---

## Description

Session login dikelola **server-side di Worker** — cookie `session` httpOnly,
SameSite=Lax, Secure (produksi), berdurasi 12 jam. Browser tidak bisa membaca atau
memalsukan session.

## Cookie

### Name: `session`

- **Isi:** `base64url(payload).base64url(HMAC-SHA256(secret, payload))`
- **Payload:** `{ id_user, role, exp }` (exp = epoch detik, 12 jam).
- **Ditandatangani** dengan `SESSION_SECRET` (HMAC-SHA256, constant-time compare).
- **Di-set oleh:** `POST /api/auth/login` (setelah verifikasi PBKDF2).
- **Dihapus oleh:** `POST /api/auth/logout`.
- **Dibaca oleh:** `GET /api/auth/me`, guard rute (`App.svelte`), endpoint admin/petugas.

## Keamanan

- Cookie **httpOnly** — tidak bisa dibaca JS (anti-XSS token theft).
- **Signature server-side** — tidak bisa dipalsukan dari client.
- **Expiry 12 jam** — diperiksa saat verifikasi.
- TIDAK menggunakan localStorage, TIDAK ada token di JS.
- DILARANG mengklaim ini bisa diganti dengan session client-side.

## API Terkait

- `POST /api/auth/login` → `{ id_user, username, nama_lengkap, role, id_layanan }`
- `POST /api/auth/logout` → `{ ok: true }`
- `GET /api/auth/me` → user row (tanpa `password_hash`) atau 401
