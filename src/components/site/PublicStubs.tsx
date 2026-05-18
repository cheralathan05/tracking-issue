import { Link } from "@tanstack/react-router";
import {
  Droplet,
  Zap,
  Construction,
  Trash2,
  Scale,
  ShieldAlert,
  HeartPulse,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  ArrowRight,
  Building2,
  Users,
  Target,
  Award,
  CheckCircle2,
  Globe,
  Lock,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="bg-gradient-hero py-16 text-primary-foreground md:py-24">
      <div className="container mx-auto px-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          {eyebrow}
        </span>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base text-primary-foreground/85 md:text-lg">{subtitle}</p>
      </div>
    </section>
  );
}

/* ------------------------- SERVICES ------------------------- */

const serviceCategories = [
  {
    icon: Droplet,
    label: "Water Supply",
    desc: "Leakage, contamination, low pressure, billing.",
    dept: "Water Supply Dept.",
  },
  {
    icon: Zap,
    label: "Electricity",
    desc: "Outages, streetlights, voltage issues, meter problems.",
    dept: "Municipal Electricity Dept.",
  },
  {
    icon: Construction,
    label: "Roads & Infra",
    desc: "Potholes, broken pavements, road signage, bridges.",
    dept: "Public Works Dept.",
  },
  {
    icon: Trash2,
    label: "Sanitation",
    desc: "Garbage collection, drainage, sewage overflow.",
    dept: "Sanitation Dept.",
  },
  {
    icon: HeartPulse,
    label: "Public Health",
    desc: "Mosquito control, hospital services, vaccination.",
    dept: "Health Dept.",
  },
  {
    icon: ShieldAlert,
    label: "Public Safety",
    desc: "Open manholes, traffic hazards, encroachments.",
    dept: "Police & PWD",
  },
  {
    icon: Scale,
    label: "Corruption / Bribery",
    desc: "Confidential complaints against officials.",
    dept: "Vigilance Cell",
  },
  {
    icon: MoreHorizontal,
    label: "Other Grievances",
    desc: "Anything else — we'll route it to the right desk.",
    dept: "Central Routing",
  },
];

export function ServicesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Citizen services"
        title="Every public service, one trusted portal."
        subtitle="File a grievance against any government department in under 2 minutes. Track resolution end-to-end with full transparency."
      />
      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {serviceCategories.map((s) => (
            <div
              key={s.label}
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{s.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-primary/80">
                {s.dept}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-8 shadow-card md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Ready to file a grievance?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in or register to get a tracking ID and SLA-bound resolution timeline.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/track">Track existing</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-primary text-primary-foreground shadow-elegant"
              >
                <Link to="/login">
                  File a complaint <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

/* ------------------------- ABOUT ------------------------- */

const pillars = [
  {
    icon: Target,
    title: "Citizen-first",
    desc: "Every grievance gets a unique ID, owner, and deadline. No black holes.",
  },
  {
    icon: Globe,
    title: "Transparent",
    desc: "Real-time public dashboards on resolution times and department performance.",
  },
  {
    icon: Lock,
    title: "Accountable",
    desc: "Auto-escalation when SLAs are breached. Audit trail for every action.",
  },
  {
    icon: Award,
    title: "Recognised",
    desc: "National Digital Governance Award nominee for civic-tech excellence.",
  },
];

const stats = [
  { v: "12,482", l: "Complaints registered" },
  { v: "9,217", l: "Resolved this year" },
  { v: "3.4 days", l: "Avg. resolution time" },
  { v: "87%", l: "Citizen satisfaction" },
];

export function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About Civic Bridge Flow"
        title="Building a more accountable, more responsive nation."
        subtitle="Civic Bridge Flow is a unified grievance redressal platform connecting citizens directly with the government departments that serve them."
      />

      <section className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
        <div className="space-y-4 text-muted-foreground">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Our mission
          </h2>
          <p>
            For decades, citizens have struggled to be heard by the very institutions built to serve
            them. Civic Bridge Flow collapses that distance — into a single tracked conversation
            between every Indian and every department of government.
          </p>
          <p>
            From a streetlight outage in Sector 14 to a contaminated water main in Sushant Lok,
            every complaint earns a grievance ID, an assigned officer, a published deadline, and a
            public audit trail.
          </p>
          <p>
            Built and operated under the Digital India initiative, Civic Bridge Flow serves all 28
            states and 8 union territories.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="text-2xl font-bold tracking-tight md:text-3xl">{s.v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Four principles guide every release
            </h2>
            <p className="mt-2 text-muted-foreground">
              Civic Bridge Flow is engineered around what citizens told us they actually need.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">A platform, not a portal.</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Departments, vigilance cells, district magistrates and citizens all collaborate in
                one shared space.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/services">Explore services</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-primary text-primary-foreground shadow-elegant"
              >
                <Link to="/contact">
                  Contact us <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

/* ------------------------- CONTACT ------------------------- */

const contactChannels = [
  {
    icon: Phone,
    title: "Toll-free helpline",
    value: "1800-XXX-XXXX",
    note: "24×7 · All Indian languages",
  },
  {
    icon: Mail,
    title: "Email support",
    value: "support@civicbridgeflow.gov.in",
    note: "Response within 24 hours",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp",
    value: "+91 9XXXX-XXXXX",
    note: "Quick text-based grievances",
  },
  {
    icon: MapPin,
    title: "Head office",
    value: "Bhavan, New Delhi 110001",
    note: "Mon–Sat · 9 AM – 6 PM",
  },
];

export function ContactPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Get in touch"
        title="We're here to listen, 24×7."
        subtitle="Reach Civic Bridge Flow via your preferred channel. For specific grievances, please file a complaint so we can track resolution end-to-end."
      />

      <section className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-5 md:py-20">
        <div className="space-y-4 md:col-span-2">
          <h2 className="text-2xl font-bold tracking-tight">Contact channels</h2>
          <p className="text-sm text-muted-foreground">
            Pick the option that fits — every channel feeds into the same case-tracking system.
          </p>
          <div className="space-y-3 pt-2">
            {contactChannels.map((c) => (
              <div
                key={c.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {c.title}
                  </div>
                  <div className="font-semibold">{c.value}</div>
                  <div className="text-xs text-muted-foreground">{c.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thanks — we'll respond within 24 hours.");
            }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8"
          >
            <h2 className="text-xl font-bold tracking-tight">Send us a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              For general queries. For specific complaints, please{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                file a grievance
              </Link>{" "}
              instead.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Full name</Label>
                <Input id="c-name" required maxLength={80} placeholder="Aarav Sharma" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-email">Email</Label>
                <Input
                  id="c-email"
                  type="email"
                  required
                  maxLength={120}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="c-subject">Subject</Label>
              <Input id="c-subject" required maxLength={120} placeholder="How can we help?" />
            </div>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="c-msg">Message</Label>
              <Textarea
                id="c-msg"
                required
                rows={5}
                maxLength={1000}
                placeholder="Share details…"
              />
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Avg. response in 24 hrs
              </p>
              <Button
                type="submit"
                className="bg-gradient-primary text-primary-foreground shadow-elegant"
              >
                Send message <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="bg-secondary/40 py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 rounded-2xl border border-border bg-card p-8 shadow-card md:grid-cols-3 md:p-10">
            {[
              {
                icon: Building2,
                title: "For departments",
                desc: "Onboard your department to Civic Bridge Flow.",
                to: "/admin/login",
              },
              {
                icon: Users,
                title: "For citizens",
                desc: "Register and start filing grievances.",
                to: "/register",
              },
              {
                icon: CheckCircle2,
                title: "Track a complaint",
                desc: "Look up status with your grievance ID.",
                to: "/track",
              },
            ].map((q) => (
              <Link
                key={q.title}
                to={q.to}
                className="group flex items-start gap-3 rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-secondary/40"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <q.icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="font-semibold">{q.title}</div>
                  <div className="text-xs text-muted-foreground">{q.desc}</div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
