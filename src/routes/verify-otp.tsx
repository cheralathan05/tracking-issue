import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyOtp } from "@/lib/auth-api";

const verifySearchSchema = z.object({
  email: z.string().optional(),
  purpose: z.enum(["registration", "password_reset", "admin_login"]).optional(),
  returnTo: z.string().optional(),
});

export const Route = createFileRoute("/verify-otp")({
  validateSearch: verifySearchSchema,
  head: () => ({ meta: [{ title: "Verify OTP — SmartGov" }] }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email ?? "");
  const [otp, setOtp] = useState("");
  const [purpose, setPurpose] = useState(search.purpose ?? "password_reset");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPasswordReset = purpose === "password_reset";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await verifyOtp(email, otp, purpose);

      // If the server returned session tokens, assume the user is logged in and
      // redirect to the appropriate dashboard.
      const token = response.data?.token;
      const user = (response.data as any)?.user;

      if (token && user) {
        const role = user.role ?? "citizen";
        const destination =
          role === "citizen"
            ? "/dashboard"
            : role === "officer"
            ? "/officer/dashboard"
            : "/admin/dashboard";

        await navigate({ to: destination as never });
        return;
      }

      if (purpose === "password_reset") {
        await navigate({ to: "/reset-password", search: { email, returnTo: search.returnTo } });
      } else if (purpose === "admin_login") {
        await navigate({ to: search.returnTo ?? "/admin/dashboard" });
      } else if (search.returnTo) {
        await navigate({ to: search.returnTo });
      } else {
        await navigate({ to: "/login" });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-gradient-subtle md:grid-cols-2">
      <div className="hidden bg-gradient-hero p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">SmartGov</div>
            <div className="text-[10px] uppercase tracking-widest opacity-70">
              One-time verification
            </div>
          </div>
        </Link>
        <div className="space-y-5">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">Secure verification.</h2>
          <p className="max-w-md text-primary-foreground/85">
            Enter the OTP you received by email to continue the account recovery or registration
            flow.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 md:p-10">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-card"
        >
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
              <ArrowRight className="h-3 w-3" /> Password recovery
            </span>
            <h1 className="text-2xl font-bold tracking-tight">
              {isPasswordReset ? "Verify OTP to reset your password" : "Verify OTP"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isPasswordReset
                ? "Enter the 6-digit code we sent to your email. After verification, you can choose a new password."
                : "Enter the OTP sent to your email to continue."}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
            <p>
              <strong>Next step:</strong> verify the code, then you’ll move to the password change
              screen.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="smartgov.admin@gmail.com"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="otp">OTP</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="otp"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="123456"
                className="pl-9"
                autoComplete="one-time-code"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Check your Gmail inbox and enter the 6-digit verification code.
            </p>
          </div>

          {!search.purpose ? (
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose</Label>
              <select
                id="purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value as typeof purpose)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="registration">Registration</option>
                <option value="password_reset">Password Reset</option>
                <option value="admin_login">Admin Login</option>
              </select>
            </div>
          ) : null}

          {isPasswordReset ? (
            <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
              <p>
                After verification, you’ll be taken to the screen where you can set a new password.
              </p>
            </div>
          ) : null}

          <div className="text-sm text-muted-foreground">
            Wrong email?{" "}
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              go back and resend the code
            </Link>
            .
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="submit"
            className="w-full bg-gradient-primary text-primary-foreground shadow-elegant"
            disabled={loading}
          >
            {loading ? "Verifying…" : "Verify OTP"}
          </Button>
        </form>
      </div>
    </div>
  );
}
