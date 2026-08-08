# Contributing

Terima kasih sudah ingin berkontribusi pada **Sistem Antrian Digital Kelurahan Talun**.
Proyek ini dibangun sebagai uji kompetensi dan berjalan di Cloudflare Workers.

## Alur Kontribusi

1. **Fork** repositori dan buat branch fitur:
   ```bash
   git checkout -b feat/nama-fitur
   ```
2. **Patuhi quality gates** — semua harus hijau sebelum pull request:
   ```bash
   npm run check   # svelte-check (0 error/0 warning) + tsc app + tsc worker
   npm run lint    # biome check
   npm test        # vitest (unit + integration worker)
   npm run build   # build produksi
   ```
3. Commit dengan pesan **conventional commits** (`feat:`, `fix:`, `docs:`, `chore:`).
4. Buka **pull request** ke branch `main`, jelaskan perubahan + sertakan hasil
   verifikasi di atas.

## Pedoman Kode

- **Bahasa:** Indonesia (UI, komentar, nama variabel).
- **Frontend:** Svelte 5 runes (bukan `export let`). Design mengikuti token di
  `src/app.css` (navy + gold) — lihat `openspec/changes/design-overhaul/`.
- **Worker:** Hono + TypeScript strict di `worker/src/routes/`.
- **Validasi:** Valibot di boundary (request body di Worker, respons di client).
- **Behavior:** baca `openspec/` sebelum mengubah perilaku — spesifikasi sistem.
- **Keamanan:** jangan menurunkan level keamanan yang ada (lihat `SECURITY.md`).
- **Konvensi agent:** baca `AGENTS.md` — berisi aturan anti-halusinasi.

## Testing

```bash
npm test                         # unit (queue/schemas)
npm run test:worker              # integration route (login, antrian, skip/recall)
```

Tambahkan test untuk perubahan yang menyentuh logika.

## Struktur Penting

| Path | Isi |
|---|---|
| `src/lib/routes/` | Halaman SPA (Kiosk, Monitor, Login, dashboard) |
| `worker/src/routes/` | API Hono (auth, layanan, antrian, users, stats) |
| `worker/migrations/` | Skema & seed D1 |
| `openspec/` | Spesifikasi sistem (capabilities, contracts) |

## License

Dengan berkontribusi, Anda menyetujui kontribusi Anda didistribusikan di bawah
[Apache License 2.0](LICENSE).
