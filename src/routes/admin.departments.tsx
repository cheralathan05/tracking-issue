import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { listComplaints, listOfficers, type ComplaintRecord, type OfficerSummary } from "@/lib/smartgov-api";

export const Route = createFileRoute("/admin/departments")({
  head: () => ({ meta: [{ title: "Departments — Admin" }] }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [officers, setOfficers] = useState<OfficerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([listComplaints({ view: "all" }), listOfficers()])
      .then(([complaintResult, officersResult]) => {
        if (!mounted) return;
        setComplaints(complaintResult.complaints);
        setOfficers(officersResult.officers);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const departments = useMemo(() => {
    const openStatuses = new Set(["Submitted", "Under Review", "Assigned", "In Progress", "Awaiting Information"]);
    const stats = new Map<string, { name: string; officers: number; open: number; resolved: number; total: number; sla: number }>();

    complaints.forEach((complaint) => {
      const name = complaint.department || "Unknown";
      const entry = stats.get(name) ?? { name, officers: 0, open: 0, resolved: 0, total: 0, sla: 0 };
      entry.total += 1;
      if (openStatuses.has(complaint.status)) {
        entry.open += 1;
      }
      if (complaint.status === "Resolved" || complaint.status === "Closed") {
        entry.resolved += 1;
      }
      stats.set(name, entry);
    });

    officers.forEach((officer) => {
      const name = officer.department || "Unassigned";
      const entry = stats.get(name) ?? { name, officers: 0, open: 0, resolved: 0, total: 0, sla: 0 };
      entry.officers += 1;
      stats.set(name, entry);
    });

    return Array.from(stats.values())
      .map((entry) => ({
        ...entry,
        sla: entry.total > 0 ? Math.round((entry.resolved / Math.max(entry.total, 1)) * 100) : 100,
      }))
      .sort((a, b) => b.open - a.open);
  }, [complaints, officers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Departments</h1>
          <p className="text-sm text-muted-foreground">
            Manage department heads, officers, and SLA targets.
          </p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-elegant">
          <Plus className="mr-1.5 h-4 w-4" /> Add department
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            Loading department data...
          </div>
        ) : departments.length > 0 ? (
          departments.map((d) => (
            <div key={d.name} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">Officers: {d.officers}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold">{d.open}</div>
                  <div className="text-[10px] text-muted-foreground">Open</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{d.resolved}</div>
                  <div className="text-[10px] text-muted-foreground">Resolved</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{d.sla}%</div>
                  <div className="text-[10px] text-muted-foreground">SLA</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            No department data available.
          </div>
        )}
      </div>
    </div>
  );
}
