import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Download, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusTone, priorityTone, type ComplaintStatus } from "@/lib/complaint-status";
import { listComplaints, type ComplaintRecord } from "@/lib/smartgov-api";

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

function AdminComplaintsList() {
  const [filter, setFilter] = useState<string>("All");
  const [q, setQ] = useState("");
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    listComplaints({ view: "all" })
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

  const list = complaints.filter((c) => {
    const sOK = filter === "All" || c.status === filter;
    const qOK =
      q === "" ||
      (c.title + c.grievanceId + c.department + c.city + c.district).toLowerCase().includes(q.toLowerCase());
    return sOK && qOK;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            All registered complaints
          </h1>
          <p className="text-sm text-muted-foreground">
            Review, assign, and resolve grievances from across the nation.
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID, title, department, location…"
              className="pl-9"
            />
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
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Filed</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading complaints...
                  </td>
                </tr>
              ) : null}
              {!loading && list.map((c) => (
                <tr key={c.grievanceId} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs">{c.grievanceId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.city}, {c.district}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.department}</td>
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
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/complaints/$id" params={{ id: c.grievanceId }}>
                        Manage
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No complaints match your filters.
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
