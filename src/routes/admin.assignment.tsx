import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, MapPin, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { assignComplaint, fetchComplaintSummary, listComplaints, type ComplaintRecord, type ComplaintSummary } from "@/lib/smartgov-api";

export const Route = createFileRoute("/admin/assignment")({
  head: () => ({ meta: [{ title: "Smart assignment — Admin" }] }),
  component: SmartAssignment,
});

function SmartAssignment() {
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const refresh = async () => {
    const [summaryResult, complaintsResult] = await Promise.all([
      fetchComplaintSummary(),
      listComplaints({ view: "all" }),
    ]);
    setSummary(summaryResult);
    setComplaints(complaintsResult.complaints);
  };

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((error) => {
        if (mounted) {
          toast.error(error instanceof Error ? error.message : "Unable to load assignments");
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
  }, []);

  const handleAssign = async (complaint: ComplaintRecord) => {
    setActionLoadingId(complaint.grievanceId);
    try {
      await assignComplaint(complaint.grievanceId, { useSuggestedOfficer: true });
      toast.success(`Assigned ${complaint.grievanceId}`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to assign complaint");
    } finally {
      setActionLoadingId(null);
    }
  };

  const pending = complaints.filter((complaint) => complaint.status === "Submitted" || complaint.status === "Under Review");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Smart assignment engine</h1>
          <p className="text-sm text-muted-foreground">
            Auto-matches complaints to officers based on department + jurisdiction + current workload.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          <Sparkles className="h-3 w-3" /> Area-based routing
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Unassigned in queue</div>
          <div className="mt-1 text-3xl font-bold">{summary ? summary.submitted : "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Assigned today</div>
          <div className="mt-1 text-3xl font-bold">{summary ? summary.assigned : "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Resolved</div>
          <div className="mt-1 text-3xl font-bold">{summary ? summary.resolved : "—"}</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="font-semibold">Suggested matches</h2>
          <Button onClick={() => toast.success("Suggestions refreshed")} variant="outline">
            Refresh
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {loading ? (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">Loading suggestions...</li>
          ) : null}
          {!loading && pending.slice(0, 8).map((complaint) => (
            <li key={complaint.grievanceId} className="grid items-center gap-4 px-5 py-4 md:grid-cols-[1fr_auto_1fr_auto]">
              <div>
                <div className="font-mono text-[10px] text-muted-foreground">{complaint.grievanceId}</div>
                <div className="font-medium">{complaint.title}</div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {complaint.city} · {complaint.department}
                </div>
              </div>
              <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Suggested officer</div>
                <div className="font-medium">{complaint.suggestedOfficerName ?? "No match yet"}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {complaint.assignedOfficerName ? `Assigned to ${complaint.assignedOfficerName}` : "Awaiting assignment"}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => toast("Suggestion dismissed")}>
                  Skip
                </Button>
                <Button size="sm" onClick={() => handleAssign(complaint)} disabled={actionLoadingId === complaint.grievanceId}>
                  {actionLoadingId === complaint.grievanceId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Assign
                </Button>
              </div>
            </li>
          ))}
          {!loading && pending.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">No pending complaints are waiting for assignment.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
