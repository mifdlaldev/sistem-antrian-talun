-- Seed data awal. Password di-hash PBKDF2-SHA256 (100.000 iterasi) — BUKAN plaintext.
-- Default: admin / admin123, petugas1 / petugas123 — WAJIB diganti setelah deploy pertama.
-- Generate ulang hash: node -e "console.log(require('node:crypto').pbkdf2Sync('PASS', require('node:crypto').randomBytes(16), 100000, 32, 'sha256'))"

INSERT INTO layanan (id_layanan, nama_layanan, kode_huruf, deskripsi) VALUES
	(1, 'Layanan KTP & KK', 'A', 'Pembuatan KTP, KK, Surat Pindah'),
	(2, 'Layanan Umum', 'B', 'SKCK, Surat Pengantar, Legalisir'),
	(3, 'Layanan Pajak', 'C', 'PBB dan Administrasi Lainnya');

INSERT INTO users (id_user, username, password_hash, nama_lengkap, role, id_layanan) VALUES
	(1, 'admin', 'pbkdf2:sha256:100000:yr3hcBHi7aXNH2w4BWU5Hw==:pgIwMqGfKilHU1PEzuMmICKhIP5GCxyCaibcCOg7wTQ=', 'Administrator', 'admin', NULL),
	(2, 'petugas1', 'pbkdf2:sha256:100000:ygO9xD8KDaYTwIT5nq9jfw==:nKihUffBHN1DYZ+SUHGPv2zP9zamd4DEZn3BXzItjLs=', 'Petugas Loket', 'petugas', 1);
