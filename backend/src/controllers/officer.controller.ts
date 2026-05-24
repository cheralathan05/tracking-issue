import type { Request, Response } from "express";

import {
  acceptOfficerInvitation,
  createOfficerInvitation,
  getOfficerInvitationByToken,
  listOfficers,
  listOfficerInvitations,
  regenerateOfficerInvitationLink,
  resendOfficerInvitation,
} from "../services/officer.service.js";
import {
  escalateFromOfficer,
  getAssignedQueue,
  getEmergencyQueue,
  getNavigationPlan,
  getOfficerKnowledgeBase,
  getOfficerMissionDashboard,
  getOfficerPerformance,
  getOfficerReports,
  getShiftStatus,
  startInspection,
  submitResolution,
  updateFieldGps,
  updateShiftStatus,
} from "../services/officer-ops.service.js";

function toViewer(req: Request) {
  return {
    id: req.user!.id,
    role: String(req.user!.role),
    fullName: req.user!.fullName,
  };
}

export async function inviteOfficer(req: Request, res: Response) {
  const result = await createOfficerInvitation(req.body, req.user?.id, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
    origin: req.get("origin") ?? undefined,
  });

  res.status(201).json({ success: true, message: result.message, data: result });
}

export async function fetchOfficerInvitation(req: Request, res: Response) {
  const tokenRaw = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
  const token = typeof tokenRaw === "string" ? tokenRaw : "";
  const result = await getOfficerInvitationByToken(token, req.get("origin") ?? undefined);
  res.status(200).json({ success: true, message: "Invitation fetched successfully", data: result });
}

export async function acceptInvitation(req: Request, res: Response) {
  const tokenRaw = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
  const token = typeof tokenRaw === "string" ? tokenRaw : "";
  const result = await acceptOfficerInvitation(token, req.body, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  res.status(200).json({ success: true, message: result.message, data: result });
}

export async function getAllOfficers(_req: Request, res: Response) {
  const result = await listOfficers();
  res.status(200).json({ success: true, message: "Officers fetched successfully", data: result });
}

export async function listInvitations(_req: Request, res: Response) {
  const result = await listOfficerInvitations();
  res.status(200).json({ success: true, message: "Invitations fetched successfully", data: result });
}

export async function regenerateInvitationLink(req: Request, res: Response) {
  const code = Array.isArray(req.params.code) ? req.params.code[0] ?? "" : req.params.code;
  const result = await regenerateOfficerInvitationLink(code, req.get("origin") ?? undefined);
  res.status(200).json({ success: true, message: result.message, data: result });
}

export async function resendInvitation(req: Request, res: Response) {
  const code = Array.isArray(req.params.code) ? req.params.code[0] ?? "" : req.params.code;
  const result = await resendOfficerInvitation(code, req.get("origin") ?? undefined);
  res.status(200).json({ success: true, message: result.message, data: result });
}

export async function getOpsDashboard(req: Request, res: Response) {
  const result = await getOfficerMissionDashboard(toViewer(req));
  res.status(200).json({ success: true, message: "Officer dashboard fetched", data: result });
}

export async function getOpsQueue(req: Request, res: Response) {
  const sortByRaw = Array.isArray(req.query.sortBy) ? req.query.sortBy[0] : req.query.sortBy;
  const latitudeRaw = Array.isArray(req.query.latitude) ? req.query.latitude[0] : req.query.latitude;
  const longitudeRaw = Array.isArray(req.query.longitude) ? req.query.longitude[0] : req.query.longitude;

  const latitude = typeof latitudeRaw === "string" ? Number(latitudeRaw) : undefined;
  const longitude = typeof longitudeRaw === "string" ? Number(longitudeRaw) : undefined;

  const result = await getAssignedQueue(toViewer(req), {
    sortBy: typeof sortByRaw === "string" ? (sortByRaw as "nearest" | "priority" | "oldest" | "sla" | "emergency") : undefined,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  });

  res.status(200).json({ success: true, message: "Officer queue fetched", data: result });
}

export async function getOpsEmergencyQueue(req: Request, res: Response) {
  const result = await getEmergencyQueue(toViewer(req));
  res.status(200).json({ success: true, message: "Emergency queue fetched", data: result });
}

export async function postInspectionStart(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const result = await startInspection(id, toViewer(req), req.body);
  res.status(200).json({ success: true, message: result.message, data: result });
}

export async function postGpsUpdate(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const result = await updateFieldGps(id, toViewer(req), req.body);
  res.status(200).json({ success: true, message: result.message, data: result });
}

export async function getNavigation(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const latitudeRaw = Array.isArray(req.query.latitude) ? req.query.latitude[0] : req.query.latitude;
  const longitudeRaw = Array.isArray(req.query.longitude) ? req.query.longitude[0] : req.query.longitude;

  const latitude = typeof latitudeRaw === "string" ? Number(latitudeRaw) : NaN;
  const longitude = typeof longitudeRaw === "string" ? Number(longitudeRaw) : NaN;

  const result = await getNavigationPlan(id, toViewer(req), {
    latitude,
    longitude,
  });

  res.status(200).json({ success: true, message: "Navigation plan generated", data: result });
}

export async function postEscalation(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const result = await escalateFromOfficer(id, toViewer(req), req.body);
  res.status(201).json({ success: true, message: result.message, data: result });
}

export async function postResolution(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const result = await submitResolution(id, toViewer(req), req.body);
  res.status(200).json({ success: true, message: result.message, data: result });
}

export async function getOpsShift(req: Request, res: Response) {
  const result = await getShiftStatus(toViewer(req));
  res.status(200).json({ success: true, message: "Shift status fetched", data: result });
}

export async function postOpsShift(req: Request, res: Response) {
  const statusRaw = req.body?.status as string;
  const noteRaw = req.body?.note as string | undefined;
  const result = await updateShiftStatus(
    toViewer(req),
    statusRaw as "Online" | "On duty" | "In field" | "Break" | "Offline",
    noteRaw,
  );

  res.status(200).json({ success: true, message: result.message, data: result });
}

export async function getOpsPerformance(req: Request, res: Response) {
  const result = await getOfficerPerformance(toViewer(req));
  res.status(200).json({ success: true, message: "Performance fetched", data: result });
}

export async function getOpsReports(req: Request, res: Response) {
  const result = await getOfficerReports(toViewer(req));
  res.status(200).json({ success: true, message: "Reports fetched", data: result });
}

export async function getOpsKnowledgeBase(_req: Request, res: Response) {
  const result = await getOfficerKnowledgeBase();
  res.status(200).json({ success: true, message: "Knowledge base fetched", data: result });
}
