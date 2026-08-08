# API Documentation

Semua endpoint di bawah path `/api/*`, same-origin dengan SPA (tanpa CORS). Session
menggunakan cookie `session` (httpOnly, otomatis dikirim browser). Response error
berbentuk `{ "error": "pesan" }` dengan status HTTP yang sesuai.

## Ringkasan Endpoint

| Method | Path | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/login` | publik | Login, set cookie session |
| POST | `/api/auth/logout` | publik | Hapus cookie session |
| GET | `/api/auth/me` | session | Data user saat ini |
| GET | `/api/layanan` | publik | Daftar layanan |
| POST | `/api/layanan` | admin | Tambah layanan |
| PUT | `/api/layanan/:id` | admin | Update layanan |
| DELETE | `/api/layanan/:id` | admin | Hapus layanan |
| POST | `/api/antrian` | publik | Ambil nomor antrian |
| GET | `/api/antrian/display` | publik | Data monitor (dilayani + 5 menunggu) |
| GET | `/api/antrian/petugas` | petugas | Dashboard petugas |
| POST | `/api/antrian/next` | petugas | Panggil antrian berikutnya (FIFO, klaim atomik) |
| POST | `/api/antrian/skip` | petugas | Lewati no-show (`batal`) + panggil berikutnya |
| POST | `/api/antrian/recall` | petugas | Panggil ulang nomor yang sedang dilayani |
| GET | `/api/users` | admin | Daftar petugas |
| POST | `/api/users` | admin | Tambah petugas |
| PUT | `/api/users/:id` | admin | Update petugas |
| DELETE | `/api/users/:id` | admin | Hapus petugas |
| GET | `/api/stats/dashboard` | admin | Statistik dashboard |
| GET | `/api/realtime` | publik | WebSocket upgrade (Durable Object) |

## Autentikasi

### POST `/api/auth/login`

```json
// Request
{ "username": "admin", "password": "admin123" }

// Response 200 — Set-Cookie: session=...; HttpOnly; SameSite=Lax; Secure
{
  "id_user": 1,
  "username": "admin",
  "nama_lengkap": "Administrator",
  "role": "admin",
  "id_layanan": null
}

// Response 401
{ "error": "Username atau Password salah!" }
```

### GET `/api/auth/me`

```json
// Response 200 (dengan cookie valid)
{ "id_user": 1, "username": "admin", "nama_lengkap": "Administrator", "role": "admin", "id_layanan": null }

// Response 401
{ "error": "Unauthorized" }
```

## Antrian

### POST `/api/antrian` — ambil nomor

Nomor dihitung **atomik** server-side (`MAX(nomor_antrian)` per layanan + tanggal),
bebas duplikasi saat kiosk digunakan bersamaan.

```json
// Request
{ "id_layanan": 1 }

// Response 201
{ "nomor_antrian": "A-001", "nama_layanan": "Layanan KTP & KK" }
```

### GET `/api/antrian/display` — monitor

```json
// Response 200
{
  "dilayani": [
    {
      "id_antrian": 1,
      "nomor_antrian": "A-001",
      "id_layanan": 1,
      "id_user": 2,
      "status": "dilayani",
      "tanggal": "2026-08-08",
      "waktu_selesai": null,
      "layanan": { "id_layanan": 1, "nama_layanan": "Layanan KTP & KK", "kode_huruf": "A", "deskripsi": null },
      "users": { "id_user": 2, "username": "petugas1", "nama_lengkap": "Petugas Loket", "role": "petugas", "id_layanan": 1 }
    }
  ],
  "menunggu": [
    { "id_antrian": 2, "nomor_antrian": "A-002", "status": "menunggu", "layanan": { "nama_layanan": "Layanan KTP & KK" } }
  ]
}
```

### POST `/api/antrian/next` — panggil berikutnya (petugas)

```json
// Response 200 — antrian berikutnya dipanggil (status → dilayani, id_user diisi)
{ "next": { "id_antrian": 1, "nomor_antrian": "A-001", "status": "menunggu", "layanan": { "nama_layanan": "Layanan KTP & KK" } } }

// Response 200 — tidak ada antrian menunggu
{ "next": null }
```

## Realtime (WebSocket)

`GET /api/realtime` melakukan upgrade WebSocket ke Durable Object `RealtimeHub`.
Setiap mutasi antrian memicu broadcast pesan `refresh` ke semua klien terhubung —
klien lalu mem-fetch ulang `/api/antrian/display`. Auto-reconnect 3 detik di
frontend (`src/lib/realtime.ts`).
