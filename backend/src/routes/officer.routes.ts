import { Router } from "express";

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
  inviteOfficer,
  listInvitations,
  regenerateInvitationLink,
  resendInvitation,
} from "../controllers/officer.controller.js";

export const officerRouter = Router();

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
