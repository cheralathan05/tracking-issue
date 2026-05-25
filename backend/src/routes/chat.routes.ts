import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireChatAccess } from "../middleware/chat.middleware.js";
import { getSocket } from "../socket.js";
import * as chatService from "../services/chat.service.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.post("/rooms/complaint/:complaintId", async (req, res, next) => {
  try {
    const rawComplaintId = req.params.complaintId;
    const complaintId = Array.isArray(rawComplaintId) ? rawComplaintId[0] : rawComplaintId;
    const room = await chatService.getOrCreateRoomForComplaint(String(complaintId));
    res.json({ success: true, room });
  } catch (err) {
    next(err);
  }
});

chatRouter.get("/rooms/:roomId/messages", requireChatAccess, async (req, res, next) => {
  try {
    const rawRoomId = req.params.roomId;
    const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
    const { limit = 50, cursor } = req.query as any;
    const messages = await chatService.getMessages(String(roomId), Number(limit), cursor);
    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
});

chatRouter.post("/rooms/:roomId/messages", requireChatAccess, async (req, res, next) => {
  try {
    const rawRoomId = req.params.roomId;
    const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
    const senderId = req.user!.id;
    const { message, messageType, receiverId, attachment } = req.body;

    const created = await chatService.sendMessage({
      roomId,
      senderId,
      receiverId,
      message,
      messageType,
      attachment,
    });

    try {
      getSocket().to(`room:${roomId}`).emit("message", created);
      getSocket().to(`room:${roomId}`).emit("message_sent", created);
    } catch {
      // Socket not ready; the message is still persisted.
    }

    res.json({ success: true, message: "Message sent successfully", data: { message: created } });
  } catch (err) {
    next(err);
  }
});

chatRouter.post("/rooms/:roomId/read", requireChatAccess, async (req, res, next) => {
  try {
    const rawRoomId = req.params.roomId;
    const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
    const userId = req.user!.id;
    await chatService.markMessagesRead(String(roomId), userId);

    try {
      getSocket().to(`room:${String(roomId)}`).emit("seen_update", {
        roomId: String(roomId),
        userId,
      });
    } catch {
      // Socket is optional here.
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Simple attachment endpoint (accepts a hosted file URL or pre-signed URL)
chatRouter.post("/rooms/:roomId/attachments", requireChatAccess, async (req, res, next) => {
  try {
    const rawRoomId = req.params.roomId;
    const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
    const senderId = req.user!.id;
    const { fileUrl, fileType, message } = req.body;

    if (!fileUrl) return next(new Error("fileUrl required"));

    const created = await chatService.sendMessage({
      roomId: String(roomId),
      senderId,
      message: message || null,
      messageType: "attachment",
      attachment: { fileUrl, fileType, uploadedBy: senderId },
    });

    try {
      getSocket().to(`room:${String(roomId)}`).emit("message", created);
      getSocket().to(`room:${String(roomId)}`).emit("message_sent", created);
    } catch {
      // Socket not ready; the attachment message is still persisted.
    }

    res.json({ success: true, message: "Attachment sent successfully", data: { message: created } });
  } catch (err) {
    next(err);
  }
});

// File upload endpoint: stores uploads locally under /uploads/chat and returns a public URL
const uploadDir = path.join(process.cwd(), "uploads", "chat");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir),
  filename: (_req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const upload = multer({ storage });

chatRouter.post(
  "/rooms/:roomId/upload",
  requireChatAccess,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const rawRoomId = req.params.roomId;
      const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
      const senderId = req.user!.id;

      if (!(req as any).file) return next(new Error("file required"));

      const fileUrl = `${env.FRONTEND_ORIGIN.replace(/\/$/, "")}/uploads/chat/${(req as any).file.filename}`;

      // return file URL; client should emit socket 'sendMessage' with attachment to create message record
      res.json({ success: true, fileUrl });
    } catch (err) {
      next(err);
    }
  },
);

// List chat threads (live workspace queue) for current user
chatRouter.get("/threads", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const role = String(req.user!.role);
    const { search, filter } = req.query as any;

    const result = await chatService.listThreadsForUser({
      userId,
      role,
      search: search as string | undefined,
      filter: (filter as any) || "all",
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Get room workspace context (full state for mission control)
chatRouter.get("/rooms/:roomId/workspace", requireChatAccess, async (req, res, next) => {
  try {
    const rawRoomId = req.params.roomId;
    const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
    const userId = req.user!.id;
    const role = String(req.user!.role);

    const result = await chatService.getRoomWorkspace({
      roomId,
      userId,
      role,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Add/remove reaction on message
chatRouter.post("/rooms/:roomId/messages/:messageId/reaction", requireChatAccess, async (req, res, next) => {
  try {
    const rawRoomId = req.params.roomId;
    const rawMessageId = req.params.messageId;
    const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
    const messageId = Array.isArray(rawMessageId) ? rawMessageId[0] : rawMessageId;
    const userId = req.user!.id;
    const { emoji } = req.body;

    if (!emoji) return next(new Error("emoji required"));

    await chatService.addMessageReaction({
      roomId,
      messageId,
      userId,
      emoji,
    });

    res.json({ success: true, message: "Reaction added" });
  } catch (err) {
    next(err);
  }
});

// Pin/unpin message
chatRouter.post("/rooms/:roomId/messages/:messageId/pin", requireChatAccess, async (req, res, next) => {
  try {
    const rawRoomId = req.params.roomId;
    const rawMessageId = req.params.messageId;
    const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
    const messageId = Array.isArray(rawMessageId) ? rawMessageId[0] : rawMessageId;
    const { pinned } = req.body;

    await chatService.pinMessage({
      roomId,
      messageId,
      pinned: Boolean(pinned),
    });

    res.json({ success: true, message: pinned ? "Message pinned" : "Message unpinned" });
  } catch (err) {
    next(err);
  }
});

// ========== COMPLAINT INTEGRATION ENDPOINTS ==========

// Get complaint header info for chat display
chatRouter.get("/complaints/:complaintId/header", requireAuth, async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { prisma } = require("../config/prisma.js");

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        assignedOfficer: { select: { id: true, fullName: true, email: true, mobile: true, department: true } },
        reporterUser: { select: { id: true, fullName: true } },
        escalation: true,
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    res.json({
      success: true,
      data: {
        id: complaint.id,
        grievanceId: complaint.grievanceId,
        title: complaint.title,
        department: complaint.department,
        status: complaint.status,
        priority: complaint.priority,
        category: complaint.category,
        assignedOfficer: complaint.assignedOfficer ? {
          id: complaint.assignedOfficer.id,
          name: complaint.assignedOfficer.fullName,
          email: complaint.assignedOfficer.email,
          department: complaint.assignedOfficer.department,
        } : null,
        citizen: complaint.reporterUser ? {
          id: complaint.reporterUser.id,
          name: complaint.reporterUser.fullName,
        } : null,
        isEscalated: !!complaint.escalation,
        escalationLevel: complaint.escalation?.level || null,
        slaDeadline: complaint.slaDeadline?.toISOString() || null,
        createdAt: complaint.createdAt.toISOString(),
        updatedAt: complaint.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ========== ESCALATION ENDPOINTS ==========

// Escalate complaint from chat
chatRouter.post("/complaints/:complaintId/escalate", requireAuth, async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { reason, level = "medium" } = req.body;
    const userId = req.user!.id;
    const { prisma } = require("../config/prisma.js");
    const { createEscalation } = require("../services/escalation.service.js");

    if (!reason) {
      return res.status(400).json({ success: false, message: "Escalation reason required" });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const result = await createEscalation({
      complaintId,
      reason,
      level,
      escalatedBy: userId,
    });

    try {
      getSocket().to(`room:${complaintId}`).emit("complaint_escalated", {
        complaintId,
        level,
        reason,
        escalatedAt: new Date().toISOString(),
      });
    } catch (e) {
      // socket optional
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Get escalation details
chatRouter.get("/complaints/:complaintId/escalation", requireAuth, async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { prisma } = require("../config/prisma.js");

    const escalation = await prisma.escalation.findUnique({
      where: { complaintId },
      include: {
        escalatedByUser: { select: { fullName: true } },
        resolvedByUser: { select: { fullName: true } },
      },
    });

    if (!escalation) {
      return res.json({ success: true, data: null });
    }

    res.json({
      success: true,
      data: {
        id: escalation.id,
        level: escalation.level,
        reason: escalation.reason,
        status: escalation.status,
        escalatedBy: escalation.escalatedByUser?.fullName,
        escalatedAt: escalation.createdAt.toISOString(),
        resolvedBy: escalation.resolvedByUser?.fullName,
        resolvedAt: escalation.resolvedAt?.toISOString(),
        resolutionNote: escalation.resolutionNote,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ========== RESOLUTION VERIFICATION ENDPOINTS ==========

// Upload resolution proof
chatRouter.post("/complaints/:complaintId/resolution-proof", requireChatAccess, async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { proofUrl, proofType, description } = req.body;
    const userId = req.user!.id;
    const { prisma } = require("../config/prisma.js");

    if (!proofUrl) {
      return res.status(400).json({ success: false, message: "Proof URL required" });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Store resolution evidence
    const evidence = Array.isArray(complaint.resolutionEvidence) ? complaint.resolutionEvidence : [];
    evidence.push({
      id: Date.now().toString(),
      type: proofType || "image",
      url: proofUrl,
      uploadedAt: new Date().toISOString(),
      description: description || "",
      uploadedBy: userId,
    });

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        resolutionEvidence: evidence,
        status: "Resolved",
      },
    });

    // Notify citizen and admins
    try {
      getSocket().to(`complaint_${complaintId}`).emit("resolution_uploaded", {
        complaintId,
        proofType,
        uploadedAt: new Date().toISOString(),
      });
    } catch (e) {
      // socket optional
    }

    res.json({
      success: true,
      message: "Resolution proof uploaded successfully",
      data: { complaintId, status: updated.status },
    });
  } catch (err) {
    next(err);
  }
});

// Verify/approve resolution
chatRouter.post("/complaints/:complaintId/verify-resolution", requireAuth, async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { verified, feedback } = req.body;
    const userId = req.user!.id;
    const { prisma } = require("../config/prisma.js");

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { reporterUser: true },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Check if user is the complainant or admin
    const isComplainant = complaint.reporterUserId === userId;
    const isAdmin = ["admin", "super_admin"].includes(req.user!.role);

    if (!isComplainant && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const newStatus = verified ? "Closed" : "In Progress";

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: newStatus,
        resolutionSummary: feedback || complaint.resolutionSummary,
      },
    });

    // Create timeline entry
    await prisma.complaintTimeline.create({
      data: {
        complaintId,
        oldStatus: complaint.status,
        newStatus,
        changedBy: userId,
        reason: feedback ? `Resolution ${verified ? "approved" : "rejected"}: ${feedback}` : `Resolution ${verified ? "approved" : "rejected"}`,
      },
    });

    // Notify all participants
    try {
      getSocket().to(`complaint_${complaintId}`).emit("resolution_verified", {
        complaintId,
        verified,
        feedback,
        newStatus,
        verifiedAt: new Date().toISOString(),
      });
    } catch (e) {
      // socket optional
    }

    res.json({
      success: true,
      message: `Resolution ${verified ? "approved" : "rejected"}`,
      data: { complaintId, status: updated.status },
    });
  } catch (err) {
    next(err);
  }
});

// ========== ADMIN MONITORING ENDPOINTS ==========

// Get admin chat room list (filtered)
chatRouter.get("/admin/rooms", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { search, filter = "all", sortBy = "latest", limit = 20, offset = 0 } = req.query;

    const adminRoles = ["super_admin", "state_admin", "district_officer", "department_officer", "admin"];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await chatService.getAdminChatRooms({
      search: search as string | undefined,
      filter: filter as string | undefined,
      sortBy: sortBy as string | undefined,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Get detailed admin view of specific chat
chatRouter.get("/admin/rooms/:roomId/details", requireAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;

    const adminRoles = ["super_admin", "state_admin", "district_officer", "department_officer", "admin"];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await chatService.getAdminChatDetails({
      roomId,
      adminId: userId,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Admin send message to chat
chatRouter.post("/admin/rooms/:roomId/message", requireAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { message, attachment } = req.body;
    const userId = req.user!.id;

    const adminRoles = ["super_admin", "state_admin", "district_officer", "department_officer", "admin"];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!message) {
      return res.status(400).json({ success: false, message: "Message required" });
    }

    const room = await (require("../config/prisma.js").prisma).chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    const created = await chatService.sendAdminMessage({
      roomId,
      complaintId: room.complaintId || "",
      adminId: userId,
      message,
      attachment,
    });

    try {
      getSocket().to(`room:${roomId}`).emit("admin_message", created);
    } catch (e) {
      // socket optional
    }

    res.json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// Admin reassign complaint
chatRouter.post("/admin/complaints/:complaintId/reassign", requireAuth, async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { newOfficerId, reason } = req.body;
    const userId = req.user!.id;

    const adminRoles = ["super_admin", "state_admin", "district_officer", "department_officer", "admin"];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!newOfficerId) {
      return res.status(400).json({ success: false, message: "New officer ID required" });
    }

    const result = await chatService.reassignComplaint({
      complaintId,
      newOfficerId,
      adminId: userId,
      reason,
    });

    res.json({ success: true, message: "Complaint reassigned successfully", data: result });
  } catch (err) {
    next(err);
  }
});

// Admin escalate complaint
chatRouter.post("/admin/complaints/:complaintId/escalate", requireAuth, async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { level, reason } = req.body;
    const userId = req.user!.id;

    const adminRoles = ["super_admin", "state_admin", "district_officer", "department_officer", "admin"];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!level || !reason) {
      return res.status(400).json({ success: false, message: "Level and reason required" });
    }

    const result = await chatService.escalateComplaint({
      complaintId,
      level,
      reason,
      adminId: userId,
    });

    res.json({ success: true, message: "Complaint escalated", data: result });
  } catch (err) {
    next(err);
  }
});

// Admin freeze/unfreeze chat
chatRouter.post("/admin/complaints/:complaintId/freeze-chat", requireAuth, async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    const adminRoles = ["super_admin", "state_admin", "district_officer", "department_officer", "admin"];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await chatService.freezeComplaintChat({
      complaintId,
      reason: reason || "Chat frozen by admin",
      adminId: userId,
    });

    res.json({ success: true, message: "Chat frozen", data: result });
  } catch (err) {
    next(err);
  }
});

chatRouter.post("/admin/complaints/:complaintId/unfreeze-chat", requireAuth, async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const userId = req.user!.id;

    const adminRoles = ["super_admin", "state_admin", "district_officer", "department_officer", "admin"];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await chatService.unfreezeComplaintChat({
      complaintId,
      adminId: userId,
    });

    res.json({ success: true, message: "Chat unfrozen", data: result });
  } catch (err) {
    next(err);
  }
});

// Admin broadcast message
chatRouter.post("/admin/broadcast-message", requireAuth, async (req, res, next) => {
  try {
    const { message, priority, scope = "all", filters } = req.body;
    const userId = req.user!.id;

    const adminRoles = ["super_admin", "state_admin"];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!message) {
      return res.status(400).json({ success: false, message: "Message required" });
    }

    const result = await chatService.broadcastAdminMessage({
      message,
      priority,
      adminId: userId,
      scope,
      filters,
    });

    res.json({ success: true, message: "Broadcast sent", data: result });
  } catch (err) {
    next(err);
  }
});
