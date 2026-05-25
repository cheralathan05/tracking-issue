import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createEscalation,
  listEscalations,
  getEscalationDetails,
  getEscalationDashboard,
  updateEscalation,
} from "../services/escalation.service.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { z } from "zod";

export const escalationRouter = Router();

// Validation schemas
const escalationCreateSchema = z.object({
  complaintId: z.string().min(1),
  reason: z.string().min(10).max(500),
  level: z.enum(["low", "medium", "high", "emergency"]).optional(),
});

const escalationUpdateSchema = z.object({
  status: z.enum(["active", "resolved", "closed"]).optional(),
  resolvedBy: z.string().optional(),
  resolutionNote: z.string().max(1000).optional(),
});

// Create escalation
escalationRouter.post(
  "/",
  requireAuth,
  validateBody(escalationCreateSchema),
  async (req, res, next) => {
    try {
      const result = await createEscalation({
        ...req.body,
        escalatedBy: req.user!.id,
      });
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// List escalations
escalationRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      level: req.query.level as string | undefined,
      complaintId: req.query.complaintId as string | undefined,
    };
    const result = await listEscalations(
      { id: req.user!.id, role: String(req.user!.role) },
      filters
    );
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Dashboard summary
escalationRouter.get("/dashboard", requireAuth, async (req, res, next) => {
  try {
    const result = await getEscalationDashboard();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Get escalation details
escalationRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const result = await getEscalationDetails(String(id), {
      id: req.user!.id,
      role: String(req.user!.role),
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Update escalation
escalationRouter.patch(
  "/:id",
  requireAuth,
  validateBody(escalationUpdateSchema),
  async (req, res, next) => {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const result = await updateEscalation(String(id), req.body, {
        id: req.user!.id,
        role: String(req.user!.role),
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);
