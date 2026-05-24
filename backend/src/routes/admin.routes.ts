import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  getAdminGovvernanceDashboard,
  getAdminSLAStatistics,
  getAdminEscalationStatistics,
  getAdminComplaintsByDepartment,
} from "../controllers/admin.controller.js";

export const adminRouter = Router();

// Governance dashboard - aggregated view
adminRouter.get(
  "/governance/dashboard",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getAdminGovvernanceDashboard,
);

// SLA statistics and monitoring
adminRouter.get(
  "/governance/sla-stats",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getAdminSLAStatistics,
);

// Escalation statistics and monitoring
adminRouter.get(
  "/governance/escalation-stats",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getAdminEscalationStatistics,
);

// Department-wise complaint analysis
adminRouter.get(
  "/governance/complaints-by-department",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getAdminComplaintsByDepartment,
);
