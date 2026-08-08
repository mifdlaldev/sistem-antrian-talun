-- P13: status 'batal' untuk no-show + P14: jejak audit waktu panggil/batal.
-- SQLite tidak bisa mengubah CHECK via ALTER — rebuild tabel antrian.

CREATE TABLE antrian_new (
	id_antrian INTEGER PRIMARY KEY AUTOINCREMENT,
	nomor_antrian TEXT NOT NULL,
	id_layanan INTEGER NOT NULL REFERENCES layanan(id_layanan),
	id_user INTEGER REFERENCES users(id_user),
	status TEXT NOT NULL CHECK (status IN ('menunggu', 'dilayani', 'selesai', 'batal')),
	tanggal TEXT NOT NULL,
	waktu_selesai TEXT,
	ip TEXT,
	waktu_buat INTEGER,
	waktu_panggil TEXT,
	waktu_batal TEXT
);

INSERT INTO antrian_new (
	id_antrian, nomor_antrian, id_layanan, id_user, status, tanggal,
	waktu_selesai, ip, waktu_buat
)
SELECT id_antrian, nomor_antrian, id_layanan, id_user, status, tanggal,
	waktu_selesai, ip, waktu_buat
FROM antrian;

DROP TABLE antrian;
ALTER TABLE antrian_new RENAME TO antrian;

CREATE INDEX idx_antrian_tanggal ON antrian(tanggal);
CREATE INDEX idx_antrian_status ON antrian(status);
CREATE INDEX idx_antrian_layanan_tanggal ON antrian(id_layanan, tanggal);
