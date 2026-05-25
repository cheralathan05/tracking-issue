import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  RefreshCw,
  Search,
  Shield,
  UserCircle2,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { priorityTone, statusTone } from "@/lib/complaint-status";
import {
  fetchAdminDashboard,
  searchAdminDashboard,
  type AdminDashboardResponse,
  type AdminSearchResult,
} from "@/lib/smartgov-api";
import { useSocket } from "@/hooks/useSocket";

const dashboardSearchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/admin/dashboard")({
  validateSearch: dashboardSearchSchema,
  head: () => ({ meta: [{ title: "Admin Overview — Civic Bridge Flow" }] }),
  component: AdminDashboard,
});

const kpiMeta = [
  { label: "Total Complaints", icon: ClipboardList, tint: "text-primary bg-primary/10" },
  { label: "Resolved", icon: CheckCircle2, tint: "text-success bg-success/10" },
  { label: "Pending", icon: Clock, tint: "text-info bg-info/10" },
  { label: "Escalations", icon: AlertTriangle, tint: "text-destructive bg-destructive/10" },
] as const;

function AdminDashboard() {
  const search = Route.useSearch();
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [searchResults, setSearchResults] = useState<AdminSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { on } = useSocket(undefined, true);

  const query = search.q?.trim() ?? "";

  const loadDashboard = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [dashboardResult, searchResult] = await Promise.all([
        fetchAdminDashboard(),
        query ? searchAdminDashboard(query) : Promise.resolve(null),
      ]);

      setDashboard(dashboardResult);
      setSearchResults(searchResult);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load governance dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    void loadDashboard(false);
  }, [loadDashboard]);

  useEffect(() => {
    const refresh = () => {
      void loadDashboard(true);
    };

    const disposeComplaintUpdated = on("complaint_updated", refresh);
    const disposeEscalation = on("escalation_created", refresh);
    const disposeNotification = on("notification", refresh);

    return () => {
      disposeComplaintUpdated?.();
      disposeEscalation?.();
      disposeNotification?.();
    };
  }, [loadDashboard, on]);

  const summary = dashboard?.summary;
  const recentComplaints = dashboard?.recentComplaints ?? [];
  const departments = dashboard?.departmentPerformance ?? [];

  const kpiValue = (label: (typeof kpiMeta)[number]["label"]) => {
    if (!summary) {
      return "-";
    }

    if (label === "Total Complaints") {
      return summary.totalComplaints;
    }

    if (label === "Resolved") {
      return summary.resolvedComplaints;
    }

    if (label === "Pending") {
      return summary.pendingComplaints;
    }

    return summary.escalations;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Governance overview</h1>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring across all departments and districts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing ? (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Updating live metrics...
            </span>
          ) : null}
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-elegant">
            <Link to="/admin/complaints">
              Review complaints <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpiMeta.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${item.tint}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
            <div className="mt-4 text-2xl font-bold tracking-tight">{loading ? "-" : kpiValue(item.label)}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">Recently registered complaints</h2>
              <p className="text-xs text-muted-foreground">Pending review and assignment.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/complaints">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recentComplaints.slice(0, 8).map((complaint) => (
              <Link
                key={complaint.grievanceId}
                to="/admin/complaints/$id"
                params={{ id: complaint.grievanceId }}
                className="flex items-start gap-4 px-5 py-4 transition hover:bg-secondary/50"
              >
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityTone(String(complaint.priority))}`}
                >
                  {complaint.priority}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{complaint.grievanceId}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(String(complaint.status))}`}
                    >
                      {complaint.status}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-medium">{complaint.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {complaint.department} · {complaint.city}, {complaint.district}
                  </div>
                </div>
              </Link>
            ))}
            {!loading && recentComplaints.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">No complaints available.</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Department performance</h2>
          </div>
          <p className="text-xs text-muted-foreground">SLA compliance and current workload.</p>
          <div className="mt-4 space-y-4">
            {departments.slice(0, 6).map((department) => (
              <div key={department.name}>
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium">{department.name}</div>
                  <div className="text-muted-foreground">
                    {department.pendingComplaints} open · {department.resolvedComplaints} resolved
                  </div>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${department.slaCompliance >= 90 ? "bg-success" : department.slaCompliance >= 75 ? "bg-info" : "bg-warning"}`}
                    style={{ width: `${department.slaCompliance}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  SLA {department.slaCompliance}% · Avg response {department.avgResponseHours}h
                </div>
              </div>
            ))}
            {!loading && departments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No department metrics available yet.</div>
            ) : null}
          </div>
        </div>
      </div>

      {query && searchResults ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Search results for "{query}"</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {searchResults.counts.complaints + searchResults.counts.users + searchResults.counts.officers + searchResults.counts.departments} matches
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="h-4 w-4 text-primary" /> Complaints ({searchResults.counts.complaints})
              </div>
              {searchResults.complaints.slice(0, 5).map((item) => (
                <Link key={item.id} to="/admin/complaints/$id" params={{ id: item.grievanceId }} className="block text-sm text-muted-foreground hover:text-foreground">
                  {item.grievanceId} · {item.title}
                </Link>
              ))}
            </div>
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserCircle2 className="h-4 w-4 text-primary" /> Users ({searchResults.counts.users})
              </div>
              {searchResults.users.slice(0, 5).map((item) => (
                <Link key={item.id} to="/admin/users" className="block text-sm text-muted-foreground hover:text-foreground">
                  {item.fullName} · {item.role}
                </Link>
              ))}
            </div>
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-primary" /> Officers ({searchResults.counts.officers})
              </div>
              {searchResults.officers.slice(0, 5).map((item) => (
                <Link key={item.id} to="/admin/officers" className="block text-sm text-muted-foreground hover:text-foreground">
                  {item.fullName} · {item.department || "Unassigned"}
                </Link>
              ))}
            </div>
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-primary" /> Departments ({searchResults.counts.departments})
              </div>
              {searchResults.departments.slice(0, 5).map((item) => (
                <Link key={item.name} to="/admin/departments" className="block text-sm text-muted-foreground hover:text-foreground">
                  {item.name} · {item.complaintCount} complaints · {item.officerCount} officers
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
