import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
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

const adminRoles = new Set(["super_admin", "state_admin", "district_officer", "department_officer", "admin", "officer"]);

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
  if (adminRoles.has(viewer.role)) {
    return;
  }

  if (complaint.reporterUserId && complaint.reporterUserId === viewer.id) {
    return;
  }

  if (complaint.assignedOfficerId && complaint.assignedOfficerId === viewer.id) {
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
  viewer?: { id: string; role: string },
) {
  const where: Prisma.ComplaintWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.view === "mine" && viewer) {
    where.reporterUserId = viewer.id;
  }

  if (query.view === "assigned" && viewer) {
    where.assignedOfficerId = viewer.id;
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

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: "desc" },
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

async function findComplaint(identifier: string) {
  return findComplaintRecord(identifier);
}

export async function getComplaintDetails(identifier: string) {
  const complaint = await findComplaint(identifier);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
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

export async function getComplaintSummary() {
  const [submitted, assigned, inProgress, resolved, escalated] = await Promise.all([
    prisma.complaint.count({ where: { status: "Submitted" } }),
    prisma.complaint.count({ where: { status: "Assigned" } }),
    prisma.complaint.count({ where: { status: "In Progress" } }),
    prisma.complaint.count({ where: { status: "Resolved" } }),
    prisma.complaint.count({ where: { status: "Escalated" } }),
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
