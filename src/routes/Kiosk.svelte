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

<div class="min-h-screen bg-muted/40 font-sans">
	<nav class="sticky top-0 z-50 border-b-4 border-gold bg-navy text-white shadow-md">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
			<div class="flex items-center gap-3 sm:gap-4">
				<img src="/logoinsunmedal.png" alt="Logo" class="h-10 w-10 rounded object-contain sm:h-12 sm:w-12" />
				<div>
					<h1 class="font-display text-lg font-bold tracking-tight sm:text-xl">
						Pelayanan Terpadu
					</h1>
					<div class="flex items-center gap-1 text-xs text-white/70 sm:text-sm">
						<MapPin class="size-3.5" />
						<span class="hidden sm:inline">Kantor Kelurahan Desa Talun</span>
						<span class="sm:hidden">Kelurahan Talun</span>
					</div>
				</div>
			</div>
			<button
				class="hidden items-center gap-2 rounded-lg border border-gold/70 px-4 py-2 font-display text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-navy sm:flex"
				onclick={() => navigate('/monitor')}
			>
				<Tv class="size-4.5" />
				<span>Monitor Display</span>
			</button>
		</div>
	</nav>

	<main class="mx-auto max-w-7xl px-4 py-8 lg:py-12">
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
			<div class="flex flex-col gap-6 lg:col-span-7">
				<div>
					<p class="mb-1 font-display text-xs font-semibold uppercase tracking-widest text-gold-deep">
						Pilih Layanan
					</p>
					<h2 class="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">
						Ambil Nomor Antrian
					</h2>
					<p class="mt-1 text-muted-foreground">
						Silakan pilih jenis layanan sesuai keperluan Anda di bawah ini.
					</p>
				</div>

				{#if daftarLayanan.length === 0}
					<Card class="py-20">
						<CardContent class="flex flex-col items-center gap-4">
							<div class="size-10 animate-spin rounded-full border-4 border-navy border-t-transparent"></div>
							<p class="text-muted-foreground">Memuat layanan...</p>
						</CardContent>
					</Card>
				{:else}
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{#each daftarLayanan as item (item.id_layanan)}
							<button
								class="group flex min-h-[132px] flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-navy hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60 sm:p-6"
								disabled={loading}
								onclick={() => handleAmbilAntrian(item)}
							>
								<div class="flex items-start justify-between">
									<div class="flex size-12 items-center justify-center rounded-lg bg-navy/5 transition-colors group-hover:bg-navy">
										<Printer class="size-6 text-navy transition-colors group-hover:text-gold" />
									</div>
									<span class="font-display text-4xl font-bold leading-none text-navy/15 transition-colors group-hover:text-gold/70">
										{item.kode_huruf}
									</span>
								</div>
								<div>
									<h3 class="font-display text-base font-semibold text-foreground transition-colors group-hover:text-navy sm:text-lg">
										{item.nama_layanan}
									</h3>
									<p class="line-clamp-2 text-sm text-muted-foreground">{item.deskripsi}</p>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex flex-col gap-6 lg:col-span-5">
				<div class="overflow-hidden rounded-xl border-2 border-gold bg-navy shadow-lg">
					<div class="border-b border-gold/30 px-5 py-4 text-center">
						<p class="font-display text-xs font-semibold uppercase tracking-widest text-gold">
							Nomor Terakhir Diambil
						</p>
						<p class="mt-0.5 text-xs text-white/60">Baru saja dicetak</p>
					</div>
					<div class="flex min-h-[180px] flex-col items-center justify-center gap-2 px-5 py-8">
						<span class="font-display text-6xl font-bold tabular-nums tracking-tight text-white">
							{antrianTerakhir}
						</span>
						<div class="mt-4 flex gap-2">
							<div class="size-2 animate-bounce rounded-full bg-gold"></div>
							<div class="size-2 animate-bounce rounded-full bg-gold [animation-delay:100ms]"></div>
							<div class="size-2 animate-bounce rounded-full bg-gold [animation-delay:200ms]"></div>
						</div>
					</div>
				</div>

				<div class="relative overflow-hidden rounded-xl border border-navy/10 bg-navy-deep p-6 text-white shadow-md">
					<div class="absolute inset-x-0 top-0 h-1 bg-gold"></div>
					<div class="relative z-10">
						<div class="mb-4 flex items-center gap-2 font-display font-semibold">
							<Info class="size-4.5 text-gold" />
							<span>Jam Operasional</span>
						</div>
						<ul class="space-y-3 text-sm text-white/80">
							<li class="flex items-center justify-between border-b border-white/10 pb-3">
								<span>Senin - Kamis</span>
								<span class="rounded bg-white/10 px-2.5 py-1 font-display text-xs font-semibold tabular-nums text-gold">
									08:00 - 15:00
								</span>
							</li>
							<li class="flex items-center justify-between pt-1">
								<span>Jumat</span>
								<span class="rounded bg-white/10 px-2.5 py-1 font-display text-xs font-semibold tabular-nums text-gold">
									08:00 - 11:00
								</span>
							</li>
						</ul>
					</div>
					<div class="absolute -bottom-10 -right-10 size-32 rounded-full bg-gold/10 blur-2xl"></div>
				</div>

				<div class="block text-center sm:hidden">
					<button
						class="font-display text-sm font-semibold text-navy underline underline-offset-4"
						onclick={() => navigate('/monitor')}
					>
						Lihat Monitor Display TV
					</button>
				</div>
			</div>
		</div>
	</main>

	<Dialog bind:open={popupTerbuka}>
		<DialogContent class="sm:max-w-md">
			<DialogHeader>
				<DialogTitle class="sr-only">Nomor Antrian Anda</DialogTitle>
				<DialogDescription class="sr-only">Nomor antrian berhasil dibuat</DialogDescription>
			</DialogHeader>
			<div class="overflow-hidden rounded-lg border-2 border-gold bg-navy text-center text-white">
				<div class="border-b border-gold/30 px-5 py-4">
					<p class="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">
						Nomor Antrian Anda
					</p>
				</div>
				<div class="flex flex-col items-center gap-2 px-5 py-8">
					<span class="font-display text-7xl font-bold tabular-nums tracking-tight">{nomorBaru}</span>
					<div class="mt-2 rounded-full bg-gold px-5 py-1.5 font-display text-sm font-semibold text-navy">
						{namaLayananBaru}
					</div>
					<p class="mt-4 animate-pulse text-xs text-white/60">Sedang mencetak struk...</p>
				</div>
			</div>
		</DialogContent>
	</Dialog>

	<div class="flex items-center justify-center gap-2 border-t border-border pb-6 pt-6 text-xs text-muted-foreground">
		<Building2 class="size-3.5" />
		<span>&copy; 2026 Kantor Kelurahan Desa Talun</span>
	</div>
</div>
