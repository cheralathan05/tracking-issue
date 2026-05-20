import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireChatAccess } from "../middleware/chat.middleware.js";
import * as chatService from "../services/chat.service.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.post("/rooms/complaint/:complaintId", async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const room = await chatService.getOrCreateRoomForComplaint(complaintId);
    res.json({ success: true, room });
  } catch (err) {
    next(err);
  }
});

chatRouter.get("/rooms/:roomId/messages", requireChatAccess, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, cursor } = req.query as any;
    const messages = await chatService.getMessages(roomId, Number(limit), cursor);
    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
});

chatRouter.post("/rooms/:roomId/messages", requireChatAccess, async (req, res, next) => {
  try {
    const { roomId } = req.params;
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

    res.json({ success: true, message: created });
  } catch (err) {
    next(err);
  }
});

chatRouter.post("/rooms/:roomId/read", requireChatAccess, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;
    await chatService.markMessagesRead(roomId, userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Simple attachment endpoint (accepts a hosted file URL or pre-signed URL)
chatRouter.post("/rooms/:roomId/attachments", requireChatAccess, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const senderId = req.user!.id;
    const { fileUrl, fileType, message } = req.body;

    if (!fileUrl) return next(new Error("fileUrl required"));

    const created = await chatService.sendMessage({
      roomId,
      senderId,
      message: message || null,
      messageType: "attachment",
      attachment: { fileUrl, fileType, uploadedBy: senderId },
    });

    res.json({ success: true, message: created });
  } catch (err) {
    next(err);
  }
});
