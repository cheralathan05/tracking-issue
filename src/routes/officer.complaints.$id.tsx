import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { priorityTone, statusTone } from "@/lib/complaint-status";
import { getComplaint, updateComplaintStatus, type ComplaintRecord } from "@/lib/smartgov-api";

export const Route = createFileRoute("/officer/complaints/$id")({
  head: () => ({ meta: [{ title: "Inspect Complaint — Officer" }] }),
  component: OfficerComplaintDetail,
});

function OfficerComplaintDetail() {
  const { id } = useParams({ from: "/officer/complaints/$id" });
  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<ComplaintRecord["status"]>("In Progress");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getComplaint(id)
      .then((result) => {
        if (mounted) {
          setComplaint(result.complaint);
          setStatus(result.complaint.status);
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

    return () => {
      mounted = false;
    };
  }, [id]);

  const refreshComplaint = async () => {
    const result = await getComplaint(id);
    setComplaint(result.complaint);
    setStatus(result.complaint.status);
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
                  onChange={(event) => setStatus(event.target.value as ComplaintRecord["status"])}
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
