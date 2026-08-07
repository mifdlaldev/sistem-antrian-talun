<script lang="ts">
	import { Calendar, Clock } from '@lucide/svelte/icons';
	import { onMount } from 'svelte';
	import * as v from 'valibot';
	import { api } from '$lib/api';
	import { subscribeAntrian } from '$lib/realtime';
	import {
		type AntrianDenganLayanan,
		AntrianDenganLayananSchema,
		type AntrianLengkap,
		AntrianLengkapSchema,
	} from '$lib/schemas';

	interface DisplayData {
		dilayani: unknown[];
		menunggu: unknown[];
		totalMenunggu?: number;
	}

	let antrianDilayani = $state<AntrianLengkap[]>([]);
	let antrianMenunggu = $state<AntrianDenganLayanan[]>([]);
	let totalMenunggu = $state(0);
	let waktu = $state(new Date());

	const dateFormatter = new Intl.DateTimeFormat('id-ID', {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});

	function formatTime(d: Date): string {
		return [d.getHours(), d.getMinutes(), d.getSeconds()]
			.map((n) => String(n).padStart(2, '0'))
			.join(':');
	}

	onMount(() => {
		const timer = setInterval(() => {
			waktu = new Date();
		}, 1000);

		fetchDataAntrian();
		const unsubscribe = subscribeAntrian(fetchDataAntrian);

		return () => {
			clearInterval(timer);
			unsubscribe();
		};
	});

	async function fetchDataAntrian() {
		try {
			const data = await api.get<DisplayData>('/api/antrian/display');
			const dilayani = v.safeParse(v.array(AntrianLengkapSchema), data.dilayani);
			const menunggu = v.safeParse(v.array(AntrianDenganLayananSchema), data.menunggu);
			if (dilayani.success) antrianDilayani = dilayani.output;
			if (menunggu.success) antrianMenunggu = menunggu.output;
			totalMenunggu = data.totalMenunggu ?? 0;
		} catch {
			// fetch gagal — biarkan tampilan lama, WS akan refetch
		}
	}
</script>

<div class="flex min-h-screen flex-col overflow-hidden bg-navy-deep font-sans text-white">
	<header class="z-10 flex flex-col items-center justify-between gap-4 border-b-4 border-gold bg-navy px-4 py-4 shadow-lg sm:flex-row sm:px-6 sm:py-5">
		<div class="flex items-center gap-3 sm:gap-4">
			<img src="/logoinsunmedal.png" alt="Logo" class="h-12 w-12 rounded object-contain sm:h-14 sm:w-14" />
			<div class="text-center sm:text-left">
				<h1 class="font-display text-xl font-bold uppercase tracking-wide sm:text-3xl">
					Kelurahan Desa Talun
				</h1>
				<p class="text-sm text-gold sm:text-lg">Sistem Antrian Terpadu</p>
			</div>
		</div>
		<div class="text-center sm:text-right">
			<div class="font-display text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
				{formatTime(waktu)}
			</div>
			<div class="mt-1 flex items-center justify-center gap-2 text-white/70 sm:justify-end">
				<Calendar class="size-4" />
				<span class="text-sm sm:text-lg">{dateFormatter.format(waktu)}</span>
			</div>
		</div>
	</header>

	<main class="relative grid flex-1 grid-cols-12 gap-4 p-4 sm:gap-6 sm:p-6">
		<div class="col-span-12 flex flex-col gap-4 lg:col-span-7 lg:gap-6">
			<div class="relative min-h-[30vh] flex-1 overflow-hidden rounded-2xl bg-navy shadow-xl sm:min-h-[40vh] lg:min-h-full">
				<img
					src="/kantorlurahtalun.jpg"
					alt="Profil Desa Talun"
					class="absolute inset-0 h-full w-full object-cover"
				/>
				<div class="absolute inset-0 bg-navy-deep/70"></div>
				{#if antrianDilayani.length > 0}
					<div class="absolute bottom-4 left-4 right-4 rounded-xl border-l-4 border-gold bg-navy/85 p-4 shadow-2xl backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
						<div class="text-center sm:text-left">
							<p class="mb-1 font-display text-sm font-semibold uppercase tracking-widest text-gold">
								Panggilan Terakhir
							</p>
							<p class="font-display text-xl font-semibold text-white sm:text-2xl">
								{antrianDilayani[0]?.layanan?.nama_layanan}
							</p>
							<p class="mt-1 text-base text-white/70 sm:text-lg">
								{antrianDilayani[0]?.users?.nama_lengkap ?? 'Petugas Loket'}
							</p>
						</div>
						<div class="mt-3 text-center sm:mt-0 sm:text-right">
							<span class="block font-display text-6xl font-bold tabular-nums tracking-tight text-gold sm:text-8xl">
								{antrianDilayani[0]?.nomor_antrian}
							</span>
						</div>
					</div>
				{:else}
					<div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
						<span class="font-display text-6xl font-bold tabular-nums tracking-tight text-white/40 sm:text-8xl">
							---
						</span>
						<p class="font-display text-sm font-semibold uppercase tracking-widest text-white/70 sm:text-base">
							Menunggu Panggilan
						</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="col-span-12 flex h-full flex-col lg:col-span-5">
			<div class="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
				<div class="flex items-center justify-center gap-2 bg-gold px-4 py-3.5 text-center sm:py-4">
					<h2 class="font-display text-lg font-bold uppercase tracking-wider text-navy sm:text-xl">
						Antrian Selanjutnya
					</h2>
					{#if totalMenunggu > 0}
						<span class="rounded-full bg-navy px-2.5 py-0.5 font-display text-xs font-bold tabular-nums text-gold sm:text-sm">
							{totalMenunggu}
						</span>
					{/if}
				</div>
				<div class="flex-1 overflow-hidden">
					{#if antrianMenunggu.length === 0}
						<div class="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-white/40">
							<Clock class="size-10" />
							<p class="text-lg sm:text-xl">Tidak ada antrian menunggu</p>
						</div>
					{:else}
						<div class="divide-y divide-white/10">
							{#each antrianMenunggu as item, index (item.id_antrian)}
								<div class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-white/5 sm:px-5 sm:py-5">
									<div class="flex items-center gap-3 sm:gap-4">
										<div class="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm font-bold text-gold sm:size-10 sm:text-base">
											{index + 1}
										</div>
										<div class="flex-grow">
											<p class="font-display text-base font-semibold text-white sm:text-lg">
												{item.layanan?.nama_layanan}
											</p>
											<p class="text-xs text-white/50 sm:text-sm">Menunggu giliran</p>
										</div>
									</div>
									<span class="pl-4 font-display text-3xl font-bold tabular-nums tracking-tight text-gold sm:text-5xl">
										{item.nomor_antrian}
									</span>
								</div>
							{/each}
						</div>
						{#if totalMenunggu > antrianMenunggu.length}
							<p class="border-t border-white/10 px-5 py-3 text-center font-display text-sm font-semibold text-white/60">
								+ {totalMenunggu - antrianMenunggu.length} antrian lagi menunggu
							</p>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</main>

	<footer class="relative overflow-hidden whitespace-nowrap border-t-4 border-gold bg-navy py-2 text-white sm:py-3">
		<div class="animate-marquee inline-block text-sm font-medium sm:text-lg">
			Selamat Datang di Kantor Kelurahan Desa Talun. Budayakan antri untuk kenyamanan
			bersama. Jam operasional Senin-Kamis (08:00 - 15:00) Jumat (08:00 - 11:00). Mohon
			siapkan berkas persyaratan Anda sebelum menuju loket.
		</div>
	</footer>
</div>

<style>
	@keyframes marquee {
		0% {
			transform: translateX(100vw);
		}
		100% {
			transform: translateX(-100%);
		}
	}
	.animate-marquee {
		animation: marquee 30s linear infinite;
		padding-left: 100%;
	}
</style>
