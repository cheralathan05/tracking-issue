import type { Request, Response } from "express";

import { getAdminDashboard, searchAdminDashboard } from "../services/admin-dashboard.service.js";

export async function getDashboard(_req: Request, res: Response) {
  const result = await getAdminDashboard();

  res.status(200).json({
    success: true,
    message: "Admin dashboard fetched successfully",
    data: result,
  });
}

export async function searchDashboard(req: Request, res: Response) {
  const queryRaw = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const query = typeof queryRaw === "string" ? queryRaw : "";
  const result = await searchAdminDashboard(query);

  res.status(200).json({
    success: true,
    message: "Admin search completed successfully",
    data: result,
  });
}