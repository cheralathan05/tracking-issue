import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLiveNotifications } from "@/hooks/useLiveNotifications";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Civic Bridge Flow" }] }),
  component: NotificationsPage,
});

function toneClass(type: string) {
  switch (type) {
    case "success":
      return "bg-success/15 text-success border-success/30";
    case "warning":
      return "bg-warning/20 text-warning-foreground border-warning/40";
    case "critical":
      return "bg-destructive/15 text-destructive border-destructive/30";
    default:
      return "bg-info/15 text-info border-info/30";
  }
}

function NotificationsPage() {
  const { notifications, unreadCount, loading, markAllRead, markAsRead } = useLiveNotifications();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">Live alerts for complaint updates, assignments, chat, and escalations.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-1 h-4 w-4" /> Mark all read
          </Button>
          <span className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
            {unreadCount} unread
          </span>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet. Live alerts will appear here automatically.</div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => {
                void markAsRead(notification.id);
                if (notification.actionUrl) {
                  window.location.href = notification.actionUrl;
                }
              }}
              className={`w-full rounded-3xl border p-4 text-left transition ${notification.isRead ? "border-border bg-card" : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${toneClass(notification.type)}`}>
                  {notification.type}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-sm font-semibold">{notification.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{notification.message}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
