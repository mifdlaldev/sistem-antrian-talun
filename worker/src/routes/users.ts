import { Hono } from "hono";
import * as v from "valibot";
import { hashPassword, requireRoles, type SessionVariables } from "../auth";
import type { Env } from "../env";

const UserBodySchema = v.object({
	username: v.pipe(v.string(), v.trim(), v.minLength(1)),
	password: v.optional(v.pipe(v.string(), v.minLength(1))),
	nama_lengkap: v.string(),
	id_layanan: v.nullable(v.number()),
});

interface UserRow {
	id_user: number;
	username: string;
	nama_lengkap: string;
	role: "admin" | "petugas";
	id_layanan: number | null;
	layanan_nama: string | null;
}

export const usersRoutes = new Hono<{
	Bindings: Env;
	Variables: SessionVariables;
}>();

usersRoutes.get("/", requireRoles("admin"), async (c) => {
	const { results } = await c.env.DB.prepare(
		`SELECT u.id_user, u.username, u.nama_lengkap, u.role, u.id_layanan, l.nama_layanan AS layanan_nama
		 FROM users u LEFT JOIN layanan l ON l.id_layanan = u.id_layanan
		 ORDER BY u.id_user ASC`,
	).all<UserRow>();
	return c.json(
		results.map((u) => ({
			id_user: u.id_user,
			username: u.username,
			nama_lengkap: u.nama_lengkap,
			role: u.role,
			id_layanan: u.id_layanan,
			layanan: u.layanan_nama ? { nama_layanan: u.layanan_nama } : null,
		})),
	);
});

usersRoutes.post("/", requireRoles("admin"), async (c) => {
	const body = v.safeParse(
		UserBodySchema,
		await c.req.json().catch(() => null),
	);
	if (!body.success || !body.output.password) {
		return c.json({ error: "Username dan Password wajib diisi" }, 400);
	}
	const passwordHash = await hashPassword(body.output.password);
	const { meta } = await c.env.DB.prepare(
		"INSERT INTO users (username, password_hash, nama_lengkap, role, id_layanan) VALUES (?, ?, ?, ?, ?)",
	)
		.bind(
			body.output.username,
			passwordHash,
			body.output.nama_lengkap,
			"petugas",
			body.output.id_layanan,
		)
		.run();
	if (meta.changes === 0)
		return c.json({ error: "Username sudah dipakai" }, 409);
	return c.json({ id_user: Number(meta.last_row_id) }, 201);
});

usersRoutes.put("/:id", requireRoles("admin"), async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
	const body = v.safeParse(
		UserBodySchema,
		await c.req.json().catch(() => null),
	);
	if (!body.success) return c.json({ error: "Data tidak valid" }, 400);

	if (body.output.password) {
		const passwordHash = await hashPassword(body.output.password);
		await c.env.DB.prepare(
			"UPDATE users SET username = ?, password_hash = ?, nama_lengkap = ?, id_layanan = ? WHERE id_user = ?",
		)
			.bind(
				body.output.username,
				passwordHash,
				body.output.nama_lengkap,
				body.output.id_layanan,
				id,
			)
			.run();
	} else {
		await c.env.DB.prepare(
			"UPDATE users SET username = ?, nama_lengkap = ?, id_layanan = ? WHERE id_user = ?",
		)
			.bind(
				body.output.username,
				body.output.nama_lengkap,
				body.output.id_layanan,
				id,
			)
			.run();
	}
	return c.json({ ok: true });
});

usersRoutes.delete("/:id", requireRoles("admin"), async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
	await c.env.DB.prepare("DELETE FROM users WHERE id_user = ?").bind(id).run();
	return c.json({ ok: true });
});
