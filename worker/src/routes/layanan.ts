import { Hono } from "hono";
import * as v from "valibot";
import { requireRoles, type SessionVariables } from "../auth";
import type { Env } from "../env";

const LayananBodySchema = v.object({
	nama_layanan: v.pipe(v.string(), v.trim(), v.minLength(1)),
	kode_huruf: v.pipe(v.string(), v.trim(), v.length(1)),
	deskripsi: v.optional(v.nullable(v.string())),
});

export interface LayananRow {
	id_layanan: number;
	nama_layanan: string;
	kode_huruf: string;
	deskripsi: string | null;
}

export const layananRoutes = new Hono<{
	Bindings: Env;
	Variables: SessionVariables;
}>();

layananRoutes.get("/", async (c) => {
	const { results } = await c.env.DB.prepare(
		"SELECT id_layanan, nama_layanan, kode_huruf, deskripsi FROM layanan ORDER BY id_layanan ASC",
	).all<LayananRow>();
	return c.json(results);
});

layananRoutes.post("/", requireRoles("admin"), async (c) => {
	const body = v.safeParse(
		LayananBodySchema,
		await c.req.json().catch(() => null),
	);
	if (!body.success) return c.json({ error: "Nama dan Kode wajib diisi" }, 400);
	const { meta } = await c.env.DB.prepare(
		"INSERT INTO layanan (nama_layanan, kode_huruf, deskripsi) VALUES (?, ?, ?)",
	)
		.bind(
			body.output.nama_layanan,
			body.output.kode_huruf,
			body.output.deskripsi ?? null,
		)
		.run();
	return c.json({ id_layanan: Number(meta.last_row_id) }, 201);
});

layananRoutes.put("/:id", requireRoles("admin"), async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
	const body = v.safeParse(
		LayananBodySchema,
		await c.req.json().catch(() => null),
	);
	if (!body.success) return c.json({ error: "Nama dan Kode wajib diisi" }, 400);
	await c.env.DB.prepare(
		"UPDATE layanan SET nama_layanan = ?, kode_huruf = ?, deskripsi = ? WHERE id_layanan = ?",
	)
		.bind(
			body.output.nama_layanan,
			body.output.kode_huruf,
			body.output.deskripsi ?? null,
			id,
		)
		.run();
	return c.json({ ok: true });
});

layananRoutes.delete("/:id", requireRoles("admin"), async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
	const { meta } = await c.env.DB.prepare(
		"DELETE FROM layanan WHERE id_layanan = ?",
	)
		.bind(id)
		.run();
	if (meta.changes === 0) {
		return c.json(
			{
				error:
					"Tidak bisa menghapus layanan yang sudah memiliki history antrian.",
			},
			409,
		);
	}
	return c.json({ ok: true });
});
