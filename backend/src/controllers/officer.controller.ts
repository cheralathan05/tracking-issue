import type { Request, Response } from "express";

import {
  acceptOfficerInvitation,
  createOfficerInvitation,
  getOfficerInvitationByToken,
  listOfficers,
  regenerateOfficerInvitationLink,
  resendOfficerInvitation,
} from "../services/officer.service.js";

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
