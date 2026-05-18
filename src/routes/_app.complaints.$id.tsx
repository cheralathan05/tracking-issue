import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { statusTone, priorityTone } from "@/lib/complaint-status";
import { getComplaint, type ComplaintRecord } from "@/lib/smartgov-api";

export const Route = createFileRoute("/_app/complaints/$id")({
  head: () => ({ meta: [{ title: "Complaint Details — Civic Bridge Flow" }] }),
  component: ComplaintDetail,
});

function ComplaintDetail() {
  const { id } = useParams({ from: "/_app/complaints/$id" });
  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    getComplaint(id)
      .then((result) => {
        if (mounted) {
          setComplaint(result.complaint);
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load complaint");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="rounded-xl border border-border bg-card p-10 text-center">Loading complaint...</div>;
  }

  if (error || !complaint) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-8 shadow-card">
        <h1 className="text-2xl font-bold">Complaint not found</h1>
        <p className="text-sm text-muted-foreground">{error ?? "The grievance ID you opened is unavailable."}</p>
        <Button asChild variant="outline">
          <Link to="/complaints">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to complaints
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0 hover:bg-transparent">
        <Link to="/complaints">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to complaints
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Grievance ID
                </div>
                <div className="mt-1 font-mono text-lg font-semibold">{complaint.grievanceId}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(complaint.status)}`}>
                  {complaint.status}
                </span>
                <span className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase ${priorityTone(complaint.priority)}`}>
                  {complaint.priority}
                </span>
              </div>
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">{complaint.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{complaint.description}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoCard icon={MapPin} label="Location" value={`${complaint.city}, ${complaint.district}`} />
              <InfoCard icon={ShieldCheck} label="Department" value={complaint.department} />
              <InfoCard icon={TimerReset} label="Filed on" value={new Date(complaint.createdAt).toLocaleString()} />
              <InfoCard icon={CheckCircle2} label="Assigned officer" value={complaint.assignedOfficerName ?? complaint.suggestedOfficerName ?? "Pending"} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Timeline</h2>
            <div className="mt-4 space-y-4">
              {complaint.timeline.map((entry) => (
                <div key={`${entry.date}-${entry.action}`} className="flex gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{entry.action}</span>
                      <span className="text-xs text-muted-foreground">{entry.by}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{entry.date}</div>
                    {entry.note ? <p className="mt-1 text-sm text-foreground/90">{entry.note}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Citizen details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <DetailRow label="Name" value={complaint.reporterName} />
              <DetailRow label="Email" value={complaint.reporterEmail ?? "—"} />
              <DetailRow label="Mobile" value={complaint.reporterMobile ?? "—"} />
              <DetailRow label="Address" value={`${complaint.address}${complaint.landmark ? `, ${complaint.landmark}` : ""}`} />
              <DetailRow label="Pincode" value={complaint.pincode} />
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Evidence</h2>
            <div className="mt-4 space-y-3">
              {complaint.evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">No evidence uploaded.</p>
              ) : (
                complaint.evidence.map((item) => (
                  <div key={`${item.name}-${item.size}`} className="rounded-xl border border-border bg-secondary/30 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      {item.type.startsWith("image/") ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                      {item.name}
                    </div>
                    {item.type.startsWith("image/") ? (
                      <img src={item.dataUrl} alt={item.name} className="mt-3 max-h-44 w-full rounded-lg object-cover" />
                    ) : (
                      <a href={item.dataUrl} download={item.name} className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
                        Download attachment
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
