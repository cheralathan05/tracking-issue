import { prisma } from "../config/prisma.js";
import { safeEmitToRole, safeEmitToUser } from "../socket.js";

export type NotificationPriority = "low" | "medium" | "high" | "critical";
export type NotificationType =
  | "submission"
  | "assignment"
  | "status"
  | "chat"
  | "escalation"
  | "admin"
  | "info";

export interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  actionUrl?: string;
  data?: Record<string, unknown> | null;
}

export async function createNotification(userId: string, payload: NotificationPayload) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      priority: payload.priority,
      actionUrl: payload.actionUrl ?? null,
      data: payload.data ?? null,
    },
  });

  safeEmitToUser(userId, "notification", {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    actionUrl: notification.actionUrl,
    data: notification.data,
  });

  return notification;
}

export async function createNotificationsForRole(role: string, payload: NotificationPayload) {
  const users = await prisma.user.findMany({
    where: { role },
    select: { id: true },
  });

  const notifications = await Promise.all(
    users.map(async (user) => {
      const notification = await createNotification(user.id, payload);
      return notification;
    }),
  );

  return notifications;
}

export async function listNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notifications.map((notification) => ({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  }));
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return null;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return true;
}
