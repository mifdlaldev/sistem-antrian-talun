-- Skema awal D1 — migrasi dari Supabase ke Cloudflare D1.
-- Perilaku tabel mengikuti openspec/spec/contracts/database-schema.md (inferred).

CREATE TABLE IF NOT EXISTS layanan (
	id_layanan INTEGER PRIMARY KEY AUTOINCREMENT,
	nama_layanan TEXT NOT NULL,
	kode_huruf TEXT NOT NULL,
	deskripsi TEXT
);

CREATE TABLE IF NOT EXISTS users (
	id_user INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	nama_lengkap TEXT NOT NULL,
	role TEXT NOT NULL CHECK (role IN ('admin', 'petugas')),
	id_layanan INTEGER REFERENCES layanan(id_layanan)
);

CREATE TABLE IF NOT EXISTS antrian (
	id_antrian INTEGER PRIMARY KEY AUTOINCREMENT,
	nomor_antrian TEXT NOT NULL,
	id_layanan INTEGER NOT NULL REFERENCES layanan(id_layanan),
	id_user INTEGER REFERENCES users(id_user),
	status TEXT NOT NULL CHECK (status IN ('menunggu', 'dilayani', 'selesai')),
	tanggal TEXT NOT NULL,
	waktu_selesai TEXT
);

CREATE INDEX IF NOT EXISTS idx_antrian_tanggal ON antrian(tanggal);
CREATE INDEX IF NOT EXISTS idx_antrian_status ON antrian(status);
CREATE INDEX IF NOT EXISTS idx_antrian_layanan_tanggal ON antrian(id_layanan, tanggal);
