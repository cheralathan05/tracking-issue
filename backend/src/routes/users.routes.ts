import { Router } from "express";

import { getAdminUsers, patchAdminUser } from "../controllers/users.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { adminUserUpdateSchema } from "../utils/validators.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  getAdminUsers,
);

usersRouter.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "state_admin", "district_officer", "department_officer", "admin"),
  validateBody(adminUserUpdateSchema),
  patchAdminUser,
);
