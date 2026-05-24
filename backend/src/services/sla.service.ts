import { prisma } from "../config/prisma.js";
import { isSLABreached, getSLAWarningLevel, calculateSLARiskScore } from "../constants/sla.js";
import { createEscalation } from "./escalation.service.js";
import { createNotificationsForRole } from "./notification.service.js";
import { safeEmitToRole, safeEmitToUser } from "../socket.js";

/**
 * Check all complaints for SLA breaches and auto-escalate if needed
 * Should be run periodically (e.g., every 5-10 minutes)
 */
export async function checkAndAutoEscalateSLABreaches() {
  try {
    const complaints = await prisma.complaint.findMany({
      where: {
        slaDeadline: {
          not: null,
        },
        status: {
          notIn: ["Resolved", "Closed", "Rejected"],
        },
        escalation: null, // Only auto-escalate if not already escalated
      },
      include: {
        escalation: true,
        assignedOfficer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    for (const complaint of complaints) {
      if (!complaint.slaDeadline) continue;

      const isBreached = isSLABreached(complaint.slaDeadline);
      const warningLevel = getSLAWarningLevel(complaint.slaDeadline);
      const riskScore = calculateSLARiskScore(complaint.slaDeadline);

      // Auto-escalate if SLA is breached
      if (isBreached && !complaint.escalation) {
        try {
          await createEscalation(
            {
              complaintId: complaint.id,
              reason: `SLA breach detected - deadline was ${complaint.slaDeadline.toISOString()}`,
              level: "high",
            },
            {
              id: "system",
              fullName: "Civic Bridge System",
              role: "super_admin",
            },
          );

          // Notify officer about escalation
          if (complaint.assignedOfficerId) {
            safeEmitToUser(complaint.assignedOfficerId, "sla_breach", {
              complaintId: complaint.id,
              grievanceId: complaint.grievanceId,
              message: "Your complaint has been auto-escalated due to SLA breach",
              deadline: complaint.slaDeadline.toISOString(),
            });
          }

          // Notify admin
          safeEmitToRole("admin", "sla_breach", {
            complaintId: complaint.id,
            grievanceId: complaint.grievanceId,
            message: `Complaint ${complaint.grievanceId} has been auto-escalated`,
            deadline: complaint.slaDeadline.toISOString(),
            officerName: complaint.assignedOfficer?.fullName || "Unassigned",
          });

          // Create notification for admins
          await createNotificationsForRole("admin", {
            title: "SLA Breach - Auto-Escalation",
            message: `Complaint ${complaint.grievanceId} has exceeded SLA deadline. Auto-escalation triggered.`,
            type: "escalation",
            priority: "critical",
            actionUrl: `/admin/complaints/${complaint.id}`,
          });

          console.log(`Auto-escalated complaint ${complaint.grievanceId} due to SLA breach`);
        } catch (error) {
          console.error(`Failed to auto-escalate complaint ${complaint.id}:`, error);
        }
      }
      // Send warning when approaching deadline
      else if (warningLevel === "warning" && !isBreached) {
        try {
          // Only send warning once (check if we haven't sent it in the last 30 minutes)
          const recentWarning = await prisma.notification.findFirst({
            where: {
              userId: complaint.assignedOfficerId || "",
              type: "sla_warning",
              createdAt: {
                gte: new Date(Date.now() - 30 * 60 * 1000),
              },
              data: {
                path: ["complaintId"],
                equals: complaint.id,
              },
            },
          });

          if (!recentWarning && complaint.assignedOfficerId) {
            safeEmitToUser(complaint.assignedOfficerId, "sla_warning", {
              complaintId: complaint.id,
              grievanceId: complaint.grievanceId,
              message: "SLA deadline approaching",
              deadline: complaint.slaDeadline.toISOString(),
              riskScore: Math.round(riskScore * 100),
            });

            // Send notification to officer
            await prisma.notification.create({
              data: {
                userId: complaint.assignedOfficerId,
                title: "SLA Warning",
                message: `Complaint ${complaint.grievanceId} is approaching SLA deadline`,
                type: "sla_warning",
                priority: "high",
                actionUrl: `/officer/complaints/${complaint.id}`,
                data: {
                  complaintId: complaint.id,
                  riskScore: Math.round(riskScore * 100),
                },
              },
            });
          }
        } catch (error) {
          console.error(`Failed to send SLA warning for complaint ${complaint.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error checking SLA breaches:", error);
  }
}

/**
 * Get SLA statistics for admin dashboard
 */
export async function getSLAStatistics() {
  const complaints = await prisma.complaint.findMany({
    where: {
      slaDeadline: {
        not: null,
      },
    },
    include: {
      escalation: true,
    },
  });

  const breached = complaints.filter((c) => isSLABreached(c.slaDeadline));
  const warning = complaints.filter(
    (c) => getSLAWarningLevel(c.slaDeadline) === "warning" && !isSLABreached(c.slaDeadline),
  );
  const healthy = complaints.filter(
    (c) => getSLAWarningLevel(c.slaDeadline) === "none" && !isSLABreached(c.slaDeadline),
  );

  return {
    total: complaints.length,
    breached: breached.length,
    warning: warning.length,
    healthy: healthy.length,
    breachPercentage: complaints.length > 0 ? (breached.length / complaints.length) * 100 : 0,
    escalatedCount: complaints.filter((c) => c.escalation).length,
    byDepartment: Object.fromEntries(
      Object.entries(
        complaints.reduce<Record<string, typeof complaints>>(
          (acc, complaint) => {
            if (!acc[complaint.department]) acc[complaint.department] = [];
            acc[complaint.department].push(complaint);
            return acc;
          },
          {},
        ),
      ).map(([dept, deptComplaints]) => [
        dept,
        {
          total: deptComplaints.length,
          breached: deptComplaints.filter((c) => isSLABreached(c.slaDeadline)).length,
          warning: deptComplaints.filter(
            (c) => getSLAWarningLevel(c.slaDeadline) === "warning" && !isSLABreached(c.slaDeadline),
          ).length,
        },
      ]),
    ),
  };
}

/**
 * Get escalation statistics for admin dashboard
 */
export async function getEscalationStatistics() {
  const escalations = await prisma.escalation.findMany({
    include: {
      complaint: {
        select: {
          grievanceId: true,
          title: true,
          category: true,
          department: true,
        },
      },
    },
  });

  const active = escalations.filter((e) => e.status === "active");
  const resolved = escalations.filter((e) => e.status === "resolved");
  const byLevel = {
    low: escalations.filter((e) => e.level === "low").length,
    medium: escalations.filter((e) => e.level === "medium").length,
    high: escalations.filter((e) => e.level === "high").length,
    emergency: escalations.filter((e) => e.level === "emergency").length,
  };

  return {
    total: escalations.length,
    active: active.length,
    resolved: resolved.length,
    byLevel,
    escalations: escalations.map((e) => ({
      id: e.id,
      complaintId: e.complaintId,
      grievanceId: e.complaint.grievanceId,
      title: e.complaint.title,
      category: e.complaint.category,
      department: e.complaint.department,
      level: e.level,
      status: e.status,
      reason: e.reason,
      createdAt: e.createdAt.toISOString(),
      resolvedAt: e.resolvedAt?.toISOString() || null,
    })),
  };
}
