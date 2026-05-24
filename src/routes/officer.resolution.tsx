import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UploadCloud, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getOfficerOpsQueue, submitOfficerResolution, type OfficerOpsQueueItem } from "@/lib/smartgov-api";

export const Route = createFileRoute("/officer/resolution")({
  head: () => ({ meta: [{ title: "Upload Resolution — Officer" }] }),
  component: ResolutionPage,
});

function ResolutionPage() {
  const [queue, setQueue] = useState<OfficerOpsQueueItem[]>([]);
  const [complaintId, setComplaintId] = useState("");
  const [summary, setSummary] = useState("");
  const [files, setFiles] = useState<Array<{ name: string; type: string; size: number; dataUrl: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getOfficerOpsQueue({ sortBy: "oldest" }).then((result) => {
      setQueue(result.queue);
      if (result.queue[0]) {
        setComplaintId(result.queue[0].complaintId);
      }
    });
  }, []);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    const payload = await Promise.all(
      picked.map(
        (file) =>
          new Promise<{ name: string; type: string; size: number; dataUrl: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, type: file.type || "application/octet-stream", size: file.size, dataUrl: String(reader.result ?? "") });
            reader.onerror = () => reject(new Error("Unable to read file"));
            reader.readAsDataURL(file);
          }),
      ),
    );
    setFiles(payload);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Upload resolution proof</h1>
        <p className="text-sm text-muted-foreground">
          Submit completion evidence so the admin can verify and close the complaint.
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!complaintId || summary.trim().length < 10) {
            toast.error("Complaint and resolution summary are required");
            return;
          }

          setSubmitting(true);
          try {
            await submitOfficerResolution(complaintId, {
              resolutionSummary: summary,
              citizenConfirmation: true,
              beforeAfterPhotos: files,
              completionTimestamp: new Date().toISOString(),
            });
            toast.success("Resolution submitted for admin verification");
            setSummary("");
            setFiles([]);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to submit resolution");
          } finally {
            setSubmitting(false);
          }
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="space-y-1.5">
            <Label htmlFor="cid">Complaint ID</Label>
            <select
              id="cid"
              value={complaintId}
              onChange={(event) => setComplaintId(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              {queue.map((item) => (
                <option key={item.id} value={item.complaintId}>
                  {item.complaintId} · {item.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="summary">Resolution summary</Label>
            <Textarea
              id="summary"
              required
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={4}
              placeholder="Explain the action taken, parts replaced, citizen acknowledgement…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-secondary/40 p-8 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
              <ImageIcon className="h-6 w-6" /> Completion photo
              <input type="file" multiple accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-secondary/40 p-8 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
              <UploadCloud className="h-6 w-6" /> Repair report (PDF)
              <input type="file" accept="application/pdf" className="hidden" onChange={onFileChange} />
            </label>
          </div>
          <div className="text-xs text-muted-foreground">{files.length} file(s) attached</div>
          <Button
            type="submit"
            disabled={submitting}
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
