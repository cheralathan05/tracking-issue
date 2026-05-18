import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Complaint — Civic Bridge Flow" },
      { name: "description", content: "Track the status of any complaint by Grievance ID." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const [id, setId] = useState("");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <section className="container mx-auto flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-card md:p-10">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">
            Track your grievance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your Grievance ID to view real-time status updates.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (id) navigate({ to: "/complaints/$id", params: { id } });
            }}
            className="mt-6 space-y-4"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="GRV-2026-XXXXX"
                className="pl-9 font-mono uppercase"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-primary text-primary-foreground shadow-elegant"
            >
              Track now <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 text-xs text-muted-foreground">
            Try a sample:{" "}
            <button
              onClick={() => setId("GRV-2026-00482")}
              className="font-mono text-primary hover:underline"
            >
              GRV-2026-00482
            </button>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
