<script lang="ts">
	import { Building2, Lock, User } from '@lucide/svelte/icons';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from '$lib/components/ui/card';
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

<div class="flex min-h-screen items-center justify-center bg-slate-100 p-4">
	<Card class="w-full max-w-md border-slate-200 shadow-xl">
		<CardHeader class="text-center">
			<div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200">
				<Building2 class="size-8 text-white" />
			</div>
			<CardTitle class="text-2xl font-bold">Sistem Antrian</CardTitle>
			<CardDescription>Silakan login untuk masuk ke sistem</CardDescription>
		</CardHeader>
		<CardContent>
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
						<User class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" />
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
						<Lock class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" />
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
				<Button type="submit" class="w-full" size="lg" disabled={loading}>
					{loading ? 'Memproses...' : 'Masuk Sistem'}
				</Button>
			</form>
			<p class="mt-8 text-center text-xs text-slate-400">&copy; 2026 Ujikom SMKN 1 Sumedang</p>
		</CardContent>
	</Card>
</div>
