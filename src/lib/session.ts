import * as v from "valibot";
import { api } from "./api";
import { type User, UserSchema } from "./schemas";

export async function getCurrentUser(): Promise<User | null> {
	try {
		const user = await api.get<unknown>("/api/auth/me");
		const result = v.safeParse(UserSchema, user);
		return result.success ? result.output : null;
	} catch {
		return null;
	}
}

export async function login(username: string, password: string): Promise<User> {
	const user = await api.post<unknown>("/api/auth/login", {
		username,
		password,
	});
	const result = v.safeParse(UserSchema, user);
	if (!result.success) throw new Error("Data user tidak valid");
	return result.output;
}

export async function logout(): Promise<void> {
	await api.post("/api/auth/logout").catch(() => undefined);
}
