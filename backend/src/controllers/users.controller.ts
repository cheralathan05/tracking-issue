import type { Request, Response } from "express";

import { listUsersForAdmin, updateUserByAdmin } from "../services/users.service.js";
import { adminUserQuerySchema } from "../utils/validators.js";

export async function getAdminUsers(req: Request, res: Response) {
  const query = adminUserQuerySchema.parse(req.query);
  const result = await listUsersForAdmin(query);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
}

export async function patchAdminUser(req: Request, res: Response) {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] ?? "" : req.params.id;
  const result = await updateUserByAdmin(userId, req.body, {
    id: req.user!.id,
    role: String(req.user!.role),
  });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: result,
  });
}
