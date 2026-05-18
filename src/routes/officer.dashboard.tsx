import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { statusTone, priorityTone } from "@/lib/complaint-status";
import { Button } from "@/components/ui/button";
import { fetchComplaintSummary, listComplaints, type ComplaintRecord, type ComplaintSummary } from "@/lib/smartgov-api";

export const Route = createFileRoute("/officer/dashboard")({
  head: () => ({ meta: [{ title: "Officer Dashboard — Civic Bridge Flow" }] }),
  component: OfficerDashboard,
});

const kpiMeta = [
  { label: "Assigned to me", icon: ClipboardList, tone: "text-info bg-info/10" },
  { label: "In progress", icon: Clock, tone: "text-warning-foreground bg-warning/20" },
  { label: "Resolved", icon: CheckCircle2, tone: "text-success bg-success/10" },
  { label: "SLA at risk", icon: AlertTriangle, tone: "text-destructive bg-destructive/10" },
];

function OfficerDashboard() {
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);
  const [queue, setQueue] = useState<ComplaintRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchComplaintSummary(), listComplaints({ view: "assigned" })]).then(([summaryResult, complaintsResult]) => {
      if (!mounted) return;
      setSummary(summaryResult);
      setQueue(complaintsResult.complaints.slice(0, 4));
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Welcome back, Officer Kumar
        </h1>
        <p className="text-sm text-muted-foreground">
          Municipal Electricity Dept. · Sector 14 jurisdiction
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiMeta.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-lg ${k.tone}`}>
                <k.icon className="h-5 w-5" />
              </span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="mt-3 text-3xl font-bold">
              {summary
                ? k.label === "Assigned to me"
                  ? summary.assigned
                  : k.label === "In progress"
                  ? summary.inProgress
                  : k.label === "Resolved"
                  ? summary.resolved
                  : summary.escalated
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">Today's queue</h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/officer/complaints">View all</Link>
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Issue</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {queue.map((c) => (
              <tr key={c.grievanceId} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-mono text-xs">{c.grievanceId}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.city}, {c.district}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${priorityTone(c.priority)}`}
                  >
                    {c.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(c.status)}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild size="sm">
                    <Link to="/officer/complaints/$id" params={{ id: c.grievanceId }}>
                      Inspect
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
