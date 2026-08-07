<script lang="ts">
import {
	CheckCircle,
	ChevronRight,
	Layers,
	LogOut,
	User,
	Users,
} from "@lucide/svelte/icons";
import { onMount } from "svelte";
import { toast } from "svelte-sonner";
import * as v from "valibot";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "$lib/components/ui/alert-dialog";
import { Button } from "$lib/components/ui/button";
import { Card, CardContent } from "$lib/components/ui/card";
import { todayIso } from "$lib/queue";
import { navigate } from "$lib/router";
import {
	type AntrianDenganLayanan,
	AntrianDenganLayananSchema,
} from "$lib/schemas";
import { clearSession, getSession } from "$lib/session";
import { subscribeAntrian, supabase } from "$lib/supabaseClient";

const session = getSession();
const petugas = {
	id: session?.id_user ?? 0,
	nama: session?.nama_lengkap ?? "",
	id_layanan_ditugaskan: session?.id_layanan ?? null,
};

let namaLayananTugas = $state("Memuat...");
let antrianSekarang = $state<AntrianDenganLayanan | null>(null);
let sisaAntrian = $state(0);
let totalSelesai = $state(0);
let loading = $state(false);
let dialogLogout = $state(false);

onMount(() => {
	if (!session) {
		navigate("/login");
		return;
	}
	cekNamaLayanan();
	fetchDataDashboard();

	const unsubscribe = subscribeAntrian("dashboard-petugas", fetchDataDashboard);

	return () => {
		unsubscribe();
	};
});

async function cekNamaLayanan() {
	if (petugas.id_layanan_ditugaskan) {
		const { data } = await supabase
			.from("layanan")
			.select("nama_layanan")
			.eq("id_layanan", petugas.id_layanan_ditugaskan)
			.single();
		namaLayananTugas = data?.nama_layanan ?? "Spesialis";
	} else {
		namaLayananTugas = "SEMUA LAYANAN";
	}
}

async function fetchDataDashboard() {
	const today = todayIso();

	const { data: sedangDilayani } = await supabase
		.from("antrian")
		.select("*, layanan(nama_layanan)")
		.eq("status", "dilayani")
		.eq("id_user", petugas.id)
		.eq("tanggal", today)
		.single();

	const parsed = v.safeParse(AntrianDenganLayananSchema, sedangDilayani);
	antrianSekarang = parsed.success ? parsed.output : null;

	let querySisa = supabase
		.from("antrian")
		.select("*", { count: "exact", head: true })
		.eq("status", "menunggu")
		.eq("tanggal", today);

	if (petugas.id_layanan_ditugaskan) {
		querySisa = querySisa.eq("id_layanan", petugas.id_layanan_ditugaskan);
	}
	const { count: sisa } = await querySisa;
	sisaAntrian = sisa ?? 0;

	const { count: selesai } = await supabase
		.from("antrian")
		.select("*", { count: "exact", head: true })
		.eq("status", "selesai")
		.eq("id_user", petugas.id)
		.eq("tanggal", today);
	totalSelesai = selesai ?? 0;
}

async function handleNextAntrian() {
	if (loading) return;
	loading = true;
	try {
		const today = todayIso();

		if (antrianSekarang) {
			await supabase
				.from("antrian")
				.update({ status: "selesai", waktu_selesai: new Date() })
				.eq("id_antrian", antrianSekarang.id_antrian);
		}

		let queryNext = supabase
			.from("antrian")
			.select("*")
			.eq("status", "menunggu")
			.eq("tanggal", today)
			.order("id_antrian", { ascending: true })
			.limit(1);

		if (petugas.id_layanan_ditugaskan) {
			queryNext = queryNext.eq("id_layanan", petugas.id_layanan_ditugaskan);
		}

		const { data: nextData } = await queryNext;
		const nextQueue = nextData?.[0];

		if (nextQueue) {
			await supabase
				.from("antrian")
				.update({ status: "dilayani", id_user: petugas.id })
				.eq("id_antrian", nextQueue.id_antrian);
			toast.success(`Memanggil ${nextQueue.nomor_antrian}`);
		} else {
			toast.info("Tidak ada antrian yang menunggu.");
		}

		await fetchDataDashboard();
	} catch {
		toast.error("Gagal memproses data.");
	} finally {
		loading = false;
	}
}

function handleLogout() {
	clearSession();
	navigate("/login");
}
</script>

<div class="min-h-screen bg-slate-50 text-slate-800">
	<nav class="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-emerald-100 p-2 text-emerald-700">
				{#if petugas.id_layanan_ditugaskan}
					<User class="size-6" />
				{:else}
					<Layers class="size-6" />
				{/if}
			</div>
			<div>
				<h1 class="text-lg font-bold uppercase">{namaLayananTugas}</h1>
				<p class="text-xs text-slate-500">{petugas.nama}</p>
			</div>
		</div>
		<button
			class="flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-red-500 hover:bg-red-50"
			onclick={() => (dialogLogout = true)}
		>
			<LogOut class="size-4.5" />
			Keluar
		</button>
	</nav>

	<main class="mx-auto max-w-5xl px-6 py-8">
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<div class="space-y-4">
				<Card>
					<CardContent class="flex items-center justify-between">
						<div>
							<p class="text-sm text-slate-500">Sisa Antrian</p>
							<h3 class="text-3xl font-bold">{sisaAntrian}</h3>
						</div>
						<Users class="size-7 text-orange-400" />
					</CardContent>
				</Card>
				<Card>
					<CardContent class="flex items-center justify-between">
						<div>
							<p class="text-sm text-slate-500">Total Selesai</p>
							<h3 class="text-3xl font-bold text-emerald-600">{totalSelesai}</h3>
						</div>
						<CheckCircle class="size-7 text-emerald-500" />
					</CardContent>
				</Card>
			</div>

			<Card class="flex flex-col overflow-hidden md:col-span-2">
				<div class="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 p-8">
					<p class="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
						Nomor Panggilan
					</p>
					{#if antrianSekarang}
						<div class="text-center">
							<span class="text-8xl font-bold tracking-tighter text-slate-900">
								{antrianSekarang.nomor_antrian}
							</span>
							{#if !petugas.id_layanan_ditugaskan}
								<p class="mt-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600">
									{antrianSekarang.layanan?.nama_layanan}
								</p>
							{/if}
						</div>
					{:else}
						<span class="text-8xl font-bold text-slate-200">---</span>
					{/if}
				</div>
				<div class="border-t border-slate-200 bg-slate-50 p-6">
					<Button
						class="w-full py-6 text-lg font-bold shadow-lg"
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
