import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  acceptOfficerInvitationSchema,
  officerInvitationSchema,
} from "../utils/validators.js";
import {
  acceptInvitation,
  fetchOfficerInvitation,
  getAllOfficers,
  getNavigation,
  getOpsDashboard,
  getOpsEmergencyQueue,
  getOpsKnowledgeBase,
  getOpsPerformance,
  getOpsQueue,
  getOpsReports,
  getOpsShift,
  inviteOfficer,
  listInvitations,
  postEscalation,
  postGpsUpdate,
  postInspectionStart,
  postOpsShift,
  postResolution,
  regenerateInvitationLink,
  resendInvitation,
} from "../controllers/officer.controller.js";

export const officerRouter = Router();

const opsShiftSchema = z.object({
  status: z.enum(["Online", "On duty", "In field", "Break", "Offline"]),
  note: z.string().trim().max(500).optional(),
});

const opsInspectionSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  note: z.string().trim().max(400).optional(),
});

const opsGpsSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  etaMinutes: z.number().int().positive().max(720).optional(),
  note: z.string().trim().max(400).optional(),
});

const opsEscalateSchema = z.object({
  reason: z.string().trim().min(5).max(800),
  level: z.enum(["low", "medium", "high", "emergency"]).optional(),
});

const opsResolveSchema = z.object({
  resolutionSummary: z.string().trim().min(10).max(2000),
  citizenConfirmation: z.boolean().default(false),
  completionTimestamp: z.string().datetime().optional(),
  beforeAfterPhotos: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        size: z.number().nonnegative(),
        dataUrl: z.string().min(1),
      }),
    )
    .max(10)
    .optional(),
});

officerRouter.get("/", requireAuth, requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"), getAllOfficers);
officerRouter.get(
  "/invitations",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  listInvitations,
);
officerRouter.post(
  "/invitations",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  validateBody(officerInvitationSchema),
  inviteOfficer,
);
officerRouter.get("/invitations/resolve", fetchOfficerInvitation);
officerRouter.post("/invitations/accept", validateBody(acceptOfficerInvitationSchema), acceptInvitation);
officerRouter.post(
  "/invitations/:code/regenerate",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  regenerateInvitationLink,
);
officerRouter.post(
  "/invitations/:code/resend",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  resendInvitation,
);

officerRouter.get(
  "/ops/dashboard",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getOpsDashboard,
);
officerRouter.get(
  "/ops/queue",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getOpsQueue,
);
officerRouter.get(
  "/ops/emergency",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getOpsEmergencyQueue,
);
officerRouter.get(
  "/ops/shift",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getOpsShift,
);
officerRouter.post(
  "/ops/shift",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  validateBody(opsShiftSchema),
  postOpsShift,
);
officerRouter.get(
  "/ops/performance",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getOpsPerformance,
);
officerRouter.get(
  "/ops/reports",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getOpsReports,
);
officerRouter.get(
  "/ops/knowledge-base",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getOpsKnowledgeBase,
);
officerRouter.post(
  "/ops/:id/inspection/start",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  validateBody(opsInspectionSchema),
  postInspectionStart,
);
officerRouter.post(
  "/ops/:id/gps",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  validateBody(opsGpsSchema),
  postGpsUpdate,
);
officerRouter.get(
  "/ops/:id/navigation",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getNavigation,
);
officerRouter.post(
  "/ops/:id/escalate",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  validateBody(opsEscalateSchema),
  postEscalation,
);
officerRouter.post(
  "/ops/:id/resolve",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  validateBody(opsResolveSchema),
  postResolution,
);
