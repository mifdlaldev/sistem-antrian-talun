import type { Env } from "./env";

const HUB_ID = "hub";

export class RealtimeHub {
	private state: DurableObjectState;

	constructor(state: DurableObjectState) {
		this.state = state;
	}

	async fetch(request: Request): Promise<Response> {
		if (request.headers.get("Upgrade") === "websocket") {
			const pair = new WebSocketPair();
			const client = pair[0];
			const server = pair[1];
			if (!client || !server)
				return new Response("WebSocket error", { status: 400 });
			this.state.acceptWebSocket(server);
			return new Response(null, { status: 101, webSocket: client });
		}

		const url = new URL(request.url);
		if (url.pathname.endsWith("/broadcast")) {
			const message =
				(await request.text().catch(() => "refresh")) || "refresh";
			for (const ws of this.state.getWebSockets()) {
				try {
					ws.send(message);
				} catch {
					// koneksi sudah tertutup — abaikan
				}
			}
			return new Response("ok");
		}

		return new Response("Not Found", { status: 404 });
	}
}

export async function broadcast(env: Env, message = "refresh"): Promise<void> {
	const id = env.REALTIME.idFromName(HUB_ID);
	await env.REALTIME.get(id)
		.fetch(
			new Request("https://internal/broadcast", {
				method: "POST",
				body: message,
			}),
		)
		.catch(() => {
			// broadcast best-effort — jangan gagalkan mutasi karena notif gagal
		});
}
