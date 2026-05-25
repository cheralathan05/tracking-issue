import { Request, Response, NextFunction } from "express";
import * as chatService from "../services/chat.service.js";
import { AppError } from "../utils/errors.js";
import { getSocket } from "../socket.js";

/**
 * Get all complaint chat rooms for admin monitoring
 * GET /api/admin/chat/rooms
 */
export async function listAdminChatRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, filter = "all", sortBy = "latest", limit = 20, offset = 0 } = req.query;
    const result = await chatService.getAdminChatRooms({
      search: search as string,
      filter: filter as string,
      sortBy: sortBy as string,
      limit: Math.min(Number(limit) || 20, 100),
      offset: Number(offset) || 0,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Get detailed chat room with all messages and metadata
 * GET /api/admin/chat/:roomId
 */
export async function getAdminChatRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { roomId } = req.params;
    const adminId = req.user!.id;

    const result = await chatService.getAdminChatDetails({
      roomId,
      adminId,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Send an admin message to a chat room
 * POST /api/admin/chat/:roomId/message
 */
export async function sendAdminMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { roomId } = req.params;
    const { message, attachment } = req.body;
    const adminId = req.user!.id;

    if (!message || typeof message !== "string") {
      throw new AppError("Message is required", 400);
    }

    // Get complaint ID from room
    const room = await chatService.getRoomById(roomId);
    if (!room.complaintId) {
      throw new AppError("Invalid chat room", 400);
    }

    const created = await chatService.sendAdminMessage({
      roomId,
      complaintId: room.complaintId,
      adminId,
      message,
      attachment,
    });

    // Emit real-time event
    try {
      getSocket().to(`room:${roomId}`).emit("admin_message", {
        id: created.id,
        message: created.message,
        senderName: req.user!.fullName,
        senderRole: "admin",
        createdAt: created.createdAt.toISOString(),
      });
    } catch {
      // Socket may not be ready
    }

    res.json({ success: true, message: "Message sent", data: { messageId: created.id } });
  } catch (err) {
    next(err);
  }
}

/**
 * Reassign complaint to a different officer
 * POST /api/admin/chat/:complaintId/reassign
 */
export async function reassignComplaintOfficer(req: Request, res: Response, next: NextFunction) {
  try {
    const { complaintId } = req.params;
    const { newOfficerId, reason } = req.body;
    const adminId = req.user!.id;

    if (!newOfficerId) {
      throw new AppError("New officer ID is required", 400);
    }

    const updated = await chatService.reassignComplaint({
      complaintId,
      newOfficerId,
      adminId,
      reason,
    });

    // Notify room participants
    const room = await chatService.getOrCreateRoomForComplaint(complaintId);
    try {
      getSocket().to(`room:${room.id}`).emit("officer_reassigned", {
        complaintId,
        newOfficerId,
        newOfficerName: updated.assignedOfficerName,
      });
    } catch {
      // Socket may not be ready
    }

    res.json({ success: true, message: "Officer reassigned" });
  } catch (err) {
    next(err);
  }
}

/**
 * Escalate a complaint
 * POST /api/admin/chat/:complaintId/escalate
 */
export async function escalateComplaintHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { complaintId } = req.params;
    const { level, reason } = req.body;
    const adminId = req.user!.id;

    if (!level || !reason) {
      throw new AppError("Level and reason are required", 400);
    }

    await chatService.escalateComplaint({
      complaintId,
      level,
      reason,
      adminId,
    });

    // Notify room participants
    const room = await chatService.getOrCreateRoomForComplaint(complaintId);
    try {
      getSocket().to(`room:${room.id}`).emit("escalation_raised", {
        complaintId,
        level,
        reason,
        escalatedBy: req.user!.fullName,
      });

      // Notify all admins
      getSocket().to("admin_monitoring").emit("escalation_alert", {
        complaintId,
        level,
        escalatedBy: req.user!.fullName,
      });
    } catch {
      // Socket may not be ready
    }

    res.json({ success: true, message: "Complaint escalated" });
  } catch (err) {
    next(err);
  }
}

/**
 * Freeze complaint chat (prevent citizen/officer messages)
 * POST /api/admin/chat/:complaintId/freeze
 */
export async function freezeChat(req: Request, res: Response, next: NextFunction) {
  try {
    const { complaintId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    if (!reason) {
      throw new AppError("Reason is required", 400);
    }

    await chatService.freezeComplaintChat({
      complaintId,
      reason,
      adminId,
    });

    // Notify room participants
    const room = await chatService.getOrCreateRoomForComplaint(complaintId);
    try {
      getSocket().to(`room:${room.id}`).emit("chat_frozen", {
        complaintId,
        reason,
        frozenBy: req.user!.fullName,
      });
    } catch {
      // Socket may not be ready
    }

    res.json({ success: true, message: "Chat frozen" });
  } catch (err) {
    next(err);
  }
}

/**
 * Unfreeze complaint chat
 * POST /api/admin/chat/:complaintId/unfreeze
 */
export async function unfreezeChat(req: Request, res: Response, next: NextFunction) {
  try {
    const { complaintId } = req.params;
    const adminId = req.user!.id;

    await chatService.unfreezeComplaintChat({
      complaintId,
      adminId,
    });

    // Notify room participants
    const room = await chatService.getOrCreateRoomForComplaint(complaintId);
    try {
      getSocket().to(`room:${room.id}`).emit("chat_unfrozen", {
        complaintId,
        unfrozenBy: req.user!.fullName,
      });
    } catch {
      // Socket may not be ready
    }

    res.json({ success: true, message: "Chat unfrozen" });
  } catch (err) {
    next(err);
  }
}

/**
 * Broadcast alert message to multiple complaints
 * POST /api/admin/chat/broadcast
 */
export async function broadcastAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, priority = "medium", scope = "all", filters } = req.body;
    const adminId = req.user!.id;

    if (!message) {
      throw new AppError("Message is required", 400);
    }

    const result = await chatService.broadcastAdminMessage({
      message,
      priority,
      adminId,
      scope,
      filters,
    });

    // Notify all admins of the broadcast
    try {
      getSocket().to("admin_monitoring").emit("broadcast_sent", {
        message,
        priority,
        scope,
        broadcastBy: req.user!.fullName,
        ...result,
      });
    } catch {
      // Socket may not be ready
    }

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
