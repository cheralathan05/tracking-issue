import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/auth-api";

export const Route = createFileRoute("/admin_/forgot-password")({
  head: () => ({ meta: [{ title: "Admin forgot password — Civic Bridge Flow" }] }),
  component: AdminForgotPasswordPage,
});

function AdminForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      await navigate({
        to: "/verify-otp",
        search: { email, purpose: "password_reset", returnTo: "/admin/login" },
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send OTP");
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
            Recover your admin account securely.
          </h2>
          <p className="max-w-md text-primary-foreground/85">
            Enter your registered email address and we will send you an OTP to reset your
            password.
          </p>
          <div className="flex items-center gap-3 text-sm opacity-80">
            <Mail className="h-4 w-4" /> Secure password recovery · Audit-logged
          </div>
        </div>
        <div className="text-xs opacity-60">© 2026 Government of India · Restricted access</div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 md:p-10">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-card"
        >
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-50/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-3 w-3" /> Password recovery
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Recover admin password</h1>
            <p className="text-sm text-muted-foreground">
              Verify your email address to receive a password reset OTP.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Registered Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
            <p>
              <strong>What happens next:</strong> You'll receive a verification OTP at your email
              address. Use it to create a new password.
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="submit"
            className="w-full bg-gradient-primary text-primary-foreground shadow-elegant"
            disabled={loading}
          >
            {loading ? "Sending OTP…" : "Send verification OTP"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Back to{" "}
            <Link to="/admin/login" className="font-medium text-primary hover:underline">
              admin sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
