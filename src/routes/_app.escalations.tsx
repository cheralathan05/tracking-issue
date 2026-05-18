import { createFileRoute } from "@tanstack/react-router";
import { Bell, MessageSquare, BarChart3, Settings, AlertTriangle } from "lucide-react";

function Stub({
  title,
  desc,
  icon: Icon,
}: {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-card">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-muted-foreground">{desc}</p>
    </div>
  );
}

export const Route = createFileRoute("/_app/escalations")({
  component: () => (
    <Stub
      title="Escalated Issues"
      desc="Escalated grievances will appear here once raised."
      icon={AlertTriangle}
    />
  ),
});
