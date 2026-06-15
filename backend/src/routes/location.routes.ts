import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  updateLocation,
  getCurrentLocation,
  getHistory,
  deactivateLocation,
  getActiveLocations,
  getComplaintLocations,
} from "../controllers/location.controller.js";

export const locationRouter = Router();

const locationUpdateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  etaMinutes: z.number().int().min(0).max(720).optional(),
  accuracy: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
});

// Officer updates their location for a complaint
locationRouter.post(
  "/:complaintId/update",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer"),
  validateBody(locationUpdateSchema),
  updateLocation,
);

// Get current officer location for a complaint (citizen/admin can view)
locationRouter.get(
  "/:complaintId/current",
  requireAuth,
  getCurrentLocation,
);

// Get location history for a complaint
locationRouter.get(
  "/:complaintId/history",
  requireAuth,
  getHistory,
);

// Officer deactivates tracking
locationRouter.post(
  "/:complaintId/deactivate",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer"),
  deactivateLocation,
);

// Get all active locations for current officer
locationRouter.get(
  "/officer/active",
  requireAuth,
  requireRole("officer", "super_admin", "state_admin", "district_officer", "department_officer"),
  getActiveLocations,
);

// Get all active officer locations for a complaint (admin/citizen monitoring)
locationRouter.get(
  "/:complaintId/officers",
  requireAuth,
  getComplaintLocations,
);
