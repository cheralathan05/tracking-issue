import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth-api";

const resetSearchSchema = z.object({
  email: z.string().optional(),
  returnTo: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: resetSearchSchema,
  head: () => ({ meta: [{ title: "Reset password — SmartGov" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await resetPassword(email, newPassword, confirmPassword);
      await navigate({ to: search.returnTo ?? "/login" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-gradient-hero p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">SmartGov</div>
            <div className="text-[10px] uppercase tracking-widest opacity-70">
              Reset credentials
            </div>
          </div>
        </Link>
        <div className="space-y-5">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            Choose a stronger password.
          </h2>
          <p className="max-w-md text-primary-foreground/85">
            Use a long password with uppercase, lowercase, numbers, and a special character.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 md:p-10">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-card"
        >
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
            <p className="text-sm text-muted-foreground">Set a new password for your account.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="smartgov.admin@gmail.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="submit"
            className="w-full bg-gradient-primary text-primary-foreground shadow-elegant"
            disabled={loading}
          >
            {loading ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
