export function todayIso(date: Date = new Date()): string {
	// Tanggal dalam zona WIB (Asia/Jakarta) — bukan UTC, agar pergantian hari
	// sesuai jam operasional kantor (08:00–15:00 WIB).
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Jakarta",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

export function buildNomorAntrian(kodeHuruf: string, urutan: number): string {
	return `${kodeHuruf}-${String(urutan).padStart(3, "0")}`;
}
