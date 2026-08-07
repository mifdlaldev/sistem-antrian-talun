<script lang="ts">
import { onMount } from "svelte";
import { Toaster } from "$lib/components/ui/sonner";
import { navigate } from "$lib/router";
import { getSession } from "$lib/session";
import AdminDashboard from "./routes/AdminDashboard.svelte";
import Kiosk from "./routes/Kiosk.svelte";
import Login from "./routes/Login.svelte";
import Monitor from "./routes/Monitor.svelte";
import PetugasDashboard from "./routes/PetugasDashboard.svelte";

let path = $state(window.location.pathname);

onMount(() => {
	const onPop = () => {
		path = window.location.pathname;
	};
	window.addEventListener("popstate", onPop);
	return () => window.removeEventListener("popstate", onPop);
});

function resolveTarget(p: string): string {
	const session = getSession();
	if (p === "/dashboard") return "/login";
	if (p === "/admin/dashboard") {
		if (!session) return "/login";
		if (session.role !== "admin") return "/petugas/dashboard";
		return p;
	}
	if (p === "/petugas/dashboard") {
		if (!session) return "/login";
		if (session.role !== "petugas") return "/admin/dashboard";
		return p;
	}
	return p;
}

$effect(() => {
	const target = resolveTarget(path);
	if (target !== path) navigate(target);
});

const effectivePath = $derived(resolveTarget(path));
</script>

{#if effectivePath === '/'}
	<Kiosk />
{:else if effectivePath === '/monitor'}
	<Monitor />
{:else if effectivePath === '/login'}
	<Login />
{:else if effectivePath === '/admin/dashboard'}
	<AdminDashboard />
{:else if effectivePath === '/petugas/dashboard'}
	<PetugasDashboard />
{:else}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<h1 class="text-6xl font-bold tracking-tight">404</h1>
			<p class="mt-2 text-muted-foreground">Halaman Tidak Ditemukan</p>
		</div>
	</div>
{/if}

<Toaster position="top-center" richColors />
