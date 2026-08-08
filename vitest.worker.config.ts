import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const HOST = "website-antrian-kelurahan-talun.mifdlaltsaqibalf25.workers.dev";

export default defineConfig({
	plugins: [
		cloudflareTest({
			singleWorker: true,
			wrangler: { configPath: "./wrangler.jsonc" },
			miniflare: {
				bindings: {
					SESSION_SECRET: "test-secret",
					TURNSTILE_SECRET: "test-secret",
					TURNSTILE_HOSTNAMES: HOST,
				},
			},
		}),
	],
});
