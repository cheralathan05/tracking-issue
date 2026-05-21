import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
import { createNotification } from "./notification.service.js";

export async function getOrCreateRoomForComplaint(complaintId: string) {
  if (!complaintId) throw new AppError("complaintId required", 400);

  let room = await prisma.chatRoom.findFirst({ where: { complaintId } });

  if (!room) {
    room = await prisma.chatRoom.create({ data: { complaintId } });
  }

  return room;
}

export async function getRoomById(roomId: string) {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError("Chat room not found", 404);
  return room;
}

export async function addParticipant(roomId: string, userId: string, role: string) {
  return prisma.chatParticipant.upsert({
    where: { id: `${roomId}-${userId}` },
    create: { id: `${roomId}-${userId}`, roomId, userId, role },
    update: { role },
  });
}

export async function sendMessage(input: {
  roomId: string;
  senderId: string;
  receiverId?: string | null;
  complaintId?: string | null;
  message?: string | null;
  messageType?: string;
  attachment?: any;
}) {
  const { roomId, senderId, receiverId, complaintId, message, messageType = "text", attachment } = input;

  const created = await prisma.chatMessage.create({
    data: {
      roomId,
      senderId,
      receiverId: receiverId || null,
      complaintId: complaintId || null,
      message: message || null,
      messageType,
      attachment: attachment || null,
    },
  });

  // create notification entries for room participants (except sender)
  const participants = await prisma.chatParticipant.findMany({ where: { roomId } });
  const notifications = participants
    .filter((p) => p.userId !== senderId)
    .map((p) => ({ userId: p.userId, roomId, messageId: created.id, type: "new_message" }));

  if (notifications.length) {
    await prisma.chatNotification.createMany({ data: notifications });

    const messageSnippet = (message || "New chat message").slice(0, 120);
    await Promise.all(
      notifications.map((notification) =>
        createNotification(notification.userId, {
          title: "New chat message",
          message: messageSnippet,
          type: "chat",
          priority: "medium",
          actionUrl: `/chat`,
          data: { roomId, messageId: created.id, complaintId: complaintId || null },
        }).catch(() => null),
      ),
    );
  }

  // audit log
  try {
    await prisma.auditLog.create({
      data: {
        userId: senderId,
        action: "chat.message.sent",
        metadata: { roomId, messageId: created.id, complaintId: complaintId || null },
      },
    });
  } catch (e) {
    // swallow audit errors
  }

  return created;
}

export async function getMessages(roomId: string, limit = 50, cursor?: string) {
  const where: any = { roomId };

  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
  });

  return messages.reverse();
}

export async function markMessagesRead(roomId: string, userId: string) {
  await prisma.chatMessage.updateMany({ where: { roomId, receiverId: userId, isRead: false }, data: { isRead: true } });
  await prisma.chatNotification.updateMany({ where: { roomId, userId, read: false }, data: { read: true } });
  return { ok: true };
}

export default {
  getOrCreateRoomForComplaint,
  getRoomById,
  addParticipant,
  sendMessage,
  getMessages,
  markMessagesRead,
};
