import type { RequestHandler } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";

export const requireChatAccess: RequestHandler = async (req, _res, next) => {
  try {
    const rawRoomId = req.params.roomId ?? req.params.complaintId;
    const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;

    if (!roomId) return next(new AppError("Missing room identifier", 400));

    const room = await prisma.chatRoom.findUnique({
      where: { id: String(roomId) },
      include: { complaint: true, participants: true },
    });

    // allow access if user is participant
    const userId = req.user!.id;

    if (room) {
      const isParticipant = room.participants.some((p) => p.userId === userId);
      if (isParticipant) return next();

      // check complaint ownership / assigned officer
      if (room.complaint) {
        if (room.complaint.reporterUserId === userId) return next();
        if (room.complaint.assignedOfficerId === userId) return next();
      }
    }

    // fallback: allow admins (roles other than citizen/officer)
    const role = String(req.user!.role);
    if (role !== "citizen") {
      return next();
    }

    return next(new AppError("Forbidden", 403));
  } catch (err) {
    next(err);
  }
};
