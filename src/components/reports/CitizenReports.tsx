import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { BarChart3, Download, TrendingUp, Clock3, ClipboardList, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartTooltip } from "@/components/ui/chart";
import { fetchComplaintSummary, listComplaints, type ComplaintRecord, type ComplaintSummary } from "@/lib/smartgov-api";

const CHART_COLORS = ["#0ea5e9", "#7c3aed", "#f97316", "#22c55e", "#ef4444"];

function formatMonth(dateString: string) {
  return format(new Date(dateString), "MMM yyyy");
}

function computeAverageResolutionTime(complaints: ComplaintRecord[]) {
  const resolvedComplaints = complaints.filter((complaint) => complaint.status === "Resolved");
  if (!resolvedComplaints.length) return "—";

  const totalHours = resolvedComplaints.reduce((sum, complaint) => {
    const createdTs = Date.parse(complaint.createdAt);
    const updatedTs = Date.parse(complaint.updatedAt);
    return sum + Math.max(0, (updatedTs - createdTs) / 1000 / 60 / 60);
  }, 0);

  const averageHours = totalHours / resolvedComplaints.length;
  const days = Math.floor(averageHours / 24);
  const hours = Math.round(averageHours % 24);

  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

export function CitizenReports() {
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);
  const [complaints, setComplaints] = useState<ComplaintRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([fetchComplaintSummary(), listComplaints({ view: "mine" })])
      .then(([summaryResult, complaintResult]) => {
        if (!active) return;
        setSummary(summaryResult);

        const MAX_COMPLAINTS = 200;
        const received = complaintResult.complaints ?? [];
        const complaintsToUse = received.length > MAX_COMPLAINTS ? received.slice(0, MAX_COMPLAINTS) : received;

        if (received.length > complaintsToUse.length) {
          // eslint-disable-next-line no-console
          console.warn(`CitizenReports: trimmed ${received.length - complaintsToUse.length} complaints for performance.`);
        }

        setComplaints(complaintsToUse);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
        setSummary(null);
        setComplaints([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const pendingCount = summary ? summary.submitted + summary.assigned + summary.inProgress : 0;
  const cards = useMemo(
    () =>
      summary
        ? [
            {
              title: "Total complaints",
              value: summary.total,
              description: "All complaints filed by you",
              icon: BarChart3,
            },
            {
              title: "Resolved",
              value: summary.resolved,
              description: "Complaints closed successfully",
              icon: CheckCircle2,
            },
            {
              title: "Pending",
              value: pendingCount,
              description: "Complaints still in progress",
              icon: ClipboardList,
            },
            {
              title: "Escalated",
              value: summary.escalated,
              description: "Complaints escalated for review",
              icon: TrendingUp,
            },
            {
              title: "Avg resolution time",
              value: complaints ? computeAverageResolutionTime(complaints) : "—",
              description: "Average time to resolve complaints",
              icon: Clock3,
            },
          ]
        : [],
    [summary, pendingCount, complaints],
  );

  const pieData = useMemo(
    () =>
      summary
        ? [
            { name: "Submitted", value: summary.submitted },
            { name: "Assigned", value: summary.assigned },
            { name: "In Progress", value: summary.inProgress },
            { name: "Resolved", value: summary.resolved },
            { name: "Escalated", value: summary.escalated },
          ]
        : [],
    [summary],
  );

  const monthlyData = useMemo(() => {
    if (!complaints || !complaints.length) return [];

    const months = new Map<string, number>();
    const now = new Date();
    for (let offset = 0; offset < 6; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - offset), 1);
      months.set(format(date, "MMM yyyy"), 0);
    }

    complaints.forEach((complaint) => {
      const month = formatMonth(complaint.createdAt);
      if (months.has(month)) {
        months.set(month, months.get(month)! + 1);
      }
    });

    return Array.from(months.entries()).map(([month, count]) => ({ month, count }));
  }, [complaints]);

  const recentComplaints = useMemo(() => {
    if (!complaints) return [];
    return [...complaints]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [complaints]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">Track your complaint history, progress and resolution trends.</p>
          </div>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="w-full md:w-auto">
          <Download className="mr-1.5 h-4 w-4" /> Export PDF
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summary
          ? cards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="border-border bg-card shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle>{card.title}</CardTitle>
                        <CardDescription>{card.description}</CardDescription>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold">{card.value}</p>
                  </CardContent>
                </Card>
              );
            })
          : Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="border-border bg-card shadow-sm animate-pulse">
                <CardHeader>
                  <div className="h-5 w-32 rounded-md bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-10 w-20 rounded-md bg-muted" />
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Monthly complaint activity</CardTitle>
            <CardDescription>See how your complaints have trended month over month.</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length ? (
              <ChartContainer
                config={{ count: { label: "Complaints", color: "#0ea5e9" } }}
                className="h-72"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend content={<ChartLegend />} />
                    <Bar dataKey="count" name="Complaints" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                No complaints yet to build a trend chart.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Submitted vs Resolved vs Escalated</CardTitle>
            <CardDescription>Visualize the progress and escalation of your complaints.</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length ? (
              <ChartContainer
                config={{
                  Submitted: { label: "Submitted", color: "#0ea5e9" },
                  Assigned: { label: "Assigned", color: "#7c3aed" },
                  "In Progress": { label: "In Progress", color: "#f97316" },
                  Resolved: { label: "Resolved", color: "#22c55e" },
                  Escalated: { label: "Escalated", color: "#ef4444" },
                }}
                className="h-72"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend content={<ChartLegend />} />
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={88} paddingAngle={4}>
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                Summary data is not available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.65fr_0.35fr]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Complaint history timeline</CardTitle>
            <CardDescription>Recent complaints and their current status.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentComplaints.length ? (
              <div className="space-y-4">
                {recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{complaint.grievanceId}</p>
                        <p className="text-sm text-muted-foreground">{complaint.title}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {complaint.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
                        <p className="text-sm">{complaint.category}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Filed</p>
                        <p className="text-sm">{format(new Date(complaint.createdAt), "dd MMM yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Last update</p>
                        <p className="text-sm">{format(new Date(complaint.updatedAt), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No complaint history is available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Latest analytics</CardTitle>
            <CardDescription>Quick insights from your complaint activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Resolution rate</p>
                  <p className="text-xl font-semibold">{summary ? `${Math.round((summary.resolved / Math.max(summary.total, 1)) * 100)}%` : "—"}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Escalation share</p>
                  <p className="text-xl font-semibold">{summary ? `${Math.round((summary.escalated / Math.max(summary.total, 1)) * 100)}%` : "—"}</p>
                </div>
                <ClipboardList className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average resolution</p>
                  <p className="text-xl font-semibold">{complaints ? computeAverageResolutionTime(complaints) : "—"}</p>
                </div>
                <Clock3 className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
