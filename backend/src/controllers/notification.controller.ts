import type { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service.js";

export async function fetchNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await notificationService.listNotifications(req.user.id);
    res.json({ success: true, data: { notifications } });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await notificationService.markNotificationRead(req.params.id, req.user.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read", data: { notification } });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllNotificationsRead(req.user.id);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
}
