import { prisma } from "../config/prisma.js";
import { adminUserSelect } from "../constants/user.js";
import { AppError } from "../utils/errors.js";
import type { AdminUserQueryInput, AdminUserUpdateInput } from "../utils/validators.js";
import { Role, type Prisma } from "@prisma/client";

type AdminOperator = {
  id: string;
  role: string;
};

const highPrivilegeRoles = new Set(["super_admin", "state_admin"]);

function isOfficerRole(role: string) {
  return role === "officer";
}

function isCitizenRole(role: string) {
  return role === "citizen";
}

function isAdminRole(role: string) {
  return !isCitizenRole(role) && !isOfficerRole(role);
}

function ensurePrivilegedEditAllowed(operatorRole: string, targetRole: string, requestedRole?: string) {
  if (targetRole === "super_admin" && operatorRole !== "super_admin") {
    throw new AppError("Only super admins can modify super admin accounts", 403);
  }

  if (requestedRole && highPrivilegeRoles.has(requestedRole) && operatorRole !== "super_admin") {
    throw new AppError("Only super admins can assign this role", 403);
  }
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function mapAdminUser(user: {
  id: string;
  fullName: string;
  username: string | null;
  email: string;
  mobile: string;
  state: string;
  district: string;
  address: string;
  department: string | null;
  jurisdictionArea: string | null;
  officerCode: string | null;
  role: string;
  isVerified: boolean;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...user,
    lockedUntil: toIsoDate(user.lockedUntil),
    lastLoginAt: toIsoDate(user.lastLoginAt),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listUsersForAdmin(query: AdminUserQueryInput) {
  const where: Prisma.UserWhereInput = {};

  if (query.scope === "citizen") {
    where.role = { in: [Role.citizen] };
  } else if (query.scope === "officer") {
    where.role = { in: [Role.officer] };
  } else if (query.scope === "admin") {
    where.role = {
      in: [
        Role.super_admin,
        Role.state_admin,
        Role.district_officer,
        Role.department_officer,
        Role.admin,
      ],
    };
  }

  if (query.verification === "verified") {
    where.isVerified = true;
    where.emailVerified = true;
  } else if (query.verification === "pending") {
    where.isVerified = false;
  }

  if (query.search) {
    const search = query.search.trim();
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { district: { contains: search, mode: "insensitive" } },
      { state: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: adminUserSelect,
  });

  const counts = users.reduce(
    (acc, user) => {
      acc.total += 1;

      if (isCitizenRole(String(user.role))) {
        acc.citizens += 1;
      } else if (isOfficerRole(String(user.role))) {
        acc.officers += 1;
      } else {
        acc.admins += 1;
      }

      if (user.isVerified && user.emailVerified) {
        acc.verified += 1;
      } else {
        acc.pending += 1;
      }

      return acc;
    },
    { total: 0, citizens: 0, officers: 0, admins: 0, verified: 0, pending: 0 },
  );

  return {
    users: users.map((user) => mapAdminUser({ ...user, role: String(user.role) })),
    counts,
  };
}

export async function updateUserByAdmin(
  userId: string,
  input: AdminUserUpdateInput,
  operator: AdminOperator,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: adminUserSelect,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  ensurePrivilegedEditAllowed(operator.role, String(user.role), input.role);

  if (operator.id === userId && input.role && input.role !== String(user.role)) {
    throw new AppError("You cannot change your own role", 400);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(typeof input.role !== "undefined" ? { role: input.role } : {}),
      ...(typeof input.isVerified !== "undefined" ? { isVerified: input.isVerified } : {}),
      ...(typeof input.emailVerified !== "undefined"
        ? { emailVerified: input.emailVerified }
        : {}),
    },
    select: adminUserSelect,
  });

  return {
    user: mapAdminUser({ ...updated, role: String(updated.role) }),
  };
}
