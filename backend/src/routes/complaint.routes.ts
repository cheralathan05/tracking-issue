import { Router } from "express";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  complaintAssignmentSchema,
  complaintMessageSchema,
  complaintStatusUpdateSchema,
  complaintSubmissionSchema,
} from "../utils/validators.js";
import {
  assignComplaintToOfficer,
  getComplaint,
  getComplaintDashboard,
  getComplaintMessages,
  getComplaints,
  postComplaintMessage,
  submitComplaint,
  updateComplaintProgress,
} from "../controllers/complaint.controller.js";

export const complaintRouter = Router();

complaintRouter.post("/", requireAuth, validateBody(complaintSubmissionSchema), submitComplaint);
complaintRouter.get("/summary", requireAuth, getComplaintDashboard);
complaintRouter.get("/", requireAuth, getComplaints);
complaintRouter.get("/:id", requireAuth, getComplaint);
complaintRouter.get("/:id/messages", requireAuth, getComplaintMessages);
complaintRouter.post("/:id/messages", requireAuth, validateBody(complaintMessageSchema), postComplaintMessage);
complaintRouter.patch(
  "/:id/assign",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  validateBody(complaintAssignmentSchema),
  assignComplaintToOfficer,
);
complaintRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin", "officer"),
  validateBody(complaintStatusUpdateSchema),
  updateComplaintProgress,
);
