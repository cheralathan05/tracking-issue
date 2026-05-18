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
} from "../controllers/officer.controller.js";

export const officerRouter = Router();

officerRouter.get("/", requireAuth, requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"), getAllOfficers);
officerRouter.post(
  "/invitations",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  validateBody(officerInvitationSchema),
  inviteOfficer,
);
officerRouter.get("/invitations/:code", fetchOfficerInvitation);
officerRouter.post("/invitations/:code/accept", validateBody(acceptOfficerInvitationSchema), acceptInvitation);
