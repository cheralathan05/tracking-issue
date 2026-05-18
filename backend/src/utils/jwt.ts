import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";

import { env } from "../config/env.js";
import type { AuthJwtPayload } from "../types/auth.js";

export function createJti(): string {
  return crypto.randomUUID();
}

export function signAccessToken(
  userId: string,
  role: string,
  rememberMe = false,
  jti = createJti(),
): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(
    { sub: userId, role, tokenType: "access", jti, rememberMe } as jwt.JwtPayload,
    env.JWT_SECRET,
    options,
  );
}

export function signRefreshToken(
  userId: string,
  role: string,
  rememberMe = false,
  jti = createJti(),
): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(
    { sub: userId, role, tokenType: "refresh", jti, rememberMe } as jwt.JwtPayload,
    env.JWT_REFRESH_SECRET,
    options,
  );
}

export function verifyAccessToken(token: string): AuthJwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthJwtPayload;
}

export function verifyRefreshToken(token: string): AuthJwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthJwtPayload;
}
