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

const MAX_FAILED_LOGIN = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const authRoutes = new Hono<{
	Bindings: Env;
	Variables: SessionVariables;
}>();

async function catatPercobaanGagal(c: {
	env: Env;
	req: { header: (n: string) => string | undefined };
}) {
	const ip = c.req.header("CF-Connecting-IP");
	if (!ip) return;
	const now = Date.now();
	await c.env.DB.prepare(
		`INSERT INTO login_attempts (ip, failed_count, last_fail) VALUES (?, 1, ?)
		 ON CONFLICT(ip) DO UPDATE SET
			failed_count = CASE WHEN ? - last_fail < ${LOGIN_WINDOW_MS} THEN failed_count + 1 ELSE 1 END,
			last_fail = ?`,
	)
		.bind(ip, now, now, now)
		.run();
}

authRoutes.post("/login", async (c) => {
	const ip = c.req.header("CF-Connecting-IP");

	if (ip) {
		const attempt = await c.env.DB.prepare(
			"SELECT failed_count, last_fail FROM login_attempts WHERE ip = ?",
		)
			.bind(ip)
			.first<{ failed_count: number; last_fail: number }>();
		if (
			attempt &&
			attempt.failed_count >= MAX_FAILED_LOGIN &&
			Date.now() - attempt.last_fail < LOGIN_WINDOW_MS
		) {
			return c.json(
				{ error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." },
				429,
			);
		}
	}

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
		await catatPercobaanGagal(c);
		await new Promise((r) => setTimeout(r, 500));
		return c.json({ error: "Username atau Password salah!" }, 401);
	}

	if (ip) {
		await c.env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?")
			.bind(ip)
			.run();
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
