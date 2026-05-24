import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  Building2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { statusTone, priorityTone } from "@/lib/complaint-status";
import { fetchComplaintSummary, listComplaints, listOfficers, type ComplaintRecord, type ComplaintSummary, type OfficerSummary } from "@/lib/smartgov-api";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Overview — Civic Bridge Flow" }] }),
  component: AdminDashboard,
});

const kpiMeta = [
  { label: "Total Complaints", icon: ClipboardList, tint: "text-primary bg-primary/10" },
  { label: "Resolved", icon: CheckCircle2, tint: "text-success bg-success/10" },
  { label: "Pending / In Progress", icon: Clock, tint: "text-info bg-info/10" },
  { label: "Escalations", icon: AlertTriangle, tint: "text-destructive bg-destructive/10" },
];

function AdminDashboard() {
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);
  const [recent, setRecent] = useState<ComplaintRecord[]>([]);
  const [officers, setOfficers] = useState<OfficerSummary[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);

  useEffect(() => {
    let mounted = true;

    Promise.all([fetchComplaintSummary(), listComplaints({ view: "all" }), listOfficers()]).then(
      ([summaryResult, complaintsResult, officersResult]) => {
        if (!mounted) return;
        setSummary(summaryResult);
        setRecent(complaintsResult.complaints.slice(0, 4));
        setComplaints(complaintsResult.complaints);
        setOfficers(officersResult.officers);
      },
    );

    return () => {
      mounted = false;
    };
  }, []);

  const departments = useMemo(() => {
    const openStatuses = new Set(["Submitted", "Under Review", "Assigned", "In Progress", "Awaiting Information"]);
    const stats = new Map<string, { name: string; open: number; resolved: number; sla: number }>();

    complaints.forEach((complaint) => {
      const name = complaint.department || "Unknown";
      const entry = stats.get(name) ?? { name, open: 0, resolved: 0, sla: 0 };
      if (openStatuses.has(complaint.status)) {
        entry.open += 1;
      }
      if (complaint.status === "Resolved" || complaint.status === "Closed") {
        entry.resolved += 1;
      }
      stats.set(name, entry);
    });

    return Array.from(stats.values())
      .map((entry) => ({
        ...entry,
        sla: Math.round(((entry.open + entry.resolved) > 0 ? (entry.resolved / (entry.open + entry.resolved)) : 0) * 100),
      }))
      .sort((a, b) => b.open - a.open)
      .slice(0, 5);
  }, [complaints]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Governance overview</h1>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring across all departments and districts.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary text-primary-foreground shadow-elegant">
          <Link to="/admin/complaints">
            Review complaints <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpiMeta.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${k.tint}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
                <TrendingUp className="h-3 w-3" /> Live
              </span>
            </div>
            <div className="mt-4 text-2xl font-bold tracking-tight">
              {summary
                ? k.label === "Total Complaints"
                  ? summary.total
                  : k.label === "Resolved"
                  ? summary.resolved
                  : k.label === "Pending / In Progress"
                  ? summary.submitted + summary.assigned + summary.inProgress
                  : summary.escalated
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">Recently registered complaints</h2>
              <p className="text-xs text-muted-foreground">Pending review &amp; assignment.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/complaints">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recent.map((c) => (
              <Link
                key={c.grievanceId}
                to="/admin/complaints/$id"
                params={{ id: c.grievanceId }}
                className="flex items-start gap-4 px-5 py-4 transition hover:bg-secondary/50"
              >
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityTone(c.priority)}`}
                >
                  {c.priority}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{c.grievanceId}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.department} · {c.city}, {c.district}
                  </div>
                </div>
                <div className="hidden text-right text-xs text-muted-foreground sm:block">
                  <div>Filed {c.createdAt}</div>
                  <div>{c.assignedOfficerName ? `Officer ${c.assignedOfficerName}` : "Pending assignment"}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Department performance</h2>
          </div>
          <p className="text-xs text-muted-foreground">SLA compliance over last 30 days.</p>
          <div className="mt-4 space-y-4">
            {departments.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-muted-foreground">
                    {d.open} open · {d.resolved} resolved
                  </div>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${d.sla >= 90 ? "bg-success" : d.sla >= 80 ? "bg-info" : "bg-warning"}`}
                    style={{ width: `${d.sla}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">SLA {d.sla}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Quick actions</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            { to: "/admin/complaints", label: "Review complaints", icon: ClipboardList },
            { to: "/admin/departments", label: "Manage departments", icon: Building2 },
            { to: "/admin/users", label: "Citizens & officers", icon: Users },
            { to: "/admin/analytics", label: "Analytics & reports", icon: TrendingUp },
            { to: "/chat", label: "Admin Chat", icon: MessageSquare },
          ].map((q) => (
            <Link
              key={q.label}
              to={q.to}
              className="group flex items-center justify-between rounded-lg border border-border p-3 transition hover:border-primary/40 hover:bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-secondary text-primary">
                  <q.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{q.label}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
