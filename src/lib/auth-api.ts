const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api";

function buildUrl(path: string) {
  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function ensureAuthSession(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const profile = await getProfile();

    if (profile.data?.user) {
      return "session";
    }
  } catch {
    try {
      await request("/auth/refresh-token", { method: "POST" });
      const profile = await getProfile();

      if (profile.data?.user) {
        return "session";
      }
    } catch {
      return null;
    }
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

function isValidationErrorPayload(errors: unknown): errors is NonNullable<ApiResponse<unknown>["errors"]> {
  return (
    typeof errors === "object" &&
    errors !== null &&
    Object.values(errors).every((value) => value === undefined || Array.isArray(value))
  );
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
    const message = payload?.message ?? "Request failed";
    const error = new Error(message) as Error & { payload?: ApiResponse<T> | null };
    error.payload = payload;

    if (payload?.errors && isValidationErrorPayload(payload.errors)) {
      const validationDetails = formatValidationErrors(payload.errors);
      if (validationDetails) {
        error.message = `${message}: ${validationDetails}`;
      }
    }

    throw error;
  }

  return payload ?? { success: true, message: "OK" };
}

export function loginCitizen(identifier: string, password: string, rememberMe = false) {
  return request<{ user: { role: string; email: string; fullName: string } }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ identifier, password, rememberMe }),
    },
  );
}

export function loginAdmin(email: string, password: string, rememberMe = true) {
  return request<{ user?: AuthUser; otp?: string; email?: string }>("/auth/admin-login", {
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
  return request<{ user?: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
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
  return request("/auth/logout", { method: "POST" });
}
