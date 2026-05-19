const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api";
const TOKEN_STORAGE_KEY = "smartgov_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "smartgov_refresh_token";

function buildUrl(path: string) {
  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const payloadPart = token.split(".")[1];

  if (!payloadPart) {
    return null;
  }

  try {
    const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalizedPayload.length % 4)) % 4);
    const decoded = window.atob(`${normalizedPayload}${padding}`);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isStoredAccessTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const expiresAt = typeof payload?.exp === "number" ? payload.exp * 1000 : null;

  if (!expiresAt) {
    return true;
  }

  return expiresAt <= Date.now() + 30_000;
}

export async function ensureAuthSession(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const storedToken = getStoredToken();

  if (storedToken && !isStoredAccessTokenExpired(storedToken)) {
    return storedToken;
  }

  try {
    const response = await request<{ token: string; user: { role: string; email: string; fullName: string } }>(
      "/auth/refresh-token",
      { method: "POST" },
    );

    if (response.data?.token) {
      setStoredTokens(response.data.token);
      return response.data.token;
    }
  } catch {
    clearStoredTokens();
  }

  return null;
}

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  mobile?: string;
  state?: string;
  district?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  otp?: string;
  emailVerificationRequired?: boolean;
  user?: unknown;
  errors?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

function formatValidationErrors(errors: NonNullable<ApiResponse<unknown>["errors"]>) {
  const messages = [
    ...(errors.formErrors ?? []),
    ...Object.values(errors.fieldErrors ?? {}).flatMap((value) => value ?? []),
  ].filter((value): value is string => Boolean(value));

  const uniqueMessages = Array.from(new Set(messages));

  if (uniqueMessages.length === 0) {
    return null;
  }

  return uniqueMessages.join("; ");
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      ...init,
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error(
      "Unable to reach the authentication service. Make sure the backend is running.",
    );
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    const validationDetails = payload?.errors ? formatValidationErrors(payload.errors) : null;
    const message = payload?.message ?? "Request failed";

    throw new Error(validationDetails ? `${message}: ${validationDetails}` : message);
  }

  return payload ?? { success: true, message: "OK" };
}

export function loginCitizen(identifier: string, password: string, rememberMe = false) {
  return request<{ token: string; user: { role: string; email: string; fullName: string } }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ identifier, password, rememberMe }),
    },
  ).then((response) => {
    if (response.data?.token) {
      setStoredTokens(response.data.token);
    }

    return response;
  });
}

export function loginAdmin(email: string, password: string, rememberMe = true) {
  return request<{ otp?: string; email?: string }>("/auth/admin-login", {
    method: "POST",
    body: JSON.stringify({ identifier: email, password, rememberMe }),
  });
}

export function registerAdmin(payload: {
  fullName: string;
  email: string;
  mobile: string;
  state: string;
  district: string;
  address: string;
  role: string;
  password: string;
  confirmPassword: string;
}) {
  return request<{ otp?: string }>("/auth/admin/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerCitizen(payload: {
  fullName: string;
  email: string;
  mobile: string;
  aadhaar: string;
  state: string;
  district: string;
  address: string;
  password: string;
  confirmPassword: string;
}) {
  return request<{ token?: string; user?: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((response) => {
    if (response.data?.token) {
      setStoredTokens(response.data.token);
    }

    return response;
  });
}

export function forgotPassword(email: string) {
  return request<{ otp?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(
  email: string,
  otp: string,
  purpose: "registration" | "password_reset" | "admin_login",
) {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp, purpose }),
  }).then((response) => {
    // Store token if authentication was successful
    if (response.data?.token) {
      setStoredTokens(response.data.token);
    }
    return response;
  });
}

export function resetPassword(email: string, newPassword: string, confirmPassword: string) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, newPassword, confirmPassword }),
  });
}

export function getProfile() {
  return request<{ user: AuthUser }>("/auth/profile", { method: "GET" });
}

export function logout() {
  clearStoredTokens();
  return request("/auth/logout", { method: "POST" });
}
