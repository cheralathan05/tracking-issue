import type { RequestHandler } from "express";

import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { publicUserSelect } from "../constants/user.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/errors.js";

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((accumulator, part) => {
    const [name, ...rest] = part.split("=");

    if (!name) {
      return accumulator;
    }

    const key = name.trim();
    const value = rest.join("=").trim();

    if (key) {
      accumulator[key] = decodeURIComponent(value);
    }

    return accumulator;
  }, {});
}

function getTokenFromRequest(req: Parameters<RequestHandler>[0]): string | undefined {
  const authorization = req.headers.authorization;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  const cookies = parseCookies(req.headers.cookie);
  return cookies[env.AUTH_ACCESS_COOKIE_NAME];
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new AppError("Missing token", 401);
    }

    const payload = verifyAccessToken(token);

    if (!payload.sub) {
      throw new AppError("Unauthorized access", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: publicUserSelect,
    });

    if (!user) {
      throw new AppError("Unauthorized access", 401);
    }

    if (!user.isVerified || !user.emailVerified) {
      throw new AppError("Please verify your email before login", 403);
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError("Unauthorized access", 401));
      return;
    }

    if (!allowedRoles.includes(String(req.user.role))) {
      next(new AppError("Forbidden", 403));
      return;
    }

    next();
  };
}
