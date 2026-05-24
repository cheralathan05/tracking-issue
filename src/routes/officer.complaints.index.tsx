import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusTone, priorityTone } from "@/lib/complaint-status";
import { getOfficerOpsQueue, type OfficerOpsQueueItem } from "@/lib/smartgov-api";

export const Route = createFileRoute("/officer/complaints/")({
  head: () => ({ meta: [{ title: "My Complaints — Officer" }] }),
  component: OfficerComplaintsList,
});

const statuses = [
  "All",
  "Assigned",
  "In Progress",
  "Awaiting Information",
  "Escalated",
  "Resolved",
] as const;

const sortModes: Array<{ label: string; value: "nearest" | "priority" | "oldest" | "sla" | "emergency" }> = [
  { label: "Nearest", value: "nearest" },
  { label: "Highest priority", value: "priority" },
  { label: "Oldest", value: "oldest" },
  { label: "SLA risk", value: "sla" },
  { label: "Emergency", value: "emergency" },
];

function OfficerComplaintsList() {
  const [filter, setFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"nearest" | "priority" | "oldest" | "sla" | "emergency">("priority");
  const [q, setQ] = useState("");
  const [complaints, setComplaints] = useState<OfficerOpsQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getOfficerOpsQueue({ sortBy })
      .then((result) => {
        if (mounted) {
          setComplaints(result.queue);
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
  }, [sortBy]);

  const list = complaints.filter(
    (c) =>
      (filter === "All" || c.status === filter) &&
      (q === "" || `${c.title}${c.complaintId}${c.citizenName}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Assigned operations queue</h1>
        <p className="text-sm text-muted-foreground">
          Live field queue with SLA risk, escalation level, and location intelligence.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="pl-9"
            />
          </div>
          <div className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-xs">
            <label htmlFor="sortBy" className="mr-2 text-muted-foreground">Sort:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              className="bg-transparent"
            >
              {sortModes.map((mode) => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${filter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Citizen</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">SLA</th>
                <th className="px-4 py-3 text-left font-medium">GPS</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading assigned complaints...
                  </td>
                </tr>
              ) : null}
              {!loading && list.map((c) => (
                <tr key={c.grievanceId} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs">{c.complaintId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.city}, {c.district}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{c.citizenName}</td>
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
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.slaDeadline ? `${Math.round(c.slaRiskScore * 100)}% risk` : "No SLA"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {typeof c.distanceKm === "number" ? `${c.distanceKm.toFixed(1)} km` : "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/officer/complaints/$id" params={{ id: c.complaintId }}>
                        Open
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No complaints assigned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
