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
    const initHeaders = init?.headers;
    const headerObj: Record<string, string> = {};
    
    if (initHeaders) {
      if (initHeaders instanceof Headers) {
        initHeaders.forEach((value, key) => {
          headerObj[key] = value;
        });
      } else if (typeof initHeaders === 'object') {
        Object.assign(headerObj, initHeaders);
      }
    }

    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...headerObj,
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
  reporterUserId?: string | null;
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
  latitude?: number | null;
  longitude?: number | null;
  slaDeadline?: string | null;
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

export interface DepartmentRecord {
  name: string;
  complaintCount: number;
  officerCount: number;
}

export interface AdminComplaintStats {
  total: number;
  pending: number;
  slaBreached: number;
  statusCounts: {
    submitted: number;
    underReview: number;
    assigned: number;
    inProgress: number;
    awaitingInformation: number;
    resolved: number;
    escalated: number;
    rejected: number;
    closed: number;
  };
  departmentWorkload: Array<{ department: string; count: number }>;
  officerWorkload: Array<{ officerId: string | null; officerName: string; count: number }>;
}

export interface AdminComplaintSearchResult {
  query: string;
  complaintCount: number;
  complaints: ComplaintRecord[];
}

export interface AdminDashboardComplaintItem {
  id: string;
  grievanceId: string;
  reporterName: string;
  title: string;
  department: string;
  district: string;
  city: string;
  status: ComplaintStatus | string;
  priority: ComplaintPriority | string;
  assignedOfficerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDepartmentPerformance {
  name: string;
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  escalationCount: number;
  slaCompliance: number;
  avgResponseHours: number;
  resolutionRate: number;
}

export interface AdminDashboardResponse {
  summary: {
    totalComplaints: number;
    resolvedComplaints: number;
    pendingComplaints: number;
    escalations: number;
    criticalComplaints: number;
    registeredCitizens: number;
    activeOfficers: number;
    offlineOfficers: number;
  };
  escalationMetrics: {
    totalEscalations: number;
    openEscalations: number;
    resolvedEscalations: number;
    criticalEscalations: number;
    breachedSlaCases: number;
  };
  citizenMetrics: {
    registeredCitizens: number;
    activeComplaints: number;
    feedbackCount: number;
    averageRating: number;
  };
  officerMetrics: {
    totalOfficers: number;
    activeOfficers: number;
    offlineOfficers: number;
    departmentAssignments: Array<{ department: string; count: number }>;
    topOfficers: Array<{
      id: string;
      fullName: string;
      email: string;
      department: string | null;
      jurisdictionArea: string | null;
      activeComplaints: number;
      resolvedComplaints: number;
      lastLoginAt: string | null;
    }>;
  };
  departmentPerformance: AdminDepartmentPerformance[];
  recentComplaints: AdminDashboardComplaintItem[];
}

export interface AdminSearchResult {
  query: string;
  counts: {
    complaints: number;
    users: number;
    officers: number;
    departments: number;
  };
  complaints: AdminDashboardComplaintItem[];
  users: Array<{
    id: string;
    fullName: string;
    username: string | null;
    email: string;
    mobile: string;
    state: string;
    district: string;
    department: string | null;
    role: string;
    isVerified: boolean;
    emailVerified: boolean;
    createdAt: string;
  }>;
  officers: Array<{
    id: string;
    fullName: string;
    username: string | null;
    email: string;
    mobile: string;
    department: string | null;
    jurisdictionArea: string | null;
    officerCode: string | null;
    role: string;
    isVerified: boolean;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  departments: Array<{
    name: string;
    complaintCount: number;
    officerCount: number;
  }>;
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
  district?: string;
  department?: string;
  priority?: string;
  officer?: string;
  escalationLevel?: string;
  offset?: number;
}) {
  return request<ComplaintListResult>("/complaints", { method: "GET" }, query as Record<string, string | number | boolean | null | undefined>);
}

export function listAdminComplaints(query?: {
  status?: string;
  q?: string;
  department?: string;
  officerId?: string;
  priority?: string;
  escalated?: boolean;
  limit?: number;
  offset?: number;
}) {
  return request<ComplaintListResult>(
    "/admin/complaints",
    { method: "GET" },
    query as Record<string, string | number | boolean | null | undefined>,
  );
}

export function searchAdminComplaints(query: string, filters?: {
  status?: string;
  department?: string;
  officerId?: string;
  priority?: string;
  escalated?: boolean;
  limit?: number;
  offset?: number;
}) {
  return request<AdminComplaintSearchResult>(
    "/admin/complaints/search",
    { method: "GET" },
    {
      q: query,
      ...(filters ?? {}),
    } as Record<string, string | number | boolean | null | undefined>,
  );
}

export function fetchAdminComplaintStats() {
  return request<AdminComplaintStats>("/admin/complaints/stats", { method: "GET" });
}

export function listDepartments() {
  return request<{ departments: DepartmentRecord[] }>("/departments", { method: "GET" });
}

export async function exportAdminComplaintsCsv(query?: {
  status?: string;
  q?: string;
  department?: string;
  officerId?: string;
  priority?: string;
  escalated?: boolean;
}) {
  let response: Response;

  try {
    response = await fetch(buildUrl("/admin/complaints/export", query as Record<string, string | number | boolean | null | undefined>), {
      method: "GET",
      credentials: "include",
    });
  } catch {
    throw new Error("Unable to reach the SmartGov backend. Make sure the backend is running.");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new Error(payload?.message ?? "Failed to export complaints");
  }

  return response.blob();
}


export function getComplaint(id: string) {
  return request<{ complaint: ComplaintRecord }>(`/complaints/${encodeURIComponent(id)}`, { method: "GET" });
}

export function listComplaintMessages(id: string) {
  return request<{ messages: ComplaintMessageRecord[] }>(`/complaints/${encodeURIComponent(id)}/messages`, {
    method: "GET",
  });
}

export type ChatRoomRecord = {
  id: string;
  complaintId?: string | null;
  roomType?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function createComplaintChatRoom(complaintId: string) {
  return request<{ room: ChatRoomRecord }>(`/chat/rooms/complaint/${encodeURIComponent(complaintId)}`, {
    method: "POST",
  });
}

export function listChatRoomMessages(roomId: string, limit = 100) {
  return request<{ messages: ComplaintMessageRecord[] }>(`/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: "GET",
  }, { limit });
}

export function sendChatRoomMessage(roomId: string, message: string) {
  return request<{ message: ComplaintMessageRecord }>(`/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function markChatRoomRead(roomId: string) {
  return request<{ success: boolean }>(`/chat/rooms/${encodeURIComponent(roomId)}/read`, {
    method: "POST",
  });
}

// ========== CHAT COMPLAINT INTEGRATION ==========

export function getChatComplaintHeader(complaintId: string) {
  return request<{
    success: boolean;
    data: {
      id: string;
      grievanceId: string;
      title: string;
      department: string;
      status: string;
      priority: string;
      category: string;
      assignedOfficer: {
        id: string;
        name: string;
        email: string;
        department: string;
      } | null;
      citizen: {
        id: string;
        name: string;
      } | null;
      isEscalated: boolean;
      escalationLevel: string | null;
      slaDeadline: string | null;
      createdAt: string;
      updatedAt: string;
    };
  }>(`/chat/complaints/${encodeURIComponent(complaintId)}/header`, { method: "GET" });
}

// ========== CHAT ESCALATION ==========

export function escalateComplaintFromChat(complaintId: string, payload: {
  reason: string;
  level?: "low" | "medium" | "high" | "emergency";
}) {
  return request<{ success: boolean; data: any }>(`/chat/complaints/${encodeURIComponent(complaintId)}/escalate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getEscalationDetails(complaintId: string) {
  return request<{
    success: boolean;
    data: {
      id: string;
      level: string;
      reason: string;
      status: string;
      escalatedBy: string;
      escalatedAt: string;
      resolvedBy: string | null;
      resolvedAt: string | null;
      resolutionNote: string | null;
    } | null;
  }>(`/chat/complaints/${encodeURIComponent(complaintId)}/escalation`, { method: "GET" });
}

// ========== CHAT RESOLUTION VERIFICATION ==========

export function uploadResolutionProof(complaintId: string, payload: {
  proofUrl: string;
  proofType?: string;
  description?: string;
}) {
  return request<{
    success: boolean;
    message: string;
    data: {
      complaintId: string;
      status: string;
    };
  }>(`/chat/complaints/${encodeURIComponent(complaintId)}/resolution-proof`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyResolution(complaintId: string, payload: {
  verified: boolean;
  feedback?: string;
}) {
  return request<{
    success: boolean;
    message: string;
    data: {
      complaintId: string;
      status: string;
    };
  }>(`/chat/complaints/${encodeURIComponent(complaintId)}/verify-resolution`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ========== CHAT ADMIN MONITORING ==========

export function getAdminChatRooms(query?: {
  search?: string;
  filter?: "all" | "escalated" | "urgent" | "unread";
  sortBy?: "latest" | "oldest" | "activity";
  limit?: number;
  offset?: number;
}) {
  return request<{
    success: boolean;
    data: {
      rooms: Array<{
        id: string;
        complaintId: string;
        grievanceId: string;
        citizen: string;
        officer: string;
        department: string;
        priority: string;
        status: string;
        escalationLevel: string | null;
        isEscalated: boolean;
        unreadCount: number;
        lastMessageTime: string;
        slaDeadline: string | null;
        createdAt: string;
      }>;
      total: number;
    };
  }>("/chat/admin/rooms", { method: "GET" }, query as Record<string, string | number | null | undefined>);
}

export function getAdminChatDetails(roomId: string) {
  return request<{
    success: boolean;
    data: {
      room: {
        id: string;
        complaintId: string;
        createdAt: string;
      };
      complaint: {
        id: string;
        grievanceId: string;
        title: string;
        category: string;
        description: string;
        status: string;
        priority: string;
        department: string;
        district: string;
        city: string;
        slaDeadline: string | null;
        createdAt: string;
        citizen: {
          name: string;
          email: string | null;
          mobile: string | null;
        };
        officer: {
          id: string | null;
          name: string | null;
          email: string | null;
        };
        escalation: {
          id: string;
          level: string;
          reason: string;
          escalatedBy: string;
          createdAt: string;
        } | null;
        recentTimeline: Array<{
          status: string;
          changedAt: string;
          reason: string | null;
        }>;
      };
      participants: Array<{
        userId: string;
        name: string | null;
        role: string;
        joinedAt: string;
      }>;
      messages: ComplaintMessageRecord[];
    };
  }>(`/chat/admin/rooms/${encodeURIComponent(roomId)}/details`, { method: "GET" });
}

export function adminReassignComplaint(complaintId: string, payload: {
  newOfficerId: string;
  reason?: string;
}) {
  return request<{
    success: boolean;
    message: string;
    data: any;
  }>(`/chat/admin/complaints/${encodeURIComponent(complaintId)}/reassign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminEscalateComplaint(complaintId: string, payload: {
  level: "low" | "medium" | "high" | "emergency";
  reason: string;
}) {
  return request<{
    success: boolean;
    message: string;
    data: any;
  }>(`/chat/admin/complaints/${encodeURIComponent(complaintId)}/escalate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function freezeComplaintChat(complaintId: string, payload: {
  reason?: string;
}) {
  return request<{
    success: boolean;
    message: string;
    data: any;
  }>(`/chat/admin/complaints/${encodeURIComponent(complaintId)}/freeze-chat`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function unfreezeComplaintChat(complaintId: string) {
  return request<{
    success: boolean;
    message: string;
    data: any;
  }>(`/chat/admin/complaints/${encodeURIComponent(complaintId)}/unfreeze-chat`, {
    method: "POST",
  });
}

export function sendBroadcastAdminMessage(payload: {
  message: string;
  priority?: string;
  scope?: "all" | "department" | "district";
  filters?: {
    department?: string;
    district?: string;
  };
}) {
  return request<{
    success: boolean;
    message: string;
    data: {
      broadcastTo: number;
    };
  }>("/chat/admin/broadcast-message", {
    method: "POST",
    body: JSON.stringify(payload),
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

export function fetchAdminDashboard() {
  return request<AdminDashboardResponse>("/admin/dashboard", { method: "GET" });
}

export function searchAdminDashboard(query: string) {
  return request<AdminSearchResult>("/admin/search", { method: "GET" }, { q: query });
}

// Escalation dashboard summary (maps to ComplaintSummary shape for compatibility)
export function fetchEscalationDashboard() {
  return request<{ totalEscalations: number; pending: number; critical: number; resolved: number }>("/escalations/dashboard", { method: "GET" })
    .then((data) => {
      // adapt shape to ComplaintSummary used by the UI
      return Promise.resolve({
        submitted: 0,
        assigned: 0,
        inProgress: 0,
        resolved: data.resolved ?? 0,
        escalated: data.totalEscalations ?? 0,
        total: data.totalEscalations ?? 0,
      } as ComplaintSummary);
    });
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

// ============================================================================
// ADMIN CHAT API FUNCTIONS
// ============================================================================

export type AdminChatRoom = {
  id: string;
  complaintId: string;
  grievanceId: string;
  citizen: string;
  officer: string;
  department: string;
  priority: string;
  status: string;
  escalationLevel?: string;
  isEscalated: boolean;
  unreadCount: number;
  lastMessageTime: string;
  slaDeadline?: string;
  createdAt: string;
};

export type AdminChatDetails = {
  room: { id: string; complaintId: string; createdAt: string };
  complaint: {
    id: string;
    grievanceId: string;
    title: string;
    category: string;
    description: string;
    status: string;
    priority: string;
    department: string;
    district: string;
    city: string;
    slaDeadline?: string;
    createdAt: string;
    citizen: { name: string; email?: string; mobile?: string };
    officer: { id?: string; name: string; email?: string };
    escalation?: {
      id: string;
      level: string;
      reason: string;
      escalatedBy: string;
      createdAt: string;
    };
    recentTimeline: Array<{
      status: string;
      changedAt: string;
      reason?: string;
    }>;
  };
  participants: Array<{
    userId: string;
    name: string;
    role: string;
    joinedAt: string;
  }>;
  messages: Array<{
    id: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    message: string;
    createdAt: string;
    isAdmin: boolean;
  }>;
};

export function listAdminChatRooms(query?: {
  search?: string;
  filter?: "all" | "escalated" | "urgent" | "unread";
  sortBy?: "latest" | "oldest" | "activity";
  limit?: number;
  offset?: number;
}) {
  return request<{
    rooms: AdminChatRoom[];
    total: number;
  }>("/admin/chat/rooms", { method: "GET" }, query as Record<string, string | number | boolean | null | undefined>);
}

export function getAdminChatRoom(roomId: string) {
  return request<{ data: AdminChatDetails }>(`/admin/chat/${encodeURIComponent(roomId)}`, { method: "GET" });
}

export function sendAdminChatMessage(roomId: string, message: string, attachment?: any) {
  return request<{ data: { messageId: string } }>(`/admin/chat/${encodeURIComponent(roomId)}/message`, {
    method: "POST",
    body: JSON.stringify({ message, attachment }),
  });
}

export function reassignComplaintToOfficer(complaintId: string, newOfficerId: string, reason?: string) {
  return request<{ success: boolean }>(`/admin/chat/${encodeURIComponent(complaintId)}/reassign`, {
    method: "POST",
    body: JSON.stringify({ newOfficerId, reason }),
  });
}

export function escalateComplaintAdmin(complaintId: string, level: string, reason: string) {
  return request<{ success: boolean }>(`/admin/chat/${encodeURIComponent(complaintId)}/escalate`, {
    method: "POST",
    body: JSON.stringify({ level, reason }),
  });
}

export function freezeComplaintChatAdmin(complaintId: string, reason: string) {
  return request<{ success: boolean }>(`/admin/chat/${encodeURIComponent(complaintId)}/freeze`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function unfreezeComplaintChatAdmin(complaintId: string) {
  return request<{ success: boolean }>(`/admin/chat/${encodeURIComponent(complaintId)}/unfreeze`, {
    method: "POST",
  });
}

export function broadcastAdminAlert(message: string, priority?: string, scope?: string, filters?: any) {
  return request<{ broadcastTo: number }>("/admin/chat/broadcast", {
    method: "POST",
    body: JSON.stringify({ message, priority, scope, filters }),
  });
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

export type OfficerOpsShiftStatus = "Online" | "On duty" | "In field" | "Break" | "Offline";

export type OfficerOpsAlert = {
  id: string;
  complaintId: string;
  priority: string;
  status: string;
  message: string;
  createdAt: string;
};

export type OfficerOpsDashboard = {
  assignedComplaints: number;
  activeEmergencies: number;
  slaBreaches: number;
  resolvedToday: number;
  inProgress: number;
  avgResponseTimeHours: number;
  citizenRating: number;
  escalations: number;
  pendingInspections: number;
  liveAlerts: OfficerOpsAlert[];
};

export type OfficerOpsQueueItem = {
  id: string;
  complaintId: string;
  citizenName: string;
  priority: string;
  department: string;
  area: string;
  city: string;
  district: string;
  status: string;
  escalationLevel: string | null;
  gps: { latitude: number; longitude: number } | null;
  distanceKm: number | null;
  slaDeadline: string | null;
  slaRiskScore: number;
  lastUpdate: string;
  title: string;
};

export type OfficerOpsEmergency = {
  id: string;
  complaintId: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  level: string | null;
  location: string;
  updatedAt: string;
};

export type OfficerOpsNavigation = {
  complaintId: string;
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  source: {
    latitude: number;
    longitude: number;
  };
  distanceKm: number;
  etaMinutes: number;
};

export type OfficerOpsPerformanceMetrics = {
  avgResolutionSpeedHours: number;
  citizenRating: number;
  slaSuccessRate: number;
  escalationCount: number;
  attendanceEvents: number;
  emergencyHandled: number;
};

export type OfficerOpsReportData = {
  totals: {
    total: number;
    resolved: number;
    inProgress: number;
    escalated: number;
  };
  byPriority: Record<string, number>;
  byArea: Record<string, number>;
  monthlyTrend: Array<{ month: string; total: number; resolved: number }>;
};

export type OfficerKnowledgeDoc = {
  id: string;
  title: string;
  category: string;
  summary: string;
};

export function getOfficerOpsDashboard() {
  return request<{ dashboard: OfficerOpsDashboard }>("/officers/ops/dashboard", { method: "GET" });
}

export function getOfficerOpsQueue(query?: {
  sortBy?: "nearest" | "priority" | "oldest" | "sla" | "emergency";
  latitude?: number;
  longitude?: number;
}) {
  return request<{ queue: OfficerOpsQueueItem[] }>("/officers/ops/queue", { method: "GET" }, query);
}

export function getOfficerOpsEmergencyQueue() {
  return request<{ emergencies: OfficerOpsEmergency[] }>("/officers/ops/emergency", { method: "GET" });
}

export function startOfficerInspection(
  complaintId: string,
  payload?: { latitude?: number; longitude?: number; note?: string },
) {
  return request<{ complaint: { id: string; complaintId: string; status: string; updatedAt: string } }>(
    `/officers/ops/${encodeURIComponent(complaintId)}/inspection/start`,
    {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    },
  );
}

export function updateOfficerGps(
  complaintId: string,
  payload: { latitude: number; longitude: number; etaMinutes?: number; note?: string },
) {
  return request<{ complaint: { id: string; complaintId: string; latitude: number | null; longitude: number | null; updatedAt: string } }>(
    `/officers/ops/${encodeURIComponent(complaintId)}/gps`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getOfficerNavigationPlan(
  complaintId: string,
  payload: { latitude: number; longitude: number },
) {
  return request<{ navigation: OfficerOpsNavigation }>(
    `/officers/ops/${encodeURIComponent(complaintId)}/navigation`,
    { method: "GET" },
    payload,
  );
}

export function escalateOfficerComplaint(
  complaintId: string,
  payload: { reason: string; level?: "low" | "medium" | "high" | "emergency" },
) {
  return request<{ escalation: EscalationRecord }>(`/officers/ops/${encodeURIComponent(complaintId)}/escalate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitOfficerResolution(
  complaintId: string,
  payload: {
    resolutionSummary: string;
    citizenConfirmation: boolean;
    completionTimestamp?: string;
    beforeAfterPhotos?: Array<{ name: string; type: string; size: number; dataUrl: string }>;
  },
) {
  return request<{ complaint: { id: string; complaintId: string; status: string; resolutionSummary: string | null; updatedAt: string } }>(
    `/officers/ops/${encodeURIComponent(complaintId)}/resolve`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getOfficerOpsShift() {
  return request<{ shift: { status: OfficerOpsShiftStatus; updatedAt: string | null } }>("/officers/ops/shift", {
    method: "GET",
  });
}

export function updateOfficerOpsShift(payload: { status: OfficerOpsShiftStatus; note?: string }) {
  return request<{ shift: { status: OfficerOpsShiftStatus; updatedAt: string } }>("/officers/ops/shift", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOfficerOpsPerformance() {
  return request<{ performance: OfficerOpsPerformanceMetrics }>("/officers/ops/performance", {
    method: "GET",
  });
}

export function getOfficerOpsReports() {
  return request<{ reports: OfficerOpsReportData }>("/officers/ops/reports", {
    method: "GET",
  });
}

export function getOfficerOpsKnowledgeBase() {
  return request<{ knowledgeBase: OfficerKnowledgeDoc[] }>("/officers/ops/knowledge-base", {
    method: "GET",
  });
}
