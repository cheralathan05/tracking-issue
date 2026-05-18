import { createFileRoute } from "@tanstack/react-router";
import { UploadCloud, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/officer/resolution")({
  head: () => ({ meta: [{ title: "Upload Resolution — Officer" }] }),
  component: ResolutionPage,
});

function ResolutionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Upload resolution proof</h1>
        <p className="text-sm text-muted-foreground">
          Submit completion evidence so the admin can verify and close the complaint.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Resolution submitted for admin verification");
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="space-y-1.5">
            <Label htmlFor="cid">Complaint ID</Label>
            <Input id="cid" required defaultValue="GRV-2026-00482" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="summary">Resolution summary</Label>
            <Textarea
              id="summary"
              required
              rows={4}
              placeholder="Explain the action taken, parts replaced, citizen acknowledgement…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-secondary/40 p-8 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
              <ImageIcon className="h-6 w-6" /> Completion photo
              <input type="file" accept="image/*" className="hidden" />
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-secondary/40 p-8 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
              <UploadCloud className="h-6 w-6" /> Repair report (PDF)
              <input type="file" accept="application/pdf" className="hidden" />
            </label>
          </div>
          <Button
            type="submit"
            className="bg-gradient-primary text-primary-foreground shadow-elegant"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Submit for verification
          </Button>
        </div>

        <aside className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold">Quality checklist</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Photo clearly shows resolved condition</li>
            <li>• Citizen contact attempted &amp; logged</li>
            <li>• Materials/cost noted in summary</li>
            <li>• Geo-tag matches complaint location</li>
            <li>• No personal data in uploads</li>
          </ul>
        </aside>
      </form>
    </div>
  );
}
