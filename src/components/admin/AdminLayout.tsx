import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Bell,
  Search,
  ShieldCheck,
  Briefcase,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { getProfile, logout, type AuthUser } from "@/lib/auth-api";

const nav = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/complaints", label: "Complaints", icon: ClipboardList },
  { to: "/admin/assignment", label: "Smart assignment", icon: Sparkles },
  { to: "/admin/officers", label: "Officers", icon: Briefcase },
  { to: "/admin/invite", label: "Invite officer", icon: UserPlus },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
  { to: "/admin/users", label: "Citizens", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminLayout() {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let mounted = true;

    getProfile()
      .then((result) => {
        if (mounted && result.data?.user) {
          setProfile(result.data.user);
        }
      })
      .catch(() => {
        if (mounted) {
          setProfile(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
          <Link
            to="/"
            className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Civic Bridge Flow</div>
              <div className="text-[10px] uppercase tracking-widest opacity-60">Admin Console</div>
            </div>
          </Link>

          <nav className="flex-1 space-y-1 p-3">
            {nav.map((n) => {
              const active = path === n.to || path.startsWith(n.to + "/");
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
              to="/admin/login"
              onClick={() => {
                void logout();
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-8">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search complaints, citizens, officers…" className="pl-9" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success sm:inline-flex">
                <Shield className="h-3 w-3" /> Admin
              </span>
              <NotificationBell />
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                  {(profile?.fullName?.trim().charAt(0) ?? "A").toUpperCase()}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-semibold">{profile?.fullName ?? "Administrator"}</div>
                  <div className="text-[10px] text-muted-foreground">{profile?.email ?? "Government account"}</div>
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
