import { prisma } from "../config/prisma.js";
import { compareOtp, generateOtp, hashOtp } from "../utils/crypto.js";
import { AppError } from "../utils/errors.js";

type OtpPurpose = "registration" | "password_reset" | "admin_login";

function getOtpExpiryDate() {
  return new Date(Date.now() + 10 * 60 * 1000);
}

export async function createOtp(email: string, purpose: OtpPurpose) {
  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);

  await prisma.otp.deleteMany({ where: { email, purpose } });

  const record = await prisma.otp.create({
    data: {
      email,
      otp: hashedOtp,
      purpose,
      expiresAt: getOtpExpiryDate(),
      verified: false,
      attempts: 0,
    },
  });

  return { otp, record };
}

export async function createResetOtp(email: string) {
  return createOtp(email, "password_reset");
}

export async function verifyLatestOtp(email: string, otp: string, purpose: OtpPurpose) {
  const record = await prisma.otp.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new AppError("Invalid OTP", 400);
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.otp.deleteMany({ where: { email, purpose } });
    throw new AppError("OTP expired", 400);
  }

  const matches = await compareOtp(otp, record.otp);

  if (!matches) {
    await prisma.otp.update({
      where: { id: record.id },
      data: { attempts: record.attempts + 1 },
    });
    throw new AppError("Invalid OTP", 400);
  }

  return prisma.otp.update({
    where: { id: record.id },
    data: {
      verified: true,
      verifiedAt: new Date(),
    },
  });
}

export async function requireVerifiedOtp(email: string, purpose: OtpPurpose) {
  const record = await prisma.otp.findFirst({
    where: { email, verified: true, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new AppError("OTP verification required", 400);
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.otp.deleteMany({ where: { email, purpose } });
    throw new AppError("OTP expired", 400);
  }

  return record;
}

export async function clearOtpRecords(email: string, purpose?: OtpPurpose) {
  await prisma.otp.deleteMany({ where: purpose ? { email, purpose } : { email } });
}
