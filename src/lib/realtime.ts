export function subscribeAntrian(onChange: () => void): () => void {
	let ws: WebSocket | null = null;
	let closed = false;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	function connect() {
		const proto = window.location.protocol === "https:" ? "wss" : "ws";
		ws = new WebSocket(`${proto}://${window.location.host}/api/realtime`);
		ws.onopen = () => onChange();
		ws.onmessage = () => onChange();
		ws.onclose = () => {
			if (!closed) reconnectTimer = setTimeout(connect, 3000);
		};
	}

	connect();

	return () => {
		closed = true;
		if (reconnectTimer) clearTimeout(reconnectTimer);
		ws?.close();
	};
}
