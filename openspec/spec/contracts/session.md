---
id: session
title: Session LocalStorage
---

## Description

Session login disimpan di browser localStorage. Bukan sesi aman — dapat dipalsukan
tanpa verifikasi server. Tidak menggunakan Supabase Auth.

## Storage

### Key: `user_session`

- **Tipe:** JSON string dari **seluruh row** tabel `users`.
- **Di-set oleh:** `Login.jsx` → `handleLogin` setelah query sukses.
- **Dibaca oleh:** `ProtectedRoute.jsx` (guard rute), `PetugasDashboard.jsx`
  (identitas petugas).
- **Dihapus oleh:** logout di `Login.jsx`, `AdminDashboard.jsx`,
  `PetugasDashboard.jsx`.

## Payload

Seluruh field dari row tabel `users`:

| Field | Contoh |
|---|---|
| `id_user` | 2 |
| `username` | "petugas1" |
| `password` | "rahasia" (plaintext) |
| `nama_lengkap` | "Budi Santoso" |
| `role` | "petugas" / "admin" |
| `id_layanan` | 1 atau `null` (general) |

## Keamanan

Session ini HARUS dianggap forgeable:

```js
localStorage.setItem("user_session", JSON.stringify({ role: "admin" }));
```

- Tidak ada expiry, tidak ada token, tidak ada validasi server-side.
- Guard hanya memeriksa keberadaan key + nilai `role`.
- DILARANG mengklaim mekanisme ini aman atau setara Supabase Auth.
