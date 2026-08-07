import * as v from "valibot";
import { type User, UserSchema } from "./schemas";

const SESSION_KEY = "user_session";

export function getSession(): User | null {
	const raw = localStorage.getItem(SESSION_KEY);
	if (!raw) return null;
	try {
		const result = v.safeParse(UserSchema, JSON.parse(raw));
		return result.success ? result.output : null;
	} catch {
		return null;
	}
}

export function setSession(user: User): void {
	localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
	localStorage.removeItem(SESSION_KEY);
}
