<script lang="ts">
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { getCurrentUser } from '$lib/session';
	import { navigate } from '$lib/router';
	import type { User } from '$lib/schemas';
	import Kiosk from './routes/Kiosk.svelte';
	import Monitor from './routes/Monitor.svelte';
	import Login from './routes/Login.svelte';
	import AdminDashboard from './routes/AdminDashboard.svelte';
	import PetugasDashboard from './routes/PetugasDashboard.svelte';

	let path = $state(window.location.pathname);
	let user = $state<User | null>(null);
	let userLoaded = $state(false);

	onMount(() => {
		const onPop = () => {
			path = window.location.pathname;
		};
		window.addEventListener('popstate', onPop);
		return () => window.removeEventListener('popstate', onPop);
	});

	$effect(() => {
		void path;
		userLoaded = false;
		getCurrentUser().then((u) => {
			user = u;
			userLoaded = true;
		});
	});

	function resolveTarget(p: string): string {
		if (p === '/dashboard') return '/login';
		if (p === '/admin/dashboard') {
			if (!user) return '/login';
			if (user.role !== 'admin') return '/petugas/dashboard';
			return p;
		}
		if (p === '/petugas/dashboard') {
			if (!user) return '/login';
			if (user.role !== 'petugas') return '/admin/dashboard';
			return p;
		}
		return p;
	}

	$effect(() => {
		if (!userLoaded) return;
		const target = resolveTarget(path);
		if (target !== path) navigate(target);
	});

	const loading = $derived(
		!userLoaded && (path === '/dashboard' || path.startsWith('/admin') || path.startsWith('/petugas')),
	);
	const effectivePath = $derived(resolveTarget(path));
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
	</div>
{:else if effectivePath === '/'}
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
