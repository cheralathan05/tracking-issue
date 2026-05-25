import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Search, Send, AlertTriangle, Lock, Unlock, UserSwap, ArrowUp } from "lucide-react";
import { ensureAuthSession, getProfile } from "@/lib/auth-api";
import {
  listAdminChatRooms,
  getAdminChatRoom,
  sendAdminChatMessage,
  reassignComplaintToOfficer,
  escalateComplaintAdmin,
  freezeComplaintChatAdmin,
  unfreezeComplaintChatAdmin,
  type AdminChatRoom,
  type AdminChatDetails,
} from "@/lib/smartgov-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSocket } from "@/hooks/useSocket";

const adminRoles = new Set([
  "super_admin",
  "state_admin",
  "district_officer",
  "department_officer",
  "admin",
  "officer",
]);

export const Route = createFileRoute("/admin/chat")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") {
      return;
    }

    const session = await ensureAuthSession();

    if (!session) {
      throw redirect({
        to: "/admin/login",
        search: { returnTo: location.pathname },
        replace: true,
      });
    }

    const profile = await getProfile().catch(() => null);
    const role = String(profile?.data?.user?.role ?? "");

    if (!adminRoles.has(role)) {
      throw redirect({
        to: "/dashboard",
        replace: true,
      });
    }
  },
  component: AdminChatPage,
});

function AdminChatPage() {
  const [rooms, setRooms] = useState<AdminChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [chatDetails, setChatDetails] = useState<AdminChatDetails | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "escalated" | "urgent" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();

  // Load initial rooms
  useEffect(() => {
    loadRooms();
  }, [filter, searchQuery]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatDetails?.messages]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.emit("adminJoinMonitoring", localStorage.getItem("userId"));

    socket.on("new_message", (data: any) => {
      if (selectedRoomId && data.roomId === selectedRoomId) {
        loadChatDetails(selectedRoomId);
      } else {
        loadRooms();
      }
    });

    socket.on("escalation_alert", (data: any) => {
      loadRooms();
    });

    socket.on("officer_reassigned", (data: any) => {
      if (selectedRoomId && data.complaintId === chatDetails?.complaint.id) {
        loadChatDetails(selectedRoomId);
      }
      loadRooms();
    });

    return () => {
      socket.off("new_message");
      socket.off("escalation_alert");
      socket.off("officer_reassigned");
    };
  }, [socket, selectedRoomId, chatDetails?.complaint.id]);

  async function loadRooms() {
    try {
      setIsLoading(true);
      const result = await listAdminChatRooms({
        filter,
        search: searchQuery,
        limit: 50,
      });
      setRooms(result.data.rooms);
    } catch (err) {
      setError("Failed to load chat rooms");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadChatDetails(roomId: string) {
    try {
      const result = await getAdminChatRoom(roomId);
      setChatDetails(result.data);
    } catch (err) {
      setError("Failed to load chat details");
      console.error(err);
    }
  }

  async function handleSelectRoom(roomId: string) {
    setSelectedRoomId(roomId);
    await loadChatDetails(roomId);
  }

  async function handleSendMessage() {
    if (!messageInput.trim() || !selectedRoomId || isSending) return;

    try {
      setIsSending(true);
      const messageText = messageInput.trim();
      setMessageInput("");

      await sendAdminChatMessage(selectedRoomId, messageText);

      // Reload chat to show new message
      await loadChatDetails(selectedRoomId);

      // Emit socket event for real-time update
      socket?.emit("message", {
        roomId: selectedRoomId,
        message: messageText,
        sender: "admin",
      });
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
      setMessageInput(messageInput);
    } finally {
      setIsSending(false);
    }
  }

  async function handleReassignOfficer() {
    if (!chatDetails) return;
    const newOfficerId = prompt("Enter new officer ID:");
    if (!newOfficerId) return;

    try {
      await reassignComplaintToOfficer(chatDetails.complaint.id, newOfficerId, "Reassigned by admin");
      await loadChatDetails(selectedRoomId!);
      alert("Officer reassigned successfully");
    } catch (err) {
      setError("Failed to reassign officer");
    }
  }

  async function handleEscalate() {
    if (!chatDetails) return;
    const level = prompt("Enter escalation level (low/medium/high/emergency):");
    if (!level) return;
    const reason = prompt("Enter escalation reason:");
    if (!reason) return;

    try {
      await escalateComplaintAdmin(chatDetails.complaint.id, level, reason);
      await loadChatDetails(selectedRoomId!);
      alert("Complaint escalated successfully");
    } catch (err) {
      setError("Failed to escalate complaint");
    }
  }

  async function handleFreezeChat() {
    if (!chatDetails) return;
    const reason = prompt("Enter reason for freezing chat:");
    if (!reason) return;

    try {
      await freezeComplaintChatAdmin(chatDetails.complaint.id, reason);
      await loadChatDetails(selectedRoomId!);
      alert("Chat frozen successfully");
    } catch (err) {
      setError("Failed to freeze chat");
    }
  }

  async function handleUnfreezeChat() {
    if (!chatDetails) return;

    try {
      await unfreezeComplaintChatAdmin(chatDetails.complaint.id);
      await loadChatDetails(selectedRoomId!);
      alert("Chat unfrozen successfully");
    } catch (err) {
      setError("Failed to unfreeze chat");
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Escalated":
        return "bg-red-50 border-l-4 border-red-500";
      case "In Progress":
        return "bg-blue-50 border-l-4 border-blue-500";
      case "Resolved":
        return "bg-green-50 border-l-4 border-green-500";
      default:
        return "bg-gray-50 border-l-4 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Admin Chat Monitoring & Governance
          </h1>
          <p className="text-slate-600">
            Monitor all complaint communications, supervise officers, and manage escalations in real-time
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Chat Rooms List */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Rooms</CardTitle>
                <CardDescription>{rooms.length} total</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by ID or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filters */}
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
                    <TabsTrigger value="escalated" className="flex-1 text-xs">🔴 Escalated</TabsTrigger>
                    <TabsTrigger value="urgent" className="flex-1 text-xs">⚡ Urgent</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Room List */}
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-2 pr-4">
                    {isLoading ? (
                      <div className="text-center text-sm text-slate-500">Loading...</div>
                    ) : rooms.length === 0 ? (
                      <div className="text-center text-sm text-slate-500">No rooms found</div>
                    ) : (
                      rooms.map((room) => (
                        <div
                          key={room.id}
                          onClick={() => handleSelectRoom(room.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedRoomId === room.id
                              ? "bg-blue-100 border-2 border-blue-500"
                              : "bg-slate-50 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-semibold text-sm text-slate-900 truncate">
                              {room.grievanceId}
                            </span>
                            {room.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {room.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 truncate">{room.citizen}</p>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {room.isEscalated && (
                              <Badge variant="destructive" className="text-xs">Escalated</Badge>
                            )}
                            <Badge
                              className={`text-xs ${getPriorityColor(room.priority)}`}
                              variant="secondary"
                            >
                              {room.priority}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Chat Details */}
          <div className="lg:col-span-3">
            {!selectedRoomId ? (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600">Select a chat room</h3>
                  <p className="text-slate-500">Choose from the left panel to start monitoring</p>
                </div>
              </Card>
            ) : !chatDetails ? (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse">Loading chat details...</div>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Complaint Info Card */}
                <Card className={`${getStatusColor(chatDetails.complaint.status)}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">
                          {chatDetails.complaint.grievanceId} - {chatDetails.complaint.title}
                        </CardTitle>
                        <CardDescription>
                          {chatDetails.complaint.department} | {chatDetails.complaint.district}
                        </CardDescription>
                      </div>
                      <Badge
                        className={`${getPriorityColor(
                          chatDetails.complaint.priority
                        )}`}
                        variant="secondary"
                      >
                        {chatDetails.complaint.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Citizen:</span>
                        <p className="font-semibold">{chatDetails.complaint.citizen.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Assigned Officer:</span>
                        <p className="font-semibold">{chatDetails.complaint.officer.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Status:</span>
                        <p className="font-semibold">{chatDetails.complaint.status}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">SLA Deadline:</span>
                        <p className="font-semibold">
                          {chatDetails.complaint.slaDeadline
                            ? new Date(chatDetails.complaint.slaDeadline).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {chatDetails.complaint.escalation && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Escalation ({chatDetails.complaint.escalation.level}):</strong>{" "}
                          {chatDetails.complaint.escalation.reason}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReassignOfficer}
                        className="text-xs"
                      >
                        <UserSwap className="w-3 h-3 mr-1" /> Reassign Officer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEscalate}
                        className="text-xs"
                      >
                        <ArrowUp className="w-3 h-3 mr-1" /> Escalate
                      </Button>
                      {!chatDetails.complaint.escalation?.reason?.includes("frozen") ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleFreezeChat}
                          className="text-xs"
                        >
                          <Lock className="w-3 h-3 mr-1" /> Freeze Chat
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleUnfreezeChat}
                          className="text-xs"
                        >
                          <Unlock className="w-3 h-3 mr-1" /> Unfreeze Chat
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Messages Area */}
                <Card className="flex flex-col h-[400px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Chat Messages</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 pr-4 mb-4">
                      <div className="space-y-3">
                        {chatDetails.messages.length === 0 ? (
                          <p className="text-center text-slate-500 text-sm py-8">
                            No messages yet
                          </p>
                        ) : (
                          chatDetails.messages.map((msg, idx) => (
                            <div key={idx} className="text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900">
                                  {msg.authorName}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {msg.authorRole}
                                </Badge>
                                {msg.isAdmin && (
                                  <Badge className="text-xs bg-purple-100 text-purple-800">
                                    ADMIN
                                  </Badge>
                                )}
                              </div>
                              <p className="text-slate-700 bg-slate-50 p-2 rounded">
                                {msg.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      <div ref={messagesEndRef} />
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type admin message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        disabled={isSending}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !messageInput.trim()}
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Participants */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Participants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {chatDetails.participants.map((participant) => (
                        <div
                          key={participant.userId}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded"
                        >
                          <div>
                            <p className="font-semibold text-sm">{participant.name}</p>
                            <p className="text-xs text-slate-600">{participant.role}</p>
                          </div>
                          <p className="text-xs text-slate-500">
                            Joined: {new Date(participant.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
