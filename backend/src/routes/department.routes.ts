import { Router } from "express";

import { listDepartments } from "../controllers/admin-complaint.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

export const departmentRouter = Router();

departmentRouter.get(
  "/",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin", "officer"),
  listDepartments,
);
