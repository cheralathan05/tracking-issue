import { Router } from "express";

import { authLimiter, otpLimiter } from "../middleware/rate-limiters.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  forgotPasswordSchema,
  adminLoginSchema,
  loginSchema,
  registerSchema,
  adminRegisterSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "../utils/validators.js";
import {
  forgotPassword,
  adminLogin,
  login,
  logout,
  profile,
  register,
  registerAdminUser,
  resetCitizenPassword,
  refreshToken,
  verifyOtp,
} from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validateBody(registerSchema), register);
authRouter.post(
  "/admin/register",
  authLimiter,
  validateBody(adminRegisterSchema),
  registerAdminUser,
);
authRouter.post("/admin-login", authLimiter, validateBody(adminLoginSchema), adminLogin);
authRouter.post("/login", authLimiter, validateBody(loginSchema), login);
authRouter.post("/refresh-token", authLimiter, refreshToken);
authRouter.get("/profile", requireAuth, profile);
authRouter.post("/forgot-password", otpLimiter, validateBody(forgotPasswordSchema), forgotPassword);
authRouter.post("/verify-otp", otpLimiter, validateBody(verifyOtpSchema), verifyOtp);
authRouter.post(
  "/reset-password",
  otpLimiter,
  validateBody(resetPasswordSchema),
  resetCitizenPassword,
);
authRouter.post("/logout", requireAuth, logout);
