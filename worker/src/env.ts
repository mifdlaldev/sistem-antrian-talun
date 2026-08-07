export interface Env {
	DB: D1Database;
	REALTIME: DurableObjectNamespace;
	SESSION_SECRET: string;
	ASSETS: Fetcher;
}
