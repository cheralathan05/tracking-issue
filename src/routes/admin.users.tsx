import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listOfficers, type OfficerSummary } from "@/lib/smartgov-api";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Officers — Admin" }] }),
  component: UsersPage,
});

function UsersPage() {
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
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Officers</h1>
          <p className="text-sm text-muted-foreground">
            Manage officer accounts and verification status.
          </p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-elegant">
          <UserPlus className="mr-1.5 h-4 w-4" /> Invite officer
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Registered officers</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Department</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Loading officers...
                </td>
              </tr>
            ) : officers.length > 0 ? (
              officers.map((officer) => (
                <tr key={officer.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium">{officer.fullName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{officer.role}</td>
                  <td className="px-4 py-3 font-mono text-xs">{officer.id}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{officer.department ?? "N/A"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium">
                      {officer.emailVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No officers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
