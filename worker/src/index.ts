import { Hono } from "hono";
import { sessionMiddleware } from "./auth";
import type { Env } from "./env";
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

export default app;
export { RealtimeHub };
