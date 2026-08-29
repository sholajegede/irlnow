/** Dummy auth model: sign up / log in / verify / age gate. No real backend. */

export type AuthMethod = "phone" | "email" | "apple" | "google";

export interface AuthSession {
  method: AuthMethod;
  handle: string;
  verified: boolean;
  ageConfirmed: boolean;
  joinedOn: string;
}

/** The one code that "works" in the prototype. Any 6 digits are accepted, this is the hint. */
export const DEMO_CODE = "204060";

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function isValidHandle(method: AuthMethod, value: string): boolean {
  if (method === "phone") return value.replace(/\D/g, "").length >= 10;
  if (method === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return true;
}

export function isAdult(dob: string): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 18;
}

export function ageFrom(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export function todayLabel(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
