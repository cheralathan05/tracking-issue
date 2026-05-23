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
