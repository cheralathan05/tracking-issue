import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, TrendingUp, Activity, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listOfficers, type OfficerSummary } from "@/lib/smartgov-api";

export const Route = createFileRoute("/admin/officers")({
  head: () => ({ meta: [{ title: "Officers — Admin" }] }),
  component: OfficersPage,
});

const statusTone = (value: string | null | undefined) =>
  value ? "border-success/30 bg-success/10 text-success" : "border-border bg-secondary text-muted-foreground";

function OfficersPage() {
  const [officers, setOfficers] = useState<OfficerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    listOfficers()
      .then((result) => {
        if (mounted) {
          setOfficers(result.officers);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Officer management</h1>
          <p className="text-sm text-muted-foreground">
            Workload, assignment area, and verification status across the field.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary text-primary-foreground shadow-elegant">
          <Link to="/admin/invite">
            <UserPlus className="mr-1.5 h-4 w-4" /> Invite officer
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Active officers</div>
          <div className="mt-1 text-3xl font-bold">{officers.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Verified officers</div>
          <div className="mt-1 text-3xl font-bold">{officers.filter((officer) => officer.isVerified).length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Pending invite-ready</div>
          <div className="mt-1 text-3xl font-bold">{officers.filter((officer) => officer.username).length}</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Briefcase className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">All officers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Officer</th>
                <th className="px-4 py-3 text-left font-medium">Dept.</th>
                <th className="px-4 py-3 text-left font-medium">Area</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading officers...
                  </td>
                </tr>
              ) : null}
              {!loading && officers.map((officer) => (
                <tr key={officer.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{officer.fullName}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{officer.username ?? officer.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{officer.department ?? "Officer"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{officer.jurisdictionArea ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{officer.officerCode ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(officer.isVerified ? "verified" : null)}`}>
                      {officer.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && officers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No officers found yet.
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
