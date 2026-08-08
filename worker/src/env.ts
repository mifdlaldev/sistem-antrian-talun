export interface Env {
	DB: D1Database;
	REALTIME: DurableObjectNamespace;
	SESSION_SECRET: string;
	TURNSTILE_SECRET: string;
	TURNSTILE_HOSTNAMES: string;
	ASSETS: Fetcher;
}
