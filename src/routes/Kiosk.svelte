<script lang="ts">
	import { Building2, Info, MapPin, Printer, Tv } from '@lucide/svelte/icons';
	import { onMount } from 'svelte';
	import * as v from 'valibot';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
	} from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { api } from '$lib/api';
	import { navigate } from '$lib/router';
	import { type Layanan, LayananSchema } from '$lib/schemas';

	let daftarLayanan = $state<Layanan[]>([]);
	let loading = $state(false);
	let antrianTerakhir = $state('-');
	let popupTerbuka = $state(false);
	let nomorBaru = $state('');
	let namaLayananBaru = $state('');

	onMount(async () => {
		try {
			const data = await api.get<unknown>('/api/layanan');
			const result = v.safeParse(v.array(LayananSchema), data);
			if (result.success) daftarLayanan = result.output;
		} catch (error) {
			console.error('Gagal mengambil data layanan:', error);
		}
	});

	async function handleAmbilAntrian(layanan: Layanan) {
		if (loading) return;
		loading = true;
		try {
			const result = await api.post<{ nomor_antrian: string; nama_layanan: string }>(
				'/api/antrian',
				{ id_layanan: layanan.id_layanan },
			);

			antrianTerakhir = result.nomor_antrian;
			nomorBaru = result.nomor_antrian;
			namaLayananBaru = result.nama_layanan;
			popupTerbuka = true;
			setTimeout(() => {
				popupTerbuka = false;
			}, 4000);
		} catch (error) {
			console.error('Error saat ambil antrian:', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-slate-50 text-slate-800">
	<nav class="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
		<div class="flex items-center gap-3 sm:gap-4">
			<img src="/logoinsunmedal.png" alt="Logo" class="h-10 w-10 object-contain" />
			<div>
				<h1 class="text-lg font-bold text-slate-800 sm:text-xl">Pelayanan Terpadu</h1>
				<div class="flex items-center gap-1 text-xs text-slate-500 sm:text-sm">
					<MapPin class="size-3.5" />
					<span class="hidden sm:inline">Kantor Kelurahan Desa Talun</span>
					<span class="sm:hidden">Kelurahan Talun</span>
				</div>
			</div>
		</div>
		<button
			class="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-emerald-700 sm:flex"
			onclick={() => navigate('/monitor')}
		>
			<Tv class="size-4.5" />
			<span>Lihat Monitor Display</span>
		</button>
	</nav>

	<main class="mx-auto max-w-7xl px-4 py-8 lg:py-12">
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
			<div class="flex flex-col gap-6 lg:col-span-7">
				<div>
					<h2 class="mb-2 text-3xl font-bold text-slate-900">Ambil Nomor Antrian</h2>
					<p class="text-slate-500">
						Silakan pilih jenis layanan sesuai keperluan Anda di bawah ini.
					</p>
				</div>

				{#if daftarLayanan.length === 0}
					<Card class="py-20">
						<CardContent class="flex flex-col items-center gap-4">
							<div class="size-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
							<p class="text-slate-400">Memuat layanan...</p>
						</CardContent>
					</Card>
				{:else}
					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						{#each daftarLayanan as item (item.id_layanan)}
							<button
								class="group flex h-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl disabled:opacity-70"
								disabled={loading}
								onclick={() => handleAmbilAntrian(item)}
							>
								<div class="flex items-start justify-between">
									<div class="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 transition-colors group-hover:bg-emerald-600">
										<Printer class="size-7 text-emerald-600 transition-colors group-hover:text-white" />
									</div>
									<span class="text-4xl font-bold text-slate-100 transition-colors group-hover:text-emerald-50">
										{item.kode_huruf}
									</span>
								</div>
								<div>
									<h3 class="mb-1 text-lg font-bold text-slate-800 transition-colors group-hover:text-emerald-700">
										{item.nama_layanan}
									</h3>
									<p class="line-clamp-2 text-sm text-slate-500">{item.deskripsi}</p>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex flex-col gap-6 lg:col-span-5">
				<Card class="overflow-hidden">
					<CardHeader class="border-b border-emerald-100 bg-emerald-50/50 text-center">
						<CardTitle class="text-emerald-900">Nomor Terakhir Diambil</CardTitle>
						<p class="text-xs text-emerald-600/60">Baru saja dicetak</p>
					</CardHeader>
					<CardContent class="flex min-h-[200px] flex-col items-center justify-center gap-2">
						<span class="text-7xl font-bold tracking-tighter text-slate-900">
							{antrianTerakhir}
						</span>
						<div class="mt-6 flex gap-2 opacity-40">
							<div class="size-2 animate-bounce rounded-full bg-slate-400"></div>
							<div class="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:100ms]"></div>
							<div class="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:200ms]"></div>
						</div>
					</CardContent>
				</Card>

				<div class="relative overflow-hidden rounded-2xl bg-emerald-600 p-6 text-white shadow-lg shadow-emerald-200">
					<div class="relative z-10">
						<div class="mb-3 flex items-center gap-2 font-semibold opacity-90">
							<Info class="size-4.5" />
							<span>Jam Operasional</span>
						</div>
						<ul class="space-y-3 text-sm text-emerald-50">
							<li class="flex justify-between border-b border-emerald-500/30 pb-2">
								<span>Senin - Kamis</span>
								<span class="rounded bg-emerald-700/50 px-2 py-0.5 font-mono font-medium">
									08:00 - 15:00
								</span>
							</li>
							<li class="flex justify-between pt-1">
								<span>Jumat</span>
								<span class="rounded bg-emerald-700/50 px-2 py-0.5 font-mono font-medium">
									08:00 - 11:00
								</span>
							</li>
						</ul>
					</div>
					<div class="absolute -bottom-10 -right-10 size-32 rounded-full bg-white/10 blur-2xl"></div>
				</div>

				<div class="mt-4 block text-center sm:hidden">
					<button class="font-medium text-sm text-emerald-600 underline" onclick={() => navigate('/monitor')}>
						Lihat Monitor Display TV
					</button>
				</div>
			</div>
		</div>
	</main>

	<Dialog bind:open={popupTerbuka}>
		<DialogContent class="border-t-4 border-emerald-500 sm:max-w-md">
			<DialogHeader>
				<DialogTitle class="sr-only">Nomor Antrian Anda</DialogTitle>
				<DialogDescription class="sr-only">Nomor antrian berhasil dibuat</DialogDescription>
			</DialogHeader>
			<div class="flex flex-col items-center gap-2 py-4 text-center">
				<span class="text-sm text-slate-500">Nomor Antrian Anda</span>
				<span class="my-4 text-7xl font-bold tracking-widest text-emerald-600">{nomorBaru}</span>
				<div class="rounded-lg border border-emerald-100 bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-700">
					{namaLayananBaru}
				</div>
				<p class="mt-4 animate-pulse text-xs text-slate-400">Sedang mencetak struk...</p>
			</div>
		</DialogContent>
	</Dialog>

	<div class="flex items-center justify-center gap-2 pb-6 text-xs text-slate-400">
		<Building2 class="size-3.5" />
		<span>&copy; 2026 Ujikom SMKN 1 Sumedang</span>
	</div>
</div>
