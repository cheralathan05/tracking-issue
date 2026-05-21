import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  fetchNotifications,
  markNotificationAsRead,
  markNotificationsRead,
} from "../controllers/notification.controller.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);
notificationRouter.get("/", fetchNotifications);
notificationRouter.post("/:id/read", markNotificationAsRead);
notificationRouter.post("/read-all", markNotificationsRead);
