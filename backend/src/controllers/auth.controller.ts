import type { Request, Response } from "express";

import { env } from "../config/env.js";
import {
  getCurrentCitizen,
  loginAdmin,
  loginCitizen,
  logoutUser,
  registerAdmin,
  registerCitizen,
  refreshAuthSession,
  resetPassword,
  startForgotPasswordFlow,
  verifyOtpFlow,
} from "../services/auth.service.js";

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((accumulator, part) => {
    const [name, ...rest] = part.split("=");
    if (!name) {
      return accumulator;
    }
    accumulator[name.trim()] = decodeURIComponent(rest.join("=").trim());
    return accumulator;
  }, {});
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
  };

  res.cookie(env.AUTH_ACCESS_COOKIE_NAME, accessToken, {
    path: "/",
    ...cookieOptions,
  });
  res.cookie(env.AUTH_REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieOptions,
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response) {
  const isProduction = env.NODE_ENV === "production";
  const cookieOptions = {
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
  };

  res.clearCookie(env.AUTH_ACCESS_COOKIE_NAME, { path: "/", ...cookieOptions });
  res.clearCookie(env.AUTH_REFRESH_COOKIE_NAME, { path: "/api/auth", ...cookieOptions });
}

function extractRefreshToken(req: Request) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[env.AUTH_REFRESH_COOKIE_NAME];
}

export async function register(req: Request, res: Response) {
  const result = await registerCitizen(req.body, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  res.status(201).json({
    success: true,
    message: result.message,
    data: result,
  });
}

export async function registerAdminUser(req: Request, res: Response) {
  const result = await registerAdmin(req.body, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  res.status(201).json({
    success: true,
    message: result.message,
    data: result,
  });
}

export async function login(req: Request, res: Response) {
  const result = await loginCitizen(req.body, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  setAuthCookies(res, result.accessToken, result.refreshToken);

  res.status(200).json({
    success: true,
    message: result.message,
    data: { user: (result as any).user },
  });
}

export async function adminLogin(req: Request, res: Response) {
  const result = await loginAdmin(req.body, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  // If a session was returned (verified admin), set auth cookies and return user
    if ("accessToken" in result && result.accessToken && result.refreshToken) {
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      message: result.message,
        data: { user: (result as any).user },
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: result.message,
    data: { otp: result.otp, email: result.email },
  });
}

export async function refreshToken(req: Request, res: Response) {
  const refreshTokenValue = extractRefreshToken(req);

  if (!refreshTokenValue) {
    res.status(401).json({ success: false, message: "Missing refresh token" });
    return;
  }

  const result = await refreshAuthSession(refreshTokenValue, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  setAuthCookies(res, result.accessToken, result.refreshToken);

  res.status(200).json({
    success: true,
    message: result.message,
    data: { user: (result as any).user },
  });
}

export async function profile(req: Request, res: Response) {
  const userId = req.tokenPayload?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Missing token",
    });
    return;
  }

  const user = await getCurrentCitizen(userId);

  res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    data: { user },
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const result = await startForgotPasswordFlow(req.body, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
}

export async function verifyOtp(req: Request, res: Response) {
  const result = await verifyOtpFlow(req.body, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  if ("accessToken" in result && result.accessToken && result.refreshToken) {
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { user: (result as any).user },
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: result.message,
    data: { user: (result as any).user },
  });
}

export async function resetCitizenPassword(req: Request, res: Response) {
  const result = await resetPassword(req.body, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  res.status(200).json({
    success: true,
    message: result.message,
    data: { user: (result as any).user },
  });
}

export async function logout(req: Request, res: Response) {
  const refreshTokenValue = extractRefreshToken(req);
  const userId = req.tokenPayload?.sub;

  if (userId) {
    await logoutUser(userId, refreshTokenValue, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });
  }

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}
