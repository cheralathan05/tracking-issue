import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAdmin } from "@/lib/auth-api";

export const Route = createFileRoute("/admin_/login")({
  head: () => ({ meta: [{ title: "Admin sign in — Civic Bridge Flow" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await loginAdmin(email, password, true);
      const resolvedEmail = result.data?.email ?? email;
      await navigate({
        to: `/verify-otp?email=${encodeURIComponent(resolvedEmail)}&purpose=admin_login&returnTo=/admin/dashboard` as never,
      });
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
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Civic Bridge Flow</div>
            <div className="text-[10px] uppercase tracking-widest opacity-70">Admin Console</div>
          </div>
        </Link>
        <div className="space-y-5">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            Govern with clarity. Resolve with speed.
          </h2>
          <p className="max-w-md text-primary-foreground/85">
            Monitor grievances, manage departments, and ensure accountability across every level of
            governance.
          </p>
          <div className="flex items-center gap-3 text-sm opacity-80">
            <Lock className="h-4 w-4" /> Multi-factor authentication · Audit-logged
          </div>
        </div>
        <div className="text-xs opacity-60">© 2026 Government of India · Restricted access</div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-md space-y-7">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
              <ShieldCheck className="h-3 w-3" /> Restricted area
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
            <p className="text-sm text-muted-foreground">Authorized government officials only.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="chera.admin@gmail.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/admin/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
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
            <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
              After verifying your email and password, an OTP will be sent to your Gmail inbox.
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              className="w-full bg-gradient-primary text-primary-foreground shadow-elegant"
              disabled={loading}
            >
              {loading ? "Verifying…" : "Sign in to admin console"}
            </Button>
          </form>

          <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
            Not an administrator?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in as a citizen
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
            Need an admin account?{" "}
            <Link to="/admin/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
