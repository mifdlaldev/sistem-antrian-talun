import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { buildNomorAntrian } from "./queue";
import { AntrianSchema, LayananSchema, UserSchema } from "./schemas";

describe("buildNomorAntrian", () => {
	it("menghasilkan format KODE-001 dengan zero-padding 3 digit", () => {
		expect(buildNomorAntrian("A", 1)).toBe("A-001");
		expect(buildNomorAntrian("B", 12)).toBe("B-012");
		expect(buildNomorAntrian("C", 999)).toBe("C-999");
	});
});

describe("skema validasi (contracts dari openspec)", () => {
	it("menerima layanan valid", () => {
		const layanan = v.parse(LayananSchema, {
			id_layanan: 1,
			nama_layanan: "Layanan KTP & KK",
			kode_huruf: "A",
			deskripsi: null,
		});
		expect(layanan.kode_huruf).toBe("A");
	});

	it("menolak status antrian tidak dikenal", () => {
		expect(() =>
			v.parse(AntrianSchema, {
				id_antrian: 1,
				nomor_antrian: "A-001",
				id_layanan: 1,
				id_user: null,
				status: "batal",
				tanggal: "2026-08-07",
				waktu_selesai: null,
			}),
		).toThrow();
	});

	it("menerima payload session users", () => {
		const user = v.parse(UserSchema, {
			id_user: 2,
			username: "petugas1",
			password: "rahasia",
			nama_lengkap: "Budi Santoso",
			role: "petugas",
			id_layanan: 1,
		});
		expect(user.role).toBe("petugas");
		expect(user.id_layanan).toBe(1);
	});
});
