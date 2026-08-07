import { Hono } from "hono";
import * as v from "valibot";
import {
	clearSessionCookie,
	type SessionVariables,
	sessionMiddleware,
	setSessionCookie,
	signSession,
	verifyPassword,
} from "../auth";
import type { Env } from "../env";

const LoginBodySchema = v.object({
	username: v.pipe(v.string(), v.trim(), v.minLength(1)),
	password: v.pipe(v.string(), v.minLength(1)),
});

interface UserRow {
	id_user: number;
	username: string;
	password_hash: string;
	nama_lengkap: string;
	role: "admin" | "petugas";
	id_layanan: number | null;
}

export const authRoutes = new Hono<{
	Bindings: Env;
	Variables: SessionVariables;
}>();

authRoutes.post("/login", async (c) => {
	const body = v.safeParse(
		LoginBodySchema,
		await c.req.json().catch(() => null),
	);
	if (!body.success)
		return c.json({ error: "Username dan Password wajib diisi" }, 400);

	const user = await c.env.DB.prepare("SELECT * FROM users WHERE username = ?")
		.bind(body.output.username)
		.first<UserRow>();
	if (
		!user ||
		!(await verifyPassword(body.output.password, user.password_hash))
	) {
		return c.json({ error: "Username atau Password salah!" }, 401);
	}

	const payload = {
		id_user: user.id_user,
		role: user.role,
		exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
	};
	const token = await signSession(payload, c.env.SESSION_SECRET);
	setSessionCookie(c, token);

	return c.json({
		id_user: user.id_user,
		username: user.username,
		nama_lengkap: user.nama_lengkap,
		role: user.role,
		id_layanan: user.id_layanan,
	});
});

authRoutes.post("/logout", (c) => {
	clearSessionCookie(c);
	return c.json({ ok: true });
});

authRoutes.get("/me", sessionMiddleware, async (c) => {
	const session = c.get("session");
	if (!session) return c.json({ error: "Unauthorized" }, 401);
	const user = await c.env.DB.prepare(
		"SELECT id_user, username, nama_lengkap, role, id_layanan FROM users WHERE id_user = ?",
	)
		.bind(session.id_user)
		.first();
	if (!user) return c.json({ error: "Unauthorized" }, 401);
	return c.json(user);
});
