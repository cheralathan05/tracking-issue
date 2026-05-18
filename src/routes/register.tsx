import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerCitizen } from "@/lib/auth-api";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Full name must be at least 3 characters long"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    mobile: z
      .string()
      .trim()
      .regex(/^(?:\+91[-\s]?)?[6-9]\d{9}$/, "Enter a valid mobile number"),
    aadhaar: z
      .string()
      .trim()
      .regex(/^(?:\d{4}\s?){3}$/, "Enter a valid Aadhaar number"),
    state: z.string().trim().min(1, "State is required"),
    district: z.string().trim().min(1, "District is required"),
    address: z.string().trim().min(5, "Address must be at least 5 characters long"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password must match",
    path: ["confirmPassword"],
  });

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Civic Bridge Flow" },
      { name: "description", content: "Register as a citizen on Civic Bridge Flow." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    aadhaar: "",
    state: "",
    district: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parsedForm = registerSchema.safeParse(form);

      if (!parsedForm.success) {
        const validationError = parsedForm.error.flatten();
        const firstMessage =
          Object.values(validationError.fieldErrors).flat().find(Boolean) ??
          validationError.formErrors[0] ??
          "Please check the form details";

        throw new Error(firstMessage);
      }

      const response = await registerCitizen(parsedForm.data);

      // In development the API returns the OTP for convenience — include it in the
      // verify page search params so developers can quickly proceed.
      const search: Record<string, string> = {
        email: parsedForm.data.email,
        purpose: "registration",
      };

      if ((response as any).otp) {
        search.otp = (response as any).otp;
      }

      await navigate({ to: "/verify-otp", search });
      return response;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">Civic Bridge Flow</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Citizen Portal
            </div>
          </div>
        </Link>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-card md:p-10">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Create your citizen account</h1>
            <p className="text-sm text-muted-foreground">
              Takes less than a minute. Your details are encrypted end-to-end.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                required
                placeholder="Aarav Sharma"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mob">Mobile number</Label>
              <Input
                id="mob"
                value={form.mobile}
                onChange={(event) => setForm({ ...form, mobile: event.target.value })}
                required
                placeholder="+91 90000 00000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em">Email</Label>
              <Input
                id="em"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aad">Aadhaar</Label>
              <Input
                id="aad"
                value={form.aadhaar}
                onChange={(event) => setForm({ ...form, aadhaar: event.target.value })}
                placeholder="XXXX-XXXX-XXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
                required
                placeholder="Haryana"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dist">District</Label>
              <Input
                id="dist"
                value={form.district}
                onChange={(event) => setForm({ ...form, district: event.target.value })}
                required
                placeholder="Gurugram"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr">Address</Label>
              <Input
                id="addr"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                required
                placeholder="House / Street / Area"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                placeholder="8+ chars, upper/lower/number/symbol"
              />
              <p className="text-xs text-muted-foreground">
                Use at least 8 characters with uppercase, lowercase, a number, and a special
                character.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpw">Confirm password</Label>
              <Input
                id="cpw"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                required
              />
            </div>

            <div className="md:col-span-2 flex flex-col-reverse items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                By registering you agree to the Terms and Privacy Policy.
              </p>
              {error ? <p className="text-sm text-destructive sm:mr-auto">{error}</p> : null}
              <Button
                type="submit"
                className="bg-gradient-primary text-primary-foreground shadow-elegant"
                disabled={loading}
              >
                {loading ? "Creating…" : "Create account"}
              </Button>
            </div>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
