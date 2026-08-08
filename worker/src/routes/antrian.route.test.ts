import { env, SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it, vi } from "vitest";
import m0001 from "../../migrations/0001_init.sql?raw";
import m0002 from "../../migrations/0002_seed.sql?raw";
import m0003 from "../../migrations/0003_hardening.sql?raw";
import m0004 from "../../migrations/0004_rebuild_antrian.sql?raw";
import m0005 from "../../migrations/0005_security.sql?raw";
import { hashPassword } from "../auth";

const HOST = "website-antrian-kelurahan-talun.mifdlaltsaqibalf25.workers.dev";

function statements(sql: string): string[] {
	return sql
		.split(";")
		.map((s) =>
			s
				.split("\n")
				.filter((line) => !line.trim().startsWith("--"))
				.join(" ")
				.trim(),
		)
		.filter(Boolean);
}

async function applyMigrations(): Promise<void> {
	for (const sql of [m0001, m0002, m0003, m0004, m0005]) {
		await env.DB.batch(statements(sql).map((s) => env.DB.prepare(s)));
	}
}

async function setPassword(username: string, password: string): Promise<void> {
	await env.DB.prepare("UPDATE users SET password_hash = ? WHERE username = ?")
		.bind(await hashPassword(password), username)
		.run();
}

async function login(
	username: string,
	password: string,
	ip: string,
): Promise<{ status: number; cookie?: string }> {
	const res = await SELF.fetch("https://" + HOST + "/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
		body: JSON.stringify({ username, password }),
	});
	const setCookie = res.headers.get("Set-Cookie");
	return { status: res.status, cookie: setCookie?.split(";")[0] };
}

describe("API routes (integration)", () => {
	beforeAll(async () => {
		await applyMigrations();
		await setPassword("admin", "test-pass");
		await setPassword("petugas1", "test-pass");

		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
				const url =
					typeof input === "string"
						? input
						: input instanceof URL
							? input.href
							: input.url;
				if (url.includes("/turnstile/v0/siteverify")) {
					const body = new URLSearchParams(init?.body?.toString());
					const success = body.get("response") === "token-ok";
					return new Response(
						JSON.stringify({
							success,
							action: "ambil_antrian",
							hostname: HOST,
						}),
						{ status: 200, headers: { "Content-Type": "application/json" } },
					);
				}
				throw new Error("unexpected fetch: " + url);
			}),
		);
	});

	describe("auth", () => {
		it("menolak password salah lalu memblokir brute-force (5 gagal → 429)", async () => {
			const ip = "10.0.0.50";
			for (let i = 0; i < 5; i++) {
				const r = await login("admin", "salah", ip);
				expect(r.status).toBe(401);
			}
			const r = await login("admin", "test-pass", ip);
			expect(r.status).toBe(429);
		});

		it("login berhasil dengan cookie session", async () => {
			const r = await login("admin", "test-pass", "10.0.0.51");
			expect(r.status).toBe(200);
			expect(r.cookie).toMatch(/^session=/);
		});
	});

	describe("antrian", () => {
		const ambil = (ip: string, token?: string) =>
			SELF.fetch("https://" + HOST + "/api/antrian", {
				method: "POST",
				headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
				body: JSON.stringify(
					token === undefined
						? { id_layanan: 1 }
						: { id_layanan: 1, cf_turnstile_response: token },
				),
			});

		it("menolak tanpa token Turnstile", async () => {
			expect((await ambil("10.0.0.52")).status).toBe(400);
		});

		it("menolak token Turnstile invalid (fail-closed 403)", async () => {
			expect((await ambil("10.0.0.52", "token-invalid")).status).toBe(403);
		});

		it("membuat nomor atomik A-001 lalu cooldown IP 60s", async () => {
			const r1 = await ambil("10.0.0.60", "token-ok");
			expect(r1.status).toBe(201);
			expect(
				((await r1.json()) as { nomor_antrian: string }).nomor_antrian,
			).toBe("A-001");

			expect((await ambil("10.0.0.60", "token-ok")).status).toBe(429);

			const r3 = await ambil("10.0.0.61", "token-ok");
			expect(r3.status).toBe(201);
			expect(
				((await r3.json()) as { nomor_antrian: string }).nomor_antrian,
			).toBe("A-002");
		});

		it("GET /last dan display totalMenunggu", async () => {
			const last = (await SELF.fetch(
				"https://" + HOST + "/api/antrian/last",
			).then((r) => r.json())) as {
				nomor_antrian: string;
			};
			expect(last.nomor_antrian).toBe("A-002");

			const display = (await SELF.fetch(
				"https://" + HOST + "/api/antrian/display",
			).then((r) => r.json())) as { totalMenunggu: number };
			expect(display.totalMenunggu).toBe(2);
		});
	});

	describe("petugas flow", () => {
		it("next → skip → recall (FIFO + klaim atomik)", async () => {
			const petugas = await login("petugas1", "test-pass", "10.0.0.70");
			expect(petugas.cookie).toBeDefined();
			const headers = {
				"Content-Type": "application/json",
				Cookie: petugas.cookie ?? "",
				"CF-Connecting-IP": "10.0.0.70",
			};

			const next1 = (await SELF.fetch("https://" + HOST + "/api/antrian/next", {
				method: "POST",
				headers,
			}).then((r) => r.json())) as { next: { nomor_antrian: string } | null };
			expect(next1.next?.nomor_antrian).toBe("A-001");

			const skip = (await SELF.fetch("https://" + HOST + "/api/antrian/skip", {
				method: "POST",
				headers,
			}).then((r) => r.json())) as {
				dilewati: string;
				next: { nomor_antrian: string } | null;
			};
			expect(skip.dilewati).toBe("A-001");
			expect(skip.next?.nomor_antrian).toBe("A-002");

			const recall = (await SELF.fetch(
				"https://" + HOST + "/api/antrian/recall",
				{
					method: "POST",
					headers,
				},
			).then((r) => r.json())) as { ok: boolean };
			expect(recall.ok).toBe(true);
		});
	});
});
