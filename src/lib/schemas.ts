import * as v from "valibot";

export const LayananSchema = v.object({
	id_layanan: v.number(),
	nama_layanan: v.string(),
	kode_huruf: v.string(),
	deskripsi: v.nullable(v.string()),
});
export type Layanan = v.InferOutput<typeof LayananSchema>;

export const AntrianStatusSchema = v.union([
	v.literal("menunggu"),
	v.literal("dilayani"),
	v.literal("selesai"),
]);
export type AntrianStatus = v.InferOutput<typeof AntrianStatusSchema>;

export const AntrianSchema = v.object({
	id_antrian: v.number(),
	nomor_antrian: v.string(),
	id_layanan: v.number(),
	id_user: v.nullable(v.number()),
	status: AntrianStatusSchema,
	tanggal: v.string(),
	waktu_selesai: v.nullable(v.string()),
});
export type Antrian = v.InferOutput<typeof AntrianSchema>;

export const UserRoleSchema = v.union([
	v.literal("admin"),
	v.literal("petugas"),
]);
export type UserRole = v.InferOutput<typeof UserRoleSchema>;

export const UserSchema = v.object({
	id_user: v.number(),
	username: v.string(),
	nama_lengkap: v.string(),
	role: UserRoleSchema,
	id_layanan: v.nullable(v.number()),
});
export type User = v.InferOutput<typeof UserSchema>;

export const AntrianDenganLayananSchema = v.object({
	...AntrianSchema.entries,
	layanan: v.nullable(LayananSchema),
});
export type AntrianDenganLayanan = v.InferOutput<
	typeof AntrianDenganLayananSchema
>;

export const AntrianLengkapSchema = v.object({
	...AntrianSchema.entries,
	layanan: v.nullable(LayananSchema),
	users: v.nullable(UserSchema),
});
export type AntrianLengkap = v.InferOutput<typeof AntrianLengkapSchema>;
