import { describe, expect, it } from "vitest";
import { buildNomorAntrian, todayIso } from "./queue";

describe("buildNomorAntrian", () => {
	it("menghasilkan format KODE-001 dengan zero-padding 3 digit", () => {
		expect(buildNomorAntrian("A", 1)).toBe("A-001");
		expect(buildNomorAntrian("B", 12)).toBe("B-012");
		expect(buildNomorAntrian("C", 999)).toBe("C-999");
	});
});

describe("todayIso (zona WIB)", () => {
	it("mengembalikan tanggal ISO YYYY-MM-DD", () => {
		expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("mengikuti tanggal WIB saat UTC sudah berganti hari", () => {
		// 2026-08-08T23:30:00Z = 2026-08-09 06:30 WIB
		expect(todayIso(new Date("2026-08-08T23:30:00Z"))).toBe("2026-08-09");
	});

	it("tetap tanggal yang sama saat pagi WIB (UTC hari sebelumnya)", () => {
		// 2026-08-08T01:30:00Z = 2026-08-08 08:30 WIB
		expect(todayIso(new Date("2026-08-08T01:30:00Z"))).toBe("2026-08-08");
	});
});
