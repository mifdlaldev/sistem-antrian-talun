<script lang="ts">
	import { Lock, User } from '@lucide/svelte/icons';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { navigate } from '$lib/router';
	import { login } from '$lib/session';

	let username = $state('');
	let password = $state('');
	let loading = $state(false);

	async function handleLogin() {
		if (loading) return;
		loading = true;
		try {
			const user = await login(username, password);
			toast.success(`Selamat datang, ${user.nama_lengkap}`);
			if (user.role === 'admin') {
				navigate('/admin/dashboard');
			} else {
				navigate('/petugas/dashboard');
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Gagal masuk');
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-navy p-4 font-sans">
	<div class="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"></div>
	<Card class="relative w-full max-w-md overflow-hidden border-white/10 shadow-2xl">
		<div class="border-b-4 border-gold bg-navy px-8 py-6 text-center">
			<img src="/logoinsunmedal.png" alt="Logo" class="mx-auto mb-3 h-14 w-14 rounded object-contain" />
			<h1 class="font-display text-xl font-bold tracking-tight text-white">Sistem Antrian</h1>
			<p class="mt-0.5 text-sm text-white/60">Kantor Kelurahan Desa Talun</p>
		</div>
		<CardContent class="px-8 py-7">
			<p class="mb-6 text-center font-display text-sm font-medium text-muted-foreground">
				Silakan login untuk masuk ke sistem
			</p>
			<form
				class="space-y-5"
				onsubmit={(e) => {
					e.preventDefault();
					handleLogin();
				}}
			>
				<div class="space-y-2">
					<Label for="username">Username</Label>
					<div class="relative">
						<User class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground" />
						<Input
							id="username"
							type="text"
							required
							class="pl-10"
							placeholder="Masukkan username"
							bind:value={username}
						/>
					</div>
				</div>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<div class="relative">
						<Lock class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground" />
						<Input
							id="password"
							type="password"
							required
							class="pl-10"
							placeholder="Masukkan password"
							bind:value={password}
						/>
					</div>
				</div>
				<Button type="submit" class="w-full font-display" size="lg" disabled={loading}>
					{loading ? 'Memproses...' : 'Masuk Sistem'}
				</Button>
			</form>
			<p class="mt-8 text-center text-xs text-muted-foreground">
				&copy; 2026 Kantor Kelurahan Desa Talun
			</p>
		</CardContent>
	</Card>
</div>
