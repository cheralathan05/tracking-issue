import { z } from "zod";

export function isEmailAddress(value: string): boolean {
  return z.string().email().safeParse(value).success;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeMobile(value: string): string {
  const digits = normalizeDigits(value);

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits;
}

export function normalizeAadhaar(value: string): string {
  return normalizeDigits(value);
}
