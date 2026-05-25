import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
import { createNotification } from "./notification.service.js";

type ChatMessageWithSender = Awaited<ReturnType<typeof prisma.chatMessage.findMany>>[number] & {
  sender?: {
    id: string;
    fullName: string;
    role: string;
  };
};

function parseJsonObject(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, any>;
}

function toIso(date: Date) {
  return date.toISOString();
}

function mapChatMessage(message: ChatMessageWithSender) {
  const senderRole = message.sender?.role ?? "citizen";
  const senderName = message.sender?.fullName ?? "System";

  return {
    id: message.id,
    authorId: message.senderId,
    authorName: senderName,
    authorRole: senderRole,
    message: message.message ?? "",
    createdAt: toIso(message.createdAt),
    isAdmin: senderRole !== "citizen",
    messageType: message.messageType,
    attachment: message.attachment,
    metadata: message.metadata,
  };
}

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

export async function addParticipant(roomId: string, userId: string, role: any) {
  return prisma.chatParticipant.upsert({
    where: { id: `${roomId}-${userId}` },
    create: { id: `${roomId}-${userId}`, roomId, userId, role: role as any },
    update: { role: role as any },
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
  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  return messages.reverse().map(mapChatMessage);
}

export async function markMessagesRead(roomId: string, userId: string) {
  await prisma.chatMessage.updateMany({ where: { roomId, receiverId: userId, isRead: false }, data: { isRead: true } });
  await prisma.chatNotification.updateMany({ where: { roomId, userId, read: false }, data: { read: true } });
  return { ok: true };
}

async function getLatestMessage(roomId: string) {
  const latest = await prisma.chatMessage.findFirst({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  return latest ? mapChatMessage(latest) : null;
}

export async function listThreadsForUser(input: {
  userId: string;
  role: string;
  search?: string;
  filter?: string;
}) {
  const rooms = await prisma.chatRoom.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      complaint: {
        include: {
          assignedOfficer: { select: { id: true, fullName: true, role: true } },
          reporterUser: { select: { id: true, fullName: true, role: true } },
        },
      },
      participants: true,
    },
  });

  const normalizedSearch = input.search?.trim().toLowerCase();

  const filtered = rooms.filter((room) => {
    const complaint = room.complaint;
    if (!complaint) return false;

    const isAdmin = ["super_admin", "state_admin", "district_officer", "department_officer", "admin"].includes(input.role);
    const isOfficer = input.role === "officer";
    const isCitizen = input.role === "citizen";

    if (isCitizen && complaint.reporterUserId !== input.userId) return false;
    if (isOfficer && complaint.assignedOfficerId !== input.userId) return false;
    if (!isCitizen && !isOfficer && !isAdmin) return false;

    if (input.filter === "mine" && complaint.reporterUserId !== input.userId) return false;
    if (input.filter === "assigned" && complaint.assignedOfficerId !== input.userId) return false;

    if (!normalizedSearch) return true;

    const haystack = [
      room.id,
      complaint.grievanceId,
      complaint.title,
      complaint.department,
      complaint.district,
      complaint.city,
      complaint.reporterName,
      complaint.assignedOfficerName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  const threads = await Promise.all(
    filtered.map(async (room) => {
      const complaint = room.complaint!;
      const latestMessage = await getLatestMessage(room.id);
      const unreadCount = await prisma.chatNotification.count({
        where: { roomId: room.id, userId: input.userId, read: false },
      });

      return {
        id: room.id,
        complaintId: complaint.id,
        grievanceId: complaint.grievanceId,
        title: complaint.title,
        department: complaint.department,
        district: complaint.district,
        status: complaint.status,
        priority: complaint.priority,
        officer: complaint.assignedOfficerName ?? complaint.suggestedOfficerName ?? "Unassigned",
        lastMessage: latestMessage?.message || complaint.status,
        lastMessageAuthor: latestMessage?.authorName ?? complaint.assignedOfficerName ?? complaint.reporterName,
        unreadCount,
        slaRemaining: complaint.slaDeadline ? complaint.slaDeadline.toISOString() : "Tracked",
        isTyping: false,
        lastMessageTime: (latestMessage?.createdAt ?? room.updatedAt.toISOString()),
        avatar: (complaint.assignedOfficerName ?? complaint.reporterName)
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join("") || "CB",
      };
    }),
  );

  return { threads };
}

export async function getRoomWorkspace(input: { roomId: string; userId: string; role: string }) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: input.roomId },
  });

  if (!room || !room.complaintId) {
    throw new AppError("Chat room not found", 404);
  }

  const complaint = await prisma.complaint.findFirst({
    where: { id: room.complaintId },
    include: {
      assignedOfficer: { select: { id: true, fullName: true, role: true } },
      reporterUser: { select: { id: true, fullName: true, role: true } },
      timelines: { orderBy: { createdAt: "asc" } },
      escalation: true,
    },
  });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  const aiInsights = await (prisma as any).aIInsight.findMany({
    where: { complaintId: complaint.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const participants = await prisma.chatParticipant.findMany({
    where: { roomId: room.id },
    include: {
      user: { select: { id: true, fullName: true, role: true } },
    },
  });

  const messages = await getMessages(room.id, 100);
  await markMessagesRead(room.id, input.userId).catch(() => null);

  return {
    room: {
      id: room.id,
      complaintId: room.complaintId,
      roomType: room.roomType,
      createdAt: toIso(room.createdAt),
      updatedAt: toIso(room.updatedAt),
    },
    complaint: {
      ...complaint,
      createdAt: toIso(complaint.createdAt),
      updatedAt: toIso(complaint.updatedAt),
      slaDeadline: complaint.slaDeadline ? toIso(complaint.slaDeadline) : null,
      timeline: Array.isArray(complaint.timeline) ? complaint.timeline : [],
      evidence: Array.isArray(complaint.evidence) ? complaint.evidence : [],
      resolutionEvidence: Array.isArray(complaint.resolutionEvidence) ? complaint.resolutionEvidence : [],
      aiInsights: aiInsights.map((insight: any) => ({
        ...insight,
        createdAt: toIso(insight.createdAt),
      })),
    },
    participants: participants.map((participant) => ({
      id: participant.id,
      userId: participant.userId,
      role: participant.role,
      joinedAt: toIso(participant.joinedAt),
      lastSeenAt: participant.lastSeenAt ? toIso(participant.lastSeenAt) : null,
      isMuted: participant.isMuted,
      user: participant.user,
    })),
    messages,
    unreadCount: await prisma.chatNotification.count({
      where: { roomId: room.id, userId: input.userId, read: false },
    }),
  };
}

export async function addMessageReaction(input: { roomId: string; messageId: string; userId: string; emoji: string }) {
  const message = await prisma.chatMessage.findFirst({
    where: { id: input.messageId, roomId: input.roomId },
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  const metadata = parseJsonObject(message.metadata);
  const reactions = Array.isArray(metadata.reactions) ? metadata.reactions : [];
  const existingIndex = reactions.findIndex((reaction: any) => reaction.userId === input.userId && reaction.emoji === input.emoji);

  if (existingIndex >= 0) {
    reactions.splice(existingIndex, 1);
  } else {
    reactions.push({ userId: input.userId, emoji: input.emoji, createdAt: new Date().toISOString() });
  }

  await prisma.chatMessage.update({
    where: { id: message.id },
    data: { metadata: { ...metadata, reactions } },
  });

  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: "chat.message.reaction",
        metadata: { roomId: input.roomId, messageId: input.messageId, emoji: input.emoji },
      },
    });
  } catch {
    // audit is best effort
  }

  return { ok: true };
}

export async function pinMessage(input: { roomId: string; messageId: string; pinned: boolean }) {
  const message = await prisma.chatMessage.findFirst({
    where: { id: input.messageId, roomId: input.roomId },
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  const metadata = parseJsonObject(message.metadata);

  await prisma.chatMessage.update({
    where: { id: message.id },
    data: { metadata: { ...metadata, pinned: input.pinned } },
  });

  try {
    await prisma.auditLog.create({
      data: {
        userId: message.senderId,
        action: input.pinned ? "chat.message.pinned" : "chat.message.unpinned",
        metadata: { roomId: input.roomId, messageId: input.messageId },
      },
    });
  } catch {
    // audit is best effort
  }

  return { ok: true };
}

export default {
  getOrCreateRoomForComplaint,
  getRoomById,
  addParticipant,
  sendMessage,
  getMessages,
  markMessagesRead,
  listThreadsForUser,
  getRoomWorkspace,
  addMessageReaction,
  pinMessage,
};
