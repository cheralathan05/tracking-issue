import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FilePlus2,
  FileSearch,
  Download,
  LifeBuoy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { statusTone, priorityTone } from "@/lib/complaint-status";
import { listComplaints, type ComplaintRecord } from "@/lib/smartgov-api";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Civic Bridge Flow" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    listComplaints({ view: "mine" })
      .then((result) => {
        if (mounted) {
          setComplaints(result.complaints);
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

  const summary = useMemo(() => {
    const counts = complaints.reduce(
      (acc, complaint) => {
        acc.total += 1;
        if (complaint.status === "Resolved" || complaint.status === "Closed") {
          acc.resolved += 1;
        }
        if (complaint.status === "Escalated") {
          acc.escalated += 1;
        }
        if (complaint.status === "Submitted" || complaint.status === "Assigned" || complaint.status === "In Progress" || complaint.status === "Awaiting Information") {
          acc.pending += 1;
        }
        return acc;
      },
      { total: 0, resolved: 0, pending: 0, escalated: 0 },
    );

    return [
      { label: "Total Complaints", value: counts.total, icon: FileSearch, tint: "text-primary bg-primary/10" },
      { label: "Resolved", value: counts.resolved, icon: CheckCircle2, tint: "text-success bg-success/10" },
      { label: "Pending", value: counts.pending, icon: Clock, tint: "text-info bg-info/10" },
      { label: "Escalated", value: counts.escalated, icon: AlertTriangle, tint: "text-destructive bg-destructive/10" },
    ];
  }, [complaints]);

  const recentComplaints = complaints.slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with your grievances.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary text-primary-foreground shadow-elegant">
          <Link to="/complaints/new">
            <FilePlus2 className="mr-1.5 h-4 w-4" /> New Complaint
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className={`grid h-10 w-10 place-items-center rounded-lg ${s.tint}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-3xl font-bold tracking-tight">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { to: "/complaints/new", label: "Raise Complaint", icon: FilePlus2 },
          { to: "/track", label: "Track Issue", icon: FileSearch },
          { to: "/reports", label: "Download Report", icon: Download },
          { to: "/chat", label: "Contact Support", icon: LifeBuoy },
        ].map((q) => (
          <Link
            key={q.label}
            to={q.to}
            className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card transition hover:border-primary/40 hover:shadow-elegant"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
                <q.icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{q.label}</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Recent grievances</h2>
            <p className="text-xs text-muted-foreground">
              Latest activity on your filed complaints.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/complaints">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Loading your complaints...
            </div>
          ) : recentComplaints.length ? (
            recentComplaints.map((c) => (
              <Link
                key={c.grievanceId}
                to="/complaints/$id"
                params={{ id: c.grievanceId }}
                className="flex items-start gap-4 px-5 py-4 transition hover:bg-secondary/50"
              >
                <div className="hidden md:block">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityTone(c.priority)}`}
                  >
                    {c.priority}
                  </span>
                </div>
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
                  <div>{new Date(c.createdAt).toLocaleDateString()}</div>
                  <div>{c.assignedOfficerName ? `Officer ${c.assignedOfficerName}` : "Pending assignment"}</div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No complaints found yet. Submit a new grievance to start tracking progress.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
