import { Hono } from "hono";
import { requireRoles, type SessionVariables } from "../auth";
import type { Env } from "../env";

interface DayRow {
	tanggal: string;
	total: number;
	selesai: number;
}

interface LayananStatRow {
	id_layanan: number;
	kode_huruf: string;
	nama_layanan: string;
	cnt: number;
}

const dayFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "short" });

export const statsRoutes = new Hono<{
	Bindings: Env;
	Variables: SessionVariables;
}>();

statsRoutes.get("/dashboard", requireRoles("admin"), async (c) => {
	const today = new Date().toISOString().slice(0, 10);

	const { results: statusRows } = await c.env.DB.prepare(
		"SELECT status, COUNT(*) AS cnt FROM antrian WHERE tanggal = ? GROUP BY status",
	)
		.bind(today)
		.all<{ status: string; cnt: number }>();
	const total = statusRows.reduce((sum, r) => sum + r.cnt, 0);
	const waiting = statusRows.find((r) => r.status === "menunggu")?.cnt ?? 0;
	const completed = statusRows.find((r) => r.status === "selesai")?.cnt ?? 0;

	const start = new Date();
	start.setDate(start.getDate() - 6);
	const startIso = start.toISOString().slice(0, 10);

	const { results: dayRows } = await c.env.DB.prepare(
		`SELECT tanggal, COUNT(*) AS total,
			SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) AS selesai
		 FROM antrian WHERE tanggal >= ? AND tanggal <= ?
		 GROUP BY tanggal`,
	)
		.bind(startIso, today)
		.all<DayRow>();
	const dayMap = new Map(dayRows.map((r) => [r.tanggal, r]));
	const weekly = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const iso = d.toISOString().slice(0, 10);
		const row = dayMap.get(iso);
		weekly.push({
			name: dayFormatter.format(d),
			date: iso,
			total: row?.total ?? 0,
			selesai: row?.selesai ?? 0,
		});
	}

	const { results: layananStats } = await c.env.DB.prepare(
		`SELECT a.id_layanan, l.kode_huruf, l.nama_layanan, COUNT(a.id_antrian) AS cnt
		 FROM layanan l LEFT JOIN antrian a ON a.id_layanan = l.id_layanan AND a.tanggal = ?
		 GROUP BY a.id_layanan, l.kode_huruf, l.nama_layanan
		 ORDER BY a.id_layanan ASC`,
	)
		.bind(today)
		.all<LayananStatRow>();

	return c.json({
		stats: { total, waiting, completed },
		weekly,
		layananStats: layananStats.map((r) => ({
			name: r.kode_huruf,
			fullName: r.nama_layanan,
			value: r.cnt,
		})),
	});
});
