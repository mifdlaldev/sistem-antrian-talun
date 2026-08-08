import { Hono } from "hono";
import { sessionMiddleware } from "./auth";
import type { Env } from "./env";
import { todayIso } from "./queue";
import { RealtimeHub } from "./realtime";
import { antrianRoutes } from "./routes/antrian";
import { authRoutes } from "./routes/auth";
import { layananRoutes } from "./routes/layanan";
import { statsRoutes } from "./routes/stats";
import { usersRoutes } from "./routes/users";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", sessionMiddleware);

app.route("/api/auth", authRoutes);
app.route("/api/layanan", layananRoutes);
app.route("/api/antrian", antrianRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/stats", statsRoutes);

app.get("/api/realtime", (c) =>
	c.env.REALTIME.get(c.env.REALTIME.idFromName("hub")).fetch(c.req.raw),
);

// SPA fallback: semua non-API dilayani oleh static assets (dist/)
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

const RETENSI_HARI = 90;

async function bersihkanAntrianLama(env: Env): Promise<void> {
	const batas = todayIso(
		new Date(Date.now() - RETENSI_HARI * 24 * 60 * 60 * 1000),
	);
	await env.DB.prepare(
		"DELETE FROM antrian WHERE status IN ('selesai', 'batal') AND tanggal < ?",
	)
		.bind(batas)
		.run();
}

const scheduled: ExportedHandlerScheduledHandler<Env> = async (
	_controller,
	env,
	ctx,
) => {
	ctx.waitUntil(bersihkanAntrianLama(env));
};

export default { fetch: app.fetch, scheduled };
export { RealtimeHub };
