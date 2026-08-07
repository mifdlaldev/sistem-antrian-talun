-- Queue hardening: cooldown anti-duplikat + jejak waktu pembuatan.
ALTER TABLE antrian ADD COLUMN ip TEXT;
ALTER TABLE antrian ADD COLUMN waktu_buat INTEGER;
