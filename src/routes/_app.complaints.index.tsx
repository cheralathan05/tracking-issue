import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { statusTone, priorityTone } from "@/lib/complaint-status";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilePlus2, Search } from "lucide-react";
import { useEffect } from "react";
import { listComplaints, type ComplaintRecord } from "@/lib/smartgov-api";

export const Route = createFileRoute("/_app/complaints/")({
  head: () => ({ meta: [{ title: "My Complaints — Civic Bridge Flow" }] }),
  component: ComplaintsList,
});

function ComplaintsList() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");
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

  const filtered = complaints.filter(
    (c) =>
      (status === "All" || c.status === status) &&
      (q === "" || c.title.toLowerCase().includes(q.toLowerCase()) || c.grievanceId.includes(q)),
  );
  const statuses = ["All", "Submitted", "Under Review", "In Progress", "Resolved", "Escalated"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Complaints</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track all grievances you've filed.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary text-primary-foreground shadow-elegant">
          <Link to="/complaints/new">
            <FilePlus2 className="mr-1.5 h-4 w-4" /> New Complaint
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ID or title…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                status === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Grievance</th>
              <th className="px-4 py-3 text-left font-medium">Department</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">ETA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Loading complaints...
                </td>
              </tr>
            ) : null}
            {!loading && filtered.map((c) => (
              <tr key={c.grievanceId} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-mono text-xs">{c.grievanceId}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.city}, {c.district}</div>
                </td>
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
                  {c.assignedOfficerName ? `Officer ${c.assignedOfficerName}` : "Pending assignment"}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No complaints match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
