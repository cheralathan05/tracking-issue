import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  FilePlus2,
  Home,
  ListChecks,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { logout, type AuthUser } from "@/lib/auth-api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/complaints/new", label: "New Complaint", icon: FilePlus2 },
  { to: "/complaints", label: "My Complaints", icon: ListChecks },
  { to: "/chat", label: "Chat Center", icon: MessageCircle },
  { to: "/escalations", label: "Escalated", icon: AlertTriangle },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function CitizenLayout({ initialUser }: { initialUser: AuthUser | null }) {
  return <CitizenLayoutContent initialUser={initialUser} />;
}

function CitizenLayoutContent({ initialUser }: { initialUser: AuthUser | null }) {
  const path = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-subtle">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-32 h-80 w-80 rounded-full bg-info/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-success/10 blur-3xl" />
      </div>

      <div className="relative flex">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border/80 bg-sidebar/95 text-sidebar-foreground backdrop-blur-xl md:flex">
          <Link to="/" className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">Civic Bridge Flow</div>
              <div className="text-[10px] uppercase tracking-[0.3em] opacity-60">Citizen command center</div>
            </div>
          </Link>

          <div className="border-b border-sidebar-border px-6 py-4">
            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-sidebar-foreground/55">Live access</div>
              <div className="mt-1 text-sm font-medium text-sidebar-foreground">
                Track issues and escalate without leaving the portal.
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {nav.map((item) => {
              const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    active
                      ? "bg-sidebar-primary/20 text-sidebar-foreground shadow-glow"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <Link
              to="/"
              onClick={() => {
                void logout();
              }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-20 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl md:px-8">
            <div className="hidden max-w-md flex-1 md:block">
              <div className="relative rounded-full border border-border bg-card/80 shadow-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search grievance ID, category, location, or officer…"
                  className="h-12 rounded-full border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground lg:flex">
                <span className="h-2 w-2 rounded-full bg-success" />
                Live service online
              </div>
              <NotificationBell initialUser={initialUser} />
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3 shadow-sm">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground shadow-glow">
                  {(initialUser?.fullName?.trim().charAt(0) ?? "U").toUpperCase()}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-semibold">{initialUser?.fullName ?? "Citizen"}</div>
                  <div className="text-[10px] text-muted-foreground">{initialUser?.email ?? "Signed in user"}</div>
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
