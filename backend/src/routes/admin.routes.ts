import { Router } from "express";

import { getDashboard, searchDashboard } from "../controllers/admin.controller.js";
import {
  exportAdminComplaints,
  listAdminComplaints,
  listAdminComplaintStats,
  queryAdminComplaints,
} from "../controllers/admin-complaint.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

export const adminRouter = Router();

adminRouter.use(
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin", "officer"),
);

adminRouter.get("/dashboard", getDashboard);
adminRouter.get("/search", searchDashboard);
adminRouter.get("/complaints", listAdminComplaints);
adminRouter.get("/complaints/stats", listAdminComplaintStats);
adminRouter.get("/complaints/search", queryAdminComplaints);
adminRouter.get("/complaints/export", exportAdminComplaints);