import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Civic Bridge Flow" }] }),
  component: NotificationsPage,
});

type Item = {
  id: number;
  type: "success" | "info" | "warning";
  title: string;
  desc: string;
  time: string;
  read: boolean;
};

const seed: Item[] = [
  {
    id: 1,
    type: "success",
    title: "Complaint resolved",
    desc: "GRV-2026-00475 has been marked resolved.",
    time: "2h ago",
    read: false,
  },
  {
    id: 2,
    type: "info",
    title: "New officer assigned",
    desc: "Officer R. Kumar is now handling GRV-2026-00482.",
    time: "1d ago",
    read: false,
  },
  {
    id: 3,
    type: "warning",
    title: "Awaiting your response",
    desc: "Officer requested additional details on GRV-2026-00410.",
    time: "2d ago",
    read: true,
  },
];

const incoming: Omit<Item, "id" | "time" | "read">[] = [
  {
    type: "info",
    title: "Status update",
    desc: "Inspection scheduled for GRV-2026-00482 tomorrow.",
  },
  { type: "success", title: "Acknowledged", desc: "Department PWD acknowledged your complaint." },
  { type: "warning", title: "SLA approaching", desc: "GRV-2026-00410 nears its 72h SLA window." },
];

function NotificationsPage() {
  const [items, setItems] = useState<Item[]>(seed);
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      const pick = incoming[Math.floor(Math.random() * incoming.length)];
      const item: Item = { ...pick, id: Date.now(), time: "just now", read: false };
      setItems((cur) => [item, ...cur].slice(0, 20));
      toast(pick.title, { description: pick.desc });
    }, 12000);
    return () => clearInterval(t);
  }, [live]);

  const tone = (t: Item["type"]) =>
    t === "success"
      ? "bg-success/15 text-success border-success/30"
      : t === "warning"
        ? "bg-warning/20 text-warning-foreground border-warning/40"
        : "bg-info/15 text-info border-info/30";

  const markAll = () => setItems((cur) => cur.map((i) => ({ ...i, read: true })));
  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unread > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {unread} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${live ? "border-success/40 bg-success/10 text-success" : "border-border bg-secondary text-muted-foreground"}`}
          >
            <Radio className={`h-3.5 w-3.5 ${live ? "animate-pulse" : ""}`} />{" "}
            {live ? "Live" : "Paused"}
          </button>
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="mr-1 h-4 w-4" /> Mark all read
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-xl border p-4 shadow-card transition ${n.read ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}
          >
            <span
              className={`mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone(n.type)}`}
            >
              {n.type}
            </span>
            <div className="flex-1">
              <div className="font-medium">{n.title}</div>
              <div className="text-sm text-muted-foreground">{n.desc}</div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
