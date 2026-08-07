---
id: authentication
title: Autentikasi (Login & Guard Rute)
---

## Description

Login username/password di `/login`, diverifikasi **server-side di Worker**
(`POST /api/auth/login`). Password disimpan sebagai hash **PBKDF2-SHA256**. Session
berupa **cookie httpOnly** yang ditandatangani HMAC-SHA256 dengan `SESSION_SECRET`.
Guard rute di `App.svelte` mem-fetch `GET /api/auth/me`.

## Scenario

Petugas memasukkan username & password → Worker query `users` by username → verifikasi
PBKDF2 (constant-time) → set cookie `session` (12 jam) → frontend redirect sesuai role.
Admin mencoba buka `/petugas/dashboard` → `GET /api/auth/me` mengembalikan role admin →
redirect ke dashboard yang sesuai.

## Requirements

### Requirement: Verifikasi kredensial

`POST /api/auth/login` HARUS query `users` by username, lalu `verifyPassword`
(PBKDF2-SHA256, 100.000 iterasi, constant-time compare). Gagal → 401
"Username atau Password salah!".

### Requirement: Cookie session

Login sukses HARUS men-set cookie `session` dengan payload
`{ id_user, role, exp }` (12 jam) yang di-HMAC-SHA256(`SESSION_SECRET`):
httpOnly, SameSite=Lax, Secure (produksi).

### Requirement: Redirect sesuai role

`role === "admin"` → navigate `/admin/dashboard`; selain itu → `/petugas/dashboard`.

### Requirement: Guard rute

`App.svelte` HARUS mem-fetch `GET /api/auth/me` pada setiap perubahan path
(cookie dikirim otomatis):
- 401 (tidak ada session) → redirect `/login`.
- Role tidak sesuai path → redirect `/admin/dashboard` (admin) atau
  `/petugas/dashboard` (petugas).

### Requirement: Session tidak forgeable

Cookie httpOnly + signature server-side — browser tidak bisa membaca atau memalsukan
session. DILARANG mengklaim mekanisme ini bisa diganti session client-side.

### Requirement: Logout

`POST /api/auth/logout` HARUS menghapus cookie, lalu frontend redirect `/login`.
