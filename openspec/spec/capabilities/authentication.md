---
id: authentication
title: Autentikasi (Login & Guard Rute)
---

## Description

Login username/password di `/login`. Session disimpan di browser `localStorage`.
Guard rute via `ProtectedRoute` berdasarkan role. **TIDAK menggunakan Supabase Auth**
— tidak ada token, tidak ada expiry, tidak ada session server-side.

## Scenario

Petugas memasukkan username & password → query tabel `users` mencocokkan keduanya →
seluruh row user disimpan ke localStorage → redirect sesuai role. Admin mencoba buka
`/petugas/dashboard` → ditolak, redirect ke dashboard yang sesuai.

## Requirements

### Requirement: Verifikasi kredensial

Login HARUS query
`supabase.from("users").select("*").eq("username", u).eq("password", p).single()` —
perbandingan **plaintext** dilakukan client-side. Password tersimpan plaintext di
tabel `users`. Ini kerentanan terdokumentasi; jangan klaim aman.

### Requirement: Penyimpanan session

Login sukses HARUS menyimpan **seluruh row user** ke `localStorage["user_session"]`
sebagai JSON string (via `setSession` dari `$lib/session`).

### Requirement: Redirect sesuai role

`role === "admin"` → navigate `/admin/dashboard`; selain itu → `/petugas/dashboard`.

### Requirement: Guard rute

`App.svelte` → `resolveTarget(path)` HARUS membaca session via `getSession()`
(`localStorage["user_session"]`, divalidasi Valibot):
- Tidak ada session → redirect `/login`.
- Role tidak sesuai path → redirect `/admin/dashboard` (jika role admin) atau
  `/petugas/dashboard` (selain admin).

### Requirement: Session dapat dipalsukan

Guard tidak melakukan verifikasi apa pun selain keberadaan + role di localStorage.
`localStorage.setItem("user_session", JSON.stringify({ role: "admin" }))` memberi akses
admin penuh. DILARANG mengklaim mekanisme ini aman.

### Requirement: Logout

Logout HARUS `clearSession()` (hapus `user_session`) lalu redirect `/login`.
