import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
import { createNotification } from "./notification.service.js";

export interface FeedbackCreateInput {
  complaintId: string;
  rating: number; // 1-5
  comment?: string;
  officerRating?: number; // 1-5
  overallSatisfaction?: boolean;
  suggestedImprovements?: string;
  submittedBy: string;
}

/**
 * Submit feedback for a complaint
 */
export async function submitFeedback(input: FeedbackCreateInput) {
  // Validate complaint exists and is resolved
  const complaint = await prisma.complaint.findUnique({
    where: { id: input.complaintId },
    include: { assignedOfficer: true, feedback: true },
  });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (complaint.status !== "Resolved") {
    throw new AppError("Can only submit feedback for resolved complaints", 400);
  }

  if (complaint.feedback) {
    throw new AppError("Feedback already submitted for this complaint", 400);
  }

  // Validate rating
  if (input.rating < 1 || input.rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  if (input.officerRating && (input.officerRating < 1 || input.officerRating > 5)) {
    throw new AppError("Officer rating must be between 1 and 5", 400);
  }

  const feedback = await prisma.feedback.create({
    data: {
      complaintId: input.complaintId,
      rating: input.rating,
      comment: input.comment || null,
      officerRating: input.officerRating || null,
      overallSatisfaction: input.overallSatisfaction !== false,
      suggestedImprovements: input.suggestedImprovements || null,
      submittedBy: input.submittedBy,
    },
    include: {
      complaint: true,
      submittedByUser: { select: { id: true, fullName: true, email: true } },
    },
  });

  // Notify assigned officer
  if (complaint.assignedOfficerId) {
    const message =
      input.rating >= 4
        ? `Great! You received positive feedback for complaint ${complaint.grievanceId}.`
        : input.rating >= 2
          ? `You received feedback for complaint ${complaint.grievanceId}. Rating: ${input.rating}/5`
          : `You received negative feedback for complaint ${complaint.grievanceId}. Please review the feedback.`;

    await createNotification(complaint.assignedOfficerId, {
      title: "Feedback Received",
      message,
      type: "info",
      priority: input.rating < 2 ? "high" : "medium",
      actionUrl: `/officer/complaints/${input.complaintId}`,
    });
  }

  return {
    message: "Feedback submitted successfully",
    feedback: {
      ...feedback,
      createdAt: feedback.createdAt.toISOString(),
      updatedAt: feedback.updatedAt.toISOString(),
    },
  };
}

/**
 * Get feedback for a complaint
 */
export async function getFeedback(complaintId: string) {
  const feedback = await prisma.feedback.findUnique({
    where: { complaintId },
    include: {
      complaint: true,
      submittedByUser: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }

  return {
    feedback: {
      ...feedback,
      createdAt: feedback.createdAt.toISOString(),
      updatedAt: feedback.updatedAt.toISOString(),
    },
  };
}

/**
 * Get all feedback with analytics
 */
export async function listFeedback(filters?: { officerId?: string; rating?: number; month?: string }) {
  const where: any = {};

  if (filters?.officerId) {
    where.complaint = {
      assignedOfficerId: filters.officerId,
    };
  }

  if (filters?.rating) {
    where.rating = filters.rating;
  }

  const feedbackRecords = await prisma.feedback.findMany({
    where,
    include: {
      complaint: { include: { assignedOfficer: true } },
      submittedByUser: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    total: feedbackRecords.length,
    feedback: feedbackRecords.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })),
  };
}

/**
 * Get analytics for citizen satisfaction
 */
export async function getCitizenSatisfactionAnalytics() {
  const feedbackRecords = await prisma.feedback.findMany({
    include: { complaint: { include: { assignedOfficer: true } } },
  });

  const stats = {
    totalFeedback: feedbackRecords.length,
    averageRating: 0,
    averageOfficerRating: 0,
    satisfactionRate: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    officerStats: {} as Record<string, { name: string; rating: number; count: number }>,
  };

  if (feedbackRecords.length > 0) {
    stats.averageRating = feedbackRecords.reduce((sum, f) => sum + f.rating, 0) / feedbackRecords.length;

    const officerRatings = feedbackRecords.filter((f) => f.officerRating);
    if (officerRatings.length > 0) {
      stats.averageOfficerRating = officerRatings.reduce((sum, f) => sum + (f.officerRating || 0), 0) / officerRatings.length;
    }

    stats.satisfactionRate = (feedbackRecords.filter((f) => f.overallSatisfaction).length / feedbackRecords.length) * 100;

    // Rating distribution
    feedbackRecords.forEach((f) => {
      stats.ratingDistribution[f.rating as keyof typeof stats.ratingDistribution]++;
    });

    // Officer stats
    feedbackRecords.forEach((f) => {
      const officer = f.complaint.assignedOfficer;
      if (officer) {
        if (!stats.officerStats[officer.id]) {
          stats.officerStats[officer.id] = {
            name: officer.fullName,
            rating: 0,
            count: 0,
          };
        }
        stats.officerStats[officer.id].rating += f.officerRating || 0;
        stats.officerStats[officer.id].count++;
      }
    });

    // Calculate average ratings for officers
    Object.keys(stats.officerStats).forEach((officerId) => {
      const officer = stats.officerStats[officerId];
      if (officer.count > 0) {
        officer.rating = officer.rating / officer.count;
      }
    });
  }

  return { analytics: stats };
}

/**
 * Get officer performance metrics
 */
export async function getOfficerPerformance(officerId: string) {
  const feedback = await prisma.feedback.findMany({
    where: {
      complaint: { assignedOfficerId: officerId },
    },
    include: { complaint: true },
  });

  const complaintCount = await prisma.complaint.count({
    where: { assignedOfficerId: officerId },
  });

  const resolvedCount = await prisma.complaint.count({
    where: {
      assignedOfficerId: officerId,
      status: "Resolved",
    },
  });

  const stats = {
    totalComplaints: complaintCount,
    resolvedComplaints: resolvedCount,
    resolutionRate: complaintCount > 0 ? (resolvedCount / complaintCount) * 100 : 0,
    totalFeedback: feedback.length,
    averageRating: 0,
    satisfactionRate: 0,
  };

  if (feedback.length > 0) {
    stats.averageRating = feedback.reduce((sum, f) => sum + (f.officerRating || f.rating), 0) / feedback.length;
    stats.satisfactionRate = (feedback.filter((f) => f.overallSatisfaction).length / feedback.length) * 100;
  }

  return { performance: stats };
}
