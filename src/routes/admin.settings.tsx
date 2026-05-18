import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin Settings — Civic Bridge Flow" }] }),
  component: () => (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure SLA targets, escalation rules, and platform policies.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <p className="text-sm text-muted-foreground">Settings options will appear here.</p>
      </div>
    </div>
  ),
});
