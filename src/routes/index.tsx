import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Droplet,
  Zap,
  Construction,
  Trash2,
  Scale,
  ShieldAlert,
  HeartPulse,
  MoreHorizontal,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  FileSearch,
  MessageSquare,
  Sparkles,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import heroImg from "@/assets/hero-civic.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Civic Bridge Flow — Citizen Grievance & Issue Tracking Portal" },
      {
        name: "description",
        content:
          "Raise, track and resolve civic grievances with full transparency. A modern civic services platform for citizens, officers and administrators.",
      },
      { property: "og:title", content: "Civic Bridge Flow — Citizen Grievance Portal" },
      {
        property: "og:description",
        content: "Transparent, secure, citizen-first grievance redressal.",
      },
    ],
  }),
  component: LandingPage,
});

const services = [
  { icon: Droplet, label: "Water", color: "text-info" },
  { icon: Zap, label: "Electricity", color: "text-warning" },
  { icon: Construction, label: "Roads", color: "text-primary" },
  { icon: Trash2, label: "Sanitation", color: "text-success" },
  { icon: Scale, label: "Corruption", color: "text-destructive" },
  { icon: ShieldAlert, label: "Public Safety", color: "text-primary" },
  { icon: HeartPulse, label: "Health", color: "text-destructive" },
  { icon: MoreHorizontal, label: "Others", color: "text-muted-foreground" },
];

const stats = [
  { value: "2.4M+", label: "Complaints Resolved" },
  { value: "184K", label: "Active Cases" },
  { value: "3.2 days", label: "Avg. Resolution" },
  { value: "94%", label: "Citizen Satisfaction" },
];

const steps = [
  {
    icon: FileSearch,
    title: "Submit Grievance",
    desc: "Fill a quick form, attach evidence and pin the location.",
  },
  {
    icon: Users,
    title: "Department Reviews",
    desc: "Auto-routed to the right officer in the relevant department.",
  },
  {
    icon: Sparkles,
    title: "Resolution",
    desc: "Track real-time updates and resolution with proof.",
  },
  {
    icon: MessageSquare,
    title: "Feedback",
    desc: "Rate the resolution and ensure accountability.",
  },
];

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95"
          aria-hidden
        />
        <div className="container relative mx-auto grid gap-10 px-4 py-20 md:grid-cols-2 md:py-28 lg:py-32">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live • Government of India initiative
            </div>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Your voice. Heard, tracked, resolved.
            </h1>
            <p className="max-w-xl text-base text-primary-foreground/85 md:text-lg">
              A transparent grievance redressal platform connecting citizens directly with
              government departments — secure, fast and accountable.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-background text-foreground shadow-elegant hover:bg-background/90"
              >
                <Link to="/complaints/new">
                  Raise a Grievance <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-primary-foreground backdrop-blur hover:bg-white/20"
              >
                <Link to="/track">Track Complaint</Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 pt-2 text-sm text-primary-foreground/80">
              <Phone className="h-4 w-4" /> Emergency Helpline:{" "}
              <span className="font-semibold text-primary-foreground">112</span>
              <span className="opacity-50">•</span>
              Citizen Helpdesk:{" "}
              <span className="font-semibold text-primary-foreground">1800-XXX-XXXX</span>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="absolute -inset-4 rounded-3xl bg-white/5 blur-2xl" aria-hidden />
            <div className="relative rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl shadow-elegant">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest opacity-70">Live Complaint</div>
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
                  In Progress
                </span>
              </div>
              <div className="mt-3 text-lg font-semibold">GRV-2026-00482</div>
              <div className="text-sm opacity-80">Streetlight outage · Sector 14, Gurugram</div>
              <div className="mt-5 space-y-3 text-sm">
                {[
                  { t: "Submitted", d: "06 May, 09:12", done: true },
                  { t: "Under Review", d: "06 May, 11:40", done: true },
                  { t: "Assigned to Officer", d: "07 May, 10:20", done: true },
                  { t: "Site inspection", d: "09 May, 16:05", done: true },
                  { t: "Resolution", d: "ETA 12 May", done: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full ${s.done ? "bg-success text-success-foreground" : "bg-white/15"}`}
                    >
                      {s.done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className={s.done ? "" : "opacity-70"}>{s.t}</div>
                    </div>
                    <div className="text-xs opacity-70">{s.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Quick Services</h2>
            <p className="mt-2 text-muted-foreground">
              Pick a category to file your grievance instantly.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/services">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {services.map((s) => (
            <Link
              key={s.label}
              to="/complaints/new"
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
            >
              <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-primary opacity-0 blur-2xl transition group-hover:opacity-30"
                aria-hidden
              />
              <div
                className={`grid h-11 w-11 place-items-center rounded-lg bg-secondary ${s.color}`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-semibold">{s.label}</div>
              <div className="mt-1 flex items-center text-sm text-muted-foreground group-hover:text-foreground">
                File complaint{" "}
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How it works</h2>
          <p className="mt-2 text-muted-foreground">
            From submission to resolution — every step is tracked and transparent.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <div className="absolute -top-3 right-5 rounded-full bg-gradient-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-10 text-primary-foreground shadow-elegant md:p-14">
          <div
            className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="text-2xl font-bold md:text-3xl">Be heard. Make change happen.</h3>
              <p className="mt-2 max-w-xl text-primary-foreground/85">
                Sign up to file complaints, get real-time updates, and hold authorities accountable.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                asChild
                size="lg"
                className="bg-background text-foreground hover:bg-background/90"
              >
                <Link to="/register">Get started</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20"
              >
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
