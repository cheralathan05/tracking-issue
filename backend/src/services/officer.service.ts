import crypto from "node:crypto";

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

export async function createOfficerInvitation(
  input: OfficerInvitationInput,
  creatorUserId?: string,
  meta?: AuthMeta,
) {
  // Prevent inviting an email that already has an account
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new AppError("An account already exists for this email", 409);
  }

  // If there's an existing invitation for this email, handle it
  const existingInvitation = await prisma.officerInvitation.findUnique({ where: { email: input.email } });

  if (existingInvitation) {
    // If still pending and not expired, prevent duplicate invites
    if (existingInvitation.status === "Pending" && existingInvitation.expiresAt.getTime() > Date.now()) {
      throw new AppError("An active invitation already exists for this email", 409);
    }

    // If invitation expired or not pending, mark expired and allow new invite creation
    if (existingInvitation.status === "Pending" && existingInvitation.expiresAt.getTime() <= Date.now()) {
      await prisma.officerInvitation.update({ where: { email: input.email }, data: { status: "Expired" } });
    }
  }

  const code = await ensureUniqueInvitationCode();
  const invitation = await prisma.officerInvitation.create({
    data: {
      code,
      fullName: input.fullName,
      email: input.email,
      mobile: input.mobile,
      username: input.username || null,
      department: input.department,
      area: input.area,
      invitedById: creatorUserId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "Pending",
    },
  });

  const origin = env.FRONTEND_ORIGIN.split(",").map((value) => value.trim()).find(Boolean) ?? "http://localhost:3000";
  const invitationUrl = `${origin.replace(/\/$/, "")}/officer/invite?code=${encodeURIComponent(invitation.code)}`;

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
    message: "Officer invitation created successfully",
    invitation: {
      ...invitation,
      createdAt: invitation.createdAt.toISOString(),
      updatedAt: invitation.updatedAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
      invitationUrl,
      sentVia: ["email", "sms"],
      meta,
    },
  };
}

export async function getOfficerInvitation(code: string) {
  const invitation = await prisma.officerInvitation.findUnique({
    where: { code },
    include: {
      invitedBy: { select: officerSummarySelect },
      acceptedBy: { select: officerSummarySelect },
    },
  });

  if (!invitation) {
    throw new AppError("Invitation not found", 404);
  }

  if (invitation.status === "Pending" && invitation.expiresAt.getTime() < Date.now()) {
    await prisma.officerInvitation.update({
      where: { code },
      data: { status: "Expired" },
    });

    throw new AppError("Invitation has expired", 410);
  }

  return {
    invitation: {
      ...invitation,
      createdAt: invitation.createdAt.toISOString(),
      updatedAt: invitation.updatedAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
    },
  };
}

export async function acceptOfficerInvitation(
  code: string,
  input: AcceptOfficerInvitationInput,
  meta?: AuthMeta,
) {
  const invitation = await prisma.officerInvitation.findUnique({ where: { code } });

  if (!invitation) {
    throw new AppError("Invitation not found", 404);
  }

  if (invitation.status !== "Pending") {
    throw new AppError("Invitation is no longer active", 409);
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    await prisma.officerInvitation.update({
      where: { code },
      data: { status: "Expired" },
    });
    throw new AppError("Invitation has expired", 410);
  }

  const username = input.username.trim();
  const password = await hashPassword(input.password);
  const officerCode = await ensureUniqueOfficerCode();
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  const existingEmail = await prisma.user.findUnique({ where: { email: invitation.email } });

  if (existingUsername) {
    throw new AppError("Username already exists", 409);
  }

  if (existingEmail) {
    throw new AppError("An account already exists for this email", 409);
  }

  const user = await prisma.user.create({
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

  await prisma.officerInvitation.update({
    where: { code },
    data: {
      status: "Accepted",
      acceptedAt: new Date(),
      acceptedById: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "officer_invitation_accepted",
      userId: user.id,
      metadata: {
        invitationCode: code,
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
      code,
      status: normalizeInviteStatus("Accepted"),
    },
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
