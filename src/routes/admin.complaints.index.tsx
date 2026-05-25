import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Download, Filter, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusTone, priorityTone, type ComplaintStatus } from "@/lib/complaint-status";
import {
  exportAdminComplaintsCsv,
  fetchAdminComplaintStats,
  listAdminComplaints,
  listDepartments,
  listOfficers,
  searchAdminComplaints,
  type AdminComplaintStats,
  type ComplaintRecord,
  type DepartmentRecord,
  type OfficerSummary,
} from "@/lib/smartgov-api";
import { useSocket } from "@/hooks/useSocket";

export const Route = createFileRoute("/admin/complaints/")({
  head: () => ({ meta: [{ title: "All Complaints — Admin" }] }),
  component: AdminComplaintsList,
});

const statuses: (ComplaintStatus | "All")[] = [
  "All",
  "Submitted",
  "Under Review",
  "Assigned",
  "In Progress",
  "Resolved",
  "Escalated",
];

const priorities = ["All", "Low", "Medium", "High", "Critical"];

function AdminComplaintsList() {
  const [filter, setFilter] = useState<string>("All");
  const [q, setQ] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [department, setDepartment] = useState<string>("All");
  const [officerId, setOfficerId] = useState<string>("All");
  const [priority, setPriority] = useState<string>("All");
  const [escalatedOnly, setEscalatedOnly] = useState(false);

  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [stats, setStats] = useState<AdminComplaintStats | null>(null);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [officers, setOfficers] = useState<OfficerSummary[]>([]);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const { on } = useSocket(undefined, true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(q.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [q]);

  const apiFilters = useMemo(() => ({
    status: filter === "All" ? undefined : filter,
    department: department === "All" ? undefined : department,
    officerId: officerId === "All" ? undefined : officerId,
    priority: priority === "All" ? undefined : priority,
    escalated: escalatedOnly ? true : undefined,
    limit: 300,
    offset: 0,
  }), [department, escalatedOnly, filter, officerId, priority]);

  const loadStats = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true);
    }

    try {
      const result = await fetchAdminComplaintStats();
      setStats(result);
    } finally {
      if (isBackground) {
        setRefreshing(false);
      }
    }
  }, []);

  const loadComplaints = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      if (debouncedQuery) {
        const result = await searchAdminComplaints(debouncedQuery, apiFilters);
        setComplaints(result.complaints);
        setTotal(result.complaintCount);
      } else {
        const result = await listAdminComplaints(apiFilters);
        setComplaints(result.complaints);
        setTotal(result.complaintCount);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to fetch complaints");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiFilters, debouncedQuery]);

  const loadReferenceData = useCallback(async () => {
    const [departmentResult, officerResult] = await Promise.all([listDepartments(), listOfficers()]);
    setDepartments(departmentResult.departments);
    setOfficers(officerResult.officers);
  }, []);

  useEffect(() => {
    let mounted = true;

    Promise.all([loadReferenceData(), loadStats(), loadComplaints()]).finally(() => {
      if (mounted) {
        setBootstrapped(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [loadComplaints, loadReferenceData, loadStats]);

  useEffect(() => {
    if (!bootstrapped) {
      return;
    }

    void loadComplaints(true);
  }, [bootstrapped, loadComplaints]);

  useEffect(() => {
    const rerenderLive = () => {
      void Promise.all([loadComplaints(true), loadStats(true)]);
    };

    const disposeCreated = on("complaint_created", rerenderLive);
    const disposeUpdated = on("complaint_updated", rerenderLive);
    const disposeStatus = on("status_changed", rerenderLive);
    const disposeAssigned = on("officer_assigned", rerenderLive);
    const disposeEscalated = on("escalation_created", rerenderLive);

    return () => {
      disposeCreated?.();
      disposeUpdated?.();
      disposeStatus?.();
      disposeAssigned?.();
      disposeEscalated?.();
    };
  }, [loadComplaints, loadStats, on]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAdminComplaintsCsv({
        ...apiFilters,
        q: debouncedQuery || undefined,
      });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `admin-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const countForStatus = (status: string) => {
    if (!stats) {
      return "-";
    }

    if (status === "All") return stats.total;
    if (status === "Submitted") return stats.statusCounts.submitted;
    if (status === "Under Review") return stats.statusCounts.underReview;
    if (status === "Assigned") return stats.statusCounts.assigned;
    if (status === "In Progress") return stats.statusCounts.inProgress;
    if (status === "Resolved") return stats.statusCounts.resolved;
    if (status === "Escalated") return stats.statusCounts.escalated;

    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">All registered complaints</h1>
          <p className="text-sm text-muted-foreground">
            Review, assign, and resolve grievances from across the nation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing ? (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Syncing live updates...
            </span>
          ) : null}
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="mr-1.5 h-4 w-4" /> {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Total complaints</div>
          <div className="mt-2 text-2xl font-bold tracking-tight">{stats ? stats.total : "-"}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Pending queue</div>
          <div className="mt-2 text-2xl font-bold tracking-tight">{stats ? stats.pending : "-"}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">SLA breached</div>
          <div className="mt-2 flex items-center text-2xl font-bold tracking-tight">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> {stats ? stats.slaBreached : "-"}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search complaints, citizens, officers..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 text-xs md:ml-auto">
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="All">All departments</option>
              {departments.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={officerId}
              onChange={(event) => setOfficerId(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="All">All officers</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.fullName}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              {priorities.map((level) => (
                <option key={level} value={level}>
                  {level} priority
                </option>
              ))}
            </select>

            <button
              onClick={() => setEscalatedOnly((current) => !current)}
              className={`h-9 rounded-md border px-3 text-xs font-medium transition ${escalatedOnly ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-input text-muted-foreground hover:bg-secondary"}`}
            >
              Escalated only
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((statusItem) => (
              <button
                key={statusItem}
                onClick={() => setFilter(statusItem)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${filter === statusItem ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
              >
                {statusItem} ({countForStatus(statusItem)})
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-3 text-xs text-muted-foreground">
          Showing {complaints.length} of {total} complaints
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Citizen</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Officer</th>
                <th className="px-4 py-3 text-left font-medium">Filed</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading complaints...
                  </td>
                </tr>
              ) : null}

              {!loading && complaints.map((complaint) => (
                <tr key={complaint.grievanceId} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs">{complaint.grievanceId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{complaint.title}</div>
                    <div className="text-xs text-muted-foreground">{complaint.city}, {complaint.district}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{complaint.reporterName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{complaint.department}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${priorityTone(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{complaint.assignedOfficerName ?? "Unassigned"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(complaint.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/complaints/$id" params={{ id: complaint.grievanceId }}>
                        Manage
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}

              {!loading && complaints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No complaints match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
