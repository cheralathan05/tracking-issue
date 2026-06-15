import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
import type { Viewer } from "../utils/types.js";

interface LocationUpdateInput {
  latitude: number;
  longitude: number;
  etaMinutes?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

/**
 * Store or update officer's live location during field operations
 */
export async function storeOfficerLocation(
  complaintId: string,
  officerId: string,
  payload: LocationUpdateInput,
) {
  if (!complaintId || !officerId) {
    throw new AppError("complaintId and officerId required", 400);
  }

  if (typeof payload.latitude !== "number" || typeof payload.longitude !== "number") {
    throw new AppError("latitude and longitude required", 400);
  }

  // Verify complaint exists and is assigned to this officer
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: { id: true, assignedOfficerId: true, grievanceId: true },
  });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (complaint.assignedOfficerId !== officerId) {
    throw new AppError("Complaint not assigned to this officer", 403);
  }

  // Store location with upsert (create or update by officerId + complaintId)
  const location = await prisma.officerLocation.upsert({
    where: {
      officerId_complaintId: {
        officerId,
        complaintId,
      },
    },
    create: {
      officerId,
      complaintId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      etaMinutes: payload.etaMinutes,
      accuracy: payload.accuracy,
      heading: payload.heading,
      speed: payload.speed,
      isActive: true,
    },
    update: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      etaMinutes: payload.etaMinutes,
      accuracy: payload.accuracy,
      heading: payload.heading,
      speed: payload.speed,
      updatedAt: new Date(),
    },
    include: {
      officer: {
        select: {
          id: true,
          fullName: true,
          department: true,
        },
      },
    },
  });

  return {
    location: {
      id: location.id,
      officerId: location.officerId,
      complaintId: location.complaintId,
      officerName: location.officer.fullName,
      latitude: location.latitude,
      longitude: location.longitude,
      etaMinutes: location.etaMinutes,
      accuracy: location.accuracy,
      heading: location.heading,
      speed: location.speed,
      updatedAt: location.updatedAt.toISOString(),
    },
  };
}

/**
 * Get current officer location for a complaint
 */
export async function getOfficerLocation(complaintId: string) {
  if (!complaintId) {
    throw new AppError("complaintId required", 400);
  }

  const location = await prisma.officerLocation.findFirst({
    where: {
      complaintId,
      isActive: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      officer: {
        select: {
          id: true,
          fullName: true,
          department: true,
          mobile: true,
        },
      },
      complaint: {
        select: {
          id: true,
          grievanceId: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!location) {
    throw new AppError("No active location found for this complaint", 404);
  }

  return {
    location: {
      id: location.id,
      officerId: location.officer.id,
      officerName: location.officer.fullName,
      department: location.officer.department,
      mobile: location.officer.mobile,
      latitude: location.latitude,
      longitude: location.longitude,
      etaMinutes: location.etaMinutes,
      accuracy: location.accuracy,
      heading: location.heading,
      speed: location.speed,
      updatedAt: location.updatedAt.toISOString(),
      complaint: {
        id: location.complaint.id,
        grievanceId: location.complaint.grievanceId,
        title: location.complaint.title,
        status: location.complaint.status,
      },
    },
  };
}

/**
 * Get location history for a complaint (last N updates)
 */
export async function getLocationHistory(complaintId: string, limit = 20) {
  if (!complaintId) {
    throw new AppError("complaintId required", 400);
  }

  const locations = await prisma.officerLocation.findMany({
    where: { complaintId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      officer: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return {
    locations: locations.map((loc) => ({
      id: loc.id,
      officerId: loc.officer.id,
      officerName: loc.officer.fullName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      etaMinutes: loc.etaMinutes,
      accuracy: loc.accuracy,
      updatedAt: loc.updatedAt.toISOString(),
    })),
  };
}

/**
 * Deactivate officer location (e.g., when complaint is resolved)
 */
export async function deactivateOfficerLocation(complaintId: string, officerId: string) {
  if (!complaintId || !officerId) {
    throw new AppError("complaintId and officerId required", 400);
  }

  const location = await prisma.officerLocation.updateMany({
    where: {
      complaintId,
      officerId,
    },
    data: {
      isActive: false,
      updatedAt: new Date(),
    },
  });

  return {
    message: "Location tracking deactivated",
    updated: location.count,
  };
}

/**
 * Get all active locations for an officer (across all complaints)
 */
export async function getActiveLocationsForOfficer(officerId: string) {
  if (!officerId) {
    throw new AppError("officerId required", 400);
  }

  const locations = await prisma.officerLocation.findMany({
    where: {
      officerId,
      isActive: true,
    },
    include: {
      complaint: {
        select: {
          id: true,
          grievanceId: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return {
    locations: locations.map((loc) => ({
      id: loc.id,
      complaintId: loc.complaint.id,
      grievanceId: loc.complaint.grievanceId,
      title: loc.complaint.title,
      status: loc.complaint.status,
      latitude: loc.latitude,
      longitude: loc.longitude,
      etaMinutes: loc.etaMinutes,
      updatedAt: loc.updatedAt.toISOString(),
    })),
  };
}

/**
 * Get all active officer locations for a complaint (for admin monitoring)
 */
export async function getActiveLocationsForComplaint(complaintId: string) {
  if (!complaintId) {
    throw new AppError("complaintId required", 400);
  }

  const locations = await prisma.officerLocation.findMany({
    where: {
      complaintId,
      isActive: true,
    },
    include: {
      officer: {
        select: {
          id: true,
          fullName: true,
          department: true,
          mobile: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return {
    locations: locations.map((loc) => ({
      id: loc.id,
      officerId: loc.officer.id,
      officerName: loc.officer.fullName,
      department: loc.officer.department,
      mobile: loc.officer.mobile,
      latitude: loc.latitude,
      longitude: loc.longitude,
      etaMinutes: loc.etaMinutes,
      accuracy: loc.accuracy,
      heading: loc.heading,
      speed: loc.speed,
      updatedAt: loc.updatedAt.toISOString(),
    })),
  };
}

/**
 * Clean up stale locations (older than X hours)
 */
export async function cleanupStaleLocations(hoursOld = 24) {
  const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

  const result = await prisma.officerLocation.deleteMany({
    where: {
      updatedAt: {
        lt: cutoffTime,
      },
      isActive: false,
    },
  });

  return {
    message: "Stale locations cleaned up",
    deleted: result.count,
  };
}
