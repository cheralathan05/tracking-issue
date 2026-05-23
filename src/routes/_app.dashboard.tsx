import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileSearch,
  LifeBuoy,
  MapPinned,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { priorityTone, statusTone } from "@/lib/complaint-status";
import {
  fetchComplaintSummary,
  fetchNotifications,
  getComplaintAnalytics,
  listComplaints,
  type ComplaintAnalytics,
  type ComplaintRecord,
  type ComplaintSummary,
  type NotificationRecord,
} from "@/lib/smartgov-api";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Civic Bridge Flow" }] }),
  component: DashboardPage,
});

function formatDuration(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "0h";
  }

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  return `${Math.round(hours)}h`;
}

function DashboardPage() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);
  const [analytics, setAnalytics] = useState<ComplaintAnalytics | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      listComplaints({ view: "mine", limit: 8 }),
      fetchComplaintSummary(),
      getComplaintAnalytics(),
      fetchNotifications(),
    ])
      .then(([complaintsResult, summaryResult, analyticsResult, notificationsResult]) => {
        if (!active) {
          return;
        }

        setComplaints(complaintsResult.complaints ?? []);
        setSummary(summaryResult);
        setAnalytics(analyticsResult.analytics);
        setNotifications((notificationsResult.notifications ?? []).slice(0, 6));
        setError(null);
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
        setComplaints([]);
        setSummary(null);
        setAnalytics(null);
        setNotifications([]);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const recentComplaints = useMemo(
    () => [...complaints].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 4),
    [complaints],
  );

  const unresolvedComplaints = useMemo(
    () => complaints.filter((complaint) => complaint.status !== "Resolved" && complaint.status !== "Closed"),
    [complaints],
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead),
    [notifications],
  );

  const cards = useMemo(() => {
    const total = summary?.total ?? complaints.length;
    const resolved = summary?.resolved ?? 0;
    const pending = summary ? summary.submitted + summary.assigned + summary.inProgress : 0;
    const escalated = summary?.escalated ?? 0;
    const resolutionRate = analytics ? Math.round(analytics.resolutionRate) : total > 0 ? Math.round((resolved / total) * 100) : 0;
    const satisfactionRating = analytics ? analytics.satisfactionRating : 0;

    return [
      { label: "Total complaints", value: total, detail: "Live complaints across your account", icon: FileSearch, accent: "text-primary bg-primary/10" },
      { label: "Resolved", value: resolved, detail: `${resolutionRate}% resolution rate`, icon: CheckCircle2, accent: "text-success bg-success/10" },
      { label: "Pending", value: pending, detail: "Still moving through the service queue", icon: Clock3, accent: "text-info bg-info/10" },
      { label: "Escalated", value: escalated, detail: `Satisfaction ${satisfactionRating.toFixed(1)}/5`, icon: AlertTriangle, accent: "text-destructive bg-destructive/10" },
    ];
  }, [analytics, complaints.length, summary]);

  const statusBreakdown = useMemo(
    () =>
      summary
        ? [
            { label: "Submitted", value: summary.submitted },
            { label: "Assigned", value: summary.assigned },
            { label: "In progress", value: summary.inProgress },
            { label: "Resolved", value: summary.resolved },
            { label: "Escalated", value: summary.escalated },
          ]
        : [],
    [summary],
  );

  const topCategories = useMemo(() => {
    const entries = Object.entries(analytics?.byCategory ?? {});
    return entries.sort((left, right) => right[1] - left[1]).slice(0, 4);
  }, [analytics]);

  const primaryAction = useMemo(() => {
    if (unreadNotifications.length > 0) {
      return { label: "Review alert", to: "/notifications" as const, icon: Bell };
    }

    if (unresolvedComplaints[0]) {
      return {
        label: "Open complaint",
        to: "/complaints/$id" as const,
        params: { id: unresolvedComplaints[0].grievanceId },
        icon: FileSearch,
      };
    }

    return { label: "Raise a new issue", to: "/complaints/new" as const, icon: FilePlus2 };
  }, [unreadNotifications.length, unresolvedComplaints]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-hero text-primary-foreground shadow-elegant">
        <div className="grid gap-6 p-6 md:grid-cols-[1.3fr_0.7fr] md:p-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
              <Sparkles className="h-3.5 w-3.5" /> Citizen command center
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
                One place to file, track, chat, and resolve every civic issue.
              </h1>
              <p className="max-w-2xl text-sm text-primary-foreground/82 md:text-base">
                Your portal is now driven by live backend data: complaints, notifications, analytics, chat support, and follow-up actions all appear in one product-grade workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-background text-foreground shadow-lg hover:bg-background/90">
                <Link to="/complaints/new">
                  <FilePlus2 className="mr-1.5 h-4 w-4" /> File a complaint
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-white/10 text-primary-foreground hover:bg-white/15">
                <Link to="/chat">
                  <MessageSquare className="mr-1.5 h-4 w-4" /> Open support chat
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <Link to="/reports">
                  <TrendingUp className="mr-1.5 h-4 w-4" /> View reports
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-primary-foreground/60">Next action</div>
                  <div className="mt-2 text-lg font-semibold">
                    {unreadNotifications.length > 0
                      ? unreadNotifications[0].title
                      : unresolvedComplaints[0]
                        ? unresolvedComplaints[0].title
                        : "Your account is clear"}
                  </div>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
                  {unreadNotifications.length > 0 ? <Bell className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                </div>
              </div>
              <p className="mt-3 text-sm text-primary-foreground/75">
                {unreadNotifications.length > 0
                  ? unreadNotifications[0].message
                  : unresolvedComplaints[0]
                    ? `${unresolvedComplaints[0].grievanceId} is currently ${unresolvedComplaints[0].status.toLowerCase()}.`
                    : "No active grievances are waiting for action."}
              </p>
              <div className="mt-4">
                <Button asChild size="sm" className="bg-white text-foreground hover:bg-white/90">
                  {primaryAction.to === "/complaints/$id" && "params" in primaryAction ? (
                    <Link to={primaryAction.to} params={primaryAction.params}>
                      {primaryAction.label}
                    </Link>
                  ) : (
                    <Link to={primaryAction.to}>
                      {primaryAction.label}
                    </Link>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.25em] text-primary-foreground/60">Unread alerts</div>
                <div className="mt-2 text-3xl font-semibold">{unreadNotifications.length}</div>
                <div className="mt-1 text-sm text-primary-foreground/72">Notifications waiting for review</div>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.25em] text-primary-foreground/60">Latest activity</div>
                <div className="mt-2 text-3xl font-semibold">{notifications.length ? 1 : 0}</div>
                <div className="mt-1 text-sm text-primary-foreground/72">The most recent backend event surfaced here</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <div className="mt-2 text-3xl font-semibold tracking-tight">
                    {loading ? "—" : card.value}
                  </div>
                </div>
                <div className={`grid h-11 w-11 place-items-center rounded-2xl ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{card.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">Recent grievances</h2>
              <p className="text-xs text-muted-foreground">A live snapshot of your latest filings and service status.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/complaints">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">Loading your complaint feed…</div>
            ) : recentComplaints.length ? (
              recentComplaints.map((complaint) => (
                <Link
                  key={complaint.grievanceId}
                  to="/complaints/$id"
                  params={{ id: complaint.grievanceId }}
                  className="flex flex-col gap-4 px-5 py-4 transition hover:bg-secondary/40 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{complaint.grievanceId}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityTone(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </div>
                    <div className="truncate text-base font-medium">{complaint.title}</div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPinned className="h-3.5 w-3.5" /> {complaint.city}, {complaint.district}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" /> {complaint.department}
                      </span>
                      <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground sm:min-w-[140px]">
                    <div className="font-medium text-foreground/80">
                      {complaint.assignedOfficerName ? `Officer ${complaint.assignedOfficerName}` : "Pending assignment"}
                    </div>
                    <div className="mt-1">Updated {new Date(complaint.updatedAt).toLocaleDateString()}</div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                No complaints found yet. File your first grievance to unlock the live dashboard.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Service health</h2>
                <p className="text-xs text-muted-foreground">Backend-driven service metrics for your account.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <div className="mt-5 space-y-4">
              {statusBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-gradient-primary"
                      style={{
                        width: `${summary ? Math.max(Math.min((item.value / Math.max(summary.total, 1)) * 100, 100), item.value > 0 ? 8 : 0) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Quick actions</h2>
                <p className="text-xs text-muted-foreground">Everything you need from one product-like hub.</p>
              </div>
              <LifeBuoy className="h-5 w-5 text-info" />
            </div>
            <div className="mt-4 grid gap-3">
              {[
                { to: "/complaints/new", label: "File complaint", icon: FilePlus2 },
                { to: "/complaints", label: "Track complaints", icon: FileSearch },
                { to: "/notifications", label: "Review alerts", icon: Bell },
                { to: "/chat", label: "Open support chat", icon: MessageSquare },
                { to: "/reports", label: "Inspect reports", icon: TrendingUp },
              ].map((action) => (
                <Link key={action.label} to={action.to} className="group flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 transition hover:border-primary/40 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <action.icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{action.label}</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-semibold">Top categories</h2>
            {topCategories.length ? (
              <div className="mt-4 space-y-3">
                {topCategories.map(([category, value]) => (
                  <div key={category} className="rounded-2xl border border-border bg-secondary/30 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{category}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Category analytics will appear once a few complaints are filed.</p>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-semibold">Latest notification</h2>
            {notifications[0] ? (
              <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {notifications[0].type}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{new Date(notifications[0].createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-3 font-medium">{notifications[0].title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{notifications[0].message}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No notifications yet. Service alerts will show up here automatically.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
