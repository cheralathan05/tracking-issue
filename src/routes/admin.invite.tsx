import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Mail, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createOfficerInvitation, regenerateOfficerInvitation, resendOfficerInvitation } from "@/lib/smartgov-api";

const DEPARTMENTS = ["Water Supply", "Electricity", "Roads", "Sanitation", "Public Safety", "Health", "Corruption", "Others"] as const;

export const Route = createFileRoute("/admin/invite")({
  head: () => ({ meta: [{ title: "Invite officer — Admin" }] }),
  component: InviteOfficerPage,
});

function InviteOfficerPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [department, setDepartment] = useState<(typeof DEPARTMENTS)[number]>("Water Supply");
  const [area, setArea] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState<"resend" | "regenerate" | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSubmitSuccess(false);

    try {
      const result = await createOfficerInvitation({
        fullName,
        email,
        mobile,
        department,
        area,
        username: username.trim() || undefined,
      });

      setInviteUrl(result.invitation.invitationUrl ?? null);
      setInviteCode(result.invitation.code);
      setSubmitSuccess(true);
      toast.success("Invitation sent successfully");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to create officer invitation",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!inviteCode) return;
    setActionLoading("resend");
    setError(null);
    try {
      const result = await resendOfficerInvitation(inviteCode);
      setInviteUrl(result.invitation.invitationUrl ?? inviteUrl);
      toast.success("Invitation email sent");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to send invitation email");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerateLink = async () => {
    if (!inviteCode) return;
    setActionLoading("regenerate");
    setError(null);
    try {
      const result = await regenerateOfficerInvitation(inviteCode);
      setInviteUrl(result.invitation.invitationUrl ?? inviteUrl);
      toast.success("Invitation link regenerated");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to regenerate invitation link");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Invite officer</h1>
        <p className="text-sm text-muted-foreground">
          Send a secure invite link to an officer so they can activate their account and login
          with their assigned area and department.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-card lg:col-span-2"
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="email">Officer email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="ramesh@gov.in"
                className="pl-9"
              />
            </div>
          </div>
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
            <Label htmlFor="department">Department</Label>
            <select
              id="department"
              value={department}
              onChange={(event) => setDepartment(event.target.value as (typeof DEPARTMENTS)[number])}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="area">Assigned area</Label>
            <Input
              id="area"
              value={area}
              onChange={(event) => setArea(event.target.value)}
              required
              placeholder="Sathyamangalam"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Preferred username</Label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="ramesh_sgm"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="inviteLink">Invite link</Label>
            <Input
              id="inviteLink"
              value={inviteUrl ?? ""}
              readOnly
              placeholder="The generated invite URL will appear here"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="submit"
          className="bg-gradient-primary text-primary-foreground shadow-elegant"
          disabled={loading}
        >
          {loading ? "Creating invitation..." : submitSuccess ? "Invitation Sent Successfully" : "Create Invitation"}
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4" /> Admin account creation
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Once the invitation is created, the officer can only activate through the secure link. Login
          is blocked until account activation is completed.
        </p>
        {inviteUrl ? (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-sm">
            <div className="font-medium">Generated link</div>
            <div className="mt-1 break-all text-xs text-muted-foreground">{inviteUrl}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteUrl);
                  toast.success("Invite link copied");
                }}
              >
                <Copy className="mr-1.5 h-4 w-4" /> Copy Link
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading !== null}
                onClick={handleResendEmail}
              >
                <Mail className="mr-1.5 h-4 w-4" /> {actionLoading === "resend" ? "Sending..." : "Send Email"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading !== null}
                onClick={handleRegenerateLink}
              >
                <RefreshCcw className="mr-1.5 h-4 w-4" /> {actionLoading === "regenerate" ? "Regenerating..." : "Regenerate"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
