import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shield, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loginCitizen } from "@/lib/auth-api";

const loginSearchSchema = z.object({
  returnTo: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Civic Bridge Flow" },
      { name: "description", content: "Sign in to your Civic Bridge Flow citizen account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await loginCitizen(identifier, password, rememberMe);
      const role = response.data?.user.role ?? "citizen";
      const destination =
        search.returnTo?.startsWith("/")
          ? search.returnTo
          : role === "citizen"
            ? "/dashboard"
            : role === "officer"
              ? "/officer/dashboard"
              : "/admin/dashboard";
      await navigate({ to: destination as never });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden bg-gradient-hero p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Civic Bridge Flow</div>
            <div className="text-[10px] uppercase tracking-widest opacity-70">Citizen Portal</div>
          </div>
        </Link>
        <div className="space-y-5">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            Transparent governance, in your pocket.
          </h2>
          <p className="max-w-md text-primary-foreground/85">
            Track grievances, communicate with departments, and hold authorities accountable — all
            in one secure platform.
          </p>
          <div className="flex items-center gap-3 text-sm opacity-80">
            <Lock className="h-4 w-4" /> Bank-grade encryption · Aadhaar-verified
          </div>
        </div>
        <div className="text-xs opacity-60">© 2026 Government of India</div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-md space-y-7">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your citizen account.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Mobile or Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                  placeholder="you@example.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              />{" "}
              <Label htmlFor="remember" className="font-normal text-muted-foreground">
                Remember me on this device
              </Label>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              className="w-full bg-gradient-primary text-primary-foreground shadow-elegant"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Officer / Admin?</span> Access the{" "}
            <Link to="/admin/login" className="font-medium text-primary hover:underline">
              Admin Console →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
