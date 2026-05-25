import type { Request, Response } from "express";

import {
  getAdminComplaintExportCsv,
  getAdminComplaints,
  getAdminComplaintStats,
  getDepartmentDirectory,
  searchAdminComplaints,
  type AdminComplaintQuery,
} from "../services/admin-complaint.service.js";

function normalizeQuery(req: Request): AdminComplaintQuery {
  const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const offsetRaw = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
  const statusRaw = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
  const qRaw = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const departmentRaw = Array.isArray(req.query.department) ? req.query.department[0] : req.query.department;
  const officerIdRaw = Array.isArray(req.query.officerId) ? req.query.officerId[0] : req.query.officerId;
  const priorityRaw = Array.isArray(req.query.priority) ? req.query.priority[0] : req.query.priority;
  const escalatedRaw = Array.isArray(req.query.escalated) ? req.query.escalated[0] : req.query.escalated;

  const parsedLimit = typeof limitRaw === "string" ? Number(limitRaw) : undefined;
  const parsedOffset = typeof offsetRaw === "string" ? Number(offsetRaw) : undefined;

  return {
    status: typeof statusRaw === "string" && statusRaw.trim() ? statusRaw.trim() : undefined,
    q: typeof qRaw === "string" && qRaw.trim() ? qRaw.trim() : undefined,
    department: typeof departmentRaw === "string" && departmentRaw.trim() ? departmentRaw.trim() : undefined,
    officerId: typeof officerIdRaw === "string" && officerIdRaw.trim() ? officerIdRaw.trim() : undefined,
    priority: typeof priorityRaw === "string" && priorityRaw.trim() ? priorityRaw.trim() : undefined,
    escalated: typeof escalatedRaw === "string" ? escalatedRaw === "true" : undefined,
    limit: Number.isFinite(parsedLimit) ? Math.min(Math.max(1, parsedLimit as number), 500) : 200,
    offset: Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset as number) : 0,
  };
}

export async function listAdminComplaints(req: Request, res: Response) {
  const result = await getAdminComplaints(normalizeQuery(req));

  res.status(200).json({
    success: true,
    message: "Admin complaints fetched successfully",
    data: result,
  });
}

export async function listAdminComplaintStats(_req: Request, res: Response) {
  const result = await getAdminComplaintStats();

  res.status(200).json({
    success: true,
    message: "Admin complaint stats fetched successfully",
    data: result,
  });
}

export async function queryAdminComplaints(req: Request, res: Response) {
  const query = normalizeQuery(req);
  const q = query.q ?? "";
  const result = await searchAdminComplaints({
    ...query,
    q,
  });

  res.status(200).json({
    success: true,
    message: "Admin complaint search completed successfully",
    data: result,
  });
}

export async function exportAdminComplaints(req: Request, res: Response) {
  const csv = await getAdminComplaintExportCsv(normalizeQuery(req));
  const stamp = new Date().toISOString().slice(0, 10);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=admin-complaints-${stamp}.csv`);
  res.status(200).send(csv);
}

export async function listDepartments(_req: Request, res: Response) {
  const result = await getDepartmentDirectory();

  res.status(200).json({
    success: true,
    message: "Departments fetched successfully",
    data: result,
  });
}
