import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAdmin } from "@/lib/auth-api";

export const Route = createFileRoute("/admin_/signup")({
  head: () => ({ meta: [{ title: "Admin sign up — Civic Bridge Flow" }] }),
  component: AdminSignupPage,
});

function AdminSignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("admin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await registerAdmin({
        fullName,
        email,
        mobile,
        role,
        state,
        district,
        address,
        password,
        confirmPassword,
      });
      await navigate({
        to: `/verify-otp?email=${encodeURIComponent(email)}&purpose=registration&returnTo=/admin/login` as never,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to create admin account",
      );
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
            Register as an administrator.
          </h2>
          <p className="max-w-md text-primary-foreground/85">
            Create a secure government admin account and verify via email OTP before accessing the
            admin console.
          </p>
          <div className="flex items-center gap-3 text-sm opacity-80">
            <Lock className="h-4 w-4" /> Secure sign-up · Audit-ready access
          </div>
        </div>
        <div className="text-xs opacity-60">© 2026 Government of India · Restricted access</div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-md space-y-7">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
              <ShieldCheck className="h-3 w-3" /> Admin sign up
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Create your admin account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your details and verify your email to join the Civic Bridge Flow admin console.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                placeholder="Chera Admin"
              />
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
                  required
                  placeholder="admin@example.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="mobile">Mobile number</Label>
                <Input
                  id="mobile"
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                  required
                  placeholder="9876543210"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  required
                  placeholder="Gujarat"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  required
                  placeholder="Ahmedabad"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  required
                  placeholder="123 Government Building"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
                <option value="state_admin">State admin</option>
                <option value="district_officer">District officer</option>
                <option value="department_officer">Department officer</option>
                <option value="officer">Officer</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              className="w-full bg-gradient-primary text-primary-foreground shadow-elegant"
              disabled={loading}
            >
              {loading ? "Signing up…" : "Create admin account"}
            </Button>
          </form>

          <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
            Already have an admin account?{" "}
            <Link to="/admin/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
