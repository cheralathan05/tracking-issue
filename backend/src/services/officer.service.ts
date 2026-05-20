import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { sendOfficerInvitationEmail } from "./email.service.js";
import { officerSummarySelect } from "../constants/user.js";
import { hashPassword } from "../utils/crypto.js";
import { AppError } from "../utils/errors.js";
import type {
  AcceptOfficerInvitationInput,
  OfficerInvitationInput,
} from "../utils/validators.js";
import { generateInvitationCode, generateOfficerCode } from "../utils/complaint-routing.js";

type AuthMeta = {
  ipAddress?: string;
  userAgent?: string;
  origin?: string;
};

type InviteTokenPayload = {
  tokenType: "officer_invite";
  code: string;
  email: string;
};

function buildTimelineMessage(action: string, note?: string) {
  return {
    date: new Date().toISOString(),
    action,
    by: "System",
    ...(note ? { note } : {}),
  };
}

async function ensureUniqueOfficerCode() {
  const existingCodes = new Set(
    (await prisma.user.findMany({ where: { officerCode: { not: null } }, select: { officerCode: true } })).flatMap((user) => (user.officerCode ? [user.officerCode] : [])),
  );

  return generateOfficerCode(existingCodes);
}

async function ensureUniqueInvitationCode() {
  const existingCodes = new Set(
    (await prisma.officerInvitation.findMany({ select: { code: true } })).map((invitation) => invitation.code),
  );

  return generateInvitationCode(existingCodes);
}

function normalizeInviteStatus(status: string) {
  return status.trim();
}

function isInvitationPending(invitation: { status: string; expiresAt: Date }) {
  return invitation.status === "Pending" && invitation.expiresAt.getTime() > Date.now();
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, "");
}

function resolveFrontendOrigin(requestOrigin?: string) {
  const configuredOrigins = env.FRONTEND_ORIGIN.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (requestOrigin) {
    const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
    const matchingConfiguredOrigin = configuredOrigins.find(
      (origin) => normalizeOrigin(origin) === normalizedRequestOrigin,
    );

    if (matchingConfiguredOrigin) {
      return normalizeOrigin(matchingConfiguredOrigin);
    }
  }

  const preferredLocalOrigin = configuredOrigins.find((origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    return normalizedOrigin === "http://localhost:3000" || normalizedOrigin === "http://127.0.0.1:3000";
  });

  return normalizeOrigin(preferredLocalOrigin ?? configuredOrigins[0] ?? "http://localhost:3000");
}

function createActivationToken(invitation: { code: string; email: string; expiresAt: Date }) {
  const secondsUntilExpiry = Math.max(1, Math.floor((invitation.expiresAt.getTime() - Date.now()) / 1000));

  return jwt.sign(
    {
      tokenType: "officer_invite",
      code: invitation.code,
      email: invitation.email,
    } as InviteTokenPayload,
    env.JWT_SECRET,
    { expiresIn: secondsUntilExpiry },
  );
}

function verifyActivationToken(token: string): InviteTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as InviteTokenPayload;

    if (
      payload.tokenType !== "officer_invite"
      || typeof payload.code !== "string"
      || typeof payload.email !== "string"
    ) {
      throw new AppError("Invalid invitation token", 400);
    }

    return payload;
  } catch {
    throw new AppError("Invalid or expired invitation token", 400);
  }
}

function buildInvitationUrl(origin: string, token: string) {
  return `${origin}/officer/activate?token=${encodeURIComponent(token)}`;
}

async function ensureInvitationNotExpired(invitation: { code: string; status: string; expiresAt: Date }) {
  if (invitation.status === "Pending" && invitation.expiresAt.getTime() < Date.now()) {
    await prisma.officerInvitation.update({
      where: { code: invitation.code },
      data: { status: "Expired" },
    });
    throw new AppError("Invitation has expired", 410);
  }
}

function serializeInvitation(invitation: any, invitationUrl?: string) {
  return {
    ...invitation,
    createdAt: invitation.createdAt.toISOString(),
    updatedAt: invitation.updatedAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
    ...(invitationUrl ? { invitationUrl } : {}),
  };
}

export async function createOfficerInvitation(
  input: OfficerInvitationInput,
  creatorUserId?: string,
  meta?: AuthMeta,
) {
  // Prevent inviting an email that already has an account
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new AppError("Officer already exists", 409);
  }

  if (input.username) {
    const existingUsername = await prisma.user.findUnique({ where: { username: input.username } });
    if (existingUsername) {
      throw new AppError("Username already exists", 409);
    }
  }

  // If there's an existing invitation for this email, handle it
  const existingInvitation = await prisma.officerInvitation.findUnique({ where: { email: input.email } });

  if (existingInvitation && isInvitationPending(existingInvitation)) {
    throw new AppError("Pending invitation already sent", 409);
  }

  const code = await ensureUniqueInvitationCode();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  let invitation: any;
  try {
    if (existingInvitation) {
      invitation = await prisma.officerInvitation.update({
        where: { email: input.email },
        data: {
          code,
          fullName: input.fullName,
          mobile: input.mobile,
          username: input.username || null,
          department: input.department,
          area: input.area,
          invitedById: creatorUserId,
          expiresAt,
          status: "Pending",
          acceptedAt: null,
          acceptedById: null,
        },
      });
    } else {
      invitation = await prisma.officerInvitation.create({
        data: {
          code,
          fullName: input.fullName,
          email: input.email,
          mobile: input.mobile,
          username: input.username || null,
          department: input.department,
          area: input.area,
          invitedById: creatorUserId,
          expiresAt,
          status: "Pending",
        },
      });
    }
  } catch (err: any) {
    // Handle unique constraint race / Prisma errors gracefully
    if (err?.code === "P2002") {
      // Unique constraint failed (likely on email or code)
      throw new AppError("Officer invitation already exists for this email", 409);
    }

    // Re-throw other unexpected errors
    throw err;
  }

  const origin = resolveFrontendOrigin(meta?.origin);
  const activationToken = createActivationToken(invitation);
  const invitationUrl = buildInvitationUrl(origin, activationToken);

  // attempt to send email (best-effort)
  try {
    await sendOfficerInvitationEmail({
      to: invitation.email,
      fullName: invitation.fullName,
      department: invitation.department,
      area: invitation.area,
      invitationUrl,
      expiresAt: invitation.expiresAt.toISOString(),
    });
  } catch (err) {
    // log but do not fail the request
    console.error("Failed to send officer invitation email:", err);
  }

  return {
    message: "Invitation sent successfully",
    invitation: {
      ...serializeInvitation(invitation, invitationUrl),
      sentVia: ["email"],
      meta,
    },
  };
}

export async function getOfficerInvitationByToken(token: string, requestOrigin?: string) {
  const payload = verifyActivationToken(token);
  const invitation = await prisma.officerInvitation.findUnique({
    where: { code: payload.code },
    include: {
      invitedBy: { select: officerSummarySelect },
      acceptedBy: { select: officerSummarySelect },
    },
  });

  if (!invitation) {
    throw new AppError("Invitation not found", 404);
  }

  if (invitation.email.toLowerCase() !== payload.email.toLowerCase()) {
    throw new AppError("Invalid invitation token", 400);
  }

  await ensureInvitationNotExpired(invitation);

  const origin = resolveFrontendOrigin(requestOrigin);
  const invitationUrl = buildInvitationUrl(origin, createActivationToken(invitation));

  return {
    invitation: serializeInvitation(invitation, invitationUrl),
  };
}

export async function acceptOfficerInvitation(
  token: string,
  input: AcceptOfficerInvitationInput,
  meta?: AuthMeta,
) {
  const payload = verifyActivationToken(token);
  const invitation = await prisma.officerInvitation.findUnique({ where: { code: payload.code } });

  if (!invitation) {
    throw new AppError("Invitation not found", 404);
  }

  if (invitation.email.toLowerCase() !== payload.email.toLowerCase()) {
    throw new AppError("Invalid invitation token", 400);
  }

  await ensureInvitationNotExpired(invitation);

  if (invitation.status !== "Pending") {
    throw new AppError("Invitation is no longer active", 409);
  }

  const username = invitation.username?.trim();

  if (!username) {
    throw new AppError("Invitation is missing a username", 400);
  }

  const password = await hashPassword(input.password);
  const officerCode = await ensureUniqueOfficerCode();

  // Check for existing username or email in users table
  const [existingUsername, existingEmail] = await Promise.all([
    prisma.user.findUnique({ where: { username } }),
    prisma.user.findUnique({ where: { email: invitation.email } }),
  ]);

  if (existingUsername) {
    throw new AppError("Username already exists", 409);
  }

  if (existingEmail) {
    // Email already exists - reject the activation
    // This user should NOT have been created during invitation
    throw new AppError("An account already exists for this email. Please contact administrator.", 409);
  }

  // Create officer user - THIS IS THE ONLY PLACE WHERE OFFICER USERS ARE CREATED
  let user;
  try {
    user = await prisma.user.create({
      data: {
        fullName: invitation.fullName,
        username,
        email: invitation.email,
        mobile: invitation.mobile,
        aadhaar: crypto.randomUUID(),
        state: invitation.area,
        district: invitation.area,
        address: `${invitation.department}, ${invitation.area}`,
        department: invitation.department,
        jurisdictionArea: invitation.area,
        officerCode,
        password,
        role: invitation.role,
        isVerified: true,
        emailVerified: true,
      },
      select: officerSummarySelect,
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      throw new AppError("Username or email already exists. Please contact administrator.", 409);
    }
    throw err;
  }

  // Mark invitation as accepted
  await prisma.officerInvitation.update({
    where: { code: invitation.code },
    data: {
      status: "Accepted",
      acceptedAt: new Date(),
      acceptedById: user.id,
    },
  });

  // Log the activation action
  await prisma.auditLog.create({
    data: {
      action: "officer_invitation_accepted",
      userId: user.id,
      metadata: {
        invitationCode: invitation.code,
        department: invitation.department,
        area: invitation.area,
      } as never,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    },
  });

  return {
    message: "Officer account activated successfully",
    user,
    invitation: {
      code: invitation.code,
      status: normalizeInviteStatus("Accepted"),
    },
  };
}

export async function regenerateOfficerInvitationLink(code: string, requestOrigin?: string) {
  const invitation = await prisma.officerInvitation.findUnique({ where: { code } });

  if (!invitation) {
    throw new AppError("Invitation not found", 404);
  }

  await ensureInvitationNotExpired(invitation);

  if (invitation.status !== "Pending") {
    throw new AppError("Invitation is no longer active", 409);
  }

  const origin = resolveFrontendOrigin(requestOrigin);
  const invitationUrl = buildInvitationUrl(origin, createActivationToken(invitation));

  return {
    message: "Invitation link regenerated",
    invitation: serializeInvitation(invitation, invitationUrl),
  };
}

export async function resendOfficerInvitation(code: string, requestOrigin?: string) {
  const invitation = await prisma.officerInvitation.findUnique({ where: { code } });

  if (!invitation) {
    throw new AppError("Invitation not found", 404);
  }

  await ensureInvitationNotExpired(invitation);

  if (invitation.status !== "Pending") {
    throw new AppError("Invitation is no longer active", 409);
  }

  const origin = resolveFrontendOrigin(requestOrigin);
  const invitationUrl = buildInvitationUrl(origin, createActivationToken(invitation));

  await sendOfficerInvitationEmail({
    to: invitation.email,
    fullName: invitation.fullName,
    department: invitation.department,
    area: invitation.area,
    invitationUrl,
    expiresAt: invitation.expiresAt.toISOString(),
  });

  return {
    message: "Invitation email sent successfully",
    invitation: serializeInvitation(invitation, invitationUrl),
  };
}

export async function listOfficers() {
  const officers = await prisma.user.findMany({
    where: { role: "officer" },
    select: officerSummarySelect,
    orderBy: { createdAt: "desc" },
  });

  return {
    officers,
  };
}
