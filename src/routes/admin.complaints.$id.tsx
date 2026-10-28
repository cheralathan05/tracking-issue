import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, MessageSquare, Send, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { priorityTone, statusTone } from "@/lib/complaint-status";
import {
  assignComplaint,
  getComplaint,
  listComplaintMessages,
  listOfficers,
  sendComplaintMessage,
  updateComplaintStatus,
  type ComplaintMessageRecord,
  type ComplaintRecord,
  type OfficerSummary,
} from "@/lib/smartgov-api";

export const Route = createFileRoute("/admin/complaints/$id")({
  head: () => ({ meta: [{ title: "Manage Complaint — Admin" }] }),
  component: AdminComplaintDetail,
});

function AdminComplaintDetail() {
  const { id } = useParams({ from: "/admin/complaints/$id" });
  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null);
  const [officers, setOfficers] = useState<OfficerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [status, setStatus] = useState<ComplaintRecord["status"]>("Under Review");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ComplaintMessageRecord[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setMessagesLoading(true);
    setError(null);
    setMessageError(null);

    Promise.all([getComplaint(id), listOfficers()])
      .then(([complaintResult, officersResult]) => {
        if (!mounted) {
          return;
        }

        const comp = complaintResult.complaint;
        setComplaint(comp);
        setStatus(comp.status);
        const officerList = officersResult.officers;
        setOfficers(officerList);

        // Pre-select current, suggested, or first available officer
        if (comp.assignedOfficerId) {
          setSelectedOfficerId(comp.assignedOfficerId);
        } else if (comp.suggestedOfficerId) {
          setSelectedOfficerId(comp.suggestedOfficerId);
        } else if (officerList.length > 0) {
          setSelectedOfficerId(officerList[0].id);
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load complaint");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    listComplaintMessages(id)
      .then((result) => {
        if (mounted) {
          setMessages(result.messages);
        }
      })
      .catch((messageFetchError) => {
        if (mounted) {
          setMessageError(messageFetchError instanceof Error ? messageFetchError.message : "Unable to load chat messages");
        }
      })
      .finally(() => {
        if (mounted) {
          setMessagesLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const refreshComplaint = async () => {
    const result = await getComplaint(id);
    setComplaint(result.complaint);
    setStatus(result.complaint.status);
    if (result.complaint.assignedOfficerId) {
      setSelectedOfficerId(result.complaint.assignedOfficerId);
    }
  };

  const handleAssign = async (targetOfficerId?: string) => {
    if (!complaint) return;
    const officerToAssign = targetOfficerId || selectedOfficerId || complaint.suggestedOfficerId;
    if (!officerToAssign) {
      toast.error("Please select an officer to assign");
      return;
    }

    setActionLoading(true);
    try {
      await assignComplaint(complaint.grievanceId, {
        officerId: officerToAssign,
        useSuggestedOfficer: false,
      });
      const chosen = officers.find((o) => o.id === officerToAssign);
      toast.success(`Complaint assigned to ${chosen?.fullName || "officer"}`);
      await refreshComplaint();
    } catch (assignError) {
      toast.error(assignError instanceof Error ? assignError.message : "Unable to assign complaint");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!complaint) return;
    setActionLoading(true);
    try {
      await updateComplaintStatus(complaint.grievanceId, {
        status,
        note,
        resolutionSummary: status === "Resolved" ? note : undefined,
      });
      toast.success("Complaint updated");
      setNote("");
      await refreshComplaint();
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : "Unable to update complaint");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    setSendingMessage(true);
    try {
      const result = await sendComplaintMessage(id, newMessage.trim());
      setMessages((currentMessages) => [...currentMessages, result.messageRecord]);
      setNewMessage("");
      setMessageError(null);
      toast.success("Message sent");
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : "Unable to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-border bg-card p-10 text-center">Loading complaint...</div>;
  }

  if (error || !complaint) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-8 shadow-card">
        <h1 className="text-2xl font-bold">Complaint not found</h1>
        <p className="text-sm text-muted-foreground">{error ?? "The complaint record is unavailable."}</p>
        <Button asChild variant="outline">
          <Link to="/admin/complaints">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to complaints
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0 hover:bg-transparent">
        <Link to="/admin/complaints">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to complaints
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Grievance ID</div>
                <div className="mt-1 font-mono text-lg font-semibold">{complaint.grievanceId}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(complaint.status)}`}>
                  {complaint.status}
                </span>
                <span className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase ${priorityTone(complaint.priority)}`}>
                  {complaint.priority}
                </span>
              </div>
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">{complaint.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{complaint.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DetailCard label="Location" value={`${complaint.city}, ${complaint.district}`} />
              <DetailCard label="Department" value={complaint.department} />
              <DetailCard label="Citizen" value={complaint.reporterName} />
              <DetailCard label="Assigned officer" value={complaint.assignedOfficerName ?? complaint.suggestedOfficerName ?? "Pending"} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Chat with citizen</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Messages are saved through the complaint API and shared with the citizen thread.
            </p>
            <div className="mt-4 flex h-64 flex-col gap-3 overflow-hidden">
              <div className="flex-1 space-y-3 overflow-auto pr-2">
                {messagesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading chat...</div>
                ) : messageError ? (
                  <div className="text-sm text-destructive">{messageError}</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No messages yet. Send the first message.</div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${message.isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-foreground"}`}
                      >
                        <div className="font-medium">{message.isAdmin ? `You (${message.authorName})` : message.authorName}</div>
                        <div className="mt-1 whitespace-pre-wrap">{message.message}</div>
                        <div className={`mt-1 text-xs ${message.isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage((e.target as HTMLInputElement).value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()}>
                  {sendingMessage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Timeline</h2>
            <div className="mt-4 space-y-4">
              {complaint.timeline.map((entry) => (
                <div key={`${entry.date}-${entry.action}`} className="rounded-xl border border-border bg-secondary/30 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{entry.action}</span>
                    <span className="text-xs text-muted-foreground">{entry.by}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{entry.date}</div>
                  {entry.note ? <p className="mt-1 text-sm">{entry.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Officer Assignment</h2>
              {complaint.assignedOfficerName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3 w-3" /> Assigned
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                  Awaiting Assignment
                </span>
              )}
            </div>

            {complaint.assignedOfficerName && (
              <div className="mt-3 rounded-xl border border-success/30 bg-success/5 p-3 text-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Currently Assigned</div>
                <div className="mt-1 font-semibold text-foreground">{complaint.assignedOfficerName}</div>
                <div className="text-xs text-muted-foreground">
                  {complaint.assignedDepartment} {complaint.assignedArea ? `· ${complaint.assignedArea}` : ""}
                </div>
              </div>
            )}

            {complaint.suggestedOfficerName && !complaint.assignedOfficerId && (
              <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      ✨ Suggested Match
                    </div>
                    <div className="mt-0.5 font-medium">{complaint.suggestedOfficerName}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10"
                    disabled={actionLoading}
                    onClick={() => handleAssign(complaint.suggestedOfficerId!)}
                  >
                    1-Click Assign
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="officerSelect" className="text-xs font-medium text-muted-foreground">
                  {complaint.assignedOfficerId ? "Reassign to Officer" : "Select Officer"}
                </Label>
                <select
                  id="officerSelect"
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose an Officer --</option>
                  {officers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.fullName} ({officer.department || "General"} · {officer.jurisdictionArea || "All areas"})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => handleAssign()}
                disabled={actionLoading || !selectedOfficerId}
                className="w-full bg-gradient-primary text-primary-foreground"
              >
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                {complaint.assignedOfficerId ? "Reassign Officer" : "Assign Officer"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Status update</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">New status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ComplaintRecord["status"])}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Under Review</option>
                  <option>Assigned</option>
                  <option>In Progress</option>
                  <option>Awaiting Information</option>
                  <option>Resolved</option>
                  <option>Escalated</option>
                  <option>Rejected</option>
                  <option>Closed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Note / resolution summary</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add a note for the timeline or a resolution summary if marking resolved."
                />
              </div>
              <Button onClick={handleStatusUpdate} disabled={actionLoading} className="w-full bg-gradient-primary text-primary-foreground">
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update complaint
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
