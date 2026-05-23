import { useState } from "react";
import { Bell, Check, Circle, Clock3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AuthUser } from "@/lib/auth-api";
import { useLiveNotifications } from "@/hooks/useLiveNotifications";

const toneClasses: Record<string, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-info/10 text-info border-info/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

export function NotificationBell({ initialUser }: { initialUser?: AuthUser | null }) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, markAllRead, markAsRead } = useLiveNotifications(initialUser ?? undefined);

  const activeItems = notifications.slice(0, 8);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen((current) => !current)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Notifications</div>
              <div className="text-[11px] text-muted-foreground">{unreadCount} unread</div>
            </div>
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading notifications…</div>
            ) : activeItems.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No recent notifications.</div>
            ) : (
              activeItems.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    void markAsRead(notification.id);
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                  className={`w-full border-b border-border px-4 py-3 text-left transition hover:bg-secondary ${notification.isRead ? "bg-card" : "bg-background"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneClasses[notification.type] ?? toneClasses.info}`}>
                      {notification.type}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="mt-2 font-medium text-sm">{notification.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{notification.message}</div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Real-time alerts for complaints, assignments, escalations, chat, and status changes.
          </div>
        </div>
      )}
    </div>
  );
}
