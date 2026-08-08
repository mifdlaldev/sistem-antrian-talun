import { Hono } from "hono";
import * as v from "valibot";
import { requireRoles, type SessionVariables } from "../auth";
import type { Env } from "../env";
import { todayIso } from "../queue";
import { broadcast } from "../realtime";

const AmbilBodySchema = v.object({
	id_layanan: v.number(),
});

interface LayananRow {
	id_layanan: number;
	nama_layanan: string;
	kode_huruf: string;
}

interface AntrianRow {
	id_antrian: number;
	nomor_antrian: string;
	id_layanan: number;
	id_user: number | null;
	status: "menunggu" | "dilayani" | "selesai";
	tanggal: string;
	waktu_selesai: string | null;
}

interface UserRow {
	id_user: number;
	id_layanan: number | null;
}

interface DilayaniRow extends AntrianRow {
	nama_layanan: string;
	kode_huruf: string;
	petugas_id: number | null;
	petugas_nama: string | null;
	petugas_username: string | null;
}

interface MenungguRow extends AntrianRow {
	nama_layanan: string;
	kode_huruf: string;
}

function shapeDilayani(row: DilayaniRow) {
	return {
		...row,
		layanan: {
			id_layanan: row.id_layanan,
			nama_layanan: row.nama_layanan,
			kode_huruf: row.kode_huruf,
			deskripsi: null,
		},
		users:
			row.petugas_id === null
				? null
				: {
						id_user: row.petugas_id,
						username: row.petugas_username,
						nama_lengkap: row.petugas_nama,
						role: "petugas",
						id_layanan: null,
					},
	};
}

function shapeMenunggu(row: MenungguRow) {
	return {
		...row,
		layanan: {
			id_layanan: row.id_layanan,
			nama_layanan: row.nama_layanan,
			kode_huruf: row.kode_huruf,
			deskripsi: null,
		},
	};
}

const COOLDOWN_MS = 60_000;

export const antrianRoutes = new Hono<{
	Bindings: Env;
	Variables: SessionVariables;
}>();

antrianRoutes.post("/", async (c) => {
	const body = v.safeParse(
		AmbilBodySchema,
		await c.req.json().catch(() => null),
	);
	if (!body.success) return c.json({ error: "id_layanan wajib diisi" }, 400);

	const today = todayIso();
	const layanan = await c.env.DB.prepare(
		"SELECT id_layanan, nama_layanan, kode_huruf FROM layanan WHERE id_layanan = ?",
	)
		.bind(body.output.id_layanan)
		.first<LayananRow>();
	if (!layanan) return c.json({ error: "Layanan tidak ditemukan" }, 404);

	// Cooldown anti-duplikat: 1 nomor per IP per layanan per 60 detik (P5).
	const ip = c.req.header("CF-Connecting-IP") ?? null;
	const now = Date.now();
	if (ip) {
		const terakhir = await c.env.DB.prepare(
			"SELECT waktu_buat FROM antrian WHERE ip = ? AND id_layanan = ? AND tanggal = ? ORDER BY id_antrian DESC LIMIT 1",
		)
			.bind(ip, body.output.id_layanan, today)
			.first<{ waktu_buat: number | null }>();
		if (terakhir?.waktu_buat !== null && terakhir?.waktu_buat !== undefined) {
			const sisa = COOLDOWN_MS - (now - terakhir.waktu_buat);
			if (sisa > 0) {
				return c.json(
					{
						error: `Mohon tunggu ${Math.ceil(sisa / 1000)} detik sebelum mengambil nomor lagi.`,
					},
					429,
				);
			}
		}
	}

	// Insert atomik satu statement + RETURNING: nomor dari MAX antrian hari ini,
	// langsung dikembalikan tanpa query-back (bebas race, P1).
	const inserted = await c.env.DB.prepare(
		`INSERT INTO antrian (nomor_antrian, id_layanan, status, tanggal, ip, waktu_buat)
		 SELECT printf('%s-%03d', l.kode_huruf,
			COALESCE(MAX(CAST(SUBSTR(a.nomor_antrian, 3) AS INTEGER)), 0) + 1),
			l.id_layanan, 'menunggu', ?, ?, ?
		 FROM layanan l
		 LEFT JOIN antrian a ON a.id_layanan = l.id_layanan AND a.tanggal = ?
		 WHERE l.id_layanan = ?
		 GROUP BY l.id_layanan
		 RETURNING nomor_antrian`,
	)
		.bind(today, ip, now, today, body.output.id_layanan)
		.first<{ nomor_antrian: string }>();

	if (!inserted) return c.json({ error: "Gagal membuat antrian" }, 500);

	await broadcast(c.env);
	return c.json(
		{
			nomor_antrian: inserted.nomor_antrian,
			nama_layanan: layanan.nama_layanan,
		},
		201,
	);
});

antrianRoutes.get("/last", async (c) => {
	const today = todayIso();
	const row = await c.env.DB.prepare(
		"SELECT nomor_antrian FROM antrian WHERE tanggal = ? ORDER BY id_antrian DESC LIMIT 1",
	)
		.bind(today)
		.first<{ nomor_antrian: string }>();
	return c.json({ nomor_antrian: row?.nomor_antrian ?? null });
});

antrianRoutes.get("/display", async (c) => {
	const today = todayIso();
	const { results: dilayani } = await c.env.DB.prepare(
		`SELECT a.*, l.nama_layanan, l.kode_huruf,
			u.id_user AS petugas_id, u.nama_lengkap AS petugas_nama, u.username AS petugas_username
		 FROM antrian a
		 JOIN layanan l ON l.id_layanan = a.id_layanan
		 LEFT JOIN users u ON u.id_user = a.id_user
		 WHERE a.status = 'dilayani' AND a.tanggal = ?
		 ORDER BY a.waktu_selesai DESC`,
	)
		.bind(today)
		.all<DilayaniRow>();
	const { results: menunggu } = await c.env.DB.prepare(
		`SELECT a.*, l.nama_layanan, l.kode_huruf
		 FROM antrian a
		 JOIN layanan l ON l.id_layanan = a.id_layanan
		 WHERE a.status = 'menunggu' AND a.tanggal = ?
		 ORDER BY a.id_antrian ASC
		 LIMIT 5`,
	)
		.bind(today)
		.all<MenungguRow>();
	const { results: totalRows } = await c.env.DB.prepare(
		"SELECT COUNT(*) AS cnt FROM antrian WHERE status = 'menunggu' AND tanggal = ?",
	)
		.bind(today)
		.all<{ cnt: number }>();
	return c.json({
		dilayani: dilayani.map(shapeDilayani),
		menunggu: menunggu.map(shapeMenunggu),
		totalMenunggu: totalRows[0]?.cnt ?? 0,
	});
});

antrianRoutes.get("/petugas", requireRoles("petugas"), async (c) => {
	const session = c.get("session");
	if (!session) return c.json({ error: "Unauthorized" }, 401);
	const today = todayIso();

	const user = await c.env.DB.prepare(
		"SELECT id_user, id_layanan FROM users WHERE id_user = ?",
	)
		.bind(session.id_user)
		.first<UserRow>();
	if (!user) return c.json({ error: "Unauthorized" }, 401);

	const sedangDilayani = await c.env.DB.prepare(
		`SELECT a.*, l.nama_layanan, l.kode_huruf
		 FROM antrian a JOIN layanan l ON l.id_layanan = a.id_layanan
		 WHERE a.status = 'dilayani' AND a.id_user = ? AND a.tanggal = ?`,
	)
		.bind(session.id_user, today)
		.first<MenungguRow>();

	let sisaAntrian: number;
	if (user.id_layanan === null) {
		const { results } = await c.env.DB.prepare(
			"SELECT COUNT(*) AS cnt FROM antrian WHERE status = 'menunggu' AND tanggal = ?",
		)
			.bind(today)
			.all<{ cnt: number }>();
		sisaAntrian = results[0]?.cnt ?? 0;
	} else {
		const { results } = await c.env.DB.prepare(
			"SELECT COUNT(*) AS cnt FROM antrian WHERE status = 'menunggu' AND tanggal = ? AND id_layanan = ?",
		)
			.bind(today, user.id_layanan)
			.all<{ cnt: number }>();
		sisaAntrian = results[0]?.cnt ?? 0;
	}

	const { results: selesaiRows } = await c.env.DB.prepare(
		"SELECT COUNT(*) AS cnt FROM antrian WHERE status = 'selesai' AND id_user = ? AND tanggal = ?",
	)
		.bind(session.id_user, today)
		.all<{ cnt: number }>();
	const totalSelesai = selesaiRows[0]?.cnt ?? 0;

	let namaLayananTugas = "SEMUA LAYANAN";
	if (user.id_layanan !== null) {
		const layanan = await c.env.DB.prepare(
			"SELECT nama_layanan FROM layanan WHERE id_layanan = ?",
		)
			.bind(user.id_layanan)
			.first<{ nama_layanan: string }>();
		namaLayananTugas = layanan?.nama_layanan ?? "Spesialis";
	}

	return c.json({
		sedangDilayani: sedangDilayani ? shapeMenunggu(sedangDilayani) : null,
		sisaAntrian,
		totalSelesai,
		namaLayananTugas,
	});
});

interface KlaimHasil {
	id_antrian: number;
	nomor_antrian: string;
	id_layanan: number;
}

interface PetugasRow {
	id_user: number;
	id_layanan: number | null;
}

async function klaimBerikutnya(
	c: { env: Env },
	petugas: PetugasRow,
	today: string,
	finishStmt?: D1PreparedStatement,
): Promise<MenungguRow | null> {
	const stmts: D1PreparedStatement[] = [];
	if (finishStmt) stmts.push(finishStmt);
	stmts.push(
		petugas.id_layanan === null
			? c.env.DB.prepare(
					`UPDATE antrian SET status = 'dilayani', id_user = ?, waktu_panggil = ?
					 WHERE id_antrian = (
						 SELECT id_antrian FROM antrian
						 WHERE status = 'menunggu' AND tanggal = ?
						 ORDER BY id_antrian ASC LIMIT 1
					 )
					 RETURNING id_antrian, nomor_antrian, id_layanan`,
				).bind(petugas.id_user, new Date().toISOString(), today)
			: c.env.DB.prepare(
					`UPDATE antrian SET status = 'dilayani', id_user = ?, waktu_panggil = ?
					 WHERE id_antrian = (
						 SELECT id_antrian FROM antrian
						 WHERE status = 'menunggu' AND tanggal = ? AND id_layanan = ?
						 ORDER BY id_antrian ASC LIMIT 1
					 )
					 RETURNING id_antrian, nomor_antrian, id_layanan`,
				).bind(
					petugas.id_user,
					new Date().toISOString(),
					today,
					petugas.id_layanan,
				),
	);
	const results = await c.env.DB.batch(stmts);
	const claimed = results[results.length - 1]?.results?.[0] as
		| KlaimHasil
		| undefined;
	if (!claimed) return null;

	const full = await c.env.DB.prepare(
		`SELECT a.*, l.nama_layanan, l.kode_huruf
		 FROM antrian a JOIN layanan l ON l.id_layanan = a.id_layanan
		 WHERE a.id_antrian = ?`,
	)
		.bind(claimed.id_antrian)
		.first<MenungguRow>();
	return full ?? null;
}

antrianRoutes.post("/next", requireRoles("petugas"), async (c) => {
	const session = c.get("session");
	if (!session) return c.json({ error: "Unauthorized" }, 401);
	const today = todayIso();

	const petugas = await c.env.DB.prepare(
		"SELECT id_user, id_layanan FROM users WHERE id_user = ?",
	)
		.bind(session.id_user)
		.first<PetugasRow>();
	if (!petugas) return c.json({ error: "Unauthorized" }, 401);

	const sedangDilayani = await c.env.DB.prepare(
		"SELECT * FROM antrian WHERE status = 'dilayani' AND id_user = ? AND tanggal = ?",
	)
		.bind(session.id_user, today)
		.first<AntrianRow>();
	const finishStmt = sedangDilayani
		? c.env.DB.prepare(
				"UPDATE antrian SET status = 'selesai', waktu_selesai = ? WHERE id_antrian = ?",
			).bind(new Date().toISOString(), sedangDilayani.id_antrian)
		: undefined;

	const next = await klaimBerikutnya(c, petugas, today, finishStmt);
	if (next) {
		await broadcast(c.env);
		return c.json({ next: shapeMenunggu(next) });
	}
	return c.json({ next: null });
});

antrianRoutes.post("/skip", requireRoles("petugas"), async (c) => {
	const session = c.get("session");
	if (!session) return c.json({ error: "Unauthorized" }, 401);
	const today = todayIso();

	const petugas = await c.env.DB.prepare(
		"SELECT id_user, id_layanan FROM users WHERE id_user = ?",
	)
		.bind(session.id_user)
		.first<PetugasRow>();
	if (!petugas) return c.json({ error: "Unauthorized" }, 401);

	const sedangDilayani = await c.env.DB.prepare(
		"SELECT * FROM antrian WHERE status = 'dilayani' AND id_user = ? AND tanggal = ?",
	)
		.bind(session.id_user, today)
		.first<AntrianRow>();
	if (!sedangDilayani) {
		return c.json({ error: "Tidak ada antrian yang sedang dilayani" }, 400);
	}

	const batalStmt = c.env.DB.prepare(
		"UPDATE antrian SET status = 'batal', waktu_batal = ? WHERE id_antrian = ?",
	).bind(new Date().toISOString(), sedangDilayani.id_antrian);

	const next = await klaimBerikutnya(c, petugas, today, batalStmt);
	await broadcast(c.env);
	return c.json({
		dilewati: sedangDilayani.nomor_antrian,
		next: next ? shapeMenunggu(next) : null,
	});
});

antrianRoutes.post("/recall", requireRoles("petugas"), async (c) => {
	await broadcast(c.env);
	return c.json({ ok: true });
});
