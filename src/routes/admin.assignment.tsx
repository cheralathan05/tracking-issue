import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, MapPin, ArrowRight, CheckCircle2, Loader2, UserCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  assignComplaint,
  fetchComplaintSummary,
  listComplaints,
  listOfficers,
  type ComplaintRecord,
  type ComplaintSummary,
  type OfficerSummary,
} from "@/lib/smartgov-api";

export const Route = createFileRoute("/admin/assignment")({
  head: () => ({ meta: [{ title: "Smart assignment — Admin" }] }),
  component: SmartAssignment,
});

function SmartAssignment() {
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [officers, setOfficers] = useState<OfficerSummary[]>([]);
  const [selectedOfficers, setSelectedOfficers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const refresh = async () => {
    const [summaryResult, complaintsResult, officersResult] = await Promise.all([
      fetchComplaintSummary(),
      listComplaints({ view: "all" }),
      listOfficers().catch(() => ({ officers: [] })),
    ]);
    setSummary(summaryResult);
    setComplaints(complaintsResult.complaints);
    setOfficers(officersResult.officers);
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

  const handleAssign = async (complaint: ComplaintRecord, officerIdOverride?: string) => {
    const targetOfficerId = officerIdOverride || selectedOfficers[complaint.grievanceId] || complaint.suggestedOfficerId;
    if (!targetOfficerId && !complaint.suggestedOfficerId) {
      toast.error("Please select an officer to assign");
      return;
    }

    setActionLoadingId(complaint.grievanceId);
    try {
      await assignComplaint(complaint.grievanceId, {
        officerId: targetOfficerId ?? undefined,
        useSuggestedOfficer: !targetOfficerId,
      });
      const assignedOfficer = officers.find((o) => o.id === targetOfficerId);
      toast.success(`Assigned ${complaint.grievanceId} to ${assignedOfficer?.fullName || "officer"}`);
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
          {!loading &&
            pending.slice(0, 15).map((complaint) => {
              const currentChoice = selectedOfficers[complaint.grievanceId] || complaint.suggestedOfficerId || "";
              return (
                <li key={complaint.grievanceId} className="grid items-center gap-4 px-5 py-4 md:grid-cols-[1.2fr_auto_1.4fr_auto]">
                  <div>
                    <Link
                      to="/admin/complaints/$id"
                      params={{ id: complaint.grievanceId }}
                      className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-primary hover:underline"
                    >
                      {complaint.grievanceId} <ExternalLink className="h-3 w-3" />
                    </Link>
                    <div className="font-medium text-foreground">{complaint.title}</div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {complaint.city} · <span className="font-medium text-foreground/80">{complaint.department}</span>
                    </div>
                  </div>

                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="uppercase tracking-wide text-muted-foreground">Officer</span>
                      {complaint.suggestedOfficerName && (
                        <span className="text-[11px] font-medium text-primary">✨ Match: {complaint.suggestedOfficerName}</span>
                      )}
                    </div>
                    <select
                      value={currentChoice}
                      onChange={(e) =>
                        setSelectedOfficers((prev) => ({
                          ...prev,
                          [complaint.grievanceId]: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {complaint.suggestedOfficerId && (
                        <option value={complaint.suggestedOfficerId}>
                          ⭐ Suggested: {complaint.suggestedOfficerName}
                        </option>
                      )}
                      <option value="">-- Choose verified officer --</option>
                      {officers.map((officer) => (
                        <option key={officer.id} value={officer.id}>
                          {officer.fullName} ({officer.department || "General"} · {officer.jurisdictionArea || "All areas"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAssign(complaint, currentChoice)}
                      disabled={actionLoadingId === complaint.grievanceId || (!currentChoice && !complaint.suggestedOfficerId)}
                      className="bg-gradient-primary text-primary-foreground text-xs"
                    >
                      {actionLoadingId === complaint.grievanceId ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Assign
                    </Button>
                  </div>
                </li>
              );
            })}
          {!loading && pending.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">
              No pending complaints are waiting for assignment. All grievances are active.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
