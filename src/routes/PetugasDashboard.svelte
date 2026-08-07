<script lang="ts">
	import {
		CheckCircle,
		ChevronRight,
		Layers,
		LogOut,
		User,
		Users,
	} from '@lucide/svelte/icons';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import * as v from 'valibot';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
	} from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { api } from '$lib/api';
	import { subscribeAntrian } from '$lib/realtime';
	import { navigate } from '$lib/router';
	import {
		type AntrianDenganLayanan,
		AntrianDenganLayananSchema,
	} from '$lib/schemas';
	import { getCurrentUser, logout } from '$lib/session';

	interface PetugasDashboardData {
		sedangDilayani: unknown;
		sisaAntrian: number;
		totalSelesai: number;
		namaLayananTugas: string;
	}

	let petugas = $state({ id: 0, nama: '', id_layanan_ditugaskan: null as number | null });
	let namaLayananTugas = $state('Memuat...');
	let antrianSekarang = $state<AntrianDenganLayanan | null>(null);
	let sisaAntrian = $state(0);
	let totalSelesai = $state(0);
	let loading = $state(false);
	let dialogLogout = $state(false);

	onMount(() => {
		void init();

		const unsubscribe = subscribeAntrian(fetchDataDashboard);

		return () => {
			unsubscribe();
		};
	});

	async function init() {
		const user = await getCurrentUser();
		if (!user) {
			navigate('/login');
			return;
		}
		petugas = {
			id: user.id_user,
			nama: user.nama_lengkap,
			id_layanan_ditugaskan: user.id_layanan,
		};
		await fetchDataDashboard();
	}

	async function fetchDataDashboard() {
		try {
			const data = await api.get<PetugasDashboardData>('/api/antrian/petugas');
			const parsed = v.safeParse(AntrianDenganLayananSchema, data.sedangDilayani);
			antrianSekarang = parsed.success ? parsed.output : null;
			sisaAntrian = data.sisaAntrian;
			totalSelesai = data.totalSelesai;
			namaLayananTugas = data.namaLayananTugas;
		} catch {
			// fetch gagal — biarkan state lama
		}
	}

	async function handleNextAntrian() {
		if (loading) return;
		loading = true;
		try {
			const result = await api.post<{ next: AntrianDenganLayanan | null }>('/api/antrian/next');
			if (result.next) {
				toast.success(`Memanggil ${result.next.nomor_antrian}`);
			} else {
				toast.info('Tidak ada antrian yang menunggu.');
			}
			await fetchDataDashboard();
		} catch {
			toast.error('Gagal memproses data.');
		} finally {
			loading = false;
		}
	}

	function handleLogout() {
		logout().then(() => navigate('/login'));
	}
</script>

<div class="min-h-screen bg-muted/40 text-foreground">
	<nav class="sticky top-0 z-50 flex items-center justify-between border-b-2 border-gold bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-navy p-2.5 text-gold">
				{#if petugas.id_layanan_ditugaskan}
					<User class="size-5" />
				{:else}
					<Layers class="size-5" />
				{/if}
			</div>
			<div>
				<h1 class="font-display text-base font-bold uppercase tracking-wide text-navy sm:text-lg">
					{namaLayananTugas}
				</h1>
				<p class="text-xs text-muted-foreground">{petugas.nama}</p>
			</div>
		</div>
		<button
			class="flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
			onclick={() => (dialogLogout = true)}
		>
			<LogOut class="size-4.5" />
			Keluar
		</button>
	</nav>

	<main class="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
		<div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
			<div class="grid grid-cols-2 gap-4 sm:gap-6 md:col-span-3 md:grid-cols-3">
				<Card class="overflow-hidden">
					<div class="h-1 bg-gold"></div>
					<CardContent class="flex items-center justify-between">
						<div>
							<p class="text-sm text-muted-foreground">Sisa Antrian</p>
							<h3 class="font-display text-3xl font-bold tabular-nums text-navy">{sisaAntrian}</h3>
						</div>
						<Users class="size-7 text-gold-deep" />
					</CardContent>
				</Card>
				<Card class="overflow-hidden">
					<div class="h-1 bg-navy"></div>
					<CardContent class="flex items-center justify-between">
						<div>
							<p class="text-sm text-muted-foreground">Total Selesai</p>
							<h3 class="font-display text-3xl font-bold tabular-nums text-green-600">{totalSelesai}</h3>
						</div>
						<CheckCircle class="size-7 text-green-600" />
					</CardContent>
				</Card>
			</div>

			<Card class="flex flex-col overflow-hidden md:col-span-3">
				<div class="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-white to-muted p-6 sm:p-10">
					<p class="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-gold-deep">
						Nomor Panggilan
					</p>
					{#if antrianSekarang}
						<div class="text-center">
							<span class="font-display text-7xl font-bold tabular-nums tracking-tight text-navy sm:text-8xl">
								{antrianSekarang.nomor_antrian}
							</span>
							{#if !petugas.id_layanan_ditugaskan}
								<p class="mx-auto mt-3 w-fit rounded-full bg-gold px-4 py-1 font-display text-sm font-semibold text-navy">
									{antrianSekarang.layanan?.nama_layanan}
								</p>
							{/if}
						</div>
					{:else}
						<span class="font-display text-7xl font-bold tabular-nums text-slate-200 sm:text-8xl">---</span>
					{/if}
				</div>
				<div class="border-t border-border bg-muted/60 p-4 sm:p-6">
					<Button
						class="w-full py-6 font-display text-lg font-bold shadow-lg"
						size="lg"
						disabled={loading}
						onclick={handleNextAntrian}
					>
						{loading ? 'Memproses...' : antrianSekarang ? 'SELESAI & LANJUT' : 'PANGGIL ANTRIAN'}
						<ChevronRight class="size-5" />
					</Button>
				</div>
			</Card>
		</div>
	</main>

	<AlertDialog bind:open={dialogLogout}>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>Keluar?</AlertDialogTitle>
				<AlertDialogDescription>Kembali ke halaman login</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>Batal</AlertDialogCancel>
				<AlertDialogAction onclick={handleLogout}>Ya, Keluar</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
</div>
