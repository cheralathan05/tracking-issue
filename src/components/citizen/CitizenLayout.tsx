import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home,
  FilePlus2,
  ListChecks,
  Bell,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfile, type AuthUser } from "@/lib/auth-api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/complaints/new", label: "New Complaint", icon: FilePlus2 },
  { to: "/complaints", label: "My Complaints", icon: ListChecks },
  { to: "/escalations", label: "Escalated", icon: AlertTriangle },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/chat", label: "Chat Support", icon: MessageSquare },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function CitizenLayout() {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    getProfile()
      .then((result) => {
        if (result.data?.user) {
          setProfile(result.data.user);
        }
      })
      .catch(() => {
        setProfile(null);
      });
  }, []);

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
          <Link
            to="/"
            className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Civic Bridge Flow</div>
              <div className="text-[10px] uppercase tracking-widest opacity-60">Citizen</div>
            </div>
          </Link>

          <nav className="flex-1 space-y-1 p-3">
            {nav.map((n) => {
              const active = path === n.to || (n.to !== "/dashboard" && path.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-sidebar-primary/20 text-sidebar-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-8">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by Grievance ID, category, location…" className="pl-9" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                {(profile?.fullName?.trim().charAt(0) ?? "U").toUpperCase()}
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-semibold">{profile?.fullName ?? "Citizen"}</div>
                <div className="text-[10px] text-muted-foreground">
                  {profile?.email ?? "Signed in user"}
                </div>
              </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
