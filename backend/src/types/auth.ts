export interface PublicCitizen {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  aadhaar: string;
  state: string;
  district: string;
  address: string;
  role: string;
  isVerified: boolean;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthJwtPayload {
  sub: string;
  role: string;
  tokenType: "access" | "refresh";
  jti: string;
  rememberMe?: boolean;
}
