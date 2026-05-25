import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  UploadCloud,
  LogOut,
  Briefcase,
  Search,
  ShieldAlert,
  Radio,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/ui/NotificationBell";

const nav = [
  { to: "/officer/dashboard", label: "Mission Dashboard", icon: LayoutDashboard },
  { to: "/officer/complaints", label: "Assigned Complaints", icon: ClipboardList },
  { to: "/officer/chat", label: "Field Operations Chat", icon: MessageSquare },
  { to: "/officer/resolution", label: "Resolution Upload", icon: UploadCloud },
] as const;

export function OfficerLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="flex min-h-screen min-w-0">
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
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
        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close sidebar backdrop"
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={closeSidebar}
            />

            <aside className="absolute inset-y-0 left-0 flex h-full w-[18rem] max-w-[85vw] flex-col border-r border-sidebar-border/80 bg-sidebar/98 text-sidebar-foreground shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-sidebar-border px-5 py-4">
                <Link to="/" className="flex items-center gap-2.5" onClick={closeSidebar}>
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary">
                    <Briefcase className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">Civic Bridge Flow</div>
                    <div className="text-[10px] uppercase tracking-widest opacity-60">Officer Portal</div>
                  </div>
                </Link>

                <button
                  type="button"
                  aria-label="Close sidebar"
                  onClick={closeSidebar}
                  className="grid h-9 w-9 place-items-center rounded-full border border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 p-3">
                {nav.map((n) => {
                  const active = path === n.to || path.startsWith(n.to + "/");
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={closeSidebar}
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
                  onClick={() => {
                    closeSidebar();
                  }}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </Link>
              </div>
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-8">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-accent md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search assigned complaints…" className="pl-9" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive lg:inline-flex">
                <ShieldAlert className="h-3 w-3" /> Emergency ready
              </span>
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 lg:inline-flex">
                <Radio className="h-3 w-3" /> Realtime sync
              </span>
              <span className="hidden items-center gap-1.5 rounded-full border border-info/30 bg-info/10 px-2.5 py-1 text-[11px] font-medium text-info sm:inline-flex">
                <Briefcase className="h-3 w-3" /> Field Officer
              </span>
              <NotificationBell />
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
          <main className="flex-1 min-w-0 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
