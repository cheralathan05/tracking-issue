import type { Prisma } from "@prisma/client";

import { prisma } from "../config/prisma.js";

const unresolvedStatuses = ["Submitted", "Under Review", "Assigned", "In Progress", "Awaiting Information", "Escalated", "Rejected"];

export type AdminComplaintQuery = {
  status?: string;
  q?: string;
  department?: string;
  officerId?: string;
  priority?: string;
  escalated?: boolean;
  limit: number;
  offset: number;
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function buildWhere(query: AdminComplaintQuery): Prisma.ComplaintWhereInput {
  const where: Prisma.ComplaintWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.department) {
    where.department = query.department;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.officerId) {
    where.assignedOfficerId = query.officerId;
  }

  if (query.escalated === true) {
    where.OR = [
      { status: "Escalated" },
      { escalation: { isNot: null } },
    ];
  }

  if (query.q) {
    const search = query.q.trim();
    if (search) {
      const searchWhere: Prisma.ComplaintWhereInput = {
        OR: [
          { grievanceId: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { reporterName: { contains: search, mode: "insensitive" } },
          { department: { contains: search, mode: "insensitive" } },
          { district: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { assignedOfficerName: { contains: search, mode: "insensitive" } },
        ],
      };

      if (where.AND) {
        where.AND = Array.isArray(where.AND) ? [...where.AND, searchWhere] : [where.AND, searchWhere];
      } else {
        where.AND = [searchWhere];
      }
    }
  }

  return where;
}

function toCsvRow(values: Array<string | number | boolean | null>) {
  return values
    .map((value) => {
      if (value === null || typeof value === "undefined") {
        return "";
      }

      const str = String(value);
      return `"${str.replace(/"/g, '""')}"`;
    })
    .join(",");
}

export async function getAdminComplaints(query: AdminComplaintQuery) {
  const where = buildWhere(query);

  const [total, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: query.offset,
      take: query.limit,
      include: {
        assignedOfficer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            department: true,
            jurisdictionArea: true,
          },
        },
        escalation: {
          select: {
            level: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  return {
    complaintCount: total,
    complaints: complaints.map((complaint) => ({
      ...complaint,
      createdAt: complaint.createdAt.toISOString(),
      updatedAt: complaint.updatedAt.toISOString(),
      slaDeadline: toIso(complaint.slaDeadline),
      escalatedAt: toIso(complaint.escalation?.createdAt),
      evidence: complaint.evidence ?? [],
      timeline: complaint.timeline ?? [],
      resolutionEvidence: complaint.resolutionEvidence ?? [],
    })),
  };
}

export async function getAdminComplaintStats() {
  const now = new Date();

  const [
    total,
    submitted,
    underReview,
    assigned,
    inProgress,
    resolved,
    escalated,
    closed,
    rejected,
    awaitingInformation,
    slaBreached,
    departmentGroups,
    officerGroups,
  ] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: "Submitted" } }),
    prisma.complaint.count({ where: { status: "Under Review" } }),
    prisma.complaint.count({ where: { status: "Assigned" } }),
    prisma.complaint.count({ where: { status: "In Progress" } }),
    prisma.complaint.count({ where: { status: "Resolved" } }),
    prisma.complaint.count({ where: { status: "Escalated" } }),
    prisma.complaint.count({ where: { status: "Closed" } }),
    prisma.complaint.count({ where: { status: "Rejected" } }),
    prisma.complaint.count({ where: { status: "Awaiting Information" } }),
    prisma.complaint.count({
      where: {
        slaDeadline: { lt: now },
        status: { in: unresolvedStatuses },
      },
    }),
    prisma.complaint.groupBy({
      by: ["department"],
      _count: { _all: true },
    }),
    prisma.complaint.groupBy({
      by: ["assignedOfficerId", "assignedOfficerName"],
      where: { assignedOfficerId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  return {
    total,
    statusCounts: {
      submitted,
      underReview,
      assigned,
      inProgress,
      awaitingInformation,
      resolved,
      escalated,
      rejected,
      closed,
    },
    pending: submitted + underReview + assigned + inProgress + awaitingInformation + escalated,
    slaBreached,
    departmentWorkload: departmentGroups
      .map((item) => ({
        department: item.department || "Unassigned",
        count: item._count._all,
      }))
      .sort((left, right) => right.count - left.count),
    officerWorkload: officerGroups
      .map((item) => ({
        officerId: item.assignedOfficerId,
        officerName: item.assignedOfficerName || "Unassigned",
        count: item._count._all,
      }))
      .sort((left, right) => right.count - left.count),
  };
}

export async function searchAdminComplaints(query: Omit<AdminComplaintQuery, "q"> & { q: string }) {
  const result = await getAdminComplaints({
    ...query,
    q: query.q,
  });

  return {
    query: query.q,
    ...result,
  };
}

export async function getAdminComplaintExportCsv(query: AdminComplaintQuery) {
  const where = buildWhere(query);
  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      escalation: {
        select: {
          level: true,
          status: true,
        },
      },
    },
  });

  const rows = [
    toCsvRow([
      "Complaint ID",
      "Title",
      "Citizen",
      "Department",
      "Priority",
      "Status",
      "Assigned Officer",
      "State",
      "District",
      "City",
      "Created At",
      "Updated At",
      "SLA Deadline",
      "Escalated",
      "Escalation Level",
    ]),
    ...complaints.map((complaint) =>
      toCsvRow([
        complaint.grievanceId,
        complaint.title,
        complaint.reporterName,
        complaint.department,
        complaint.priority,
        complaint.status,
        complaint.assignedOfficerName,
        complaint.state,
        complaint.district,
        complaint.city,
        complaint.createdAt.toISOString(),
        complaint.updatedAt.toISOString(),
        toIso(complaint.slaDeadline),
        complaint.status === "Escalated" || Boolean(complaint.escalation),
        complaint.escalation?.level ?? "",
      ]),
    ),
  ];

  return rows.join("\n");
}

export async function getDepartmentDirectory() {
  const [complaintDepartments, officerDepartments] = await Promise.all([
    prisma.complaint.groupBy({
      by: ["department"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["department"],
      where: {
        role: "officer",
        department: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  const departmentMap = new Map<string, { name: string; complaintCount: number; officerCount: number }>();

  complaintDepartments.forEach((item) => {
    const name = item.department?.trim() || "Unassigned";
    departmentMap.set(name, {
      name,
      complaintCount: item._count._all,
      officerCount: 0,
    });
  });

  officerDepartments.forEach((item) => {
    const name = item.department?.trim() || "Unassigned";
    const current = departmentMap.get(name) ?? { name, complaintCount: 0, officerCount: 0 };
    current.officerCount = item._count._all;
    departmentMap.set(name, current);
  });

  return {
    departments: Array.from(departmentMap.values()).sort((left, right) => right.complaintCount - left.complaintCount),
  };
}
