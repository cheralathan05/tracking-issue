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

// Admin Chat Operations
export async function getAdminChatRooms(input: {
  search?: string;
  filter?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, filter = "all", sortBy = "latest", limit = 20, offset = 0 } = input;
  const normalizedSearch = search?.trim().toLowerCase();

  let whereClause: any = {};

  // Filter by status/priority if needed
  if (filter === "escalated") {
    whereClause.complaint = { escalation: { isNot: null } };
  } else if (filter === "urgent") {
    whereClause.complaint = { priority: { in: ["HIGH", "CRITICAL"] } };
  } else if (filter === "unread") {
    whereClause.notifications = { some: { read: false } };
  }

  // Search in complaint data
  if (normalizedSearch) {
    whereClause.complaint = {
      ...whereClause.complaint,
      OR: [
        { grievanceId: { contains: normalizedSearch, mode: "insensitive" } },
        { title: { contains: normalizedSearch, mode: "insensitive" } },
        { reporterName: { contains: normalizedSearch, mode: "insensitive" } },
        { assignedOfficerName: { contains: normalizedSearch, mode: "insensitive" } },
      ],
    };
  }

  const rooms = await prisma.chatRoom.findMany({
    where: whereClause,
    include: {
      complaint: {
        include: {
          assignedOfficer: { select: { id: true, fullName: true, role: true } },
          reporterUser: { select: { id: true, fullName: true } },
          escalation: true,
        },
      },
      participants: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      notifications: { where: { read: false } },
    },
    orderBy:
      sortBy === "oldest"
        ? { createdAt: "asc" }
        : sortBy === "activity"
          ? { updatedAt: "desc" }
          : { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return {
    rooms: rooms.map((room) => ({
      id: room.id,
      complaintId: room.complaint?.id,
      grievanceId: room.complaint?.grievanceId,
      citizen: room.complaint?.reporterName,
      officer: room.complaint?.assignedOfficerName || "Unassigned",
      department: room.complaint?.department,
      priority: room.complaint?.priority,
      status: room.complaint?.status,
      escalationLevel: room.complaint?.escalation?.level,
      isEscalated: !!room.complaint?.escalation,
      unreadCount: room.notifications.length,
      lastMessageTime: room.messages[0]?.createdAt.toISOString(),
      slaDeadline: room.complaint?.slaDeadline?.toISOString(),
      createdAt: room.createdAt.toISOString(),
    })),
    total: await prisma.chatRoom.count({ where: whereClause }),
  };
}

export async function getAdminChatDetails(input: { roomId: string; adminId: string }) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: input.roomId },
    include: {
      complaint: {
        include: {
          assignedOfficer: { select: { id: true, fullName: true, role: true, email: true } },
          reporterUser: { select: { id: true, fullName: true, role: true, email: true, mobile: true } },
          escalation: { include: { escalatedByUser: { select: { fullName: true } } } },
          timelines: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
      participants: { include: { user: { select: { id: true, fullName: true, role: true } } } },
    },
  });

  if (!room || !room.complaint) {
    throw new AppError("Chat room not found", 404);
  }

  const messages = await getMessages(room.id, 100);

  return {
    room: {
      id: room.id,
      complaintId: room.complaint.id,
      createdAt: toIso(room.createdAt),
    },
    complaint: {
      id: room.complaint.id,
      grievanceId: room.complaint.grievanceId,
      title: room.complaint.title,
      category: room.complaint.category,
      description: room.complaint.description,
      status: room.complaint.status,
      priority: room.complaint.priority,
      department: room.complaint.department,
      district: room.complaint.district,
      city: room.complaint.city,
      slaDeadline: room.complaint.slaDeadline?.toISOString(),
      createdAt: toIso(room.complaint.createdAt),
      citizen: {
        name: room.complaint.reporterName,
        email: room.complaint.reporterUser?.email,
        mobile: room.complaint.reporterUser?.mobile,
      },
      officer: {
        id: room.complaint.assignedOfficerId,
        name: room.complaint.assignedOfficerName,
        email: room.complaint.assignedOfficer?.email,
      },
      escalation: room.complaint.escalation
        ? {
            id: room.complaint.escalation.id,
            level: room.complaint.escalation.level,
            reason: room.complaint.escalation.reason,
            escalatedBy: room.complaint.escalation.escalatedByUser?.fullName,
            createdAt: toIso(room.complaint.escalation.createdAt),
          }
        : null,
      recentTimeline: room.complaint.timelines.map((t) => ({
        status: t.newStatus,
        changedAt: toIso(t.createdAt),
        reason: t.reason,
      })),
    },
    participants: participants.map((p) => ({
      userId: p.userId,
      name: p.user?.fullName,
      role: p.role,
      joinedAt: toIso(p.joinedAt),
    })),
    messages,
  };
}

export async function sendAdminMessage(input: {
  roomId: string;
  complaintId: string;
  adminId: string;
  message: string;
  attachment?: any;
}) {
  const { roomId, complaintId, adminId, message, attachment } = input;

  // Verify admin can access this room
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId, complaintId },
  });

  if (!room) {
    throw new AppError("Chat room not found", 404);
  }

  const created = await prisma.chatMessage.create({
    data: {
      roomId,
      senderId: adminId,
      complaintId,
      message,
      messageType: "admin_message",
      attachment: attachment || null,
    },
  });

  // Notify all participants
  const participants = await prisma.chatParticipant.findMany({ where: { roomId } });
  const notifications = participants
    .filter((p) => p.userId !== adminId)
    .map((p) => ({ userId: p.userId, roomId, messageId: created.id, type: "admin_message" }));

  if (notifications.length) {
    await prisma.chatNotification.createMany({ data: notifications });
  }

  // Audit log
  await createAdminAuditLog(adminId, "admin.chat.message", {
    roomId,
    messageId: created.id,
    complaintId,
  });

  return created;
}

export async function reassignComplaint(input: {
  complaintId: string;
  newOfficerId: string;
  adminId: string;
  reason?: string;
}) {
  const { complaintId, newOfficerId, adminId, reason } = input;

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  const newOfficer = await prisma.user.findUnique({ where: { id: newOfficerId } });
  if (!newOfficer) {
    throw new AppError("Officer not found", 404);
  }

  const oldOfficerId = complaint.assignedOfficerId;

  // Update complaint
  const updated = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      assignedOfficerId: newOfficerId,
      assignedOfficerName: newOfficer.fullName,
      assignedDepartment: newOfficer.department || complaint.assignedDepartment,
    },
  });

  // Create timeline entry
  await prisma.complaintTimeline.create({
    data: {
      complaintId,
      oldStatus: complaint.status,
      newStatus: complaint.status,
      changedBy: adminId,
      reason: `Officer reassigned from ${complaint.assignedOfficerName || "unassigned"} to ${newOfficer.fullName}. ${reason || ""}`,
    },
  });

  // Audit log
  await createAdminAuditLog(adminId, "admin.complaint.reassign", {
    complaintId,
    oldOfficerId,
    newOfficerId,
    reason,
  });

  return updated;
}

export async function escalateComplaint(input: {
  complaintId: string;
  level: string;
  reason: string;
  adminId: string;
}) {
  const { complaintId, level, reason, adminId } = input;

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  // Check if already escalated
  const existing = await prisma.escalation.findUnique({ where: { complaintId } });

  if (existing) {
    // Update existing escalation
    await prisma.escalation.update({
      where: { id: existing.id },
      data: { level, reason, status: "active" },
    });
  } else {
    // Create new escalation
    await prisma.escalation.create({
      data: {
        complaintId,
        escalatedBy: adminId,
        level,
        reason,
      },
    });
  }

  // Update complaint priority if high escalation
  if (level === "emergency" || level === "high") {
    await prisma.complaint.update({
      where: { id: complaintId },
      data: { priority: "CRITICAL" },
    });
  }

  // Audit log
  await createAdminAuditLog(adminId, "admin.complaint.escalate", {
    complaintId,
    level,
    reason,
  });

  return { ok: true };
}

export async function freezeComplaintChat(input: {
  complaintId: string;
  reason: string;
  adminId: string;
}) {
  const { complaintId, reason, adminId } = input;

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  // Add frozen flag to metadata
  const metadata = parseJsonObject(complaint.timeline);
  const updated = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      timeline: { ...metadata, chatFrozen: true, frozenAt: new Date().toISOString(), frozenReason: reason },
    },
  });

  // Audit log
  await createAdminAuditLog(adminId, "admin.chat.freeze", {
    complaintId,
    reason,
  });

  return updated;
}

export async function unfreezeComplaintChat(input: {
  complaintId: string;
  adminId: string;
}) {
  const { complaintId, adminId } = input;

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  const metadata = parseJsonObject(complaint.timeline);
  const updated = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      timeline: { ...metadata, chatFrozen: false, unfrozenAt: new Date().toISOString() },
    },
  });

  // Audit log
  await createAdminAuditLog(adminId, "admin.chat.unfreeze", { complaintId });

  return updated;
}

export async function broadcastAdminMessage(input: {
  message: string;
  priority?: string;
  adminId: string;
  scope?: "all" | "department" | "district";
  filters?: { department?: string; district?: string };
}) {
  const { message, priority = "medium", adminId, scope = "all", filters = {} } = input;

  // Find all relevant complaints
  let whereClause: any = {};
  if (scope === "department" && filters.department) {
    whereClause.department = filters.department;
  } else if (scope === "district" && filters.district) {
    whereClause.district = filters.district;
  }

  const complaints = await prisma.complaint.findMany({ where: whereClause });

  // Create notifications for all complaint participants
  const notifications: any[] = [];
  for (const complaint of complaints) {
    const room = await getOrCreateRoomForComplaint(complaint.id);
    const participants = await prisma.chatParticipant.findMany({ where: { roomId: room.id } });

    for (const participant of participants) {
      notifications.push({
        userId: participant.userId,
        roomId: room.id,
        type: "broadcast_alert",
      });
    }

    // Create system message
    await sendMessage({
      roomId: room.id,
      senderId: adminId,
      complaintId: complaint.id,
      message: `[BROADCAST ALERT]\n${message}`,
      messageType: "system_alert",
    });
  }

  if (notifications.length) {
    await prisma.chatNotification.createMany({ data: notifications });
  }

  // Audit log
  await createAdminAuditLog(adminId, "admin.broadcast.alert", {
    scope,
    filters,
    complaintCount: complaints.length,
  });

  return { broadcastTo: complaints.length };
}

// Audit Logging Helper
export async function createAdminAuditLog(
  adminId: string,
  action: string,
  metadata?: Record<string, any>,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action,
        metadata: metadata || {},
      },
    });
  } catch (e) {
    // swallow errors
  }
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
  getAdminChatRooms,
  getAdminChatDetails,
  sendAdminMessage,
  reassignComplaint,
  escalateComplaint,
  freezeComplaintChat,
  unfreezeComplaintChat,
  broadcastAdminMessage,
  createAdminAuditLog,
};
