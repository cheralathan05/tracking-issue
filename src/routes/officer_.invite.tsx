import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Briefcase, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { acceptOfficerInvitation, getOfficerInvitation } from "@/lib/smartgov-api";

const inviteSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/officer_/invite")({
  validateSearch: inviteSearchSchema,
  head: () => ({ meta: [{ title: "Activate officer invite — Civic Bridge Flow" }] }),
  component: OfficerInviteAccept,
});

export function OfficerInviteAccept() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(Boolean(search.token));
  const [invite, setInvite] = useState<{
    fullName: string;
    email: string;
    mobile: string;
    department: string;
    area: string;
    code: string;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!search.token) {
      setLoadingInvite(false);
      return;
    }

    let mounted = true;
    getOfficerInvitation(search.token)
      .then((result) => {
        if (mounted) {
          setInvite(result.invitation);
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load invitation");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingInvite(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [search.token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.token) {
      setError("Missing invitation token");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await acceptOfficerInvitation(search.token, {
        password,
        confirmPassword,
      });
      toast.success("Officer account activated");
      await navigate({ to: "/officer/login" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to activate invite");
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvite) {
    return <div className="min-h-screen bg-secondary/40 p-10">Loading invitation...</div>;
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Civic Bridge Flow</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Officer activation
            </div>
          </div>
        </Link>

        <div className="mt-8 rounded-xl border border-border bg-card p-8 shadow-card">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
            <CheckCircle2 className="h-3 w-3" /> Invitation valid
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Activate your officer account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {invite ? (
              <>
                You were invited as a <strong>{invite.department}</strong> officer for <strong>{invite.area}</strong>.
                Set your password to complete activation.
              </>
            ) : (
              "Open the invite link sent by admin to activate your officer account."
            )}
          </p>

          <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Officer name</Label>
              <Input id="name" value={invite?.fullName ?? ""} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={invite?.email ?? ""} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept">Department</Label>
              <Input id="dept" value={invite?.department ?? ""} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area">Assigned area</Label>
              <Input id="area" value={invite?.area ?? ""} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Invite code</Label>
              <Input id="code" value={invite?.code ?? ""} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpw">Confirm password</Label>
              <Input id="cpw" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required placeholder="••••••••" />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Your activation is audit-logged.
              </p>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-primary text-primary-foreground shadow-elegant"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? "Activating…" : "Activate &amp; sign in"}
              </Button>
            </div>
          </form>

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
