import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
import { createNotification, createNotificationsForRole } from "./notification.service.js";

export interface EscalationCreateInput {
  complaintId: string;
  reason: string;
  level?: "low" | "medium" | "high" | "emergency";
  escalatedBy: string;
}

export interface EscalationUpdateInput {
  status?: "active" | "resolved" | "closed";
  resolvedBy?: string;
  resolutionNote?: string;
}

/**
 * Create a new escalation for a complaint
 */
export async function createEscalation(input: EscalationCreateInput) {
  const complaint = await prisma.complaint.findUnique({
    where: { id: input.complaintId },
    include: { reporterUser: true, assignedOfficer: true },
  });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  // Check if already escalated
  const existing = await prisma.escalation.findUnique({
    where: { complaintId: input.complaintId },
  });

  if (existing) {
    throw new AppError("This complaint is already escalated", 400);
  }

  const escalation = await prisma.escalation.create({
    data: {
      complaintId: input.complaintId,
      reason: input.reason,
      level: input.level || "medium",
      escalatedBy: input.escalatedBy,
      status: "active",
    },
    include: {
      complaint: true,
      escalatedByUser: true,
    },
  });

  // Update complaint status
  await prisma.complaint.update({
    where: { id: input.complaintId },
    data: { status: "Escalated" },
  });

  // Notify admins
  await createNotificationsForRole("admin", {
    title: `Complaint ${complaint.grievanceId} Escalated`,
    message: `Complaint has been escalated (Level: ${input.level || "medium"}). Reason: ${input.reason}`,
    type: "escalation",
    priority: input.level === "emergency" ? "critical" : "high",
    actionUrl: `/admin/complaints/${input.complaintId}`,
    data: { complaintId: input.complaintId, escalationLevel: input.level },
  });

  // Notify escalated by user
  await createNotification(input.escalatedBy, {
    title: "Escalation Confirmed",
    message: `Your escalation for complaint ${complaint.grievanceId} has been recorded and forwarded to management.`,
    type: "escalation",
    priority: "high",
    actionUrl: `/complaints/${input.complaintId}`,
  });

  return {
    message: "Complaint escalated successfully",
    escalation: {
      ...escalation,
      createdAt: escalation.createdAt.toISOString(),
      updatedAt: escalation.updatedAt.toISOString(),
      resolvedAt: escalation.resolvedAt?.toISOString() || null,
    },
  };
}

/**
 * Get all escalations
 */
export async function listEscalations(
  viewer: { id: string; role: string },
  filters?: { status?: string; level?: string; complaintId?: string }
) {
  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.level) {
    where.level = filters.level;
  }

  if (filters?.complaintId) {
    where.complaintId = filters.complaintId;
  }

  // Citizens can only see their own escalations
  if (viewer.role === "citizen") {
    where.escalatedByUser = {
      id: viewer.id,
    };
  }

  const escalations = await prisma.escalation.findMany({
    where,
    include: {
      complaint: true,
      escalatedByUser: { select: { id: true, fullName: true, email: true } },
      resolvedByUser: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    total: escalations.length,
    escalations: escalations.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      resolvedAt: e.resolvedAt?.toISOString() || null,
    })),
  };
}

/**
 * Get escalation details
 */
export async function getEscalationDetails(escalationId: string, viewer: { id: string; role: string }) {
  const escalation = await prisma.escalation.findUnique({
    where: { id: escalationId },
    include: {
      complaint: true,
      escalatedByUser: { select: { id: true, fullName: true, email: true, role: true } },
      resolvedByUser: { select: { id: true, fullName: true, email: true, role: true } },
    },
  });

  if (!escalation) {
    throw new AppError("Escalation not found", 404);
  }

  // Authorization: citizens can only view their own escalations
  if (viewer.role === "citizen" && escalation.escalatedBy !== viewer.id) {
    throw new AppError("Forbidden", 403);
  }

  return {
    escalation: {
      ...escalation,
      createdAt: escalation.createdAt.toISOString(),
      updatedAt: escalation.updatedAt.toISOString(),
      resolvedAt: escalation.resolvedAt?.toISOString() || null,
    },
  };
}

/**
 * Update escalation status and resolution
 */
export async function updateEscalation(
  escalationId: string,
  input: EscalationUpdateInput,
  resolver: { id: string; role: string }
) {
  const escalation = await prisma.escalation.findUnique({
    where: { id: escalationId },
    include: { complaint: true },
  });

  if (!escalation) {
    throw new AppError("Escalation not found", 404);
  }

  // Only admins can resolve escalations
  if (!["admin", "super_admin", "state_admin", "district_officer"].includes(resolver.role)) {
    throw new AppError("Only administrators can resolve escalations", 403);
  }

  const updated = await prisma.escalation.update({
    where: { id: escalationId },
    data: {
      status: input.status,
      resolvedBy: input.resolvedBy,
      resolutionNote: input.resolutionNote,
      resolvedAt: input.status === "resolved" ? new Date() : undefined,
    },
    include: {
      complaint: true,
      escalatedByUser: true,
      resolvedByUser: { select: { id: true, fullName: true, email: true } },
    },
  });

  // Notify the person who escalated
  await createNotification(escalation.escalatedBy, {
    title: "Escalation Resolved",
    message: `Your escalation for complaint ${escalation.complaint.grievanceId} has been resolved. ${input.resolutionNote || ""}`,
    type: "escalation",
    priority: "high",
    actionUrl: `/complaints/${escalation.complaintId}`,
  });

  return {
    message: "Escalation updated successfully",
    escalation: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      resolvedAt: updated.resolvedAt?.toISOString() || null,
    },
  };
}

/**
 * Check for SLA breaches and auto-escalate if needed
 */
export async function checkAndEscalateSLABreaches() {
  const now = new Date();

  // Find complaints that have breached SLA
  const breachedComplaints = await prisma.complaint.findMany({
    where: {
      slaDeadline: {
        lt: now,
      },
      status: {
        not: "Resolved",
      },
      escalation: null, // Not already escalated
    },
  });

  const escalations = await Promise.all(
    breachedComplaints.map((complaint) =>
      createEscalation({
        complaintId: complaint.id,
        reason: "SLA deadline breached",
        level: "high",
        escalatedBy: "system",
      }).catch(() => null) // Ignore errors
    )
  );

  return {
    message: "SLA check completed",
    escalated: escalations.filter(Boolean).length,
  };
}

/**
 * Escalation dashboard summary for admin views
 */
export async function getEscalationDashboard() {
  const totalEscalations = await prisma.escalation.count();

  const pending = await prisma.escalation.count({ where: { status: "active" } });

  const resolved = await prisma.escalation.count({ where: { status: "resolved" } });

  // Define critical as emergency-level or linked complaint with Critical priority
  const critical = await prisma.escalation.count({
    where: {
      OR: [
        { level: "emergency" },
        { complaint: { priority: "Critical" } },
      ],
    },
  });

  return {
    totalEscalations,
    pending,
    critical,
    resolved,
  };
}
