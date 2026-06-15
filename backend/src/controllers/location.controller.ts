import type { Request, Response } from "express";
import {
  storeOfficerLocation,
  getOfficerLocation,
  getLocationHistory,
  deactivateOfficerLocation,
  getActiveLocationsForOfficer,
  getActiveLocationsForComplaint,
} from "../services/location.service.js";
import { emitOfficerLocationUpdate, emitLocationToUser, broadcastLocationUpdate } from "../socket.js";
import { AppError } from "../utils/errors.js";

/**
 * POST /api/locations/:complaintId/update
 * Store/update officer's live location
 */
export async function updateLocation(req: Request, res: Response) {
  const complaintId = Array.isArray(req.params.complaintId)
    ? req.params.complaintId[0] ?? ""
    : req.params.complaintId;

  const officerId = req.user?.id;
  if (!officerId) {
    throw new AppError("User not authenticated", 401);
  }

  const payload = req.body;

  const result = await storeOfficerLocation(complaintId, officerId, payload);

  // Emit location update to all clients watching this complaint
  emitOfficerLocationUpdate(complaintId, {
    officerId: result.location.officerId,
    officerName: result.location.officerName,
    latitude: result.location.latitude,
    longitude: result.location.longitude,
    etaMinutes: result.location.etaMinutes,
    accuracy: result.location.accuracy,
    updatedAt: result.location.updatedAt,
  });

  // Also broadcast to admin monitoring
  broadcastLocationUpdate("officer-location-updated", {
    complaintId,
    officer: result.location,
  });

  res.status(200).json({
    success: true,
    message: "Location updated",
    data: result.location,
  });
}

/**
 * GET /api/locations/:complaintId/current
 * Get current officer location for a complaint (for citizen tracking)
 */
export async function getCurrentLocation(req: Request, res: Response) {
  const complaintId = Array.isArray(req.params.complaintId)
    ? req.params.complaintId[0] ?? ""
    : req.params.complaintId;

  const result = await getOfficerLocation(complaintId);

  res.status(200).json({
    success: true,
    message: "Current location fetched",
    data: result.location,
  });
}

/**
 * GET /api/locations/:complaintId/history
 * Get location history for a complaint
 */
export async function getHistory(req: Request, res: Response) {
  const complaintId = Array.isArray(req.params.complaintId)
    ? req.params.complaintId[0] ?? ""
    : req.params.complaintId;

  const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const limit = limitRaw ? Math.min(Math.max(parseInt(limitRaw as string) || 20, 5), 100) : 20;

  const result = await getLocationHistory(complaintId, limit);

  res.status(200).json({
    success: true,
    message: "Location history fetched",
    data: result.locations,
  });
}

/**
 * POST /api/locations/:complaintId/deactivate
 * Stop tracking officer location for a complaint
 */
export async function deactivateLocation(req: Request, res: Response) {
  const complaintId = Array.isArray(req.params.complaintId)
    ? req.params.complaintId[0] ?? ""
    : req.params.complaintId;

  const officerId = req.user?.id;
  if (!officerId) {
    throw new AppError("User not authenticated", 401);
  }

  const result = await deactivateOfficerLocation(complaintId, officerId);

  // Emit deactivation event
  emitOfficerLocationUpdate(complaintId, {
    type: "tracking-stopped",
    complaintId,
  });

  res.status(200).json({
    success: true,
    message: result.message,
    data: { updated: result.updated },
  });
}

/**
 * GET /api/locations/officer/active
 * Get all active locations for the current officer
 */
export async function getActiveLocations(req: Request, res: Response) {
  const officerId = req.user?.id;
  if (!officerId) {
    throw new AppError("User not authenticated", 401);
  }

  const result = await getActiveLocationsForOfficer(officerId);

  res.status(200).json({
    success: true,
    message: "Active locations fetched",
    data: result.locations,
  });
}

/**
 * GET /api/locations/:complaintId/officers
 * Get all active officer locations for a complaint (for admin/citizen tracking)
 */
export async function getComplaintLocations(req: Request, res: Response) {
  const complaintId = Array.isArray(req.params.complaintId)
    ? req.params.complaintId[0] ?? ""
    : req.params.complaintId;

  const result = await getActiveLocationsForComplaint(complaintId);

  res.status(200).json({
    success: true,
    message: "Officer locations fetched",
    data: result.locations,
  });
}
