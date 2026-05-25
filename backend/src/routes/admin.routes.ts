import { Router } from "express";

import { getDashboard, searchDashboard } from "../controllers/admin.controller.js";
import {
  exportAdminComplaints,
  listAdminComplaints,
  listAdminComplaintStats,
  queryAdminComplaints,
} from "../controllers/admin-complaint.controller.js";
import {
  listAdminChatRooms,
  getAdminChatRoom,
  sendAdminMessage,
  reassignComplaintOfficer,
  escalateComplaintHandler,
  freezeChat,
  unfreezeChat,
  broadcastAlert,
} from "../controllers/admin-chat.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

export const adminRouter = Router();

adminRouter.use(
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin", "officer"),
);

adminRouter.get("/dashboard", getDashboard);
adminRouter.get("/search", searchDashboard);
adminRouter.get("/complaints", listAdminComplaints);
adminRouter.get("/complaints/stats", listAdminComplaintStats);
adminRouter.get("/complaints/search", queryAdminComplaints);
adminRouter.get("/complaints/export", exportAdminComplaints);

// Admin Chat Routes
adminRouter.get("/chat/rooms", listAdminChatRooms);
adminRouter.get("/chat/:roomId", getAdminChatRoom);
adminRouter.post("/chat/:roomId/message", sendAdminMessage);
adminRouter.post("/chat/:complaintId/reassign", reassignComplaintOfficer);
adminRouter.post("/chat/:complaintId/escalate", escalateComplaintHandler);
adminRouter.post("/chat/:complaintId/freeze", freezeChat);
adminRouter.post("/chat/:complaintId/unfreeze", unfreezeChat);
adminRouter.post("/chat/broadcast", broadcastAlert);