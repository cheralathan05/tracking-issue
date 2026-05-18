import crypto from "node:crypto";

import { prisma } from "../config/prisma.js";
import type { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { publicUserSelect } from "../constants/user.js";
import type {
  AdminLoginInput,
  AdminRegisterInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from "../utils/validators.js";
import { comparePassword, hashPassword } from "../utils/crypto.js";
import { AppError } from "../utils/errors.js";
import {
  isEmailAddress,
  normalizeAadhaar,
  normalizeEmail,
  normalizeMobile,
} from "../utils/errors-helper.js";
import { createJti, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { clearOtpRecords, createOtp, requireVerifiedOtp, verifyLatestOtp } from "./otp.service.js";
import {
  sendEmailVerificationOtpEmail,
  sendPasswordResetOtpEmail,
  sendAdminLoginOtpEmail,
} from "./email.service.js";

type AuthMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  refreshJti: string;
};

async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
}

async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: publicUserSelect,
  });
}

function buildSessionExpiry(rememberMe: boolean): Date {
  const days = rememberMe ? 30 : 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function writeAuditLog(
  action: string,
  userId?: string,
  metadata?: Record<string, unknown>,
  meta?: AuthMeta,
) {
  await prisma.auditLog.create({
    data: {
      action,
      userId,
      metadata: metadata as Prisma.InputJsonValue,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    },
  });
}

function buildAuthResponse(
  user: NonNullable<Awaited<ReturnType<typeof getUserById>>>,
  rememberMe = false,
  meta?: AuthMeta,
): AuthTokens & { user: typeof user } {
  const jti = createJti();
  const accessToken = signAccessToken(user.id, String(user.role), rememberMe, jti);
  const refreshToken = signRefreshToken(user.id, String(user.role), rememberMe, jti);
  const refreshJti = jti;

  return { accessToken, refreshToken, refreshJti, user };
}

async function persistRefreshToken(
  userId: string,
  refreshToken: string,
  refreshJti: string,
  rememberMe: boolean,
  meta?: AuthMeta,
) {
  const expiresAt = buildSessionExpiry(rememberMe);

  await prisma.refreshToken.upsert({
    where: { jti: refreshJti },
    create: {
      jti: refreshJti,
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    },
    update: {
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt,
      revokedAt: null,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    },
  });
}

async function issueSession(userId: string, rememberMe = false, meta?: AuthMeta) {
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError("Unauthorized access", 401);
  }

  const response = buildAuthResponse(user, rememberMe, meta);
  await persistRefreshToken(user.id, response.refreshToken, response.refreshJti, rememberMe, meta);
  return response;
}

async function ensureNotLocked(user: {
  id: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}) {
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw new AppError("Account locked due to multiple failed attempts. Try again later.", 423);
  }

  if (user.lockedUntil && user.lockedUntil.getTime() <= Date.now()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }
}

async function registerVerificationOtp(email: string) {
  const { otp } = await createOtp(email, "registration");
  // Send email non-blocking to avoid API timeout
  sendEmailVerificationOtpEmail(email, otp).catch((err) => {
    console.error("Failed to send verification OTP email:", err);
  });
  return otp;
}

async function incrementFailedAttempts(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, failedLoginAttempts: true },
  });

  if (!user) {
    return;
  }

  const attempts = user.failedLoginAttempts + 1;
  const lockedUntil =
    attempts >= env.ACCOUNT_LOCK_THRESHOLD
      ? new Date(Date.now() + env.ACCOUNT_LOCK_MINUTES * 60 * 1000)
      : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: attempts,
      lockedUntil,
    },
  });
}

async function resetLoginAttempts(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}

async function findUserByIdentifier(identifier: string) {
  if (isEmailAddress(identifier)) {
    return prisma.user.findUnique({
      where: { email: normalizeEmail(identifier) },
    });
  }

  const mobile = normalizeMobile(identifier);
  if (mobile.length !== 10) {
    const username = identifier.trim();

    if (username.length < 3) {
      throw new AppError("Enter a valid email, username, or mobile number", 400);
    }

    return prisma.user.findUnique({
      where: { username } as never,
    });
  }

  return prisma.user.findUnique({
    where: { mobile },
  });
}

function requireRoleForAdmin(role: string) {
  return [
    "super_admin",
    "state_admin",
    "district_officer",
    "department_officer",
    "admin",
    "officer",
  ].includes(role);
}

export async function registerCitizen(input: RegisterInput, meta?: AuthMeta) {
  const email = normalizeEmail(input.email);
  const mobile = normalizeMobile(input.mobile);
  const aadhaar = normalizeAadhaar(input.aadhaar);

  const [existingEmail, existingMobile, existingAadhaar] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { mobile }, select: { id: true } }),
    prisma.user.findUnique({ where: { aadhaar }, select: { id: true } }),
  ]);

  if (existingEmail) {
    throw new AppError("Email already exists", 409);
  }

  if (existingMobile) {
    throw new AppError("Mobile already exists", 409);
  }

  if (existingAadhaar) {
    throw new AppError("Aadhaar already exists", 409);
  }

  const password = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email,
      mobile,
      aadhaar,
      state: input.state,
      district: input.district,
      address: input.address,
      password,
      role: "citizen",
      isVerified: false,
      emailVerified: false,
    },
    select: publicUserSelect,
  });

  const otp = await registerVerificationOtp(email);
  await writeAuditLog("citizen_registered", user.id, { email }, meta);

  return {
    message: "Registration successful. Verify your email using the OTP sent to your inbox.",
    user,
    emailVerificationRequired: true,
    otp: env.NODE_ENV === "development" ? otp : undefined,
  };
}

export async function registerAdmin(input: AdminRegisterInput, meta?: AuthMeta) {
  const email = normalizeEmail(input.email);
  const mobile = normalizeMobile(input.mobile);
  if (!requireRoleForAdmin(input.role)) {
    throw new AppError("Invalid administrator role", 400);
  }

  // Check if a user with this email already exists
  const existingEmailUser = await prisma.user.findUnique({ where: { email } });

  // Check if the mobile is already used by another account
  const existingMobileUser = await prisma.user.findUnique({ where: { mobile } });

  // If mobile belongs to another user (different from the email user), block
  if (existingMobileUser && existingEmailUser && existingMobileUser.id !== existingEmailUser.id) {
    throw new AppError("Mobile already registered", 409);
  }

  // If mobile belongs to some other user and email is new, block as well
  if (existingMobileUser && !existingEmailUser) {
    throw new AppError("Mobile already registered", 409);
  }

  const password = await hashPassword(input.password);

  // If an account with this email exists and is a citizen, promote/update it to admin
  if (existingEmailUser) {
    if (String(existingEmailUser.role) !== "citizen") {
      throw new AppError("Email already registered", 409);
    }

    const updated = await prisma.user.update({
      where: { email },
      data: {
        fullName: input.fullName,
        mobile,
        state: input.state,
        district: input.district,
        address: input.address,
        password,
        role: input.role,
        // keep existing aadhaar if present
        isVerified: false,
        emailVerified: false,
      },
      select: publicUserSelect,
    });

    const otp = await registerVerificationOtp(email);
    await writeAuditLog("admin_promoted", updated.id, { role: input.role, email }, meta);

    return {
      message: "Existing account updated to administrator. Verification OTP sent to email.",
      user: updated,
      emailVerificationRequired: true,
      otp: env.NODE_ENV === "development" ? otp : undefined,
    };
  }

  // No existing email user — create a fresh admin account
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email,
      mobile,
      aadhaar: crypto.randomUUID(),
      state: input.state,
      district: input.district,
      address: input.address,
      password,
      role: input.role,
      isVerified: false,
      emailVerified: false,
    },
    select: publicUserSelect,
  });

  const otp = await registerVerificationOtp(email);
  await writeAuditLog("admin_registered", user.id, { role: input.role, email }, meta);

  return {
    message: "Admin account created successfully. Verification OTP sent to email.",
    user,
    emailVerificationRequired: true,
    otp: env.NODE_ENV === "development" ? otp : undefined,
  };
}

export async function loginCitizen(input: LoginInput, meta?: AuthMeta) {
  const user = await findUserByIdentifier(input.identifier);

  if (!user) {
    throw new AppError("Invalid login credentials", 401);
  }

  if (String(user.role) !== "citizen") {
    throw new AppError("Use admin login for official accounts", 403);
  }

  await ensureNotLocked(user);

  const passwordMatches = await comparePassword(input.password, user.password);

  if (!passwordMatches) {
    await incrementFailedAttempts(user.id);
    throw new AppError("Invalid password", 401);
  }

  if (!user.emailVerified) {
    throw new AppError("Email verification required", 403);
  }

  await resetLoginAttempts(user.id);
  const session = await issueSession(user.id, input.rememberMe, meta);
  await writeAuditLog("citizen_login", user.id, { rememberMe: input.rememberMe }, meta);

  return {
    message: "Login successful",
    ...session,
  };
}

export async function loginAdmin(input: AdminLoginInput, meta?: AuthMeta) {
  const user = await findUserByIdentifier(input.identifier);

  if (!user) {
    throw new AppError("Invalid login credentials", 401);
  }

  if (!requireRoleForAdmin(String(user.role))) {
    throw new AppError("Use citizen login for public accounts", 403);
  }

  await ensureNotLocked(user);

  const passwordMatches = await comparePassword(input.password, user.password);

  if (!passwordMatches) {
    await incrementFailedAttempts(user.id);
    throw new AppError("Invalid password", 401);
  }

  if (!user.isVerified || !user.emailVerified) {
    throw new AppError("Account not verified. Complete email verification before login.", 403);
  }

  await resetLoginAttempts(user.id);

  const email = normalizeEmail(user.email);
  const { otp } = await createOtp(email, "admin_login");
  // Send email non-blocking to avoid API timeout
  sendAdminLoginOtpEmail(email, otp).catch((err) => {
    console.error("Failed to send admin login OTP email:", err);
  });
  await writeAuditLog("admin_login_otp_requested", user.id, { email, role: user.role }, meta);

  return {
    message: "OTP sent to your registered email address.",
    otp: env.NODE_ENV === "development" ? otp : undefined,
    email,
  };
}

export async function refreshAuthSession(refreshToken: string, meta?: AuthMeta) {
  const payload = createRefreshPayload(refreshToken);
  const tokenRecord = await prisma.refreshToken.findUnique({ where: { jti: payload.jti } });

  if (!tokenRecord || tokenRecord.revokedAt) {
    throw new AppError("Refresh token revoked", 401);
  }

  if (tokenRecord.expiresAt.getTime() <= Date.now()) {
    await prisma.refreshToken.update({
      where: { jti: payload.jti },
      data: { revokedAt: new Date() },
    });
    throw new AppError("Refresh token expired", 401);
  }

  if (tokenRecord.tokenHash !== hashToken(refreshToken)) {
    await prisma.refreshToken.update({
      where: { jti: payload.jti },
      data: { revokedAt: new Date() },
    });
    throw new AppError("Refresh token mismatch", 401);
  }

  const user = await getUserById(payload.sub);
  if (!user) {
    throw new AppError("Unauthorized access", 401);
  }

  const rotated = await issueSession(user.id, Boolean(payload.rememberMe), meta);
  await prisma.refreshToken.update({
    where: { jti: payload.jti },
    data: { revokedAt: new Date() },
  });
  await writeAuditLog("token_refreshed", user.id, { rememberMe: payload.rememberMe }, meta);

  return {
    message: "Session refreshed successfully",
    ...rotated,
  };
}

function createRefreshPayload(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  if (payload.tokenType !== "refresh") {
    throw new AppError("Invalid refresh token", 401);
  }

  return payload;
}

export async function getCurrentCitizen(userId: string) {
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError("Unauthorized access", 401);
  }

  return user;
}

export async function startForgotPasswordFlow(input: ForgotPasswordInput, meta?: AuthMeta) {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new AppError("Email not found", 404);
  }

  const { otp } = await createOtp(email, "password_reset");
  // Send email non-blocking to avoid API timeout
  sendPasswordResetOtpEmail(email, otp).catch((err) => {
    console.error("Failed to send password reset OTP email:", err);
  });
  await writeAuditLog("password_reset_otp_requested", user.id, { email }, meta);

  return {
    message: "OTP sent to registered email address",
    otp: env.NODE_ENV === "development" ? otp : undefined,
  };
}

export async function verifyOtpFlow(input: VerifyOtpInput, meta?: AuthMeta) {
  const email = normalizeEmail(input.email);
  const record = await verifyLatestOtp(email, input.otp, input.purpose);

  if (input.purpose === "registration") {
    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: true, isVerified: true },
      select: { id: true },
    });

    await writeAuditLog("email_verified", user.id, { email, purpose: input.purpose }, meta);

    // Issue a session so the user is logged in immediately after verifying their email.
    const session = await issueSession(user.id, false, meta);

    return {
      message: "Email verified successfully",
      ...session,
    };
  }

  if (input.purpose === "admin_login") {
    const user = await getUserByEmail(email);

    if (!user) {
      throw new AppError("Invalid admin login attempt", 401);
    }

    if (!requireRoleForAdmin(String(user.role))) {
      throw new AppError("Use citizen login for public accounts", 403);
    }

    const session = await issueSession(user.id, true, meta);
    await writeAuditLog("admin_login_completed", user.id, { email, role: user.role }, meta);

    return {
      message: "OTP verified and login successful",
      ...session,
    };
  }

  await writeAuditLog("otp_verified", undefined, { email, purpose: input.purpose }, meta);
  return { message: "OTP verified successfully" };
}

export async function resetPassword(input: ResetPasswordInput, meta?: AuthMeta) {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (!user) {
    throw new AppError("Email not found", 404);
  }

  await requireVerifiedOtp(email, "password_reset");

  const password = await hashPassword(input.newPassword);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      password,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    select: publicUserSelect,
  });

  await clearOtpRecords(email, "password_reset");
  await writeAuditLog("password_reset_completed", updatedUser.id, { email }, meta);

  return {
    message: "Password reset successfully",
    user: updatedUser,
  };
}

export async function logoutUser(userId: string, refreshToken?: string, meta?: AuthMeta) {
  if (refreshToken) {
    try {
      const payload = createRefreshPayload(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { jti: payload.jti, userId },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Ignore invalid refresh token during logout.
    }
  }

  await writeAuditLog("logout", userId, undefined, meta);

  return { message: "Logged out successfully" };
}
