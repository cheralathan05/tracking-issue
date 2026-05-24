import type { Prisma } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
import { createNotification, createNotificationsForRole } from "./notification.service.js";
import { createEscalation as createEscalationRecord } from "./escalation.service.js";

type Viewer = {
  id: string;
  role: string;
  fullName: string;
};

type ShiftStatus = "Online" | "On duty" | "In field" | "Break" | "Offline";

type TimelineEntry = {
  date?: string;
  action?: string;
  by?: string;
  note?: string;
  metadata?: Record<string, unknown>;
};

const adminRoles = new Set(["super_admin", "state_admin", "district_officer", "department_officer", "admin"]);

function isAdmin(role: string) {
  return adminRoles.has(role);
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function parseTimeline(value: Prisma.JsonValue | null): TimelineEntry[] {
  return Array.isArray(value) ? (value as TimelineEntry[]) : [];
}

function buildTimelineEntry(action: string, by: string, note?: string, metadata?: Record<string, unknown>) {
  const entry: TimelineEntry = {
    date: new Date().toISOString(),
    action,
    by,
  };

  if (note) {
    entry.note = note;
  }

  if (metadata && Object.keys(metadata).length > 0) {
    entry.metadata = metadata;
  }

  return entry;
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const earthRadiusKm = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const a = sinDLat * sinDLat + sinDLng * sinDLng * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

async function resolveComplaint(identifier: string) {
  const complaint = await prisma.complaint.findFirst({
    where: {
      OR: [{ id: identifier }, { grievanceId: identifier }],
    },
    include: {
      assignedOfficer: { select: { id: true, fullName: true, role: true } },
      reporterUser: { select: { id: true, fullName: true, role: true } },
      escalation: true,
    },
  });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  return complaint;
}

function assertOfficerAccess(
  complaint: Awaited<ReturnType<typeof resolveComplaint>>,
  viewer: Viewer,
) {
  if (isAdmin(viewer.role)) {
    return;
  }

  if (viewer.role !== "officer") {
    throw new AppError("Forbidden", 403);
  }

  if (complaint.assignedOfficerId !== viewer.id) {
    throw new AppError("Complaint is not assigned to this officer", 403);
  }
}

export async function getOfficerMissionDashboard(viewer: Viewer) {
  const where: Prisma.ComplaintWhereInput = viewer.role === "officer"
    ? { assignedOfficerId: viewer.id }
    : {};

  const now = Date.now();
  const complaints = await prisma.complaint.findMany({
    where,
    include: {
      escalation: true,
      feedback: true,
    },
  });

  const assigned = complaints.length;
  const activeEmergencies = complaints.filter(
    (c) => c.priority === "Critical" || c.escalation?.level === "emergency",
  ).length;
  const slaBreaches = complaints.filter(
    (c) => c.slaDeadline && c.slaDeadline.getTime() <= now && c.status !== "Resolved" && c.status !== "Closed",
  ).length;
  const resolvedToday = complaints.filter((c) => {
    if (c.status !== "Resolved") return false;
    const updated = c.updatedAt;
    const today = new Date();
    return updated.getDate() === today.getDate()
      && updated.getMonth() === today.getMonth()
      && updated.getFullYear() === today.getFullYear();
  }).length;
  const inProgress = complaints.filter((c) => c.status === "In Progress").length;
  const escalations = complaints.filter((c) => Boolean(c.escalation)).length;
  const pendingInspections = complaints.filter((c) => c.status === "Assigned" || c.status === "Awaiting Information").length;

  const resolvedComplaints = complaints.filter((c) => c.status === "Resolved");
  const avgResponseTimeHours = resolvedComplaints.length === 0
    ? 0
    : Math.round(
      resolvedComplaints.reduce((sum, item) => {
        const createdMs = item.createdAt.getTime();
        const resolvedMs = item.updatedAt.getTime();
        return sum + Math.max(0, resolvedMs - createdMs);
      }, 0) / resolvedComplaints.length / 1000 / 60 / 60,
    );

  const rated = complaints.filter((c) => c.feedback?.rating);
  const citizenRating = rated.length === 0
    ? 0
    : Math.round((rated.reduce((sum, item) => sum + (item.feedback?.officerRating || item.feedback?.rating || 0), 0) / rated.length) * 10) / 10;

  const liveAlerts = complaints
    .filter((c) => c.priority === "Critical" || c.status === "Escalated" || (c.slaDeadline ? c.slaDeadline.getTime() - now <= 30 * 60 * 1000 : false))
    .slice(0, 8)
    .map((c) => {
      let message = `Complaint ${c.grievanceId} requires attention`;
      if (c.priority === "Critical") {
        message = `Critical ${c.category.toLowerCase()} issue reported in ${c.city}`;
      } else if (c.status === "Escalated") {
        message = `Escalation active on ${c.grievanceId}`;
      } else if (c.slaDeadline) {
        const minutes = Math.max(1, Math.round((c.slaDeadline.getTime() - now) / 60000));
        message = `SLA warning for ${c.grievanceId}: ${minutes} mins remaining`;
      }

      return {
        id: c.id,
        complaintId: c.grievanceId,
        priority: c.priority,
        status: c.status,
        message,
        createdAt: c.updatedAt.toISOString(),
      };
    });

  return {
    dashboard: {
      assignedComplaints: assigned,
      activeEmergencies,
      slaBreaches,
      resolvedToday,
      inProgress,
      avgResponseTimeHours,
      citizenRating,
      escalations,
      pendingInspections,
      liveAlerts,
    },
  };
}

export async function getAssignedQueue(
  viewer: Viewer,
  options: {
    sortBy?: "nearest" | "priority" | "oldest" | "sla" | "emergency";
    latitude?: number;
    longitude?: number;
  },
) {
  const where: Prisma.ComplaintWhereInput = viewer.role === "officer"
    ? { assignedOfficerId: viewer.id }
    : {};

  const records = await prisma.complaint.findMany({
    where,
    include: {
      escalation: true,
    },
  });

  const now = Date.now();
  const priorityRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

  const items = records.map((item) => {
    const distance = typeof options.latitude === "number"
      && typeof options.longitude === "number"
      && typeof item.latitude === "number"
      && typeof item.longitude === "number"
      ? distanceKm(options.latitude, options.longitude, item.latitude, item.longitude)
      : null;

    const slaRiskScore = item.slaDeadline
      ? Math.max(0, 1 - (item.slaDeadline.getTime() - now) / (2 * 60 * 60 * 1000))
      : 0;

    return {
      id: item.id,
      complaintId: item.grievanceId,
      citizenName: item.reporterName,
      priority: item.priority,
      department: item.department,
      area: `${item.city}, ${item.district}`,
      city: item.city,
      district: item.district,
      status: item.status,
      escalationLevel: item.escalation?.level ?? null,
      gps: item.latitude && item.longitude ? { latitude: item.latitude, longitude: item.longitude } : null,
      distanceKm: distance,
      slaDeadline: item.slaDeadline?.toISOString() ?? null,
      slaRiskScore: Number(slaRiskScore.toFixed(2)),
      lastUpdate: item.updatedAt.toISOString(),
      title: item.title,
    };
  });

  const sortBy = options.sortBy ?? "priority";
  items.sort((a, b) => {
    if (sortBy === "nearest") {
      return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
    }

    if (sortBy === "oldest") {
      return new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime();
    }

    if (sortBy === "sla") {
      return b.slaRiskScore - a.slaRiskScore;
    }

    if (sortBy === "emergency") {
      const emergencyWeight = (value: typeof items[number]) => {
        if (value.priority === "Critical") return 4;
        if (value.escalationLevel === "emergency") return 3;
        if (value.status === "Escalated") return 2;
        return 1;
      };
      return emergencyWeight(b) - emergencyWeight(a);
    }

    return (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0);
  });

  return { queue: items };
}

export async function getEmergencyQueue(viewer: Viewer) {
  const where: Prisma.ComplaintWhereInput = {
    OR: [{ priority: "Critical" }, { status: "Escalated" }, { escalation: { level: "emergency" } }],
  };

  if (viewer.role === "officer") {
    where.assignedOfficerId = viewer.id;
  }

  const complaints = await prisma.complaint.findMany({
    where,
    include: { escalation: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 30,
  });

  return {
    emergencies: complaints.map((item) => ({
      id: item.id,
      complaintId: item.grievanceId,
      title: item.title,
      category: item.category,
      priority: item.priority,
      status: item.status,
      level: item.escalation?.level ?? null,
      location: `${item.address}, ${item.city}`,
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}

export async function startInspection(
  identifier: string,
  viewer: Viewer,
  payload: { latitude?: number; longitude?: number; note?: string },
) {
  const complaint = await resolveComplaint(identifier);
  assertOfficerAccess(complaint, viewer);

  const timeline = parseTimeline(complaint.timeline);
  const entry = buildTimelineEntry(
    "Inspection Started",
    viewer.fullName,
    payload.note || "Officer started field inspection",
    {
      latitude: payload.latitude,
      longitude: payload.longitude,
      startedAt: new Date().toISOString(),
    },
  );

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      status: "In Progress",
      latitude: payload.latitude ?? complaint.latitude,
      longitude: payload.longitude ?? complaint.longitude,
      timeline: toJson([...timeline, entry]),
    },
  });

  if (complaint.reporterUserId) {
    await createNotification(complaint.reporterUserId, {
      title: "Inspection has started",
      message: `Officer has started inspection for ${complaint.grievanceId}.`,
      type: "status",
      priority: "high",
      actionUrl: `/complaints/${complaint.id}`,
    });
  }

  return {
    message: "Inspection started",
    complaint: {
      id: updated.id,
      complaintId: updated.grievanceId,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export async function updateFieldGps(
  identifier: string,
  viewer: Viewer,
  payload: { latitude: number; longitude: number; etaMinutes?: number; note?: string },
) {
  const complaint = await resolveComplaint(identifier);
  assertOfficerAccess(complaint, viewer);

  const timeline = parseTimeline(complaint.timeline);
  const entry = buildTimelineEntry(
    "GPS Update",
    viewer.fullName,
    payload.note || "Live location updated",
    {
      latitude: payload.latitude,
      longitude: payload.longitude,
      etaMinutes: payload.etaMinutes,
      sharedAt: new Date().toISOString(),
    },
  );

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      timeline: toJson([...timeline, entry]),
    },
  });

  if (complaint.reporterUserId) {
    await createNotification(complaint.reporterUserId, {
      title: "Officer en route",
      message: payload.etaMinutes
        ? `Officer is approximately ${payload.etaMinutes} mins away for ${complaint.grievanceId}.`
        : `Live location updated for complaint ${complaint.grievanceId}.`,
      type: "info",
      priority: "medium",
      actionUrl: `/complaints/${complaint.id}`,
      data: {
        latitude: payload.latitude,
        longitude: payload.longitude,
        etaMinutes: payload.etaMinutes ?? null,
      },
    });
  }

  return {
    message: "GPS updated",
    complaint: {
      id: updated.id,
      complaintId: updated.grievanceId,
      latitude: updated.latitude,
      longitude: updated.longitude,
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export async function getNavigationPlan(
  identifier: string,
  viewer: Viewer,
  source: { latitude: number; longitude: number },
) {
  const complaint = await resolveComplaint(identifier);
  assertOfficerAccess(complaint, viewer);

  if (typeof complaint.latitude !== "number" || typeof complaint.longitude !== "number") {
    throw new AppError("Complaint location is unavailable", 400);
  }

  const km = distanceKm(source.latitude, source.longitude, complaint.latitude, complaint.longitude);
  const etaMinutes = Math.max(1, Math.round((km / 25) * 60));

  return {
    navigation: {
      complaintId: complaint.grievanceId,
      destination: {
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        address: `${complaint.address}, ${complaint.city}`,
      },
      source,
      distanceKm: Number(km.toFixed(2)),
      etaMinutes,
    },
  };
}

export async function escalateFromOfficer(
  identifier: string,
  viewer: Viewer,
  payload: { reason: string; level?: "low" | "medium" | "high" | "emergency" },
) {
  const complaint = await resolveComplaint(identifier);
  assertOfficerAccess(complaint, viewer);

  const result = await createEscalationRecord({
    complaintId: complaint.id,
    reason: payload.reason,
    level: payload.level,
    escalatedBy: viewer.id,
  });

  const timeline = parseTimeline(complaint.timeline);
  const entry = buildTimelineEntry("Escalated", viewer.fullName, payload.reason, {
    level: payload.level ?? "medium",
  });

  await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      timeline: toJson([...timeline, entry]),
    },
  });

  return result;
}

export async function submitResolution(
  identifier: string,
  viewer: Viewer,
  payload: {
    resolutionSummary: string;
    citizenConfirmation: boolean;
    completionTimestamp?: string;
    beforeAfterPhotos?: Array<{ name: string; type: string; size: number; dataUrl: string }>;
  },
) {
  const complaint = await resolveComplaint(identifier);
  assertOfficerAccess(complaint, viewer);

  const timeline = parseTimeline(complaint.timeline);
  const completedAt = payload.completionTimestamp ? new Date(payload.completionTimestamp) : new Date();

  if (Number.isNaN(completedAt.getTime())) {
    throw new AppError("Invalid completion timestamp", 400);
  }

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      status: "Resolved",
      resolutionSummary: payload.resolutionSummary,
      resolutionEvidence: toJson(payload.beforeAfterPhotos ?? []),
      timeline: toJson([
        ...timeline,
        buildTimelineEntry(
          "Resolved",
          viewer.fullName,
          payload.resolutionSummary,
          {
            citizenConfirmation: payload.citizenConfirmation,
            completionTimestamp: completedAt.toISOString(),
            proofCount: payload.beforeAfterPhotos?.length ?? 0,
          },
        ),
      ]),
    },
  });

  if (complaint.reporterUserId) {
    await createNotification(complaint.reporterUserId, {
      title: "Complaint marked resolved",
      message: `Resolution submitted for ${complaint.grievanceId}. Please review and submit feedback.`,
      type: "status",
      priority: "high",
      actionUrl: `/complaints/${complaint.id}`,
    });
  }

  await createNotificationsForRole("admin", {
    title: "Resolution uploaded",
    message: `Officer submitted resolution proof for ${complaint.grievanceId}.`,
    type: "admin",
    priority: "medium",
    actionUrl: `/admin/complaints/${complaint.id}`,
  });

  return {
    message: "Resolution submitted successfully",
    complaint: {
      id: updated.id,
      complaintId: updated.grievanceId,
      status: updated.status,
      resolutionSummary: updated.resolutionSummary,
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export async function getShiftStatus(viewer: Viewer) {
  const latest = await prisma.auditLog.findFirst({
    where: {
      userId: viewer.id,
      action: "officer.shift.status",
    },
    orderBy: { createdAt: "desc" },
  });

  const currentStatus = (latest?.metadata as { status?: ShiftStatus } | null)?.status ?? "Offline";

  return {
    shift: {
      status: currentStatus,
      updatedAt: latest?.createdAt.toISOString() ?? null,
    },
  };
}

export async function updateShiftStatus(viewer: Viewer, status: ShiftStatus, note?: string) {
  await prisma.auditLog.create({
    data: {
      userId: viewer.id,
      action: "officer.shift.status",
      metadata: toJson({ status, note: note ?? null }),
    },
  });

  await createNotificationsForRole("admin", {
    title: "Officer shift status updated",
    message: `${viewer.fullName} is now ${status}.`,
    type: "admin",
    priority: "low",
    actionUrl: "/admin/officers",
  });

  return {
    message: "Shift status updated",
    shift: {
      status,
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function getOfficerPerformance(viewer: Viewer) {
  const where: Prisma.ComplaintWhereInput = viewer.role === "officer"
    ? { assignedOfficerId: viewer.id }
    : {};

  const complaints = await prisma.complaint.findMany({ where, include: { feedback: true, escalation: true } });

  const resolved = complaints.filter((c) => c.status === "Resolved");
  const escalated = complaints.filter((c) => c.status === "Escalated" || Boolean(c.escalation));
  const slaSuccess = complaints.filter((c) => c.slaDeadline && c.updatedAt <= c.slaDeadline).length;
  const attendanceLogs = await prisma.auditLog.count({ where: { userId: viewer.id, action: "officer.shift.status" } });
  const emergencyHandled = complaints.filter((c) => c.priority === "Critical" && c.status === "Resolved").length;

  const avgResolutionSpeedHours = resolved.length === 0
    ? 0
    : Math.round(
      resolved.reduce((sum, c) => sum + (c.updatedAt.getTime() - c.createdAt.getTime()), 0)
      / resolved.length
      / 1000
      / 60
      / 60,
    );

  const feedbackRows = complaints.filter((c) => c.feedback?.rating);
  const citizenRating = feedbackRows.length === 0
    ? 0
    : Math.round((feedbackRows.reduce((sum, c) => sum + (c.feedback?.officerRating || c.feedback?.rating || 0), 0) / feedbackRows.length) * 10) / 10;

  return {
    performance: {
      avgResolutionSpeedHours,
      citizenRating,
      slaSuccessRate: complaints.length === 0 ? 0 : Math.round((slaSuccess / complaints.length) * 100),
      escalationCount: escalated.length,
      attendanceEvents: attendanceLogs,
      emergencyHandled,
    },
  };
}

export async function getOfficerReports(viewer: Viewer) {
  const where: Prisma.ComplaintWhereInput = viewer.role === "officer"
    ? { assignedOfficerId: viewer.id }
    : {};

  const complaints = await prisma.complaint.findMany({ where, include: { escalation: true, feedback: true } });

  const totals = {
    total: complaints.length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    escalated: complaints.filter((c) => Boolean(c.escalation)).length,
  };

  const byPriority = complaints.reduce<Record<string, number>>((acc, item) => {
    acc[item.priority] = (acc[item.priority] ?? 0) + 1;
    return acc;
  }, {});

  const byArea = complaints.reduce<Record<string, number>>((acc, item) => {
    const area = `${item.city}, ${item.district}`;
    acc[area] = (acc[area] ?? 0) + 1;
    return acc;
  }, {});

  const monthly = complaints.reduce<Record<string, { total: number; resolved: number }>>((acc, item) => {
    const month = `${item.createdAt.getUTCFullYear()}-${String(item.createdAt.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!acc[month]) {
      acc[month] = { total: 0, resolved: 0 };
    }
    acc[month].total += 1;
    if (item.status === "Resolved") {
      acc[month].resolved += 1;
    }
    return acc;
  }, {});

  return {
    reports: {
      totals,
      byPriority,
      byArea,
      monthlyTrend: Object.entries(monthly)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([month, values]) => ({ month, ...values })),
    },
  };
}

export async function getOfficerKnowledgeBase() {
  return {
    knowledgeBase: [
      {
        id: "sop-water-leak",
        title: "Emergency SOP: Water Pipeline Burst",
        category: "Emergency protocols",
        summary: "Isolate supply, notify utility control room, mark hazard zone, publish citizen advisory.",
      },
      {
        id: "sop-electrical-fire",
        title: "Electrical Fire First Response",
        category: "Safety documentation",
        summary: "Disconnect feeder, coordinate with fire services, secure perimeter, log incident timeline.",
      },
      {
        id: "repair-road-collapse",
        title: "Road Collapse Temporary Restoration",
        category: "Repair procedures",
        summary: "Deploy barricades, classify collapse severity, escalate to roads department if structural risk exists.",
      },
      {
        id: "department-guideline-escalation",
        title: "Cross-Department Escalation Matrix",
        category: "Department guidelines",
        summary: "Use escalation center when issue spans utilities, roads, sanitation, and public safety teams.",
      },
    ],
  };
}
