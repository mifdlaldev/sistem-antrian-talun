import { describe, expect, it } from "vitest";
import { buildNomorAntrian, todayIso } from "./queue";

describe("buildNomorAntrian", () => {
	it("menghasilkan format KODE-001 dengan zero-padding 3 digit", () => {
		expect(buildNomorAntrian("A", 1)).toBe("A-001");
		expect(buildNomorAntrian("B", 12)).toBe("B-012");
		expect(buildNomorAntrian("C", 999)).toBe("C-999");
	});
});

describe("todayIso", () => {
	it("mengembalikan tanggal ISO YYYY-MM-DD", () => {
		expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});
