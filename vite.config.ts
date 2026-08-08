/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts", "worker/src/queue.test.ts"],
	},
});
