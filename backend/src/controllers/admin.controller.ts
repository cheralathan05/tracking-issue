import type { Request, Response } from "express";
import { getSLAStatistics, getEscalationStatistics } from "../services/sla.service.js";
import { prisma } from "../config/prisma.js";
import { calculateSLARiskScore, isSLABreached } from "../constants/sla.js";

/**
 * Admin Governance Dashboard
 * Aggregated view of all complaints, SLA status, escalations, and officer performance
 */
export async function getAdminGovvernanceDashboard(req: Request, res: Response) {
  try {
    const [slaStats, escalationStats, complaints, officers] = await Promise.all([
      getSLAStatistics(),
      getEscalationStatistics(),
      prisma.complaint.findMany({
        select: {
          id: true,
          grievanceId: true,
          status: true,
          priority: true,
          category: true,
          department: true,
          createdAt: true,
          slaDeadline: true,
          assignedOfficerId: true,
          escalation: { select: { id: true, level: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: "officer", isVerified: true, emailVerified: true },
        select: {
          id: true,
          fullName: true,
          department: true,
          jurisdictionArea: true,
        },
      }),
    ]);

    const totalComplaints = complaints.length;
    const complaintsByStatus = complaints.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const complaintsByDepartment = complaints.reduce<Record<string, number>>((acc, c) => {
      acc[c.department] = (acc[c.department] || 0) + 1;
      return acc;
    }, {});

    const complaintsByPriority = complaints.reduce<Record<string, number>>((acc, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {});

    const recentComplaints = complaints.slice(0, 10).map((c) => ({
      id: c.id,
      grievanceId: c.grievanceId,
      status: c.status,
      priority: c.priority,
      category: c.category,
      department: c.department,
      createdAt: c.createdAt.toISOString(),
      slaStatus: isSLABreached(c.slaDeadline) ? "breached" : "active",
      riskScore: Math.round(calculateSLARiskScore(c.slaDeadline) * 100),
      isEscalated: !!c.escalation,
      escalationLevel: c.escalation?.level || null,
    }));

    res.json({
      success: true,
      message: "Governance dashboard data fetched successfully",
      data: {
        summary: {
          totalComplaints,
          totalOfficers: officers.length,
          totalEscalations: escalationStats.total,
          activeEscalations: escalationStats.active,
        },
        sla: slaStats,
        escalations: escalationStats,
        complaintsByStatus,
        complaintsByDepartment,
        complaintsByPriority,
        recentComplaints,
        officers: officers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching governance dashboard:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * SLA Statistics
 * Detailed SLA monitoring and compliance metrics
 */
export async function getAdminSLAStatistics(req: Request, res: Response) {
  try {
    const slaStats = await getSLAStatistics();

    // Get trend data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const complaintsLast7Days = await prisma.complaint.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        slaDeadline: true,
        status: true,
      },
    });

    const dailyTrend = complaintsLast7Days.reduce<
      Record<string, { submitted: number; breached: number; resolved: number }>
    >((acc, c) => {
      const date = c.createdAt.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { submitted: 0, breached: 0, resolved: 0 };
      }
      acc[date].submitted += 1;
      if (isSLABreached(c.slaDeadline)) {
        acc[date].breached += 1;
      }
      if (c.status === "Resolved") {
        acc[date].resolved += 1;
      }
      return acc;
    }, {});

    res.json({
      success: true,
      message: "SLA statistics fetched successfully",
      data: {
        statistics: slaStats,
        dailyTrend: Object.entries(dailyTrend).map(([date, data]) => ({
          date,
          ...data,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching SLA statistics:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Escalation Statistics
 * Detailed escalation monitoring and analysis
 */
export async function getAdminEscalationStatistics(req: Request, res: Response) {
  try {
    const escalationStats = await getEscalationStatistics();

    res.json({
      success: true,
      message: "Escalation statistics fetched successfully",
      data: escalationStats,
    });
  } catch (error) {
    console.error("Error fetching escalation statistics:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Complaints by Department
 * Department-wise analysis and performance metrics
 */
export async function getAdminComplaintsByDepartment(req: Request, res: Response) {
  try {
    const departments = await prisma.complaint.groupBy({
      by: ["department"],
      _count: { id: true },
    });

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const complaints = await prisma.complaint.findMany({
          where: { department: dept.department },
          select: {
            id: true,
            status: true,
            priority: true,
            slaDeadline: true,
            escalation: { select: { id: true } },
            createdAt: true,
            updatedAt: true,
          },
        });

        const resolved = complaints.filter((c) => c.status === "Resolved").length;
        const breached = complaints.filter((c) => isSLABreached(c.slaDeadline)).length;
        const escalated = complaints.filter((c) => c.escalation).length;

        const avgResolutionTime = complaints
          .filter((c) => c.status === "Resolved")
          .reduce((sum, c) => sum + (c.updatedAt.getTime() - c.createdAt.getTime()), 0) / Math.max(resolved, 1);

        return {
          department: dept.department,
          totalComplaints: complaints.length,
          resolved,
          resolutionRate: (resolved / complaints.length) * 100,
          breached,
          breachRate: (breached / complaints.length) * 100,
          escalated,
          escalationRate: (escalated / complaints.length) * 100,
          avgResolutionTimeHours: Math.round(avgResolutionTime / (1000 * 60 * 60) / 10) / 10,
          byPriority: complaints.reduce<Record<string, number>>((acc, c) => {
            acc[c.priority] = (acc[c.priority] || 0) + 1;
            return acc;
          }, {}),
        };
      }),
    );

    res.json({
      success: true,
      message: "Department complaints data fetched successfully",
      data: departmentStats.sort((a, b) => b.totalComplaints - a.totalComplaints),
    });
  } catch (error) {
    console.error("Error fetching complaints by department:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
