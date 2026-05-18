import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ClipboardList,
  UploadCloud,
  Bell,
  LogOut,
  Briefcase,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const nav = [
  { to: "/officer/dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { to: "/officer/complaints", label: "Assigned Complaints", icon: ClipboardList },
  { to: "/officer/resolution", label: "Upload Resolution", icon: UploadCloud },
] as const;

export function OfficerLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
          <Link
            to="/"
            className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Civic Bridge Flow</div>
              <div className="text-[10px] uppercase tracking-widest opacity-60">Officer Portal</div>
            </div>
          </Link>
          <nav className="flex-1 space-y-1 p-3">
            {nav.map((n) => {
              const active = path === n.to || path.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${active ? "bg-sidebar-primary/20 text-sidebar-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border p-3">
            <Link
              to="/officer/login"
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
              <Input placeholder="Search assigned complaints…" className="pl-9" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-info/30 bg-info/10 px-2.5 py-1 text-[11px] font-medium text-info sm:inline-flex">
                <Briefcase className="h-3 w-3" /> Field Officer
              </span>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                  RK
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-semibold">R. Kumar</div>
                  <div className="text-[10px] text-muted-foreground">Electricity · Sector 14</div>
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
