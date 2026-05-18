import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input defaultValue="Aarav Sharma" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input defaultValue="aarav@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Mobile</Label>
            <Input defaultValue="+91 90000 00000" />
          </div>
          <div className="space-y-1.5">
            <Label>District</Label>
            <Input defaultValue="Gurugram" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button className="bg-gradient-primary text-primary-foreground">Save changes</Button>
        </div>
      </div>
    </div>
  );
}
