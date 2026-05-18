import crypto from "node:crypto";
import bcrypt from "bcrypt";

const PASSWORD_SALT_ROUNDS = 12;
const OTP_SALT_ROUNDS = 10;

export function generateOtp(length = 6): string {
  const upperBound = 10 ** length;
  return crypto.randomInt(0, upperBound).toString().padStart(length, "0");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, OTP_SALT_ROUNDS);
}

export async function compareOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
