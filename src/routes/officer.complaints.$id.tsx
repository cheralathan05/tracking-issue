import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Send,
  Navigation,
  Siren,
  MapPin,
  Timer,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { priorityTone, statusTone } from "@/lib/complaint-status";
import {
  escalateOfficerComplaint,
  getComplaint,
  getOfficerNavigationPlan,
  listComplaintMessages,
  sendComplaintMessage,
  startOfficerInspection,
  submitOfficerResolution,
  updateComplaintStatus,
  updateOfficerGps,
  type ComplaintMessageRecord,
  type ComplaintRecord,
  type ComplaintStatus,
  type EscalationRecord,
  type OfficerOpsNavigation,
} from "@/lib/smartgov-api";

export const Route = createFileRoute("/officer/complaints/$id")({
  head: () => ({ meta: [{ title: "Inspect Complaint — Officer" }] }),
  component: OfficerComplaintDetail,
});

function OfficerComplaintDetail() {
  const { id } = useParams({ from: "/officer/complaints/$id" });
  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null);
  const [messages, setMessages] = useState<ComplaintMessageRecord[]>([]);
  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<ComplaintRecord["status"]>("In Progress");
  const [note, setNote] = useState("");
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [gpsEta, setGpsEta] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationLevel, setEscalationLevel] = useState<EscalationRecord["level"]>("high");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [citizenConfirmation, setCitizenConfirmation] = useState(true);
  const [proofFiles, setProofFiles] = useState<Array<{ name: string; type: string; size: number; dataUrl: string }>>([]);
  const [navPlan, setNavPlan] = useState<OfficerOpsNavigation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const quickReplies = [
    "Team dispatched",
    "Inspection started",
    "Issue identified",
    "Repair in progress",
    "Expected completion in 30 mins",
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [complaintResult, messageResult] = await Promise.all([getComplaint(id), listComplaintMessages(id)]);
        if (mounted) {
          setComplaint(complaintResult.complaint);
          setStatus(complaintResult.complaint.status);
          setMessages(messageResult.messages);
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load complaint");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    const poll = setInterval(load, 6000);

    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, [id]);

  const refreshComplaint = async () => {
    const [result, messageResult] = await Promise.all([getComplaint(id), listComplaintMessages(id)]);
    setComplaint(result.complaint);
    setStatus(result.complaint.status);
    setMessages(messageResult.messages);
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
    if (!chatText.trim() || !complaint) return;
    setActionLoading(true);
    try {
      await sendComplaintMessage(complaint.grievanceId, chatText.trim());
      setChatText("");
      await refreshComplaint();
      toast.success("Message delivered");
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : "Unable to send message");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartInspection = async () => {
    if (!complaint) return;
    setActionLoading(true);
    try {
      await startOfficerInspection(complaint.grievanceId, {
        latitude: gpsLat ? Number(gpsLat) : undefined,
        longitude: gpsLng ? Number(gpsLng) : undefined,
        note: "Inspection started from officer workspace",
      });
      toast.success("Inspection timer started");
      await refreshComplaint();
    } catch (inspectionError) {
      toast.error(inspectionError instanceof Error ? inspectionError.message : "Unable to start inspection");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateGps = async () => {
    if (!complaint || !gpsLat || !gpsLng) return;
    setActionLoading(true);
    try {
      await updateOfficerGps(complaint.grievanceId, {
        latitude: Number(gpsLat),
        longitude: Number(gpsLng),
        etaMinutes: gpsEta ? Number(gpsEta) : undefined,
      });
      toast.success("GPS update shared");
      await refreshComplaint();
    } catch (gpsError) {
      toast.error(gpsError instanceof Error ? gpsError.message : "Unable to update GPS");
    } finally {
      setActionLoading(false);
    }
  };

  const handleNavigate = async () => {
    if (!complaint) return;

    if (!navigator.geolocation) {
      toast.error("Geolocation unavailable on this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await getOfficerNavigationPlan(complaint.grievanceId, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setNavPlan(result.navigation);
          toast.success(`ETA ${result.navigation.etaMinutes} mins`);
        } catch (navError) {
          toast.error(navError instanceof Error ? navError.message : "Unable to fetch route");
        }
      },
      () => {
        toast.error("Location permission denied");
      },
    );
  };

  const handleEscalate = async () => {
    if (!complaint || !escalationReason.trim()) return;
    setActionLoading(true);
    try {
      await escalateOfficerComplaint(complaint.grievanceId, {
        reason: escalationReason.trim(),
        level: escalationLevel,
      });
      toast.success("Escalation submitted");
      setEscalationReason("");
      await refreshComplaint();
    } catch (escalateError) {
      toast.error(escalateError instanceof Error ? escalateError.message : "Unable to escalate");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProofFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const transformed = await Promise.all(
      files.map(
        (file) =>
          new Promise<{ name: string; type: string; size: number; dataUrl: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type || "application/octet-stream",
                size: file.size,
                dataUrl: String(reader.result ?? ""),
              });
            };
            reader.onerror = () => reject(new Error("Unable to process file"));
            reader.readAsDataURL(file);
          }),
      ),
    );

    setProofFiles(transformed);
  };

  const handleResolve = async () => {
    if (!complaint || !resolutionSummary.trim()) return;
    setActionLoading(true);
    try {
      await submitOfficerResolution(complaint.grievanceId, {
        resolutionSummary: resolutionSummary.trim(),
        citizenConfirmation,
        beforeAfterPhotos: proofFiles,
        completionTimestamp: new Date().toISOString(),
      });
      toast.success("Resolution submitted with evidence");
      setResolutionSummary("");
      setProofFiles([]);
      await refreshComplaint();
    } catch (resolveError) {
      toast.error(resolveError instanceof Error ? resolveError.message : "Unable to submit resolution");
    } finally {
      setActionLoading(false);
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
          <Link to="/officer/complaints">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to complaints
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0 hover:bg-transparent">
        <Link to="/officer/complaints">
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
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border px-2 py-1">Department: {complaint.department}</span>
              <span className="rounded-full border border-border px-2 py-1">Area: {complaint.city}, {complaint.district}</span>
              <span className="rounded-full border border-border px-2 py-1">SLA: {complaint.slaDeadline ? new Date(complaint.slaDeadline).toLocaleString() : "Not set"}</span>
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
            <h2 className="font-semibold">Citizen details</h2>
            <div className="mt-4 space-y-2 text-sm">
              <DetailRow label="Name" value={complaint.reporterName} />
              <DetailRow label="Email" value={complaint.reporterEmail ?? "—"} />
              <DetailRow label="Mobile" value={complaint.reporterMobile ?? "—"} />
              <DetailRow label="Area" value={`${complaint.city}, ${complaint.district}`} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Update progress</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ComplaintStatus)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>In Progress</option>
                  <option>Awaiting Information</option>
                  <option>Resolved</option>
                  <option>Escalated</option>
                  <option>Closed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Field note / resolution</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add inspection notes or resolution summary."
                />
              </div>
              <Button onClick={handleStatusUpdate} disabled={actionLoading} className="w-full bg-gradient-primary text-primary-foreground">
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Save update
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Field inspection & GPS</h2>
            <div className="mt-4 space-y-3">
              <Button onClick={handleStartInspection} disabled={actionLoading} className="w-full" variant="outline">
                <Timer className="mr-2 h-4 w-4" /> Start inspection
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Input value={gpsLat} onChange={(e) => setGpsLat(e.target.value)} placeholder="Latitude" />
                <Input value={gpsLng} onChange={(e) => setGpsLng(e.target.value)} placeholder="Longitude" />
              </div>
              <Input value={gpsEta} onChange={(e) => setGpsEta(e.target.value)} placeholder="ETA in mins (optional)" />
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleUpdateGps} disabled={actionLoading || !gpsLat || !gpsLng} variant="outline">
                  <Radio className="mr-1.5 h-4 w-4" /> Share GPS
                </Button>
                <Button onClick={handleNavigate} variant="outline">
                  <Navigation className="mr-1.5 h-4 w-4" /> Navigate
                </Button>
              </div>
              {navPlan ? (
                <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs">
                  <div>Distance: {navPlan.distanceKm} km</div>
                  <div>ETA: {navPlan.etaMinutes} mins</div>
                  <div className="truncate">Destination: {navPlan.destination.address}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Escalation center</h2>
            <div className="mt-4 space-y-3">
              <select
                value={escalationLevel}
                onChange={(event) => setEscalationLevel(event.target.value as EscalationRecord["level"])}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Lack of resources</option>
                <option value="medium">Cross-department issue</option>
                <option value="high">Infrastructure failure</option>
                <option value="emergency">Emergency / Safety risk</option>
              </select>
              <Textarea
                value={escalationReason}
                onChange={(event) => setEscalationReason(event.target.value)}
                placeholder="Explain why this case must be escalated"
              />
              <Button onClick={handleEscalate} disabled={actionLoading || escalationReason.trim().length < 5} className="w-full" variant="destructive">
                <Siren className="mr-1.5 h-4 w-4" /> Escalate issue
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Resolution upload</h2>
            <div className="mt-4 space-y-3">
              <Textarea
                value={resolutionSummary}
                onChange={(event) => setResolutionSummary(event.target.value)}
                placeholder="Resolution notes, completion details, and handoff notes"
              />
              <div className="space-y-1.5">
                <Label htmlFor="proofFiles">Before / after photos</Label>
                <Input id="proofFiles" type="file" multiple accept="image/*" onChange={handleProofFiles} />
                <div className="text-xs text-muted-foreground">{proofFiles.length} proof file(s) selected</div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={citizenConfirmation}
                  onChange={(event) => setCitizenConfirmation(event.target.checked)}
                />
                Citizen confirmation received
              </label>
              <Button onClick={handleResolve} disabled={actionLoading || resolutionSummary.trim().length < 10} className="w-full bg-gradient-primary text-primary-foreground">
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Submit resolution proof
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Live complaint chat</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => setChatText(reply)}
              className="rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary"
            >
              {reply}
            </button>
          ))}
        </div>
        <div className="mt-4 max-h-72 space-y-2 overflow-auto rounded-lg border border-border bg-secondary/20 p-3">
          {messages.length === 0 ? <div className="text-sm text-muted-foreground">No messages yet.</div> : null}
          {messages.map((message) => (
            <div key={message.id} className={`rounded-lg p-2.5 text-sm ${message.isAdmin ? "bg-info/10" : "bg-card"}`}>
              <div className="text-xs text-muted-foreground">{message.authorName} · {new Date(message.createdAt).toLocaleString()}</div>
              <div>{message.message}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Send realtime update to citizen/admin" />
          <Button onClick={handleSendMessage} disabled={actionLoading || !chatText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
