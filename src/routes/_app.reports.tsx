import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchComplaintSummary, type ComplaintSummary } from "@/lib/smartgov-api";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchComplaintSummary()
      .then((result) => {
        if (mounted) {
          setSummary(result);
        }
      })
      .catch(() => {
        if (mounted) {
          setSummary(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const rows = summary
    ? [
        { label: "Submitted", count: summary.submitted },
        { label: "Assigned", count: summary.assigned },
        { label: "In Progress", count: summary.inProgress },
        { label: "Resolved", count: summary.resolved },
        { label: "Escalated", count: summary.escalated },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        </div>
        <Button variant="outline">
          <Download className="mr-1.5 h-4 w-4" /> Export PDF
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {summary ? (
              rows.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-3 font-medium">{row.label}</td>
                  <td className="px-4 py-3">{row.count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Loading report data...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
