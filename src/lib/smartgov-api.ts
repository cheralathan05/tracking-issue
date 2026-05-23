const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api";

function buildUrl(path: string, query?: Record<string, string | number | boolean | null | undefined>) {
  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const searchParams = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";

  if (normalizedBase.startsWith("http://") || normalizedBase.startsWith("https://")) {
    return `${normalizedBase}${normalizedPath}${suffix}`;
  }

  return `${normalizedBase}${normalizedPath}${suffix}`;
}

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
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

async function request<T>(path: string, init?: RequestInit, query?: Record<string, string | number | boolean | null | undefined>): Promise<T> {
  let response: Response;

  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    };

    response = await fetch(buildUrl(path, query), {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new Error("Unable to reach the SmartGov backend. Make sure the backend is running.");
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    const validationDetails = payload?.errors ? formatValidationErrors(payload.errors) : null;
    const message = payload?.message ?? "Request failed";
    throw new Error(validationDetails ? `${message}: ${validationDetails}` : message);
  }

  return (payload?.data ?? ({} as T));
}

export type ComplaintStatus =
  | "Submitted"
  | "Under Review"
  | "Assigned"
  | "In Progress"
  | "Awaiting Information"
  | "Resolved"
  | "Escalated"
  | "Rejected"
  | "Closed";

export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";

export interface ComplaintEvidence {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface ComplaintTimelineEntry {
  date: string;
  action: string;
  by: string;
  note?: string;
}

export interface ComplaintMessageRecord {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
  isAdmin: boolean;
}

export interface OfficerSummary {
  id: string;
  fullName: string;
  username?: string | null;
  email: string;
  mobile: string;
  department?: string | null;
  jurisdictionArea?: string | null;
  officerCode?: string | null;
  role: string;
  isVerified: boolean;
  emailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserRecord {
  id: string;
  fullName: string;
  username?: string | null;
  email: string;
  mobile: string;
  state: string;
  district: string;
  address: string;
  department?: string | null;
  jurisdictionArea?: string | null;
  officerCode?: string | null;
  role: string;
  isVerified: boolean;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserCounts {
  total: number;
  citizens: number;
  officers: number;
  admins: number;
  verified: number;
  pending: number;
}

export interface AdminUserListResult {
  users: AdminUserRecord[];
  counts: AdminUserCounts;
}

export interface ComplaintRecord {
  id: string;
  grievanceId: string;
  reporterName: string;
  reporterEmail?: string | null;
  reporterMobile?: string | null;
  title: string;
  category: string;
  department: string;
  description: string;
  state: string;
  district: string;
  city: string;
  address: string;
  landmark?: string | null;
  pincode: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  publicVisibility: boolean;
  escalationLevel?: number | null;
  escalatedAt?: string | null;
  escalationReason?: string | null;
  suggestedOfficerId?: string | null;
  suggestedOfficerName?: string | null;
  assignedOfficerId?: string | null;
  assignedOfficerName?: string | null;
  assignedDepartment?: string | null;
  assignedArea?: string | null;
  evidence: ComplaintEvidence[];
  timeline: ComplaintTimelineEntry[];
  resolutionSummary?: string | null;
  resolutionEvidence: ComplaintEvidence[];
  createdAt: string;
  updatedAt: string;
  assignedOfficer?: OfficerSummary | null;
  reporterUser?: OfficerSummary | null;
}

export interface ComplaintListResult {
  complaintCount: number;
  complaints: ComplaintRecord[];
}

export interface ComplaintSummary {
  submitted: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  escalated: number;
  total: number;
}

export interface OfficerInvitationRecord {
  id: string;
  code: string;
  fullName: string;
  email: string;
  mobile: string;
  username?: string | null;
  department: string;
  area: string;
  role: string;
  status: string;
  invitedById?: string | null;
  acceptedById?: string | null;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  invitationUrl?: string;
  sentVia?: string[];
}

export function createComplaint(payload: {
  reporterName: string;
  reporterEmail?: string;
  reporterMobile: string;
  title: string;
  category: string;
  description: string;
  state: string;
  district: string;
  city: string;
  address: string;
  landmark?: string;
  pincode: string;
  priority: ComplaintPriority;
  publicVisibility: boolean;
  latitude?: number | null;
  longitude?: number | null;
  evidence: ComplaintEvidence[];
}) {
  return request<{ complaint: ComplaintRecord }>("/complaints", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listComplaints(query?: {
  view?: "all" | "mine" | "assigned";
  status?: ComplaintStatus;
  search?: string;
  limit?: number;
  summaryOnly?: boolean;
}) {
  return request<ComplaintListResult>("/complaints", { method: "GET" }, query as Record<string, string | number | boolean | null | undefined>);
}

export function getComplaint(id: string) {
  return request<{ complaint: ComplaintRecord }>(`/complaints/${encodeURIComponent(id)}`, { method: "GET" });
}

export function listComplaintMessages(id: string) {
  return request<{ messages: ComplaintMessageRecord[] }>(`/complaints/${encodeURIComponent(id)}/messages`, {
    method: "GET",
  });
}

export function sendComplaintMessage(id: string, message: string) {
  return request<{ messageRecord: ComplaintMessageRecord }>(`/complaints/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function updateComplaintStatus(
  id: string,
  payload: {
    status: ComplaintStatus;
    note?: string;
    resolutionSummary?: string;
    resolutionEvidence?: ComplaintEvidence[];
  },
) {
  return request<{ complaint: ComplaintRecord }>(`/complaints/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function assignComplaint(
  id: string,
  payload: {
    officerId?: string;
    useSuggestedOfficer?: boolean;
  },
) {
  return request<{ complaint: ComplaintRecord }>(`/complaints/${encodeURIComponent(id)}/assign`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchComplaintSummary() {
  return request<ComplaintSummary>("/complaints/summary", { method: "GET" });
}

export function createOfficerInvitation(payload: {
  fullName: string;
  email: string;
  mobile: string;
  department: string;
  area: string;
  username?: string;
}) {
  return request<{ invitation: OfficerInvitationRecord }>("/officers/invitations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOfficerInvitation(token: string) {
  return request<{ invitation: OfficerInvitationRecord }>("/officers/invitations/resolve", {
    method: "GET",
  }, { token });
}

export function acceptOfficerInvitation(
  token: string,
  payload: {
    username?: string;
    password: string;
    confirmPassword: string;
  },
) {
  return request<{ user: OfficerSummary }>("/officers/invitations/accept", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { token });
}

export function resendOfficerInvitation(code: string) {
  return request<{ invitation: OfficerInvitationRecord }>(`/officers/invitations/${encodeURIComponent(code)}/resend`, {
    method: "POST",
  });
}

export function regenerateOfficerInvitation(code: string) {
  return request<{ invitation: OfficerInvitationRecord }>(`/officers/invitations/${encodeURIComponent(code)}/regenerate`, {
    method: "POST",
  });
}

export function listOfficers() {
  return request<{ officers: OfficerSummary[] }>("/officers", { method: "GET" });
}

export function listOfficerInvitations() {
  return request<{ invitations: OfficerInvitationRecord[] }>("/officers/invitations", { method: "GET" });
}

export function listAdminUsers(query?: {
  scope?: "all" | "citizen" | "officer" | "admin";
  verification?: "all" | "verified" | "pending";
  search?: string;
}) {
  return request<AdminUserListResult>(
    "/users",
    { method: "GET" },
    query as Record<string, string | number | boolean | null | undefined>,
  );
}

export function updateAdminUser(
  id: string,
  payload: {
    role?:
      | "super_admin"
      | "state_admin"
      | "district_officer"
      | "department_officer"
      | "citizen"
      | "admin"
      | "officer";
    isVerified?: boolean;
    emailVerified?: boolean;
  },
) {
  return request<{ user: AdminUserRecord }>(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function requestComplaintSummaryForDashboard() {
  return fetchComplaintSummary();
}

export type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "critical";
  priority: "low" | "medium" | "high" | "critical";
  isRead: boolean;
  actionUrl?: string;
  data?: Record<string, unknown> | null;
  createdAt: string;
};

export function fetchNotifications() {
  return request<{ notifications: NotificationRecord[] }>("/notifications", { method: "GET" });
}

export function markNotificationRead(id: string) {
  return request<{ notification: NotificationRecord }>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "POST",
  });
}

export function markAllNotificationsRead() {
  return request<void>("/notifications/read-all", { method: "POST" });
}

// Escalation APIs
export type EscalationRecord = {
  id: string;
  complaintId: string;
  reason: string;
  level: "low" | "medium" | "high" | "emergency";
  status: "active" | "resolved" | "closed";
  escalatedBy: string;
  escalatedByUser: { id: string; fullName: string; email: string };
  resolvedBy?: string | null;
  resolvedByUser?: { id: string; fullName: string; email: string } | null;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
};

export function createEscalation(complaintId: string, reason: string, level?: "low" | "medium" | "high" | "emergency") {
  return request<{ escalation: EscalationRecord }>("/escalations", {
    method: "POST",
    body: JSON.stringify({ complaintId, reason, level }),
  });
}

export function listEscalations(filters?: { status?: string; level?: string; complaintId?: string }) {
  return request<{ escalations: EscalationRecord[] }>("/escalations", {
    method: "GET",
  }, filters);
}

export function getEscalation(id: string) {
  return request<{ escalation: EscalationRecord }>(`/escalations/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export function updateEscalation(
  id: string,
  update: { status?: "active" | "resolved" | "closed"; resolutionNote?: string }
) {
  return request<{ escalation: EscalationRecord }>(`/escalations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

// Feedback APIs
export type FeedbackRecord = {
  id: string;
  complaintId: string;
  rating: number;
  comment?: string | null;
  officerRating?: number | null;
  overallSatisfaction: boolean;
  suggestedImprovements?: string | null;
  submittedBy: string;
  submittedByUser: { id: string; fullName: string; email: string };
  createdAt: string;
  updatedAt: string;
};

export function submitFeedback(
  complaintId: string,
  feedback: {
    rating: number;
    comment?: string;
    officerRating?: number;
    overallSatisfaction?: boolean;
    suggestedImprovements?: string;
  }
) {
  return request<{ feedback: FeedbackRecord }>("/feedback", {
    method: "POST",
    body: JSON.stringify({ complaintId, ...feedback }),
  });
}

export function getFeedback(complaintId: string) {
  return request<{ feedback: FeedbackRecord }>(`/feedback/complaint/${encodeURIComponent(complaintId)}`, {
    method: "GET",
  });
}

export function listFeedback(filters?: { officerId?: string; rating?: number }) {
  return request<{ feedback: FeedbackRecord[]; total: number }>("/feedback", {
    method: "GET",
  }, filters);
}

export type SatisfactionAnalytics = {
  totalFeedback: number;
  averageRating: number;
  averageOfficerRating: number;
  satisfactionRate: number;
  ratingDistribution: Record<number, number>;
  officerStats: Record<string, { name: string; rating: number; count: number }>;
};

export function getCitizenSatisfactionAnalytics() {
  return request<{ analytics: SatisfactionAnalytics }>("/feedback/analytics/satisfaction", {
    method: "GET",
  });
}

export type OfficerPerformance = {
  totalComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number;
  totalFeedback: number;
  averageRating: number;
  satisfactionRate: number;
};

export function getOfficerPerformance(officerId: string) {
  return request<{ performance: OfficerPerformance }>(`/feedback/officer/${encodeURIComponent(officerId)}/performance`, {
    method: "GET",
  });
}

// Complaint Analytics
export type ComplaintAnalytics = {
  totalComplaints: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  avgResolutionTime: number;
  satisfactionRating: number;
  feedback: Array<{ complaintId: string; rating: number; comment?: string; date: string }>;
  escalations: number;
  resolutionRate: number;
  monthlyTrend: Array<{ month: string; count: number; resolved: number }>;
};

export function getComplaintAnalytics() {
  return request<{ analytics: ComplaintAnalytics }>("/complaints/analytics/personal", {
    method: "GET",
  });
}
