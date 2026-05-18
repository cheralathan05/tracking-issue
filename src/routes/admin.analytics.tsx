import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchComplaintSummary, listComplaints, type ComplaintRecord, type ComplaintSummary } from "@/lib/smartgov-api";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([fetchComplaintSummary(), listComplaints({ view: "all" })])
      .then(([summaryResult, complaintsResult]) => {
        if (!mounted) return;
        setSummary(summaryResult);
        setComplaints(complaintsResult.complaints);
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

  const { monthKeys, monthLabels } = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    const labels: string[] = [];

    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      keys.push(`${date.getFullYear()}-${date.getMonth()}`);
      labels.push(date.toLocaleString("default", { month: "short" }));
    }

    return { monthKeys: keys, monthLabels: labels };
  }, []);

  const series = useMemo(() => {
    const counts = Object.fromEntries(monthKeys.map((key) => [key, 0]));

    complaints.forEach((complaint) => {
      const date = new Date(complaint.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (key in counts) {
        counts[key] += 1;
      }
    });

    return monthKeys.map((key) => counts[key] ?? 0);
  }, [complaints, monthKeys]);

  const metrics = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Total complaints", value: String(summary.total), trend: "Live" },
      { label: "Resolved rate", value: `${summary.total ? Math.round((summary.resolved / summary.total) * 100) : 0}%`, trend: "Based on real data" },
      { label: "Assigned", value: String(summary.assigned), trend: `${summary.total ? Math.round((summary.assigned / summary.total) * 100) : 0}% assigned` },
      { label: "Escalated", value: String(summary.escalated), trend: `${summary.total ? Math.round((summary.escalated / summary.total) * 100) : 0}% escalated` },
    ];
  }, [summary]);

  const max = Math.max(...series, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Analytics &amp; reports</h1>
        <p className="text-sm text-muted-foreground">
          Transparency dashboards for citizens and officials.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground shadow-card">
            Loading analytics data...
          </div>
        ) : metrics.length > 0 ? (
          metrics.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-2xl font-bold">{s.value}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3 w-3" /> {s.trend}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground shadow-card">
            No analytics data available.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Complaints registered (last 12 months)</h2>
        </div>
        <div className="mt-6 flex h-48 items-end gap-2">
          {monthLabels.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md bg-gradient-primary"
                style={{ height: `${(series[i] / max) * 100}%` }}
              />
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
