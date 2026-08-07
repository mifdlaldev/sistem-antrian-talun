export function todayIso(date: Date = new Date()): string {
	return date.toISOString().slice(0, 10);
}

export function buildNomorAntrian(kodeHuruf: string, urutan: number): string {
	return `${kodeHuruf}-${String(urutan).padStart(3, "0")}`;
}
