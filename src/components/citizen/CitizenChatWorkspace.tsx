import { useEffect, useMemo, useRef, useState, type RefObject, type UIEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  Clock3,
  Download,
  FileAudio,
  FileText,
  Filter,
  Image as ImageIcon,
  Info,
  Link2,
  Loader2,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Users,
  Video,
  Wifi,
  WifiOff,
} from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { priorityTone, statusTone } from "@/lib/complaint-status";
import { fetchComplaintSummary, listComplaints, type ComplaintPriority, type ComplaintRecord, type ComplaintStatus, type ComplaintSummary } from "@/lib/smartgov-api";

type ProfileUser = {
  id?: string;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
} | null;

type ChatMessageRecord = {
  id: string;
  roomId: string;
  senderId: string;
  receiverId?: string | null;
  complaintId?: string | null;
  message?: string | null;
  messageType?: string | null;
  attachment?:
    | {
        fileUrl?: string;
        fileType?: string;
        uploadedBy?: string;
        fileName?: string;
        latitude?: number;
        longitude?: number;
      }
    | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  isRead?: boolean;
};

type ComplaintFilter = "all" | "open" | "resolved" | "escalated" | "urgent";
type InboxScope = "mine" | "assigned" | "all";
type MobilePanel = "threads" | "chat" | "details";
type TypingPayload = { roomId: string; userName?: string; isTyping?: boolean };

const complaintFilters: { value: ComplaintFilter; label: string; icon: typeof Filter }[] = [
  { value: "all", label: "All threads", icon: Filter },
  { value: "open", label: "Open", icon: MessageSquare },
  { value: "escalated", label: "Escalated", icon: TriangleAlert },
  { value: "urgent", label: "Urgent", icon: ShieldAlert },
  { value: "resolved", label: "Resolved", icon: CheckCheck },
];

function resolveSocketUrl() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api";

  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    return apiBase.replace(/\/api\/?$/, "");
  }

  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost") {
      return "http://localhost:4004";
    }

    return window.location.origin;
  }

  return "/";
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(value));
}

function formatTimeLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.round(diffHours / 24)}d ago`;
}

function extractFileName(fileUrl: string) {
  try {
    const parsed = new URL(fileUrl, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() ?? "attachment");
  } catch {
    return fileUrl.split("/").filter(Boolean).pop() ?? "attachment";
  }
}

function formatBytes(bytes?: number | null) {
  if (!bytes || Number.isNaN(bytes)) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getAttachmentKind(message: ChatMessageRecord) {
  const fileType = message.attachment?.fileType ?? "";
  const messageType = (message.messageType ?? "text").toLowerCase();

  if (messageType === "system") return "system";
  if (messageType === "location") return "location";
  if (messageType === "voice" || fileType.startsWith("audio/")) return "audio";
  if (messageType === "image" || fileType.startsWith("image/")) return "image";
  if (messageType === "pdf" || fileType.includes("pdf")) return "pdf";
  if (messageType === "attachment") return "attachment";

  return "text";
}

function getMessagePreview(message?: ChatMessageRecord | null) {
  if (!message) return "No replies yet";

  const kind = getAttachmentKind(message);
  if (kind === "image") return "Shared an image";
  if (kind === "pdf") return "Shared a PDF";
  if (kind === "audio") return "Shared a voice note";
  if (kind === "location") return "Shared live location";
  if (kind === "system") return message.message ?? "System update";

  return message.message?.trim() || "Attachment shared";
}

function getComplaintSignal(complaint: ComplaintRecord) {
  return {
    escalated: complaint.status === "Escalated" || Boolean(complaint.escalationLevel && complaint.escalationLevel > 0),
    urgent: complaint.priority === "Critical" || complaint.priority === "High",
  };
}

function isCompactViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
}

function resolveInboxScope(role: string): InboxScope {
  if (role === "officer") {
    return "assigned";
  }

  if (role === "super_admin" || role === "state_admin" || role === "district_officer" || role === "department_officer" || role === "admin") {
    return "all";
  }

  return "mine";
}

function getWorkspaceLabel(role: string) {
  if (role === "officer") return "Officer command center";
  if (role === "admin" || role === "super_admin" || role === "state_admin" || role === "district_officer" || role === "department_officer") {
    return "Admin operations view";
  }
  return "Citizen support workspace";
}

async function readJsonResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | {
        success?: boolean;
        message?: string | ChatMessageRecord | null;
        data?: { message?: ChatMessageRecord | null } | null;
        error?: string;
      }
    | null;

  return payload;
}

function mergeMessageList(messages: ChatMessageRecord[], nextMessage: ChatMessageRecord) {
  if (!nextMessage.id) {
    return messages;
  }

  if (messages.some((message) => message.id === nextMessage.id)) {
    return messages.map((message) => (message.id === nextMessage.id ? nextMessage : message));
  }

  return [...messages, nextMessage];
}

export function CitizenChatWorkspace({ profile }: { profile: ProfileUser }) {
  const currentUserId = profile?.id ?? null;
  const currentUserName = profile?.fullName ?? "You";
  const currentUserRole = profile?.role ?? "citizen";
  const inboxScope = resolveInboxScope(currentUserRole);

  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ComplaintFilter>("all");
  const [scope, setScope] = useState<InboxScope>(inboxScope);
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [connectionState, setConnectionState] = useState<"online" | "offline" | "reconnecting">("reconnecting");
  const [remoteTyping, setRemoteTyping] = useState<string[]>([]);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("threads");
  const [unreadByComplaintId, setUnreadByComplaintId] = useState<Record<string, number>>({});
  const [latestMessageByComplaintId, setLatestMessageByComplaintId] = useState<Record<string, ChatMessageRecord | null>>({});

  const socketRef = useRef<Socket | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  const selectedComplaintIdRef = useRef<string | null>(null);
  const roomToComplaintIdRef = useRef<Record<string, string>>({});
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const messageBottomRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const typingTimerRef = useRef<number | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedComplaint = useMemo(() => complaints.find((complaint) => complaint.id === activeComplaintId) ?? null, [activeComplaintId, complaints]);

  const visibleComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...complaints]
      .filter((complaint) => {
        if (scope === "mine" && complaint.reporterUserId && complaint.reporterUserId !== currentUserId) {
          return false;
        }

        if (scope === "assigned" && complaint.assignedOfficerId && complaint.assignedOfficerId !== currentUserId) {
          return false;
        }

        const searchable = [
          complaint.grievanceId,
          complaint.title,
          complaint.category,
          complaint.department,
          complaint.reporterName,
          complaint.city,
          complaint.district,
          complaint.assignedOfficerName ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (query && !searchable.includes(query)) return false;
        if (filter === "all") return true;
        if (filter === "resolved") return complaint.status === "Resolved" || complaint.status === "Closed";
        if (filter === "escalated") return complaint.status === "Escalated" || Boolean(complaint.escalationLevel && complaint.escalationLevel > 0);
        if (filter === "urgent") return complaint.priority === "High" || complaint.priority === "Critical";
        return complaint.status !== "Resolved" && complaint.status !== "Closed";
      })
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, [complaints, filter, search, scope]);

  const complaintCounts = useMemo(() => {
    const open = complaints.filter((complaint) => complaint.status !== "Resolved" && complaint.status !== "Closed").length;
    const escalated = complaints.filter((complaint) => complaint.status === "Escalated" || Boolean(complaint.escalationLevel && complaint.escalationLevel > 0)).length;
    const urgent = complaints.filter((complaint) => complaint.priority === "High" || complaint.priority === "Critical").length;
    const resolved = complaints.filter((complaint) => complaint.status === "Resolved" || complaint.status === "Closed").length;
    const unread = Object.values(unreadByComplaintId).reduce((total, count) => total + count, 0);

    return { open, escalated, urgent, resolved, total: complaints.length, unread };
  }, [complaints, unreadByComplaintId]);

  const workspaceLabel = getWorkspaceLabel(currentUserRole);
  const scopeOptions: Array<{ value: InboxScope; label: string; description: string }> =
    currentUserRole === "officer"
      ? [{ value: "assigned", label: "Assigned", description: "Officer queue" }]
      : currentUserRole === "super_admin" || currentUserRole === "state_admin" || currentUserRole === "district_officer" || currentUserRole === "department_officer" || currentUserRole === "admin"
        ? [
            { value: "all", label: "All threads", description: "Monitor everything" },
            { value: "assigned", label: "Assigned", description: "Officer-owned cases" },
            { value: "mine", label: "Mine", description: "Citizen-owned cases" },
          ]
        : [{ value: "mine", label: "Mine", description: "Your complaints" }];

  async function markRoomRead(roomId: string) {
    try {
      await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/read`, { method: "POST", credentials: "include" });
    } catch {
      // ignore read receipt errors
    }
  }

  async function openComplaint(complaint: ComplaintRecord, nextMobilePanel: MobilePanel = "chat") {
    setActiveComplaintId(complaint.id);
    selectedComplaintIdRef.current = complaint.id;
    setMessagesLoading(true);
    setMessagesError(null);
    setRemoteTyping([]);

    if (isCompactViewport()) {
      setMobilePanel(nextMobilePanel);
    }

    try {
      const roomResponse = await fetch(`/api/chat/rooms/complaint/${encodeURIComponent(complaint.id)}`, { method: "POST", credentials: "include" });
      const roomPayload = (await readJsonResponse(roomResponse)) as { room?: { id?: string }; message?: string } | null;
      const roomId = roomPayload?.room?.id;

      if (!roomResponse.ok || !roomId) {
        throw new Error((roomPayload?.message as string | undefined) || "Unable to open chat room");
      }

      roomToComplaintIdRef.current[roomId] = complaint.id;
      setActiveRoomId(roomId);
      activeRoomIdRef.current = roomId;

      const messagesResponse = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages?limit=100`, { credentials: "include" });
      const messagesPayload = (await readJsonResponse(messagesResponse)) as { messages?: ChatMessageRecord[]; message?: string } | null;
      const nextMessages = Array.isArray(messagesPayload?.messages) ? messagesPayload.messages : [];

      if (!messagesResponse.ok) {
        throw new Error((messagesPayload?.message as string | undefined) || "Unable to load chat messages");
      }

      setMessages(nextMessages);
      setLatestMessageByComplaintId((current) => ({ ...current, [complaint.id]: nextMessages.at(-1) ?? null }));
      setUnreadByComplaintId((current) => ({ ...current, [complaint.id]: 0 }));
      isNearBottomRef.current = true;
      await markRoomRead(roomId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open chat room";
      setMessagesError(message);
      toast.error(message);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function postChatMessage(roomId: string, payload: Record<string, unknown>) {
    const response = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await readJsonResponse(response);
    const createdMessage = (body?.data?.message ?? (typeof body?.message === "object" ? (body.message as ChatMessageRecord) : null)) as ChatMessageRecord | null;

    if (!response.ok) {
      throw new Error((body?.message as string | undefined) || "Unable to send message");
    }

    if (!createdMessage?.id) {
      throw new Error("Message saved, but no message payload was returned");
    }

    return createdMessage;
  }

  function scrollToLatest(behavior: ScrollBehavior = "smooth") {
    messageBottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }

  function handleMessagesScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
    isNearBottomRef.current = remaining < 140;
  }

  function scheduleTypingReset(roomId: string | null) {
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = window.setTimeout(() => {
      if (roomId && socketRef.current) {
        socketRef.current.emit("typing", { roomId, isTyping: false, userName: currentUserName });
      }
    }, 900);
  }

  function handleComposerChange(nextValue: string) {
    setMessageText(nextValue);

    if (!activeRoomId || !nextValue.trim() || !socketRef.current) {
      return;
    }

    socketRef.current.emit("typing", { roomId: activeRoomId, userName: currentUserName, isTyping: true });
    scheduleTypingReset(activeRoomId);
  }

  async function sendLocation() {
    if (!activeRoomId) {
      toast.error("Select a complaint first");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location sharing is not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const createdMessage = await postChatMessage(activeRoomId, {
            complaintId: selectedComplaint?.id ?? null,
            message: "Shared live location",
            messageType: "location",
            attachment: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });

          setMessages((current) => mergeMessageList(current, createdMessage));
          setLatestMessageByComplaintId((current) => ({ ...current, [selectedComplaint?.id ?? activeRoomId]: createdMessage }));
          setRemoteTyping([]);
          isNearBottomRef.current = true;
          scrollToLatest("smooth");
          await markRoomRead(activeRoomId);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to share location");
        }
      },
      () => toast.error("Unable to access your location"),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function handleAttachmentUpload(file: File | null) {
    if (!file) return;
    setPendingAttachment(file);
    composerRef.current?.focus();
  }

  async function sendMessage() {
    if (!activeRoomId) {
      toast.error("Select a complaint first");
      return;
    }

    const trimmedMessage = messageText.trim();
    if (!trimmedMessage && !pendingAttachment) return;

    setSending(true);
    try {
      let attachmentPayload: Record<string, unknown> | null = null;
      let messageType = "text";
      let payloadMessage = trimmedMessage || null;

      if (pendingAttachment) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", pendingAttachment);

        const uploadResponse = await fetch(`/api/chat/rooms/${encodeURIComponent(activeRoomId)}/upload`, {
          method: "POST",
          credentials: "include",
          body: uploadFormData,
        });

        const uploadPayload = (await readJsonResponse(uploadResponse)) as { fileUrl?: string; message?: string } | null;
        if (!uploadResponse.ok || !uploadPayload?.fileUrl) {
          throw new Error(uploadPayload?.message || "Unable to upload attachment");
        }

        const fileType = pendingAttachment.type;
        messageType = fileType.startsWith("image/") ? "image" : fileType.startsWith("audio/") ? "voice" : fileType.includes("pdf") ? "pdf" : "attachment";
        attachmentPayload = { fileUrl: uploadPayload.fileUrl, fileType, fileName: pendingAttachment.name };
        payloadMessage = payloadMessage || pendingAttachment.name;
      }

      const createdMessage = await postChatMessage(activeRoomId, {
        complaintId: selectedComplaint?.id ?? null,
        message: payloadMessage,
        messageType,
        attachment: attachmentPayload,
      });

      setMessages((current) => mergeMessageList(current, createdMessage));
      setLatestMessageByComplaintId((current) => ({ ...current, [selectedComplaint?.id ?? activeRoomId]: createdMessage }));
      setMessageText("");
      setPendingAttachment(null);
      setRemoteTyping([]);
      composerRef.current?.focus();
      isNearBottomRef.current = true;
      scrollToLatest("smooth");
      await markRoomRead(activeRoomId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send message");
    } finally {
      setSending(false);
    }
  }

  function downloadReport() {
    if (!selectedComplaint) {
      toast.error("Select a complaint first");
      return;
    }

    const report = { complaint: selectedComplaint, messages, generatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedComplaint.grievanceId}-chat-report.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function openActiveComplaint(nextMobilePanel: MobilePanel = "chat") {
    if (!selectedComplaint) return;
    void openComplaint(selectedComplaint, nextMobilePanel);
  }

  useEffect(() => {
    let mounted = true;

    async function loadComplaints() {
      setComplaintsLoading(true);
      setComplaintsError(null);

      try {
        const [complaintResult, summaryResult] = await Promise.all([
          listComplaints({ view: scope, limit: 100 }),
          fetchComplaintSummary().catch(() => null),
        ]);

        const nextComplaints = [...(complaintResult.complaints ?? [])].sort(
          (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        );

        if (!mounted) return;

        setComplaints(nextComplaints);
        setSummary(summaryResult);

        if (nextComplaints.length > 0 && !selectedComplaintIdRef.current) {
          void openComplaint(nextComplaints[0]);
        } else if (selectedComplaintIdRef.current && !nextComplaints.some((complaint) => complaint.id === selectedComplaintIdRef.current)) {
          selectedComplaintIdRef.current = nextComplaints[0]?.id ?? null;
          setActiveComplaintId(nextComplaints[0]?.id ?? null);
          if (nextComplaints[0]) {
            void openComplaint(nextComplaints[0]);
          }
        }
      } catch (error) {
        if (mounted) {
          setComplaintsError(error instanceof Error ? error.message : "Unable to load chat threads");
        }
      } finally {
        if (mounted) {
          setComplaintsLoading(false);
        }
      }
    }

    void loadComplaints();

    return () => {
      mounted = false;
    };
  }, [scope]);

  useEffect(() => {
    if (!currentUserId) {
      setConnectionState("offline");
      return;
    }

    const socket = io(resolveSocketUrl(), { withCredentials: true, transports: ["websocket"] });
    socketRef.current = socket;

    const handleMessage = (message: ChatMessageRecord) => {
      if (!message?.id) return;

      const complaintId = message.complaintId ?? roomToComplaintIdRef.current[message.roomId ?? ""] ?? null;

      if (message.roomId && message.roomId === activeRoomIdRef.current) {
        setMessages((current) => mergeMessageList(current, message));
        setLatestMessageByComplaintId((current) => ({
          ...current,
          [complaintId ?? selectedComplaintIdRef.current ?? message.roomId]: message,
        }));

        if (isNearBottomRef.current) {
          window.requestAnimationFrame(() => scrollToLatest("smooth"));
        }

        void markRoomRead(message.roomId);
        return;
      }

      if (complaintId) {
        setUnreadByComplaintId((current) => ({ ...current, [complaintId]: (current[complaintId] ?? 0) + 1 }));
        setLatestMessageByComplaintId((current) => ({ ...current, [complaintId]: message }));
      }
    };

    const handleTyping = (payload: TypingPayload) => {
      if (!payload?.roomId || payload.roomId !== activeRoomIdRef.current) return;
      setRemoteTyping(payload.isTyping ? [payload.userName ?? "Support team"] : []);
    };

    const handleSeenUpdate = (payload: { roomId?: string; userId?: string }) => {
      if (!payload?.roomId || payload.roomId !== activeRoomIdRef.current) return;
      if (payload.userId === currentUserId) return;

      setMessages((current) => current.map((message) => (message.senderId === currentUserId ? { ...message, isRead: true } : message)));
    };

    const handleComplaintUpdated = (payload: Partial<ComplaintRecord> & { id?: string }) => {
      if (!payload?.id) return;

      setComplaints((current) => current.map((complaint) => (complaint.id === payload.id ? { ...complaint, ...payload } : complaint)));
      setLatestMessageByComplaintId((current) => current);
    };

    socket.on("connect", () => {
      setConnectionState("online");
      socket.emit("identify", { userId: currentUserId, role: currentUserRole });
    });
    socket.on("disconnect", () => setConnectionState("offline"));
    socket.on("connect_error", () => setConnectionState("reconnecting"));
    socket.on("message", handleMessage);
    socket.on("typing", handleTyping);
    socket.on("seen_update", handleSeenUpdate);
    socket.on("complaint-updated", handleComplaintUpdated);

    return () => {
      socket.off("message", handleMessage);
      socket.off("typing", handleTyping);
      socket.off("seen_update", handleSeenUpdate);
      socket.off("complaint-updated", handleComplaintUpdated);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, currentUserRole]);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeRoomId || !socketRef.current) return;

    socketRef.current.emit("joinRoom", activeRoomId);
    return () => {
      socketRef.current?.emit("leaveRoom", activeRoomId);
    };
  }, [activeRoomId]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (isNearBottomRef.current) {
      scrollToLatest(messages.length > 1 ? "smooth" : "auto");
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative -m-4 flex h-[calc(100dvh-5rem)] min-h-0 flex-col overflow-hidden md:-m-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(2,132,199,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.05),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.96))]" />
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-4rem] top-40 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />

      <div className="relative flex min-h-0 flex-1 flex-col gap-5 p-4 md:p-8">
        <section className="flex-none overflow-hidden rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_-42px_rgba(15,23,42,0.38)] backdrop-blur-2xl md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4 xl:max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {workspaceLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  {connectionState === "online" ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5 text-amber-500" />}
                  {connectionState === "online" ? "Live connection" : connectionState === "reconnecting" ? "Reconnecting" : "Offline"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  <Clock3 className="h-3.5 w-3.5" />
                  SLA-aware response flow
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  <CheckCheck className="h-3.5 w-3.5" />
                  {complaintCounts.unread} unread updates
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-[58px] md:leading-[0.94]">
                  A calmer, premium inbox for every complaint conversation.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Keep a single thread for each grievance, track officer replies and attachments in one place, and move from overview to response without losing context.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Open threads", value: complaintCounts.open, icon: MessageSquare, tone: "from-sky-50 to-white" },
                  { label: "Escalations", value: complaintCounts.escalated, icon: TriangleAlert, tone: "from-rose-50 to-white" },
                  { label: "Urgent cases", value: complaintCounts.urgent, icon: ShieldAlert, tone: "from-amber-50 to-white" },
                  { label: "Resolved", value: complaintCounts.resolved, icon: CheckCheck, tone: "from-emerald-50 to-white" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-[24px] border border-white/70 bg-gradient-to-br ${item.tone} p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)]`}>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                      <item.icon className="h-4 w-4 text-primary" />
                      {item.label}
                    </div>
                    <div className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid shrink-0 gap-3 sm:grid-cols-3 xl:w-[420px] xl:grid-cols-1">
              <div className="rounded-[28px] border border-white/70 bg-slate-950 px-5 py-5 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.5)]">
                <div className="text-[11px] uppercase tracking-[0.3em] text-slate-300">Workspace status</div>
                <div className="mt-3 text-2xl font-semibold tracking-tight">Mission control</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Monitor live threads, respond fast, and keep every message anchored to its complaint record.</p>
              </div>
              <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
                <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Backend status</div>
                <div className="mt-3 text-lg font-semibold text-slate-950">Complaint API connected</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{scope === "all" ? "Global monitoring queue" : scope === "assigned" ? "Assigned officer queue" : "Citizen-owned support queue"} with rooms, messages, uploads, and read receipts wired to the backend.</p>
              </div>
              <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
                <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Selected complaint</div>
                <div className="mt-3 text-lg font-semibold text-slate-950">{selectedComplaint ? selectedComplaint.grievanceId : "No case selected"}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedComplaint ? selectedComplaint.title : "Choose a thread to inspect the timeline and reply."}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search grievance ID, citizen name, category, or department..."
                className="h-14 rounded-[22px] border-white/80 bg-white/90 pl-14 text-base shadow-[0_12px_30px_-22px_rgba(15,23,42,0.55)]"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {complaintFilters.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm transition-all ${
                    filter === item.value
                      ? "border-sky-200 bg-sky-50 text-sky-700 shadow-[0_10px_25px_-16px_rgba(2,132,199,0.7)]"
                      : "border-white/80 bg-white/80 text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Inbox scope</div>
            <div className="flex flex-wrap gap-2">
              {scopeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setScope(option.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                    scope === option.value
                      ? "border-slate-900 bg-slate-950 text-white shadow-[0_16px_30px_-20px_rgba(15,23,42,0.7)]"
                      : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className={`text-[11px] ${scope === option.value ? "text-white/70" : "text-slate-400"}`}>{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="hidden min-h-0 flex-1 gap-5 lg:grid lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_380px]">
          <ThreadRail
            complaintsLoading={complaintsLoading}
            complaintsError={complaintsError}
            visibleComplaints={visibleComplaints}
            activeComplaintId={activeComplaintId}
            unreadByComplaintId={unreadByComplaintId}
            latestMessageByComplaintId={latestMessageByComplaintId}
            onSelect={(complaint) => void openComplaint(complaint)}
            currentUserId={currentUserId}
          />

          <ConversationPanel
            selectedComplaint={selectedComplaint}
            messages={messages}
            messagesLoading={messagesLoading}
            messagesError={messagesError}
            remoteTyping={remoteTyping}
            activeRoomId={activeRoomId}
            messagesViewportRef={messagesViewportRef}
            messageBottomRef={messageBottomRef}
            attachmentInputRef={attachmentInputRef}
            composerRef={composerRef}
            messageText={messageText}
            pendingAttachment={pendingAttachment}
            sending={sending}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onComposerChange={handleComposerChange}
            onScroll={handleMessagesScroll}
            onSelectAttachment={() => attachmentInputRef.current?.click()}
            onAttachFile={(file) => void handleAttachmentUpload(file)}
            onRemoveAttachment={() => setPendingAttachment(null)}
            onSendMessage={() => void sendMessage()}
            onSendLocation={() => void sendLocation()}
            onQuickRefresh={openActiveComplaint}
            onDownloadReport={downloadReport}
          />

          <InsightPanel selectedComplaint={selectedComplaint} summary={summary} onDownloadReport={downloadReport} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 lg:hidden">
          {mobilePanel === "threads" ? (
            <ThreadRail
              complaintsLoading={complaintsLoading}
              complaintsError={complaintsError}
              visibleComplaints={visibleComplaints}
              activeComplaintId={activeComplaintId}
              unreadByComplaintId={unreadByComplaintId}
              latestMessageByComplaintId={latestMessageByComplaintId}
              onSelect={(complaint) => void openComplaint(complaint, "chat")}
              currentUserId={currentUserId}
              mobileLayout
            />
          ) : mobilePanel === "chat" ? (
            <ConversationPanel
              selectedComplaint={selectedComplaint}
              messages={messages}
              messagesLoading={messagesLoading}
              messagesError={messagesError}
              remoteTyping={remoteTyping}
              activeRoomId={activeRoomId}
              messagesViewportRef={messagesViewportRef}
              messageBottomRef={messageBottomRef}
              attachmentInputRef={attachmentInputRef}
              composerRef={composerRef}
              messageText={messageText}
              pendingAttachment={pendingAttachment}
              sending={sending}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onComposerChange={handleComposerChange}
              onScroll={handleMessagesScroll}
              onSelectAttachment={() => attachmentInputRef.current?.click()}
              onAttachFile={(file) => void handleAttachmentUpload(file)}
              onRemoveAttachment={() => setPendingAttachment(null)}
              onSendMessage={() => void sendMessage()}
              onSendLocation={() => void sendLocation()}
              onQuickRefresh={openActiveComplaint}
              onDownloadReport={downloadReport}
              mobileLayout
              onBack={() => setMobilePanel("threads")}
            />
          ) : (
            <InsightPanel
              selectedComplaint={selectedComplaint}
              summary={summary}
              onDownloadReport={downloadReport}
              mobileLayout
              onBackToThreads={() => setMobilePanel("chat")}
            />
          )}
        </div>

        <div className="sticky bottom-0 z-20 -mx-4 border-t border-white/60 bg-white/90 px-4 py-3 backdrop-blur-2xl lg:hidden md:-mx-8 md:px-8">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setMobilePanel("threads")} className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm transition ${mobilePanel === "threads" ? "bg-primary/10 text-primary" : "bg-card/80 text-muted-foreground"}`}>
              <Users className="h-4 w-4" />
              Threads
            </button>
            <button onClick={() => setMobilePanel("chat")} className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm transition ${mobilePanel === "chat" ? "bg-primary/10 text-primary" : "bg-card/80 text-muted-foreground"}`}>
              <MessageSquare className="h-4 w-4" />
              Chat
            </button>
            <button onClick={() => setMobilePanel("details")} className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm transition ${mobilePanel === "details" ? "bg-primary/10 text-primary" : "bg-card/80 text-muted-foreground"}`}>
              <MoreHorizontal className="h-4 w-4" />
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadRail({
  complaintsLoading,
  complaintsError,
  visibleComplaints,
  activeComplaintId,
  unreadByComplaintId,
  latestMessageByComplaintId,
  onSelect,
  currentUserId,
  mobileLayout = false,
}: {
  complaintsLoading: boolean;
  complaintsError: string | null;
  visibleComplaints: ComplaintRecord[];
  activeComplaintId: string | null;
  unreadByComplaintId: Record<string, number>;
  latestMessageByComplaintId: Record<string, ChatMessageRecord | null>;
  onSelect: (complaint: ComplaintRecord) => void;
  currentUserId: string | null;
  mobileLayout?: boolean;
}) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card/80 shadow-card backdrop-blur-xl">
      <div className="flex-none border-b border-border/60 px-5 py-5 md:px-6 md:py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Complaint queue</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Live conversations</h2>
          </div>
          <div className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground">{visibleComplaints.length}</div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Search, filter, and jump into any complaint thread without losing message context.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
        {complaintsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-[120px] animate-pulse rounded-3xl border border-border/60 bg-muted/40" />
            ))}
          </div>
        ) : complaintsError ? (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">{complaintsError}</div>
        ) : visibleComplaints.length === 0 ? (
          <div className="grid h-full place-items-center rounded-3xl border border-dashed border-border/70 bg-background/60 px-5 py-10 text-center">
            <div className="max-w-xs">
              <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-3 text-lg font-semibold tracking-tight">No threads match your filters</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try a different search term or switch back to all threads.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleComplaints.map((complaint) => {
              const active = activeComplaintId === complaint.id;
              const unreadCount = unreadByComplaintId[complaint.id] ?? 0;
              const latestMessage = latestMessageByComplaintId[complaint.id];
              const preview = getMessagePreview(latestMessage);
              const signal = getComplaintSignal(complaint);
              const hasConversation = Boolean(latestMessage);

              return (
                <button
                  key={complaint.id}
                  onClick={() => onSelect(complaint)}
                  className={`group flex h-[120px] w-full flex-col rounded-3xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                    active
                      ? "border-primary/30 bg-gradient-to-br from-primary/10 to-cyan-500/10 shadow-[0_18px_48px_-30px_rgba(2,132,199,0.65)]"
                      : "border-border/70 bg-background/70 hover:border-primary/20 hover:bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted-foreground">{complaint.grievanceId}</div>
                      <div className="mt-1 truncate text-base font-semibold tracking-tight">{complaint.title}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {unreadCount > 0 ? <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">{unreadCount}</span> : null}
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone(complaint.status)}`}>{complaint.status}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className={`rounded-full px-2 py-1 ${priorityTone(complaint.priority)}`}>{complaint.priority}</span>
                    <span>{complaint.department}</span>
                    <span>•</span>
                    <span>{complaint.city}</span>
                  </div>

                  <div className="mt-auto flex items-center gap-3 pt-3 text-sm text-muted-foreground">
                    <div className={`grid h-9 w-9 place-items-center rounded-2xl ${signal.urgent ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">{preview}</div>
                      <div className="text-xs text-muted-foreground">
                        {complaint.assignedOfficerName ?? "Awaiting assignment"}
                        {complaint.assignedOfficerId ? " • Assigned" : ""}
                        {complaint.assignedOfficerId === currentUserId ? " • You" : ""}
                        {signal.escalated ? " • Escalated" : ""}
                      </div>
                      {!hasConversation ? (
                        <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          Tap to open thread
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {mobileLayout ? (
        <div className="border-t border-border/60 px-5 py-4 text-xs text-muted-foreground">
          Select a thread to open the conversation view.
        </div>
      ) : null}
    </aside>
  );
}

function ConversationPanel({
  selectedComplaint,
  messages,
  messagesLoading,
  messagesError,
  remoteTyping,
  activeRoomId,
  messagesViewportRef,
  messageBottomRef,
  attachmentInputRef,
  composerRef,
  messageText,
  pendingAttachment,
  sending,
  currentUserId,
  currentUserName,
  onComposerChange,
  onScroll,
  onSelectAttachment,
  onAttachFile,
  onRemoveAttachment,
  onSendMessage,
  onSendLocation,
  onQuickRefresh,
  onDownloadReport,
  mobileLayout = false,
  onBack,
}: {
  selectedComplaint: ComplaintRecord | null;
  messages: ChatMessageRecord[];
  messagesLoading: boolean;
  messagesError: string | null;
  remoteTyping: string[];
  activeRoomId: string | null;
  messagesViewportRef: RefObject<HTMLDivElement | null>;
  messageBottomRef: RefObject<HTMLDivElement | null>;
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  messageText: string;
  pendingAttachment: File | null;
  sending: boolean;
  currentUserId: string | null;
  currentUserName: string;
  onComposerChange: (value: string) => void;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  onSelectAttachment: () => void;
  onAttachFile: (file: File | null) => void;
  onRemoveAttachment: () => void;
  onSendMessage: () => void;
  onSendLocation: () => void;
  onQuickRefresh: () => void;
  onDownloadReport: () => void;
  mobileLayout?: boolean;
  onBack?: () => void;
}) {
  const orderedMessages = useMemo(
    () => [...messages].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()),
    [messages],
  );

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card/80 shadow-card backdrop-blur-xl">
      <div className="flex-none border-b border-border/60 bg-background/50 p-5 md:px-6 md:py-6">
        <div className="flex min-h-[96px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {mobileLayout && onBack ? (
              <Button variant="ghost" className="h-12 w-12 shrink-0 rounded-full p-0" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : null}

            <div className="min-w-0">
              {selectedComplaint ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <h2 className="truncate text-2xl font-extrabold tracking-tight md:text-[34px]">{selectedComplaint.title}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(selectedComplaint.status)}`}>{selectedComplaint.status}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityTone(selectedComplaint.priority)}`}>{selectedComplaint.priority}</span>
                    {getComplaintSignal(selectedComplaint).escalated ? <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">Escalated</span> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground md:text-base">
                    <span className="font-mono text-[13px] uppercase tracking-[0.26em] text-primary">{selectedComplaint.grievanceId}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-5 w-5" />
                      {selectedComplaint.assignedOfficerName ?? "Officer not assigned"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-5 w-5" />
                      Updated {formatRelativeTime(selectedComplaint.updatedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      {selectedComplaint.assignedOfficerId ? <Wifi className="h-5 w-5 text-success" /> : <WifiOff className="h-5 w-5 text-warning" />}
                      Live thread
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Select a complaint to open the thread</h2>
                  <p className="mt-2 text-base text-muted-foreground md:text-[16px]">The chat window loads message history, attachments, and realtime updates once a case is selected.</p>
                </>
              )}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-3 xl:flex">
            <Button variant="outline" className="h-14 min-w-[120px] rounded-full px-5 text-sm" onClick={onQuickRefresh} disabled={!selectedComplaint}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" className="h-14 min-w-[120px] rounded-full px-5 text-sm" onClick={onDownloadReport} disabled={!selectedComplaint}>
              <Download className="mr-2 h-4 w-4" />
              Report
            </Button>
          </div>
        </div>
      </div>

      <div ref={messagesViewportRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-6" onScroll={onScroll}>
        {!selectedComplaint ? (
          <div className="grid h-full place-items-center rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-10 text-center">
            <div className="max-w-md">
              <MessageSquare className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">No conversation selected</h3>
              <p className="mt-2 text-sm text-muted-foreground">Pick a complaint thread from the list to open the realtime support workspace.</p>
            </div>
          </div>
        ) : messagesLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className="h-24 w-[70%] animate-pulse rounded-3xl bg-muted/60" />
              </div>
            ))}
          </div>
        ) : messagesError ? (
          <div className="grid h-full place-items-center rounded-3xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center text-destructive">
            <div className="max-w-md">
              <TriangleAlert className="mx-auto h-10 w-10" />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">Unable to load messages</h3>
              <p className="mt-2 text-sm text-muted-foreground">{messagesError}</p>
            </div>
          </div>
        ) : orderedMessages.length === 0 ? (
          <div className="grid h-full place-items-center rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-10 text-center">
            <div className="max-w-md">
              <MessageSquare className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">Thread is ready</h3>
              <p className="mt-2 text-sm text-muted-foreground">Start the conversation with the citizen. Messages and attachments will appear here in realtime.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orderedMessages.map((message, index) => {
              const previousMessage = orderedMessages[index - 1];
              const isMine = message.senderId === currentUserId;
              const isSystem = getAttachmentKind(message) === "system";
              const showDayDivider = !previousMessage || formatDateLabel(previousMessage.createdAt) !== formatDateLabel(message.createdAt);
              const showAvatar = !previousMessage || previousMessage.senderId !== message.senderId || showDayDivider;
              const attachmentKind = getAttachmentKind(message);

              return (
                <div key={message.id} className="space-y-4">
                  {showDayDivider ? (
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      <span className="h-px flex-1 bg-border/70" />
                      <span>{formatDateLabel(message.createdAt)}</span>
                      <span className="h-px flex-1 bg-border/70" />
                    </div>
                  ) : null}

                  {isSystem ? (
                    <div className="mx-auto max-w-2xl rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">{message.message ?? getMessagePreview(message)}</div>
                  ) : (
                    <div className={`flex items-end gap-4 ${isMine ? "justify-end" : "justify-start"}`}>
                      {!isMine ? (
                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${showAvatar ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          <Users className="h-5 w-5" />
                        </div>
                      ) : null}

                      <div className={`max-w-[72%] rounded-3xl border px-5 py-4 shadow-md md:px-6 md:py-5 ${isMine ? "border-primary/20 bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground shadow-[0_24px_60px_-30px_rgba(8,145,178,0.85)]" : "border-border/70 bg-background/90 text-foreground"}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className={`text-xs font-medium ${isMine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{isMine ? currentUserName : "Support team"}</div>
                          <div className={`text-[13px] ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatTimeLabel(message.createdAt)}</div>
                        </div>

                        {message.message ? <p className="mt-3 whitespace-pre-wrap text-[17px] leading-8">{message.message}</p> : null}

                        {attachmentKind === "image" && message.attachment?.fileUrl ? (
                          <a href={message.attachment.fileUrl} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-2xl border border-white/10">
                            <img src={message.attachment.fileUrl} alt={message.attachment.fileName ?? "Attachment"} className="max-h-72 w-full object-cover" />
                          </a>
                        ) : null}

                        {attachmentKind === "audio" && message.attachment?.fileUrl ? (
                          <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <FileAudio className="h-4 w-4" />
                              Voice note
                            </div>
                            <audio controls src={message.attachment.fileUrl} className="w-full" />
                          </div>
                        ) : null}

                        {attachmentKind === "pdf" && message.attachment?.fileUrl ? (
                          <a href={message.attachment.fileUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-4 text-sm transition hover:bg-accent">
                            <FileText className="h-5 w-5 text-primary" />
                            <div className="min-w-0">
                              <div className="font-medium">{extractFileName(message.attachment.fileUrl)}</div>
                              <div className="text-xs text-muted-foreground">Open PDF attachment</div>
                            </div>
                            <Link2 className="ml-auto h-4 w-4 text-muted-foreground" />
                          </a>
                        ) : null}

                        {attachmentKind === "location" && message.attachment ? (
                          <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              Location shared
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {typeof message.attachment.latitude === "number" && typeof message.attachment.longitude === "number"
                                ? `${message.attachment.latitude.toFixed(5)}, ${message.attachment.longitude.toFixed(5)}`
                                : "Location metadata attached to this update."}
                            </div>
                          </div>
                        ) : null}

                        {message.attachment?.fileUrl && attachmentKind === "attachment" ? (
                          <a href={message.attachment.fileUrl} target="_blank" rel="noreferrer" className={`mt-4 flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm transition ${isMine ? "border-white/15 bg-white/10" : "border-border/70 bg-muted/40 hover:bg-accent"}`}>
                            <Paperclip className="h-5 w-5" />
                            <div className="min-w-0">
                              <div className="font-medium">{message.attachment.fileName ?? extractFileName(message.attachment.fileUrl)}</div>
                              <div className={`text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Attachment ready to open</div>
                            </div>
                            <Link2 className="ml-auto h-4 w-4 opacity-70" />
                          </a>
                        ) : null}

                        <div className={`mt-3 flex items-center justify-between gap-3 text-[13px] ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCheck className="h-3.5 w-3.5" />
                            {message.isRead ? "Seen" : "Delivered"}
                          </span>
                          {message.receiverId ? <span>Recipient: {message.receiverId}</span> : <span>{attachmentKind}</span>}
                        </div>
                      </div>

                      {isMine ? (
                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${showAvatar ? "bg-background text-primary" : "bg-muted text-muted-foreground"}`}>
                          <span className="text-sm font-semibold">{currentUserName.slice(0, 1).toUpperCase()}</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}

            {remoteTyping.length > 0 ? (
              <div className="flex items-center gap-3 text-base text-muted-foreground">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="rounded-full border border-border/70 bg-background/80 px-4 py-3">{remoteTyping[0]} is typing...</div>
              </div>
            ) : null}
          </div>
        )}

        <div ref={messageBottomRef} />
      </div>

      <div className="flex-none border-t border-border/60 bg-background/95 px-5 py-5 backdrop-blur-xl md:px-6 md:py-6">
        {selectedComplaint ? (
          <>
            {pendingAttachment ? (
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{pendingAttachment.name}</div>
                  <div className="text-xs text-muted-foreground">{pendingAttachment.type || "attachment ready"}</div>
                </div>
                <button onClick={onRemoveAttachment} className="text-xs font-medium text-muted-foreground transition hover:text-foreground">Remove</button>
              </div>
            ) : null}

            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[28px] border border-border/70 bg-background px-4 py-4 shadow-sm md:px-5 md:py-5">
                <button onClick={onSelectAttachment} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-border/70 bg-muted/40 text-muted-foreground transition hover:bg-accent hover:text-foreground" title="Attach file">
                  <Paperclip className="h-5 w-5" />
                </button>
                <button onClick={onSelectAttachment} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-border/70 bg-muted/40 text-muted-foreground transition hover:bg-accent hover:text-foreground" title="Attach image or PDF">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button onClick={onSendLocation} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-border/70 bg-muted/40 text-muted-foreground transition hover:bg-accent hover:text-foreground" title="Share location">
                  <MapPin className="h-5 w-5" />
                </button>
                <textarea
                  ref={composerRef}
                  value={messageText}
                  onChange={(event) => onComposerChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      onSendMessage();
                    }
                  }}
                  placeholder={`Message ${selectedComplaint.reporterName}...`}
                  rows={3}
                  className="min-h-[64px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[16px] outline-none placeholder:text-muted-foreground focus:ring-0"
                />
              </div>

              <div className="flex flex-shrink-0 items-center gap-3">
                <Button variant="outline" className="h-16 w-[140px] rounded-2xl px-5 text-sm" onClick={onQuickRefresh} disabled={!activeRoomId}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button className="h-16 w-[140px] rounded-2xl bg-gradient-to-r from-primary to-cyan-500 px-6 text-base text-primary-foreground shadow-[0_20px_40px_-20px_rgba(8,145,178,0.85)]" onClick={onSendMessage} disabled={sending || (!messageText.trim() && !pendingAttachment)}>
                  {sending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                  Send
                </Button>
              </div>
            </div>

            <input
              ref={attachmentInputRef}
              type="file"
              accept="image/*,application/pdf,audio/*"
              className="hidden"
              onChange={(event) => {
                onAttachFile(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 px-5 py-6 text-sm text-muted-foreground">Select a complaint to start messaging. The composer unlocks once a thread is active.</div>
        )}
      </div>
    </section>
  );
}

function InsightPanel({
  selectedComplaint,
  summary,
  onDownloadReport,
  mobileLayout = false,
  onBackToThreads,
}: {
  selectedComplaint: ComplaintRecord | null;
  summary: ComplaintSummary | null;
  onDownloadReport: () => void;
  mobileLayout?: boolean;
  onBackToThreads?: () => void;
}) {
  const stats = summary
    ? [
        { label: "Submitted", value: summary.submitted },
        { label: "Assigned", value: summary.assigned },
        { label: "In progress", value: summary.inProgress },
        { label: "Resolved", value: summary.resolved },
        { label: "Escalated", value: summary.escalated },
      ]
    : [];

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card/80 shadow-card backdrop-blur-xl">
      <div className="flex-none border-b border-border/60 px-5 py-5 md:px-6 md:py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Complaint details</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Context and actions</h2>
          </div>
          {mobileLayout ? (
            <Button variant="ghost" className="h-12 rounded-full px-3" onClick={onBackToThreads}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
        {!selectedComplaint ? (
          <div className="grid h-full place-items-center rounded-3xl border border-dashed border-border/70 bg-background/60 px-5 py-10 text-center">
            <div className="max-w-xs">
              <Sparkles className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-3 text-lg font-semibold tracking-tight">No complaint selected</h3>
              <p className="mt-2 text-sm text-muted-foreground">Select a conversation to inspect its timeline, evidence, SLA, and officer context.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Status</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(selectedComplaint.status)}`}>{selectedComplaint.status}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityTone(selectedComplaint.priority)}`}>{selectedComplaint.priority}</span>
                    {selectedComplaint.escalationLevel ? <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">Escalation level {selectedComplaint.escalationLevel}</span> : null}
                  </div>
                </div>
                <button onClick={onDownloadReport} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white px-3 py-2 text-xs font-medium text-foreground transition hover:bg-accent">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{selectedComplaint.description}</p>
            </div>

            {stats.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-border/70 bg-background/70 p-4">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{item.label}</div>
                    <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold tracking-tight">Case facts</h3>
                <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">{selectedComplaint.category}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniDetailCard label="Grievance ID" value={selectedComplaint.grievanceId} mono />
                <MiniDetailCard label="Department" value={selectedComplaint.department} />
                <MiniDetailCard label="Location" value={`${selectedComplaint.city}, ${selectedComplaint.district}`} />
                <MiniDetailCard label="Officer" value={selectedComplaint.assignedOfficerName ?? "Pending"} />
                <MiniDetailCard label="Citizen" value={selectedComplaint.reporterName} />
                <MiniDetailCard label="Updated" value={formatRelativeTime(selectedComplaint.updatedAt)} />
              </div>
              <div className="mt-4 rounded-2xl border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">{selectedComplaint.address}</div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
              <h3 className="font-semibold tracking-tight">Evidence</h3>
              <div className="mt-3 space-y-3">
                {selectedComplaint.evidence.length ? (
                  selectedComplaint.evidence.map((item) => (
                    <a
                      key={`${item.name}-${item.type}`}
                      href={item.dataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm transition hover:bg-accent"
                    >
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.type} • {formatBytes(item.size)}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">No evidence uploaded.</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold tracking-tight">Timeline</h3>
                <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">{selectedComplaint.timeline.length} entries</span>
              </div>
              <div className="mt-4 space-y-3">
                {selectedComplaint.timeline.length ? (
                  selectedComplaint.timeline.map((entry) => (
                    <div key={`${entry.date}-${entry.action}`} className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{entry.action}</div>
                        <div className="text-xs text-muted-foreground">{entry.date}</div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{entry.by}</div>
                      {entry.note ? <div className="mt-2 text-sm text-foreground/90">{entry.note}</div> : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">No timeline entries recorded yet.</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
              <h3 className="font-semibold tracking-tight">Resolution</h3>
              <p className="mt-2 text-sm text-muted-foreground">{selectedComplaint.resolutionSummary ?? "No resolution recorded yet."}</p>
              <div className="mt-4 space-y-2">
                {selectedComplaint.resolutionEvidence.length ? (
                  selectedComplaint.resolutionEvidence.map((item) => (
                    <div key={`${item.name}-${item.type}`} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.type} • {formatBytes(item.size)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">No resolution evidence uploaded.</div>
                )}
              </div>
            </div>

            {summary ? (
              <div className="rounded-3xl border border-border/70 bg-slate-950 p-4 text-white">
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-300">Backend summary</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-3 xl:grid-cols-2">
                  <SummaryChip label="Total" value={summary.total} />
                  <SummaryChip label="Submitted" value={summary.submitted} />
                  <SummaryChip label="Assigned" value={summary.assigned} />
                  <SummaryChip label="In progress" value={summary.inProgress} />
                  <SummaryChip label="Resolved" value={summary.resolved} />
                  <SummaryChip label="Escalated" value={summary.escalated} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}

function MiniDetailCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm font-medium text-foreground ${mono ? "font-mono tracking-[0.18em]" : ""}`}>{value}</div>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-[-0.04em]">{value}</div>
    </div>
  );
}
