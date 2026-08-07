import { createMiddleware } from "hono/factory";
import type { Env } from "./env";

const COOKIE_NAME = "session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const PBKDF2_ITERATIONS = 100_000;

export interface SessionPayload {
	id_user: number;
	role: "admin" | "petugas";
	exp: number;
}

export type SessionVariables = { session?: SessionPayload };

function toBase64(bytes: Uint8Array): string {
	let binary = "";
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
	return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

function constantTimeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
		key,
		256,
	);
	return toBase64(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await pbkdf2(password, salt);
	return `pbkdf2:sha256:${PBKDF2_ITERATIONS}:${toBase64(salt)}:${hash}`;
}

export async function verifyPassword(
	password: string,
	stored: string,
): Promise<boolean> {
	const parts = stored.split(":");
	if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256")
		return false;
	const [, , iterations, saltB64, expected] = parts;
	if (!iterations || !saltB64 || !expected) return false;
	const actual = await pbkdf2(password, fromBase64(saltB64));
	return constantTimeEqual(actual, expected);
}

async function hmacSign(secret: string, body: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(body),
	);
	return toBase64(new Uint8Array(sig));
}

export async function signSession(
	payload: SessionPayload,
	secret: string,
): Promise<string> {
	const body = toBase64(new TextEncoder().encode(JSON.stringify(payload)));
	const sig = await hmacSign(secret, body);
	return `${body}.${sig}`;
}

export async function verifySession(
	token: string,
	secret: string,
): Promise<SessionPayload | null> {
	const dot = token.lastIndexOf(".");
	if (dot <= 0) return null;
	const body = token.slice(0, dot);
	const sig = token.slice(dot + 1);
	const expected = await hmacSign(secret, body);
	if (!constantTimeEqual(sig, expected)) return null;
	try {
		const payload = JSON.parse(
			new TextDecoder().decode(fromBase64(body)),
		) as SessionPayload;
		if (
			typeof payload.id_user !== "number" ||
			!payload.role ||
			typeof payload.exp !== "number"
		)
			return null;
		if (payload.exp < Date.now() / 1000) return null;
		return payload;
	} catch {
		return null;
	}
}

function isSecure(url: string): boolean {
	return new URL(url).protocol === "https:";
}

export function setSessionCookie(
	c: { header: (name: string, value: string) => void; req: { url: string } },
	token: string,
): void {
	c.header(
		"Set-Cookie",
		`${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${isSecure(c.req.url) ? "; Secure" : ""}`,
	);
}

export function clearSessionCookie(c: {
	header: (name: string, value: string) => void;
}): void {
	c.header(
		"Set-Cookie",
		`${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
	);
}

export const sessionMiddleware = createMiddleware<{
	Bindings: Env;
	Variables: SessionVariables;
}>(async (c, next) => {
	const token = c.req.header("Cookie")?.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
	const session = token
		? await verifySession(token, c.env.SESSION_SECRET)
		: null;
	c.set("session", session ?? undefined);
	await next();
});

export function requireRoles(...roles: Array<"admin" | "petugas">) {
	return createMiddleware<{ Bindings: Env; Variables: SessionVariables }>(
		async (c, next) => {
			const session = c.get("session");
			if (!session) return c.json({ error: "Unauthorized" }, 401);
			if (!roles.includes(session.role))
				return c.json({ error: "Forbidden" }, 403);
			await next();
		},
	);
}
