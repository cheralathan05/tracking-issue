import type { Request, Response } from "express";

import { complaintQuerySchema } from "../utils/validators.js";
import {
  assignComplaint,
  addComplaintMessage,
  createComplaint,
  getComplaintDetails,
  getComplaintMessages as fetchComplaintMessages,
  getComplaintSummary,
  listComplaints,
  updateComplaintStatus,
} from "../services/complaint.service.js";

export async function submitComplaint(req: Request, res: Response) {
  const result = await createComplaint(req.body, req.user?.id, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  res.status(201).json({ success: true, message: result.message, data: result });
}

export async function getComplaints(req: Request, res: Response) {
  const query = complaintQuerySchema.parse(req.query);
  const result = await listComplaints(query, { id: req.user!.id, role: String(req.user!.role) });

  res.status(200).json({ success: true, message: "Complaints fetched successfully", data: result });
}

export async function getComplaint(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const result = await getComplaintDetails(id, {
    id: req.user!.id,
    role: String(req.user!.role),
  });
  res.status(200).json({ success: true, message: "Complaint fetched successfully", data: result });
}

export async function getComplaintMessages(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const result = await fetchComplaintMessages(id, {
    id: req.user!.id,
    role: String(req.user!.role),
  });

  res.status(200).json({ success: true, message: "Complaint messages fetched successfully", data: result });
}

export async function postComplaintMessage(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const result = await addComplaintMessage(
    id,
    req.body,
    {
      id: req.user!.id,
      fullName: req.user!.fullName,
      role: String(req.user!.role),
    },
  );

  res.status(201).json({ success: true, message: result.message, data: result });
}

export async function assignComplaintToOfficer(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const result = await assignComplaint(
    id,
    req.body,
    {
      id: req.user!.id,
      fullName: req.user!.fullName,
      role: String(req.user!.role),
    },
  );

  res.status(200).json({ success: true, message: result.message, data: result });
}

export async function updateComplaintProgress(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const result = await updateComplaintStatus(
    id,
    req.body,
    {
      id: req.user!.id,
      fullName: req.user!.fullName,
      role: String(req.user!.role),
    },
  );

  res.status(200).json({ success: true, message: result.message, data: result });
}

export async function getComplaintDashboard(req: Request, res: Response) {
  const result = await getComplaintSummary({
    id: req.user!.id,
    role: String(req.user!.role),
  });
  res.status(200).json({ success: true, message: "Complaint summary fetched successfully", data: result });
}
