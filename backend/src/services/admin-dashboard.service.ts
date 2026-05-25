import { Role } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import { adminUserSelect, officerSummarySelect } from "../constants/user.js";

const pendingComplaintStatuses = new Set([
  "Submitted",
  "Under Review",
  "Assigned",
  "In Progress",
  "Awaiting Information",
]);

const resolvedComplaintStatuses = new Set(["Resolved", "Closed"]);

type DashboardComplaintRecord = {
  id: string;
  grievanceId: string;
  reporterName: string;
  title: string;
  department: string;
  district: string;
  city: string;
  status: string;
  priority: string;
  assignedOfficerName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminDashboardComplaintItem = {
  id: string;
  grievanceId: string;
  reporterName: string;
  title: string;
  department: string;
  district: string;
  city: string;
  status: string;
  priority: string;
  assignedOfficerName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminDepartmentPerformance = {
  name: string;
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  escalationCount: number;
  slaCompliance: number;
  avgResponseHours: number;
  resolutionRate: number;
};

export type AdminDashboardResponse = {
  summary: {
    totalComplaints: number;
    resolvedComplaints: number;
    pendingComplaints: number;
    escalations: number;
    criticalComplaints: number;
    registeredCitizens: number;
    activeOfficers: number;
    offlineOfficers: number;
  };
  escalationMetrics: {
    totalEscalations: number;
    openEscalations: number;
    resolvedEscalations: number;
    criticalEscalations: number;
    breachedSlaCases: number;
  };
  citizenMetrics: {
    registeredCitizens: number;
    activeComplaints: number;
    feedbackCount: number;
    averageRating: number;
  };
  officerMetrics: {
    totalOfficers: number;
    activeOfficers: number;
    offlineOfficers: number;
    departmentAssignments: Array<{ department: string; count: number }>;
    topOfficers: Array<{
      id: string;
      fullName: string;
      email: string;
      department: string | null;
      jurisdictionArea: string | null;
      activeComplaints: number;
      resolvedComplaints: number;
      lastLoginAt: string | null;
    }>;
  };
  departmentPerformance: AdminDepartmentPerformance[];
  recentComplaints: AdminDashboardComplaintItem[];
};

export type AdminSearchResult = {
  query: string;
  counts: {
    complaints: number;
    users: number;
    officers: number;
    departments: number;
  };
  complaints: AdminDashboardComplaintItem[];
  users: Array<{
    id: string;
    fullName: string;
    username: string | null;
    email: string;
    mobile: string;
    state: string;
    district: string;
    department: string | null;
    role: string;
    isVerified: boolean;
    emailVerified: boolean;
    createdAt: string;
  }>;
  officers: Array<{
    id: string;
    fullName: string;
    username: string | null;
    email: string;
    mobile: string;
    department: string | null;
    jurisdictionArea: string | null;
    officerCode: string | null;
    role: string;
    isVerified: boolean;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  departments: Array<{
    name: string;
    complaintCount: number;
    officerCount: number;
  }>;
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function mapComplaintItem(complaint: DashboardComplaintRecord): AdminDashboardComplaintItem {
  return {
    ...complaint,
    createdAt: complaint.createdAt.toISOString(),
    updatedAt: complaint.updatedAt.toISOString(),
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function toDepartmentName(value: string | null | undefined) {
  return value?.trim() || "Unassigned";
}

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const activeCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalComplaints,
    resolvedComplaints,
    pendingComplaints,
    criticalComplaints,
    registeredCitizens,
    totalOfficers,
    activeOfficers,
    recentComplaints,
    complaintsForMetrics,
    totalEscalations,
    openEscalations,
    resolvedEscalations,
    criticalEscalations,
    breachedSlaCases,
    feedbackAggregate,
    feedbackCount,
    officerRecords,
    complaintOfficerCounts,
    departmentAssignments,
  ] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: { in: Array.from(resolvedComplaintStatuses) } } }),
    prisma.complaint.count({ where: { status: { in: Array.from(pendingComplaintStatuses) } } }),
    prisma.complaint.count({ where: { priority: "Critical" } }),
    prisma.user.count({ where: { role: Role.citizen } }),
    prisma.user.count({ where: { role: Role.officer } }),
    prisma.user.count({ where: { role: Role.officer, lastLoginAt: { gte: activeCutoff } } }),
    prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        grievanceId: true,
        reporterName: true,
        title: true,
        department: true,
        district: true,
        city: true,
        status: true,
        priority: true,
        assignedOfficerName: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.complaint.findMany({
      select: {
        department: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        slaDeadline: true,
        assignedOfficerId: true,
      },
    }),
    prisma.escalation.count(),
    prisma.escalation.count({ where: { status: "active" } }),
    prisma.escalation.count({ where: { status: "resolved" } }),
    prisma.escalation.count({ where: { OR: [{ level: "emergency" }, { complaint: { priority: "Critical" } }] } }),
    prisma.complaint.count({
      where: {
        slaDeadline: { lt: new Date() },
        status: { notIn: Array.from(resolvedComplaintStatuses) },
      },
    }),
    prisma.feedback.aggregate({ _avg: { rating: true } }),
    prisma.feedback.count(),
    prisma.user.findMany({
      where: { role: Role.officer },
      orderBy: [{ lastLoginAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        ...officerSummarySelect,
        lastLoginAt: true,
      },
    }),
    prisma.complaint.groupBy({
      by: ["assignedOfficerId"],
      where: { assignedOfficerId: { not: null } },
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["department"],
      where: { role: Role.officer, department: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const departmentMetrics = complaintsForMetrics.reduce(
    (acc, complaint) => {
      const department = toDepartmentName(complaint.department);
      const bucket = acc.get(department) ?? {
        name: department,
        totalComplaints: 0,
        resolvedComplaints: 0,
        pendingComplaints: 0,
        escalationCount: 0,
        resolvedWithinSla: 0,
        responseTimes: [] as number[],
      };

      bucket.totalComplaints += 1;

      if (resolvedComplaintStatuses.has(complaint.status)) {
        bucket.resolvedComplaints += 1;
        if (complaint.slaDeadline && complaint.slaDeadline.getTime() >= complaint.updatedAt.getTime()) {
          bucket.resolvedWithinSla += 1;
        }
      }

      if (pendingComplaintStatuses.has(complaint.status)) {
        bucket.pendingComplaints += 1;
      }

      if (complaint.status === "Escalated") {
        bucket.escalationCount += 1;
      }

      bucket.responseTimes.push(Math.max(0, complaint.updatedAt.getTime() - complaint.createdAt.getTime()) / 60 / 60 / 1000);

      acc.set(department, bucket);
      return acc;
    },
    new Map<
      string,
      {
        name: string;
        totalComplaints: number;
        resolvedComplaints: number;
        pendingComplaints: number;
        escalationCount: number;
        resolvedWithinSla: number;
        responseTimes: number[];
      }
    >(),
  );

  const officerCounts = complaintOfficerCounts.reduce((acc, item) => {
    if (item.assignedOfficerId) {
      acc.set(item.assignedOfficerId, item._count._all);
    }
    return acc;
  }, new Map<string, number>());

  const officerResolvedCounts = complaintsForMetrics.reduce((acc, complaint) => {
    if (!complaint.assignedOfficerId || !resolvedComplaintStatuses.has(complaint.status)) {
      return acc;
    }

    acc.set(complaint.assignedOfficerId, (acc.get(complaint.assignedOfficerId) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  return {
    summary: {
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      escalations: totalEscalations,
      criticalComplaints,
      registeredCitizens,
      activeOfficers,
      offlineOfficers: Math.max(0, totalOfficers - activeOfficers),
    },
    escalationMetrics: {
      totalEscalations,
      openEscalations,
      resolvedEscalations,
      criticalEscalations,
      breachedSlaCases,
    },
    citizenMetrics: {
      registeredCitizens,
      activeComplaints: totalComplaints - resolvedComplaints,
      feedbackCount,
      averageRating: feedbackAggregate._avg.rating ? Number(feedbackAggregate._avg.rating.toFixed(1)) : 0,
    },
    officerMetrics: {
      totalOfficers,
      activeOfficers,
      offlineOfficers: Math.max(0, totalOfficers - activeOfficers),
      departmentAssignments: departmentAssignments
        .map((item) => ({
          department: toDepartmentName(item.department),
          count: item._count._all,
        }))
        .sort((left, right) => right.count - left.count),
      topOfficers: officerRecords.map((officer) => ({
        id: officer.id,
        fullName: officer.fullName,
        email: officer.email,
        department: officer.department,
        jurisdictionArea: officer.jurisdictionArea,
        activeComplaints: officerCounts.get(officer.id) ?? 0,
        resolvedComplaints: officerResolvedCounts.get(officer.id) ?? 0,
        lastLoginAt: toIso(officer.lastLoginAt),
      })),
    },
    departmentPerformance: Array.from(departmentMetrics.values())
      .map((department) => ({
        name: department.name,
        totalComplaints: department.totalComplaints,
        resolvedComplaints: department.resolvedComplaints,
        pendingComplaints: department.pendingComplaints,
        escalationCount: department.escalationCount,
        slaCompliance: department.totalComplaints > 0 ? Math.round((department.resolvedWithinSla / department.totalComplaints) * 100) : 0,
        avgResponseHours: average(department.responseTimes),
        resolutionRate: department.totalComplaints > 0 ? Math.round((department.resolvedComplaints / department.totalComplaints) * 100) : 0,
      }))
      .sort((left, right) => right.totalComplaints - left.totalComplaints),
    recentComplaints: recentComplaints.map(mapComplaintItem),
  };
}

export async function searchAdminDashboard(query: string): Promise<AdminSearchResult> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return {
      query: normalizedQuery,
      counts: {
        complaints: 0,
        users: 0,
        officers: 0,
        departments: 0,
      },
      complaints: [],
      users: [],
      officers: [],
      departments: [],
    };
  }

  const [complaints, users, officers, complaintDepartments, officerDepartments] = await Promise.all([
    prisma.complaint.findMany({
      where: {
        OR: [
          { grievanceId: { contains: normalizedQuery, mode: "insensitive" } },
          { title: { contains: normalizedQuery, mode: "insensitive" } },
          { reporterName: { contains: normalizedQuery, mode: "insensitive" } },
          { department: { contains: normalizedQuery, mode: "insensitive" } },
          { district: { contains: normalizedQuery, mode: "insensitive" } },
          { city: { contains: normalizedQuery, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        grievanceId: true,
        reporterName: true,
        title: true,
        department: true,
        district: true,
        city: true,
        status: true,
        priority: true,
        assignedOfficerName: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: normalizedQuery, mode: "insensitive" } },
          { email: { contains: normalizedQuery, mode: "insensitive" } },
          { mobile: { contains: normalizedQuery, mode: "insensitive" } },
          { username: { contains: normalizedQuery, mode: "insensitive" } },
          { district: { contains: normalizedQuery, mode: "insensitive" } },
          { state: { contains: normalizedQuery, mode: "insensitive" } },
          { department: { contains: normalizedQuery, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: adminUserSelect,
    }),
    prisma.user.findMany({
      where: {
        role: Role.officer,
        OR: [
          { fullName: { contains: normalizedQuery, mode: "insensitive" } },
          { email: { contains: normalizedQuery, mode: "insensitive" } },
          { mobile: { contains: normalizedQuery, mode: "insensitive" } },
          { username: { contains: normalizedQuery, mode: "insensitive" } },
          { department: { contains: normalizedQuery, mode: "insensitive" } },
          { jurisdictionArea: { contains: normalizedQuery, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: officerSummarySelect,
    }),
    prisma.complaint.groupBy({
      by: ["department"],
      where: { department: { contains: normalizedQuery, mode: "insensitive" } },
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["department"],
      where: {
        role: Role.officer,
        department: { contains: normalizedQuery, mode: "insensitive" },
      },
      _count: { _all: true },
    }),
  ]);

  const departments = new Map<string, { name: string; complaintCount: number; officerCount: number }>();

  complaintDepartments.forEach((department) => {
    const name = toDepartmentName(department.department);
    departments.set(name, {
      name,
      complaintCount: department._count._all,
      officerCount: 0,
    });
  });

  officerDepartments.forEach((department) => {
    const name = toDepartmentName(department.department);
    const current = departments.get(name) ?? { name, complaintCount: 0, officerCount: 0 };
    current.officerCount = department._count._all;
    departments.set(name, current);
  });

  return {
    query: normalizedQuery,
    counts: {
      complaints: complaints.length,
      users: users.length,
      officers: officers.length,
      departments: departments.size,
    },
    complaints: complaints.map(mapComplaintItem),
    users: users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      state: user.state,
      district: user.district,
      department: user.department,
      role: String(user.role),
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
    })),
    officers: officers.map((officer) => ({
      id: officer.id,
      fullName: officer.fullName,
      username: officer.username,
      email: officer.email,
      mobile: officer.mobile,
      department: officer.department,
      jurisdictionArea: officer.jurisdictionArea,
      officerCode: officer.officerCode,
      role: String(officer.role),
      isVerified: officer.isVerified,
      emailVerified: officer.emailVerified,
      createdAt: officer.createdAt.toISOString(),
      updatedAt: officer.updatedAt.toISOString(),
    })),
    departments: Array.from(departments.values()).sort((left, right) => right.complaintCount - left.complaintCount),
  };
}