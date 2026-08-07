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
	}

	let antrianDilayani = $state<AntrianLengkap[]>([]);
	let antrianMenunggu = $state<AntrianDenganLayanan[]>([]);
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
		} catch {
			// fetch gagal — biarkan tampilan lama, WS akan refetch
		}
	}
</script>

<div class="flex min-h-screen flex-col overflow-hidden bg-slate-100 text-slate-800">
	<header class="z-10 flex flex-col items-center justify-between gap-4 bg-emerald-700 p-4 text-white shadow-lg sm:flex-row sm:p-6">
		<div class="flex items-center gap-3 sm:gap-4">
			<img src="/logoinsunmedal.png" alt="Logo" class="h-15 w-15 object-contain" />
			<div class="text-center sm:text-left">
				<h1 class="text-xl font-bold uppercase tracking-wide sm:text-3xl">
					Kelurahan Desa Talun
				</h1>
				<p class="text-sm text-emerald-100 sm:text-lg">Sistem Antrian Terpadu</p>
			</div>
		</div>
		<div class="text-center sm:text-right">
			<div class="font-mono text-3xl font-bold sm:text-4xl">{formatTime(waktu)}</div>
			<div class="mt-1 flex items-center justify-center gap-2 text-emerald-100 sm:justify-end">
				<Calendar class="size-4" />
				<span class="text-sm sm:text-lg">{dateFormatter.format(waktu)}</span>
			</div>
		</div>
	</header>

	<main class="relative grid flex-1 grid-cols-12 gap-6 p-4 sm:p-6">
		<div class="col-span-12 flex flex-col gap-6 lg:col-span-7">
			<div class="relative min-h-[30vh] flex-1 overflow-hidden rounded-3xl bg-slate-800 shadow-xl group sm:min-h-[40vh] lg:min-h-full">
				<img
					src="/kantorlurahtalun.jpg"
					alt="Profil Desa Talun"
					class="absolute inset-0 h-full w-full object-cover"
				/>
				{#if antrianDilayani.length > 0}
					<div
						class="absolute bottom-4 left-4 right-4 flex flex-col items-center justify-between gap-4 rounded-2xl border-l-8 border-emerald-500 bg-white/95 p-4 shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-6 sm:right-6 sm:flex-row sm:p-6 sm:text-left"
					>
						<div class="text-center sm:text-left">
							<p class="mb-1 text-base font-medium uppercase text-slate-500 sm:text-lg">
								Panggilan Terakhir
							</p>
							<p class="text-xl font-bold text-slate-800 sm:text-2xl">
								{antrianDilayani[0]?.layanan?.nama_layanan}
							</p>
							<p class="mt-1 text-base font-medium text-emerald-600 sm:text-lg">
								{antrianDilayani[0]?.users?.nama_lengkap ?? 'Petugas Loket'}
							</p>
						</div>
						<div class="text-center sm:text-right">
							<span class="block text-6xl font-bold tracking-tighter text-slate-900 sm:text-8xl">
								{antrianDilayani[0]?.nomor_antrian}
							</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div class="col-span-12 flex h-full flex-col lg:col-span-5">
			<div class="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
				<div class="bg-emerald-600 p-4 text-center sm:p-5">
					<h2 class="text-xl font-bold uppercase tracking-wider text-white sm:text-2xl">
						Antrian Selanjutnya
					</h2>
				</div>
				<div class="flex-1 overflow-hidden p-0">
					{#if antrianMenunggu.length === 0}
						<div class="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-slate-400 opacity-50">
							<Clock class="size-10" />
							<p class="text-lg sm:text-xl">Tidak ada antrian menunggu</p>
						</div>
					{:else}
						<div class="divide-y divide-slate-100">
							{#each antrianMenunggu as item, index (item.id_antrian)}
								<div class="flex items-center justify-between p-4 transition-colors hover:bg-emerald-50 sm:p-6">
									<div class="flex items-center gap-3 sm:gap-4">
										<div class="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500 sm:size-10 sm:text-base">
											{index + 1}
										</div>
										<div class="flex-grow">
											<p class="text-base font-bold text-slate-700 sm:text-lg">
												{item.layanan?.nama_layanan}
											</p>
											<p class="text-xs text-slate-400 sm:text-sm">Menunggu giliran</p>
										</div>
									</div>
									<span class="pl-4 text-3xl font-bold text-emerald-600 sm:text-5xl">
										{item.nomor_antrian}
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</main>

	<footer class="relative overflow-hidden whitespace-nowrap border-t-4 border-emerald-500 bg-slate-900 py-2 text-white sm:py-3">
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
