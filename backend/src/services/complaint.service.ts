import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
import * as chatService from "./chat.service.js";
import type {
  ComplaintAssignmentInput,
  ComplaintQueryInput,
  ComplaintStatusUpdateInput,
  ComplaintSubmissionInput,
} from "../utils/validators.js";
import { officerSummarySelect } from "../constants/user.js";
import {
  deriveDepartment,
  generateComplaintId,
  isAreaMatch,
  pickSuggestedOfficer,
} from "../utils/complaint-routing.js";
import { createNotification, createNotificationsForRole } from "./notification.service.js";

const adminRoles = new Set(["super_admin", "state_admin", "district_officer", "department_officer", "admin", "officer"]);

function isPrivilegedRole(role: string) {
  return adminRoles.has(role);
}

type AuthMeta = {
  ipAddress?: string;
  userAgent?: string;
};

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function ensureUniqueComplaintId() {
  const existingIds = new Set(
    (await prisma.complaint.findMany({ select: { grievanceId: true } })).map((item) => item.grievanceId),
  );

  return generateComplaintId(existingIds);
}

function buildTimelineEntry(action: string, by: string, note?: string) {
  return {
    date: new Date().toISOString(),
    action,
    by,
    ...(note ? { note } : {}),
  };
}

type ComplaintTimelineChatEntry = {
  date?: string;
  action?: string;
  by?: string;
  note?: string;
  channel?: string;
  senderId?: string;
  senderRole?: string;
  senderName?: string;
};

function getComplaintTimeline(complaint: { timeline: Prisma.JsonValue | null }) {
  return Array.isArray(complaint.timeline) ? (complaint.timeline as ComplaintTimelineChatEntry[]) : [];
}

function isChatEntry(entry: ComplaintTimelineChatEntry) {
  return entry.channel === "chat" || entry.action === "Chat message";
}

function mapChatEntry(entry: ComplaintTimelineChatEntry, complaint: { reporterUserId: string | null; reporterName: string }) {
  const senderRole = entry.senderRole ?? (entry.senderId && entry.senderId === complaint.reporterUserId ? "citizen" : adminRoles.has(String(entry.by)) ? String(entry.by) : "admin");
  const senderName = entry.senderName ?? entry.by ?? complaint.reporterName;

  return {
    id: `${entry.date ?? Date.now()}-${senderName}`,
    authorId: entry.senderId ?? "",
    authorName: senderName,
    authorRole: senderRole,
    message: entry.note ?? "",
    createdAt: entry.date ?? new Date().toISOString(),
    isAdmin: senderRole !== "citizen",
  };
}

async function findComplaintRecord(identifier: string) {
  return prisma.complaint.findFirst({
    where: {
      OR: [{ grievanceId: identifier }, { id: identifier }],
    },
    include: {
      assignedOfficer: { select: officerSummarySelect },
      reporterUser: { select: officerSummarySelect },
    },
  });
}

function assertMessageAccess(
  complaint: NonNullable<Awaited<ReturnType<typeof findComplaintRecord>>>,
  viewer: { id: string; role: string },
) {
  if (isPrivilegedRole(viewer.role) && viewer.role !== "officer") {
    return;
  }

  if (viewer.role === "officer" && complaint.assignedOfficerId === viewer.id) {
    return;
  }

  if (complaint.reporterUserId && complaint.reporterUserId === viewer.id) {
    return;
  }

  throw new AppError("Forbidden", 403);
}

export async function createComplaint(input: ComplaintSubmissionInput, reporterUserId?: string, meta?: AuthMeta) {
  const department = deriveDepartment(input.category);
  const officers = await prisma.user.findMany({
    where: {
      role: "officer",
      isVerified: true,
      emailVerified: true,
    },
    select: officerSummarySelect,
  });

  const suggestedOfficer = pickSuggestedOfficer(officers, {
    category: input.category,
    city: input.city,
    district: input.district,
    department,
  });

  const grievanceId = await ensureUniqueComplaintId();
  const now = new Date();
  const timeline = [
    buildTimelineEntry(
      "Complaint submitted",
      input.reporterName,
      meta?.ipAddress ? `Submitted from ${meta.ipAddress}` : "Submitted from public portal",
    ),
  ];

  const complaint = await prisma.complaint.create({
    data: {
      grievanceId,
      reporterUserId,
      reporterName: input.reporterName,
      reporterEmail: input.reporterEmail || null,
      reporterMobile: input.reporterMobile,
      title: input.title,
      category: input.category,
      department,
      description: input.description,
      state: input.state,
      district: input.district,
      city: input.city,
      address: input.address,
      landmark: input.landmark || null,
      pincode: input.pincode,
      priority: input.priority,
      publicVisibility: input.publicVisibility,
      suggestedOfficerId: suggestedOfficer?.id ?? null,
      suggestedOfficerName: suggestedOfficer?.fullName ?? null,
      evidence: toJsonValue(input.evidence),
      timeline: toJsonValue(timeline),
    },
    include: {
      assignedOfficer: { select: officerSummarySelect },
    },
  });

  if (reporterUserId) {
    await createNotification(reporterUserId, {
      title: "Complaint submitted successfully",
      message: `Your complaint ${grievanceId} has been received and is under review.`,
      type: "submission",
      priority: "medium",
      actionUrl: `/complaints/${complaint.id}`,
    });
  }

  await createNotificationsForRole("admin", {
    title: "New complaint submitted",
    message: `A new complaint ${grievanceId} has been filed and requires review.`,
    type: "admin",
    priority: "high",
    actionUrl: `/admin/complaints/${complaint.id}`,
  });

  return {
    message: "Complaint submitted successfully",
    complaint: {
      ...complaint,
      createdAt: complaint.createdAt.toISOString(),
      updatedAt: complaint.updatedAt.toISOString(),
      timeline: complaint.timeline ?? timeline,
      evidence: complaint.evidence ?? [],
      suggestedOfficer: suggestedOfficer ?? null,
    },
  };
}

export async function listComplaints(
  query: ComplaintQueryInput,
  viewer: { id: string; role: string },
) {
  const where: Prisma.ComplaintWhereInput = {};
  const role = viewer.role;

  if (!isPrivilegedRole(role)) {
    where.reporterUserId = viewer.id;
  } else if (role === "officer") {
    where.assignedOfficerId = viewer.id;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.view === "mine") {
    where.reporterUserId = viewer.id;
  }

  if (query.view === "assigned") {
    where.assignedOfficerId = viewer.id;
  }

  if (!isPrivilegedRole(role) && query.view === "assigned") {
    throw new AppError("Forbidden", 403);
  }

  if (role === "officer" && query.view === "all") {
    throw new AppError("Forbidden", 403);
  }

  if (query.search) {
    const search = query.search.trim();
    where.OR = [
      { grievanceId: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { district: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
      { reporterName: { contains: search, mode: "insensitive" } },
    ];
  }

  const take = query.limit && Number.isFinite(query.limit) ? Math.min(query.limit, 500) : undefined;

  if (query.summaryOnly) {
    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        grievanceId: true,
        reporterName: true,
        title: true,
        category: true,
        department: true,
        district: true,
        city: true,
        priority: true,
        status: true,
        assignedOfficerId: true,
        assignedOfficerName: true,
        assignedOfficer: { select: officerSummarySelect },
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      complaintCount: complaints.length,
      complaints: complaints.map((complaint) => ({
        ...complaint,
        createdAt: complaint.createdAt.toISOString(),
        updatedAt: complaint.updatedAt.toISOString(),
        reporterEmail: null,
        reporterMobile: null,
        description: "",
        state: "",
        address: "",
        landmark: null,
        pincode: "",
        publicVisibility: true,
        escalatedAt: null,
        escalationReason: null,
        suggestedOfficerId: null,
        suggestedOfficerName: null,
        assignedDepartment: null,
        assignedArea: null,
        evidence: [],
        timeline: [],
        resolutionSummary: null,
        resolutionEvidence: [],
        reporterUser: null,
      })),
    };
  }

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      assignedOfficer: { select: officerSummarySelect },
    },
  });

  return {
    complaintCount: complaints.length,
    complaints: complaints.map((complaint) => ({
      ...complaint,
      createdAt: complaint.createdAt.toISOString(),
      updatedAt: complaint.updatedAt.toISOString(),
      timeline: complaint.timeline ?? [],
      evidence: complaint.evidence ?? [],
      resolutionEvidence: complaint.resolutionEvidence ?? [],
    })),
  };
}

export async function getComplaintDetails(identifier: string, viewer: { id: string; role: string }) {
  const complaint = await findComplaintRecord(identifier);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (!isPrivilegedRole(viewer.role)) {
    if (complaint.reporterUserId !== viewer.id) {
      throw new AppError("Forbidden", 403);
    }
  } else if (viewer.role === "officer") {
    if (complaint.assignedOfficerId !== viewer.id) {
      throw new AppError("Forbidden", 403);
    }
  }

  return {
    complaint: {
      ...complaint,
      createdAt: complaint.createdAt.toISOString(),
      updatedAt: complaint.updatedAt.toISOString(),
      timeline: complaint.timeline ?? [],
      evidence: complaint.evidence ?? [],
      resolutionEvidence: complaint.resolutionEvidence ?? [],
    },
  };
}

export async function getComplaintMessages(identifier: string, viewer: { id: string; role: string }) {
  const complaint = await findComplaintRecord(identifier);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  assertMessageAccess(complaint, viewer);

  const messages = getComplaintTimeline(complaint)
    .filter(isChatEntry)
    .map((entry) => mapChatEntry(entry, complaint))
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

  return { messages };
}

export async function addComplaintMessage(
  identifier: string,
  input: { message: string },
  viewer: { id: string; fullName: string; role: string },
) {
  const complaint = await findComplaintRecord(identifier);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  assertMessageAccess(complaint, viewer);

  const timeline = getComplaintTimeline(complaint);
  const nextEntry = {
    date: new Date().toISOString(),
    action: "Chat message",
    by: viewer.fullName,
    note: input.message,
    channel: "chat",
    senderId: viewer.id,
    senderRole: viewer.role,
    senderName: viewer.fullName,
  };

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      timeline: toJsonValue([...timeline, nextEntry]),
    },
    include: {
      assignedOfficer: { select: officerSummarySelect },
      reporterUser: { select: officerSummarySelect },
    },
  });

  // create chat room for complaint and add participants (best-effort)
  try {
    const room = await chatService.getOrCreateRoomForComplaint(updated.id);
    if (room) {
      if (updated.assignedOfficer) {
        await chatService.addParticipant(room.id, updated.assignedOfficer.id, "officer");
      }
      if (updated.reporterUserId) {
        await chatService.addParticipant(room.id, updated.reporterUserId, "citizen");
      }

      try {
        await chatService.sendMessage({
          roomId: room.id,
          senderId: viewer.id,
          receiverId: updated.assignedOfficer ? updated.assignedOfficer.id : undefined,
          complaintId: updated.id,
          message: input.message || `New message in complaint ${updated.grievanceId}`,
          messageType: "system",
        });
      } catch (e) {
        // swallow
      }
    }
  } catch (e) {
    // non-blocking: assignment should not fail if chat creation fails
  }

  return {
    message: "Complaint message sent successfully",
    messageRecord: mapChatEntry(nextEntry, updated),
  };
}

export async function assignComplaint(
  identifier: string,
  input: ComplaintAssignmentInput,
  operator: { id: string; fullName: string; role: string },
) {
  const complaint = await prisma.complaint.findFirst({
    where: { OR: [{ grievanceId: identifier }, { id: identifier }] },
  });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  let officer = null as null | Awaited<ReturnType<typeof prisma.user.findFirst>>;

  if (input.officerId) {
    officer = await prisma.user.findFirst({
      where: {
        id: input.officerId,
        role: "officer",
      },
    });
  }

  if (!officer && input.useSuggestedOfficer && complaint.suggestedOfficerId) {
    officer = await prisma.user.findFirst({
      where: {
        id: complaint.suggestedOfficerId,
        role: "officer",
      },
    });
  }

  if (!officer) {
    const officerPool = await prisma.user.findMany({
      where: { role: "officer", isVerified: true, emailVerified: true },
      select: officerSummarySelect,
    });
    officer = pickSuggestedOfficer(officerPool, {
      category: complaint.category,
      city: complaint.city,
      district: complaint.district,
      department: complaint.department,
    }) as Awaited<ReturnType<typeof prisma.user.findFirst>>;
  }

  if (!officer) {
    throw new AppError("No verified officer available for this complaint", 404);
  }

  const updatedTimeline = [
    ...(Array.isArray(complaint.timeline) ? complaint.timeline : []),
    buildTimelineEntry("Complaint assigned", operator.fullName, `Assigned to ${officer.fullName}`),
  ];

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      status: "Assigned",
      assignedOfficerId: officer.id,
      assignedOfficerName: officer.fullName,
      assignedDepartment: officer.department ?? complaint.department,
      assignedArea: officer.jurisdictionArea ?? complaint.city,
      timeline: toJsonValue(updatedTimeline),
    },
    include: {
      assignedOfficer: { select: officerSummarySelect },
      reporterUser: { select: officerSummarySelect },
    },
  });

  if (updated.reporterUserId) {
    await createNotification(updated.reporterUserId, {
      title: "Officer assigned",
      message: `Your complaint ${updated.grievanceId} was assigned to ${updated.assignedOfficerName}.`,
      type: "assignment",
      priority: "high",
      actionUrl: `/complaints/${updated.id}`,
    });
  }

  if (updated.assignedOfficerId) {
    await createNotification(updated.assignedOfficerId, {
      title: "New assignment received",
      message: `You have been assigned complaint ${updated.grievanceId}.`,
      type: "assignment",
      priority: "high",
      actionUrl: `/officer/complaints/${updated.id}`,
    });
  }

  await createNotificationsForRole("admin", {
    title: "Complaint assigned",
    message: `Complaint ${updated.grievanceId} has been assigned to ${updated.assignedOfficerName}.`,
    type: "admin",
    priority: "medium",
    actionUrl: `/admin/complaints/${updated.id}`,
  });

  return {
    message: "Complaint assigned successfully",
    complaint: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      timeline: updated.timeline ?? updatedTimeline,
      evidence: updated.evidence ?? [],
      resolutionEvidence: updated.resolutionEvidence ?? [],
    },
  };
}

export async function updateComplaintStatus(
  identifier: string,
  input: ComplaintStatusUpdateInput,
  operator: { id: string; fullName: string; role: string },
) {
  const complaint = await prisma.complaint.findFirst({
    where: { OR: [{ grievanceId: identifier }, { id: identifier }] },
  });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  const updatedTimeline = [
    ...(Array.isArray(complaint.timeline) ? complaint.timeline : []),
    buildTimelineEntry(input.status, operator.fullName, input.note || input.resolutionSummary || undefined),
  ];

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      status: input.status,
      resolutionSummary: input.resolutionSummary || complaint.resolutionSummary,
      ...(input.resolutionEvidence.length
        ? { resolutionEvidence: toJsonValue(input.resolutionEvidence) }
        : {}),
      timeline: toJsonValue(updatedTimeline),
    },
    include: {
      assignedOfficer: { select: officerSummarySelect },
      reporterUser: { select: officerSummarySelect },
    },
  });

  if (updated.reporterUserId) {
    await createNotification(updated.reporterUserId, {
      title: "Status updated",
      message: `Your complaint ${updated.grievanceId} is now ${updated.status}.`,
      type: "status",
      priority: updated.status === "Resolved" ? "high" : "medium",
      actionUrl: `/complaints/${updated.id}`,
    });
  }

  if (updated.assignedOfficerId && updated.assignedOfficerId !== operator.id) {
    await createNotification(updated.assignedOfficerId, {
      title: "Complaint status changed",
      message: `Complaint ${updated.grievanceId} was updated to ${updated.status}.`,
      type: "status",
      priority: "medium",
      actionUrl: `/officer/complaints/${updated.id}`,
    });
  }

  if (updated.status === "Escalated") {
    await createNotificationsForRole("admin", {
      title: "Escalation raised",
      message: `Complaint ${updated.grievanceId} has been escalated and needs urgent review.`,
      type: "escalation",
      priority: "critical",
      actionUrl: `/admin/complaints/${updated.id}`,
    });
  }

  return {
    message: "Complaint status updated successfully",
    complaint: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      timeline: updated.timeline ?? updatedTimeline,
      evidence: updated.evidence ?? [],
      resolutionEvidence: updated.resolutionEvidence ?? [],
    },
  };
}

export async function getComplaintSummary(viewer: { id: string; role: string }) {
  const baseWhere: Prisma.ComplaintWhereInput = {};

  if (!isPrivilegedRole(viewer.role)) {
    baseWhere.reporterUserId = viewer.id;
  } else if (viewer.role === "officer") {
    baseWhere.assignedOfficerId = viewer.id;
  }

  const [submitted, assigned, inProgress, resolved, escalated] = await Promise.all([
    prisma.complaint.count({ where: { ...baseWhere, status: "Submitted" } }),
    prisma.complaint.count({ where: { ...baseWhere, status: "Assigned" } }),
    prisma.complaint.count({ where: { ...baseWhere, status: "In Progress" } }),
    prisma.complaint.count({ where: { ...baseWhere, status: "Resolved" } }),
    prisma.complaint.count({ where: { ...baseWhere, status: "Escalated" } }),
  ]);

  return {
    submitted,
    assigned,
    inProgress,
    resolved,
    escalated,
    total: submitted + assigned + inProgress + resolved + escalated,
  };
}

/**
 * Get detailed analytics for a citizen's complaints including feedback
 */
export async function getComplaintAnalytics(citizenId: string) {
  const complaints = await prisma.complaint.findMany({
    where: { reporterUserId: citizenId },
    include: {
      feedback: true,
      assignedOfficer: { select: officerSummarySelect },
      escalation: true,
      timelines: { orderBy: { createdAt: "asc" } },
    },
  });

  // Calculate metrics
  const stats = {
    totalComplaints: complaints.length,
    byStatus: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    avgResolutionTime: 0,
    satisfactionRating: 0,
    feedback: [] as any[],
    escalations: 0,
    resolutionRate: 0,
    monthlyTrend: [] as Array<{ month: string; count: number; resolved: number }>,
  };

  // Count by status
  complaints.forEach((c) => {
    stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;
    stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
    stats.byPriority[c.priority] = (stats.byPriority[c.priority] || 0) + 1;
  });

  // Calculate resolution time
  const resolved = complaints.filter((c) => c.status === "Resolved");
  if (resolved.length > 0) {
    const avgMs = resolved.reduce((sum, c) => {
      const createdTime = new Date(c.createdAt).getTime();
      const resolvedTime = new Date(c.updatedAt).getTime();
      return sum + (resolvedTime - createdTime);
    }, 0) / resolved.length;
    stats.avgResolutionTime = Math.round(avgMs / 1000 / 60 / 60); // hours
    stats.resolutionRate = (resolved.length / complaints.length) * 100;
  }

  // Feedback stats
  const feedbackRecords = complaints.filter((c) => c.feedback);
  if (feedbackRecords.length > 0) {
    stats.satisfactionRating = feedbackRecords.reduce((sum, c) => sum + (c.feedback?.rating || 0), 0) / feedbackRecords.length;
    stats.feedback = feedbackRecords.map((c) => ({
      complaintId: c.grievanceId,
      rating: c.feedback?.rating,
      comment: c.feedback?.comment,
      date: c.feedback?.createdAt,
    }));
  }

  // Escalations count
  stats.escalations = complaints.filter((c) => c.escalation).length;

  // Monthly trend
  const monthlyMap = new Map<string, { count: number; resolved: number }>();
  complaints.forEach((c) => {
    const month = c.createdAt.toISOString().substring(0, 7);
    const current = monthlyMap.get(month) || { count: 0, resolved: 0 };
    current.count++;
    if (c.status === "Resolved") current.resolved++;
    monthlyMap.set(month, current);
  });
  stats.monthlyTrend = Array.from(monthlyMap.entries())
    .sort()
    .map(([month, data]) => ({ month, ...data }));

  return { analytics: stats };
}
