<script lang="ts">
import {
	Layers,
	LayoutDashboard,
	LogOut,
	Menu,
	Pencil,
	Plus,
	Trash2,
	Users,
} from "@lucide/svelte/icons";
import { onMount } from "svelte";
import { toast } from "svelte-sonner";
import * as v from "valibot";
import BarChart from "$lib/components/BarChart.svelte";
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
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "$lib/components/ui/dialog";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "$lib/components/ui/native-select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "$lib/components/ui/table";
import { todayIso } from "$lib/queue";
import { navigate } from "$lib/router";
import {
	type Layanan,
	LayananSchema,
	type User,
	UserSchema,
} from "$lib/schemas";
import { clearSession, getSession } from "$lib/session";
import { supabase } from "$lib/supabaseClient";

type UserRow = User & { layanan?: { nama_layanan: string } | null };
type StatCard = { label: string; value: number; color: string };
type WeeklyDatum = {
	name: string;
	date: string;
	total: number;
	selesai: number;
};
type LayananStat = { name: string; fullName: string; value: number };
type LayananForm = {
	open: boolean;
	mode: "add" | "edit";
	id: number | null;
	nama: string;
	kode: string;
	desk: string;
};
type UserForm = {
	open: boolean;
	mode: "add" | "edit";
	id: number | null;
	username: string;
	nama: string;
	pass: string;
	idLayanan: string;
};
type DeleteTarget = { type: "layanan" | "user"; id: number } | null;

const COLORS = [
	"#10b981",
	"#f97316",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
];

const session = getSession();
let activeTab = $state<"home" | "layanan" | "users">("home");
let isSidebarOpen = $state(false);

let stats = $state({ total: 0, waiting: 0, completed: 0 });
let dataLayanan = $state<Layanan[]>([]);
let dataUsers = $state<UserRow[]>([]);
let weeklyData = $state<WeeklyDatum[]>([]);
let layananStats = $state<LayananStat[]>([]);

let layananForm = $state<LayananForm>({
	open: false,
	mode: "add",
	id: null,
	nama: "",
	kode: "",
	desk: "",
});
let userForm = $state<UserForm>({
	open: false,
	mode: "add",
	id: null,
	username: "",
	nama: "",
	pass: "",
	idLayanan: "",
});
let deleteTarget = $state<DeleteTarget>(null);

onMount(() => {
	if (!session) {
		navigate("/login");
		return;
	}
	fetchStats();
	fetchWeeklyData();
	fetchLayananStats();
});

async function fetchStats() {
	const today = todayIso();
	const { count: total } = await supabase
		.from("antrian")
		.select("*", { count: "exact", head: true })
		.eq("tanggal", today);
	const { count: waiting } = await supabase
		.from("antrian")
		.select("*", { count: "exact", head: true })
		.eq("tanggal", today)
		.eq("status", "menunggu");
	const { count: completed } = await supabase
		.from("antrian")
		.select("*", { count: "exact", head: true })
		.eq("tanggal", today)
		.eq("status", "selesai");
	stats = {
		total: total ?? 0,
		waiting: waiting ?? 0,
		completed: completed ?? 0,
	};
}

async function fetchWeeklyData() {
	const days: WeeklyDatum[] = [];
	for (let i = 6; i >= 0; i--) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().slice(0, 10);
		const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });

		const { count: total } = await supabase
			.from("antrian")
			.select("*", { count: "exact", head: true })
			.eq("tanggal", dateStr);
		const { count: completed } = await supabase
			.from("antrian")
			.select("*", { count: "exact", head: true })
			.eq("tanggal", dateStr)
			.eq("status", "selesai");

		days.push({
			name: dayName,
			date: dateStr,
			total: total ?? 0,
			selesai: completed ?? 0,
		});
	}
	weeklyData = days;
}

async function fetchLayananStats() {
	const today = todayIso();
	const { data: layananList } = await supabase
		.from("layanan")
		.select("id_layanan, nama_layanan, kode_huruf")
		.order("id_layanan");
	if (!layananList) return;

	const rows = await Promise.all(
		layananList.map(
			async (layanan: {
				id_layanan: number;
				nama_layanan: string;
				kode_huruf: string;
			}) => {
				const { count } = await supabase
					.from("antrian")
					.select("*", { count: "exact", head: true })
					.eq("tanggal", today)
					.eq("id_layanan", layanan.id_layanan);
				return {
					name: layanan.kode_huruf,
					fullName: layanan.nama_layanan,
					value: count ?? 0,
				};
			},
		),
	);
	layananStats = rows;
}

async function fetchLayanan() {
	const { data } = await supabase
		.from("layanan")
		.select("*")
		.order("id_layanan");
	const result = v.safeParse(v.array(LayananSchema), data);
	if (result.success) dataLayanan = result.output;
}

async function fetchUsers() {
	const { data } = await supabase
		.from("users")
		.select("*, layanan(nama_layanan)")
		.order("id_user");
	dataUsers = (data ?? []) as UserRow[];
}

function openTab(tab: "home" | "layanan" | "users") {
	activeTab = tab;
	isSidebarOpen = false;
	if (tab === "layanan") fetchLayanan();
	if (tab === "users") {
		fetchUsers();
		fetchLayanan();
	}
}

async function submitLayanan() {
	if (!layananForm.nama || !layananForm.kode) {
		toast.error("Nama dan Kode wajib diisi");
		return;
	}
	if (layananForm.mode === "add") {
		const { error } = await supabase.from("layanan").insert([
			{
				nama_layanan: layananForm.nama,
				kode_huruf: layananForm.kode,
				deskripsi: layananForm.desk || null,
			},
		]);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Layanan ditambahkan");
	} else {
		const { error } = await supabase
			.from("layanan")
			.update({
				nama_layanan: layananForm.nama,
				kode_huruf: layananForm.kode,
				deskripsi: layananForm.desk || null,
			})
			.eq("id_layanan", layananForm.id);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Data berhasil diperbarui");
	}
	layananForm.open = false;
	fetchLayanan();
	fetchLayananStats();
	fetchStats();
}

async function submitUser() {
	if (!userForm.username || (userForm.mode === "add" && !userForm.pass)) {
		toast.error("Username dan Password wajib diisi");
		return;
	}
	const payloadLayanan = userForm.idLayanan
		? Number.parseInt(userForm.idLayanan, 10)
		: null;
	if (userForm.mode === "add") {
		const { error } = await supabase.from("users").insert([
			{
				username: userForm.username,
				password: userForm.pass,
				nama_lengkap: userForm.nama,
				role: "petugas",
				id_layanan: payloadLayanan,
			},
		]);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Petugas ditambahkan");
	} else {
		const updateData: Record<string, unknown> = {
			username: userForm.username,
			nama_lengkap: userForm.nama,
			id_layanan: payloadLayanan,
		};
		if (userForm.pass) updateData.password = userForm.pass;
		const { error } = await supabase
			.from("users")
			.update(updateData)
			.eq("id_user", userForm.id);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Data petugas diperbarui");
	}
	userForm.open = false;
	fetchUsers();
}

function openAddLayanan() {
	layananForm = {
		open: true,
		mode: "add",
		id: null,
		nama: "",
		kode: "",
		desk: "",
	};
}

function openEditLayanan(item: Layanan) {
	layananForm = {
		open: true,
		mode: "edit",
		id: item.id_layanan,
		nama: item.nama_layanan,
		kode: item.kode_huruf,
		desk: item.deskripsi ?? "",
	};
}

function openAddUser() {
	userForm = {
		open: true,
		mode: "add",
		id: null,
		username: "",
		nama: "",
		pass: "",
		idLayanan: "",
	};
}

function openEditUser(user: UserRow) {
	userForm = {
		open: true,
		mode: "edit",
		id: user.id_user,
		username: user.username,
		nama: user.nama_lengkap,
		pass: "",
		idLayanan: user.id_layanan === null ? "" : String(user.id_layanan),
	};
}

async function confirmDelete() {
	if (!deleteTarget) return;
	if (deleteTarget.type === "layanan") {
		const { error } = await supabase
			.from("layanan")
			.delete()
			.eq("id_layanan", deleteTarget.id);
		if (error) {
			toast.error(
				"Tidak bisa menghapus layanan yang sudah memiliki history antrian.",
			);
		} else {
			toast.success("Layanan telah dihapus");
			fetchLayanan();
			fetchLayananStats();
		}
	} else {
		const { error } = await supabase
			.from("users")
			.delete()
			.eq("id_user", deleteTarget.id);
		if (error) {
			toast.error(error.message);
		} else {
			toast.success("User berhasil dihapus");
			fetchUsers();
		}
	}
	deleteTarget = null;
}

function handleLogout() {
	clearSession();
	navigate("/login");
}

const statCards = $derived<StatCard[]>([
	{
		label: "Total Antrian Hari Ini",
		value: stats.total,
		color: "text-slate-800",
	},
	{ label: "Menunggu", value: stats.waiting, color: "text-orange-500" },
	{ label: "Selesai", value: stats.completed, color: "text-emerald-600" },
]);
</script>

<div class="flex h-screen bg-slate-100 text-slate-800">
	<aside
		class="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-300 lg:relative lg:translate-x-0 {isSidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<div class="flex items-center gap-3 border-b border-slate-700 bg-slate-950 p-6">
			<img src="/logoinsunmedal.png" alt="Logo" class="h-10 w-10 object-contain" />
			<div>
				<h1 class="text-lg font-bold">Admin Panel</h1>
				<p class="text-xs text-slate-400">Desa Talun</p>
			</div>
		</div>
		<nav class="flex-1 space-y-2 p-4">
			<button
				class="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all {activeTab === 'home'
					? 'bg-emerald-600 text-white'
					: 'text-slate-400 hover:bg-slate-800'}"
				onclick={() => openTab('home')}
			>
				<LayoutDashboard class="size-5" />
				Dashboard
			</button>
			<button
				class="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all {activeTab === 'layanan'
					? 'bg-emerald-600 text-white'
					: 'text-slate-400 hover:bg-slate-800'}"
				onclick={() => openTab('layanan')}
			>
				<Layers class="size-5" />
				Kelola Layanan
			</button>
			<button
				class="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all {activeTab === 'users'
					? 'bg-emerald-600 text-white'
					: 'text-slate-400 hover:bg-slate-800'}"
				onclick={() => openTab('users')}
			>
				<Users class="size-5" />
				Kelola Petugas
			</button>
		</nav>
		<div class="border-t border-slate-800 bg-slate-950 p-4">
			<button
				class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-400 transition-all hover:bg-red-500/10"
				onclick={handleLogout}
			>
				<LogOut class="size-5" />
				Keluar Sistem
			</button>
		</div>
	</aside>

	{#if isSidebarOpen}
		<button
			type="button"
			aria-label="Tutup menu"
			class="fixed inset-0 z-10 bg-black/50 lg:hidden"
			onclick={() => (isSidebarOpen = false)}
		></button>
	{/if}

	<div class="flex flex-1 flex-col">
		<header class="sticky top-0 z-10 flex items-center justify-between bg-white p-4 shadow-sm lg:hidden">
			<button onclick={() => (isSidebarOpen = true)}>
				<Menu class="size-6" />
			</button>
			<h1 class="text-lg font-bold">
				{activeTab === 'home' && 'Dashboard'}
				{activeTab === 'layanan' && 'Kelola Layanan'}
				{activeTab === 'users' && 'Kelola Petugas'}
			</h1>
			<div class="w-6"></div>
		</header>

		<main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
			{#if activeTab === 'home'}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					{#each statCards as card (card.label)}
						<Card>
							<CardHeader>
								<CardDescription>{card.label}</CardDescription>
								<CardTitle class="text-3xl {card.color}">{card.value}</CardTitle>
							</CardHeader>
						</Card>
					{/each}
				</div>

				<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Tren Antrian 7 Hari</CardTitle>
							<CardDescription>Jumlah antrian per hari (total & selesai)</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							<div class="flex gap-6">
								{#each weeklyData as item (item.date)}
									<div class="flex flex-1 flex-col items-center gap-1">
										<span class="text-sm font-bold">{item.total}</span>
										<div class="flex h-32 w-full items-end gap-0.5">
											<div
												class="flex-1 rounded-t bg-emerald-500"
												style="height: {item.selesai > 0 ? (item.selesai / Math.max(...weeklyData.map((d) => d.total), 1)) * 100 : 2}%"
											></div>
										</div>
										<span class="text-xs text-muted-foreground">{item.name}</span>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Antrian per Layanan</CardTitle>
							<CardDescription>Distribusi hari ini</CardDescription>
						</CardHeader>
						<CardContent>
							<BarChart
								direction="horizontal"
								data={layananStats.map((item, i) => ({
									label: item.fullName,
									value: item.value,
									color: COLORS[i % COLORS.length],
								}))}
							/>
						</CardContent>
					</Card>
				</div>
			{:else if activeTab === 'layanan'}
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-bold">Kelola Layanan</h2>
					<Button onclick={openAddLayanan}>
						<Plus class="size-4" />
						Tambah Layanan
					</Button>
				</div>
				<Card>
					<CardContent class="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Kode</TableHead>
									<TableHead>Nama Layanan</TableHead>
									<TableHead>Deskripsi</TableHead>
									<TableHead class="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each dataLayanan as item (item.id_layanan)}
									<TableRow>
										<TableCell>
											<Badge variant="outline">{item.kode_huruf}</Badge>
										</TableCell>
										<TableCell class="font-medium">{item.nama_layanan}</TableCell>
										<TableCell class="text-muted-foreground">{item.deskripsi}</TableCell>
										<TableCell class="text-right">
											<div class="flex justify-end gap-2">
												<Button
													variant="outline"
													size="sm"
													onclick={() => openEditLayanan(item)}
												>
													<Pencil class="size-3.5" />
													Edit
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onclick={() => (deleteTarget = { type: 'layanan', id: item.id_layanan })}
												>
													<Trash2 class="size-3.5" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								{/each}
								{#if dataLayanan.length === 0}
									<TableRow>
										<TableCell colspan={4} class="py-8 text-center text-muted-foreground">
											Belum ada layanan
										</TableCell>
									</TableRow>
								{/if}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			{:else}
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-bold">Kelola Petugas</h2>
					<Button onclick={openAddUser}>
						<Plus class="size-4" />
						Tambah Petugas
					</Button>
				</div>
				<Card>
					<CardContent class="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Username</TableHead>
									<TableHead>Nama Lengkap</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Penugasan</TableHead>
									<TableHead class="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each dataUsers as item (item.id_user)}
									<TableRow>
										<TableCell class="font-medium">{item.username}</TableCell>
										<TableCell>{item.nama_lengkap}</TableCell>
										<TableCell>
											<Badge>{item.role}</Badge>
										</TableCell>
										<TableCell class="text-muted-foreground">
											{item.layanan?.nama_layanan ?? 'Semua Layanan'}
										</TableCell>
										<TableCell class="text-right">
											<div class="flex justify-end gap-2">
												<Button variant="outline" size="sm" onclick={() => openEditUser(item)}>
													<Pencil class="size-3.5" />
													Edit
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onclick={() => (deleteTarget = { type: 'user', id: item.id_user })}
												>
													<Trash2 class="size-3.5" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								{/each}
								{#if dataUsers.length === 0}
									<TableRow>
										<TableCell colspan={5} class="py-8 text-center text-muted-foreground">
											Belum ada petugas
										</TableCell>
									</TableRow>
								{/if}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			{/if}
		</main>
	</div>

	<Dialog bind:open={layananForm.open}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{layananForm.mode === 'add' ? 'Tambah Layanan Baru' : 'Edit Layanan'}</DialogTitle>
				<DialogDescription>Isi data layanan di bawah ini.</DialogDescription>
			</DialogHeader>
			<div class="space-y-4 py-2">
				<div class="space-y-2">
					<Label for="layanan-nama">Nama Layanan</Label>
					<Input id="layanan-nama" placeholder="Contoh: BPJS" bind:value={layananForm.nama} />
				</div>
				<div class="space-y-2">
					<Label for="layanan-kode">Kode Huruf</Label>
					<Input id="layanan-kode" placeholder="Contoh: C" bind:value={layananForm.kode} />
				</div>
				<div class="space-y-2">
					<Label for="layanan-desk">Deskripsi Singkat</Label>
					<Input id="layanan-desk" placeholder="Opsional" bind:value={layananForm.desk} />
				</div>
			</div>
			<DialogFooter>
				<Button variant="outline" onclick={() => (layananForm.open = false)}>Batal</Button>
				<Button onclick={submitLayanan}>Simpan</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>

	<Dialog bind:open={userForm.open}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{userForm.mode === 'add' ? 'Tambah Petugas Baru' : 'Edit Data Petugas'}</DialogTitle>
				<DialogDescription>Isi data petugas di bawah ini.</DialogDescription>
			</DialogHeader>
			<div class="space-y-4 py-2">
				<div class="space-y-2">
					<Label for="user-username">Username</Label>
					<Input id="user-username" bind:value={userForm.username} />
				</div>
				<div class="space-y-2">
					<Label for="user-nama">Nama Lengkap</Label>
					<Input id="user-nama" bind:value={userForm.nama} />
				</div>
				<div class="space-y-2">
					<Label for="user-pass">
						{userForm.mode === 'add' ? 'Password' : 'Password Baru (Kosongkan jika tetap)'}
					</Label>
					<Input
						id="user-pass"
						type="password"
						placeholder={userForm.mode === 'edit' ? '***' : ''}
						bind:value={userForm.pass}
					/>
				</div>
				<div class="space-y-2">
					<Label for="user-layanan">Tugas Layanan</Label>
					<NativeSelect id="user-layanan" bind:value={userForm.idLayanan}>
						<NativeSelectOption value="">-- Semua Layanan (General) --</NativeSelectOption>
						{#each dataLayanan as item (item.id_layanan)}
							<NativeSelectOption value={String(item.id_layanan)}>
								{item.nama_layanan}
							</NativeSelectOption>
						{/each}
					</NativeSelect>
				</div>
			</div>
			<DialogFooter>
				<Button variant="outline" onclick={() => (userForm.open = false)}>Batal</Button>
				<Button onclick={submitUser}>Simpan</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>

	<AlertDialog
		open={deleteTarget !== null}
		onOpenChange={(open: boolean) => {
			if (!open) deleteTarget = null;
		}}
	>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>
					Hapus {deleteTarget?.type === 'layanan' ? 'Layanan' : 'User'}?
				</AlertDialogTitle>
				<AlertDialogDescription>
					{deleteTarget?.type === 'layanan'
						? 'Data antrian terkait mungkin akan error jika dihapus!'
						: 'User tidak bisa login lagi!'}
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel onclick={() => (deleteTarget = null)}>Batal</AlertDialogCancel>
				<AlertDialogAction onclick={confirmDelete}>Ya, Hapus</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
</div>
