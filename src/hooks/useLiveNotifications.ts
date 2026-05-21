import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSocket } from "./useSocket";
import { getProfile, type AuthUser } from "@/lib/auth-api";
import {
  fetchNotifications as fetchNotificationsApi,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
} from "@/lib/smartgov-api";

export type LiveNotification = {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "critical";
  priority: "low" | "medium" | "high" | "critical";
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  data?: Record<string, unknown> | null;
};

export function useLiveNotifications(initialUser?: AuthUser) {
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useSocket();

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  useEffect(() => {
    let mounted = true;

    async function resolveProfile() {
      if (initialUser) {
        setUser(initialUser);
        return;
      }

      try {
        const profile = await getProfile();

        if (mounted && profile.data?.user) {
          setUser(profile.data.user);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      }
    }

    resolveProfile();

    return () => {
      mounted = false;
    };
  }, [initialUser]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let socket = socketRef.current;

    async function loadNotifications() {
      setLoading(true);

      try {
        const result = await fetchNotificationsApi();

        if (mounted) {
          setNotifications(result.notifications ?? []);
        }
      } catch {
        if (mounted) {
          setNotifications([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    const eventHandler = (notification: LiveNotification) => {
      setNotifications((current) => [notification, ...current].slice(0, 50));
      toast(notification.title, { description: notification.message });
    };

    if (socket) {
      socket.emit("identify", { userId: user.id, role: user.role });
      socket.on("notification", eventHandler);
    }

    return () => {
      mounted = false;
      if (socket) {
        socket.off("notification", eventHandler);
      }
    };
  }, [socketRef, user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationReadApi(notificationId);
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
      );
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch {
      // ignore
    }
  };

  return {
    user,
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
  };
}
