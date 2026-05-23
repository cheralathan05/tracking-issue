import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  submitFeedback,
  getFeedback,
  listFeedback,
  getCitizenSatisfactionAnalytics,
  getOfficerPerformance,
} from "../services/feedback.service.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { z } from "zod";

export const feedbackRouter = Router();

// Validation schema
const feedbackSubmitSchema = z.object({
  complaintId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  officerRating: z.number().int().min(1).max(5).optional(),
  overallSatisfaction: z.boolean().optional(),
  suggestedImprovements: z.string().max(500).optional(),
});

// Submit feedback
feedbackRouter.post(
  "/",
  requireAuth,
  validateBody(feedbackSubmitSchema),
  async (req, res, next) => {
    try {
      const result = await submitFeedback({
        ...req.body,
        submittedBy: req.user!.id,
      });
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// Get feedback for a complaint
feedbackRouter.get("/complaint/:complaintId", requireAuth, async (req, res, next) => {
  try {
    const rawId = req.params.complaintId;
    const complaintId = Array.isArray(rawId) ? rawId[0] : rawId;
    const result = await getFeedback(String(complaintId));
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// List all feedback with filters
feedbackRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const filters = {
      officerId: req.query.officerId as string | undefined,
      rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
      month: req.query.month as string | undefined,
    };
    const result = await listFeedback(filters);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Get citizen satisfaction analytics
feedbackRouter.get("/analytics/satisfaction", requireAuth, async (req, res, next) => {
  try {
    // Only admins can view system-wide analytics
    if (!["admin", "super_admin", "state_admin", "district_officer"].includes(String(req.user!.role))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const result = await getCitizenSatisfactionAnalytics();
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Get officer performance metrics
feedbackRouter.get("/officer/:officerId/performance", requireAuth, async (req, res, next) => {
  try {
    const rawId = req.params.officerId;
    const officerId = Array.isArray(rawId) ? rawId[0] : rawId;
    const result = await getOfficerPerformance(String(officerId));
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});
