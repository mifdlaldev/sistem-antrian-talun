-- P10: tabel pelacak percobaan login gagal (throttle per IP).
CREATE TABLE IF NOT EXISTS login_attempts (
	ip TEXT PRIMARY KEY,
	failed_count INTEGER NOT NULL DEFAULT 0,
	last_fail INTEGER NOT NULL
);

-- P11: ganti password default seed (PBKDF2-SHA256, 100.000 iterasi).
-- Password baru dihasilkan acak — diserahkan ke admin via saluran aman, bukan di repo.
UPDATE users SET password_hash = 'pbkdf2:sha256:100000:JqksvQmj7HKOEmNciwomAw==:ouyw5LxYWklG639jliklOEenIUjWNxq0HF3GaBvxiCM=' WHERE id_user = 1;
UPDATE users SET password_hash = 'pbkdf2:sha256:100000:R9aaWvxWGrzBCob+O6Y+OQ==:uNkFqzuJ6zys7rIej1gUjsep4TYY84zAU9QA1goZH/M=' WHERE id_user = 2;
