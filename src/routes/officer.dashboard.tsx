import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  AlertTriangle,
  BellRing,
  Gauge,
  ShieldAlert,
  MapPin,
  Timer,
  Activity,
  BarChart3,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getOfficerOpsDashboard,
  getOfficerOpsEmergencyQueue,
  getOfficerOpsKnowledgeBase,
  getOfficerOpsPerformance,
  getOfficerOpsQueue,
  getOfficerOpsReports,
  getOfficerOpsShift,
  updateOfficerOpsShift,
  type OfficerKnowledgeDoc,
  type OfficerOpsDashboard,
  type OfficerOpsEmergency,
  type OfficerOpsPerformanceMetrics,
  type OfficerOpsQueueItem,
  type OfficerOpsReportData,
  type OfficerOpsShiftStatus,
} from "@/lib/smartgov-api";
import { toast } from "sonner";
import { priorityTone, statusTone } from "@/lib/complaint-status";

export const Route = createFileRoute("/officer/dashboard")({
  head: () => ({ meta: [{ title: "Officer Dashboard — Civic Bridge Flow" }] }),
  component: OfficerDashboard,
});

const shiftOptions: OfficerOpsShiftStatus[] = ["Online", "On duty", "In field", "Break", "Offline"];

function OfficerDashboard() {
  const [dashboard, setDashboard] = useState<OfficerOpsDashboard | null>(null);
  const [queue, setQueue] = useState<OfficerOpsQueueItem[]>([]);
  const [emergencies, setEmergencies] = useState<OfficerOpsEmergency[]>([]);
  const [performance, setPerformance] = useState<OfficerOpsPerformanceMetrics | null>(null);
  const [reports, setReports] = useState<OfficerOpsReportData | null>(null);
  const [knowledge, setKnowledge] = useState<OfficerKnowledgeDoc[]>([]);
  const [shift, setShift] = useState<OfficerOpsShiftStatus>("Offline");
  const [loading, setLoading] = useState(true);
  const [shiftLoading, setShiftLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [dashboardResult, queueResult, emergencyResult, shiftResult, performanceResult, reportsResult, knowledgeResult] = await Promise.all([
          getOfficerOpsDashboard(),
          getOfficerOpsQueue({ sortBy: "priority" }),
          getOfficerOpsEmergencyQueue(),
          getOfficerOpsShift(),
          getOfficerOpsPerformance(),
          getOfficerOpsReports(),
          getOfficerOpsKnowledgeBase(),
        ]);

        if (!mounted) return;

        setDashboard(dashboardResult.dashboard);
        setQueue(queueResult.queue.slice(0, 5));
        setEmergencies(emergencyResult.emergencies.slice(0, 4));
        setShift(shiftResult.shift.status);
        setPerformance(performanceResult.performance);
        setReports(reportsResult.reports);
        setKnowledge(knowledgeResult.knowledgeBase);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    const poll = setInterval(load, 7000);

    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, []);

  const onShiftChange = async (value: OfficerOpsShiftStatus) => {
    setShiftLoading(true);
    try {
      await updateOfficerOpsShift({ status: value });
      setShift(value);
      toast.success(`Shift updated to ${value}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update shift");
    } finally {
      setShiftLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center rounded-2xl border border-border bg-card">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading mission control workspace...
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-slate-100 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Enterprise Government Operations Center</div>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">Realtime Field Mission Dashboard</h1>
            <p className="mt-1 text-sm text-slate-300">Live dispatch visibility, emergency coordination, and SLA command tracking.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900/70 p-1">
            {shiftOptions.map((option) => (
              <button
                key={option}
                onClick={() => onShiftChange(option)}
                disabled={shiftLoading}
                className={`rounded-full px-3 py-1 text-xs transition ${shift === option ? "bg-emerald-400 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardList} label="Assigned Complaints" value={dashboard?.assignedComplaints ?? 0} tone="text-info bg-info/10" />
        <KpiCard icon={ShieldAlert} label="Active Emergencies" value={dashboard?.activeEmergencies ?? 0} tone="text-destructive bg-destructive/10" />
        <KpiCard icon={AlertTriangle} label="SLA Breaches" value={dashboard?.slaBreaches ?? 0} tone="text-warning-foreground bg-warning/20" />
        <KpiCard icon={Timer} label="Resolved Today" value={dashboard?.resolvedToday ?? 0} tone="text-success bg-success/10" />
        <KpiCard icon={Activity} label="In Progress" value={dashboard?.inProgress ?? 0} tone="text-info bg-info/10" />
        <KpiCard icon={Gauge} label="Avg Response (hrs)" value={dashboard?.avgResponseTimeHours ?? 0} tone="text-amber-700 bg-amber-100" />
        <KpiCard icon={BellRing} label="Citizen Rating" value={dashboard?.citizenRating ?? 0} tone="text-indigo-700 bg-indigo-100" />
        <KpiCard icon={BarChart3} label="Escalations" value={dashboard?.escalations ?? 0} tone="text-rose-700 bg-rose-100" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Live Mission Queue</h2>
            <Button asChild size="sm" variant="outline">
              <Link to="/officer/complaints">Open full queue</Link>
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Complaint</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">SLA Risk</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {queue.map((item) => (
                <tr key={item.complaintId} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs">{item.complaintId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.area}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${priorityTone(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{Math.round(item.slaRiskScore * 100)}%</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm">
                      <Link to="/officer/complaints/$id" params={{ id: item.complaintId }}>
                        Open
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 shadow-card">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
              <ShieldAlert className="h-4 w-4" /> Emergency Queue
            </div>
            <div className="space-y-3">
              {emergencies.length === 0 ? <div className="text-sm text-muted-foreground">No active emergencies.</div> : null}
              {emergencies.map((item) => (
                <Link key={item.id} to="/officer/complaints/$id" params={{ id: item.complaintId }} className="block rounded-lg border border-border bg-card p-3 hover:bg-secondary/40">
                  <div className="text-xs font-semibold uppercase text-destructive">{item.priority} · {item.level ?? "active"}</div>
                  <div className="mt-1 text-sm font-medium">{item.title}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {item.location}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="mb-3 text-sm font-semibold">Smart Alerts</div>
            <div className="space-y-2">
              {dashboard?.liveAlerts.map((alert) => (
                <div key={alert.id} className="rounded-md border border-border bg-secondary/40 p-2.5 text-xs">
                  <div className="font-medium">{alert.message}</div>
                  <div className="text-muted-foreground">{alert.complaintId}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-semibold">Officer Performance</h3>
          <div className="mt-3 space-y-2 text-sm">
            <Metric label="SLA Success" value={`${performance?.slaSuccessRate ?? 0}%`} />
            <Metric label="Avg Resolution" value={`${performance?.avgResolutionSpeedHours ?? 0} hrs`} />
            <Metric label="Emergency Handled" value={String(performance?.emergencyHandled ?? 0)} />
            <Metric label="Escalation Count" value={String(performance?.escalationCount ?? 0)} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-semibold">Reports Snapshot</h3>
          <div className="mt-3 space-y-2 text-sm">
            <Metric label="Total Workload" value={String(reports?.totals.total ?? 0)} />
            <Metric label="Resolved" value={String(reports?.totals.resolved ?? 0)} />
            <Metric label="In Progress" value={String(reports?.totals.inProgress ?? 0)} />
            <Metric label="Escalated" value={String(reports?.totals.escalated ?? 0)} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="flex items-center gap-1.5 font-semibold"><BookOpen className="h-4 w-4" /> Knowledge Base</h3>
          <div className="mt-3 space-y-2">
            {knowledge.slice(0, 3).map((doc) => (
              <div key={doc.id} className="rounded-md border border-border bg-secondary/30 p-2.5">
                <div className="text-xs uppercase text-muted-foreground">{doc.category}</div>
                <div className="text-sm font-medium">{doc.title}</div>
                <div className="text-xs text-muted-foreground">{doc.summary}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: typeof ClipboardList; label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
