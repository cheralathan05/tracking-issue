import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crosshair,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/lib/complaint-categories";
import { createComplaint, type ComplaintEvidence, type ComplaintPriority } from "@/lib/smartgov-api";

export const Route = createFileRoute("/_app/complaints/new")({
  head: () => ({ meta: [{ title: "Raise a Grievance — Civic Bridge Flow" }] }),
  component: NewComplaint,
});

const steps = ["Details", "Location", "Description", "Evidence", "Review"];
const MAX_DESC = 1000;

type DraftEvidence = File;

const categoryToDepartment: Record<string, string> = {
  water: "Water Supply",
  electricity: "Electricity",
  roads: "Roads",
  sanitation: "Sanitation",
  corruption: "Corruption",
  safety: "Public Safety",
  health: "Health",
  others: "Others",
};

function fileToEvidence(file: File): Promise<ComplaintEvidence> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: String(reader.result ?? ""),
      });
    };
    reader.readAsDataURL(file);
  });
}

function NewComplaint() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<DraftEvidence[]>([]);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    reporterName: "",
    reporterEmail: "",
    title: "",
    category: "water",
    priority: "Medium" as ComplaintPriority,
    contact: "",
    state: "Haryana",
    district: "Gurugram",
    city: "",
    pincode: "",
    address: "",
    landmark: "",
    description: "",
    occurredAt: "",
    publicVisibility: true,
  });
  const set = <K extends keyof typeof data>(k: K, v: (typeof data)[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => {
      const { [k]: _, ...rest } = e;
      return rest;
    });
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-10 text-center shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">Complaint submitted</h2>
        <p className="mt-1 text-muted-foreground">
          Your grievance has been registered and routed to the right department.
        </p>
        <div className="mt-5 rounded-lg border border-dashed border-border bg-secondary/40 p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Grievance ID
          </div>
          <div className="mt-1 font-mono text-lg font-semibold">{submitted}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            SMS + email confirmation sent to your registered contact.
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link to="/complaints">View all</Link>
          </Button>
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/complaints/$id" params={{ id: submitted }}>
              Track now
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!data.reporterName.trim()) e.reporterName = "Please enter your full name";
      if (!data.reporterEmail.trim()) e.reporterEmail = "Please enter an email address";
      if (!data.title.trim()) e.title = "Please enter a short title";
      else if (data.title.trim().length < 6) e.title = "Title must be at least 6 characters";
      if (!data.contact.trim()) e.contact = "Contact number is required";
      else if (!/^[+0-9 -]{7,15}$/.test(data.contact)) e.contact = "Enter a valid phone number";
    }
    if (s === 1) {
      if (!data.city.trim()) e.city = "City / ward is required";
      if (!/^\d{6}$/.test(data.pincode)) e.pincode = "6-digit pincode required";
      if (!data.address.trim()) e.address = "Street / landmark is required";
    }
    if (s === 2) {
      if (data.description.trim().length < 20)
        e.description = "Description should be at least 20 characters";
      if (data.description.length > MAX_DESC) e.description = `Maximum ${MAX_DESC} characters`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(steps.length - 1, s + 1));
    else toast.error("Please fix the highlighted fields");
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    for (let i = 0; i <= 2; i += 1) {
      if (!validateStep(i)) {
        setStep(i);
        toast.error("Fix errors before submitting");
        return;
      }
    }

    setLoading(true);

    try {
      const evidence = await Promise.all(files.slice(0, 6).map(fileToEvidence));
      const result = await createComplaint({
        reporterName: data.reporterName.trim(),
        reporterEmail: data.reporterEmail.trim(),
        reporterMobile: data.contact.trim(),
        title: data.title.trim(),
        category: categories.find((category) => category.id === data.category)?.label ?? "Others",
        description: data.description.trim(),
        state: data.state.trim(),
        district: data.district.trim(),
        city: data.city.trim(),
        address: data.address.trim(),
        landmark: data.landmark.trim(),
        pincode: data.pincode.trim(),
        priority: data.priority,
        publicVisibility: data.publicVisibility,
        latitude: gps?.lat ?? null,
        longitude: gps?.lng ?? null,
        evidence,
      });

      const complaint = result.complaint;
      toast.success(`Grievance ${complaint.grievanceId} registered`);
      setSubmitted(complaint.grievanceId);
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Unable to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  const captureGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    toast("Fetching location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGps({ lat: p.coords.latitude, lng: p.coords.longitude });
        toast.success("Location captured");
      },
      () => {
        setGps({ lat: 28.4595, lng: 77.0266 });
        toast.success("Location captured (approx.)");
      },
      { timeout: 4000 },
    );
  };

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming: DraftEvidence[] = Array.from(list);
    const tooBig = incoming.find((f) => f.size > 25 * 1024 * 1024);
    if (tooBig) {
      toast.error(`${tooBig.name} exceeds 25 MB`);
      return;
    }
    setFiles((prev) => [...prev, ...incoming].slice(0, 6));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => navigate({ to: "/dashboard" })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Raise a Grievance</h1>
        <p className="text-sm text-muted-foreground">
          Provide accurate details so we can route and resolve faster.
        </p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2 overflow-x-auto">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 min-w-[110px] items-center gap-2">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition ${
                i < step
                  ? "bg-success text-success-foreground"
                  : i === step
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={`text-xs font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <span className="hidden flex-1 border-t border-dashed border-border md:block" />
            )}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="reporterName">Full name</Label>
                <Input
                  id="reporterName"
                  value={data.reporterName}
                  onChange={(e) => set("reporterName", e.target.value)}
                  placeholder="Arun Kumar"
                  aria-invalid={!!errors.reporterName}
                />
                {errors.reporterName && <FieldError msg={errors.reporterName} />}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reporterEmail">Email address</Label>
                <Input
                  id="reporterEmail"
                  type="email"
                  value={data.reporterEmail}
                  onChange={(e) => set("reporterEmail", e.target.value)}
                  placeholder="arun@example.com"
                  aria-invalid={!!errors.reporterEmail}
                />
                {errors.reporterEmail && <FieldError msg={errors.reporterEmail} />}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Complaint title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Streetlight outage on main road"
                aria-invalid={!!errors.title}
              />
              {errors.title && <FieldError msg={errors.title} />}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact number</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contact"
                  className="pl-9"
                  value={data.contact}
                  onChange={(e) => set("contact", e.target.value)}
                  placeholder="+91 90000 00000"
                />
              </div>
              {errors.contact && <FieldError msg={errors.contact} />}
            </div>
            <div>
              <Label className="mb-2 block">Category</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set("category", c.id)}
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                      data.category === c.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Priority</Label>
              <div className="flex flex-wrap gap-2">
                {["Low", "Medium", "High", "Critical"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("priority", p)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${data.priority === p ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input value={data.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Input value={data.district} onChange={(e) => set("district", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>City / Ward</Label>
              <Input value={data.city} onChange={(e) => set("city", e.target.value)} />
              {errors.city && <FieldError msg={errors.city} />}
            </div>
            <div className="space-y-1.5">
              <Label>Pincode</Label>
              <Input
                maxLength={6}
                inputMode="numeric"
                value={data.pincode}
                onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
              />
              {errors.pincode && <FieldError msg={errors.pincode} />}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Street / Landmark</Label>
              <Input
                value={data.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Detailed address"
              />
              {errors.address && <FieldError msg={errors.address} />}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Landmark</Label>
              <Input
                value={data.landmark}
                onChange={(e) => set("landmark", e.target.value)}
                placeholder="Bus stand, school, market, etc."
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {gps ? (
                  <span className="font-mono text-foreground">
                    GPS · {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
                  </span>
                ) : (
                  <span>Pin your exact location for faster dispatch.</span>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={captureGps}>
                <Crosshair className="mr-1.5 h-4 w-4" /> {gps ? "Refresh" : "Use my GPS"}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Detailed description</Label>
                <span
                  className={`text-xs ${data.description.length > MAX_DESC ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {data.description.length}/{MAX_DESC}
                </span>
              </div>
              <Textarea
                rows={6}
                maxLength={MAX_DESC + 50}
                value={data.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the issue, when it started, how it impacts you and any context that helps the officer."
              />
              {errors.description && <FieldError msg={errors.description} />}
            </div>
            <div className="space-y-1.5">
              <Label>Date of occurrence</Label>
              <Input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={data.occurredAt}
                onChange={(e) => set("occurredAt", e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.publicVisibility}
                onChange={(e) => set("publicVisibility", e.target.checked)}
              />
              Make this visible on the public transparency portal
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Label>Upload evidence</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/30 p-10 text-center transition hover:border-primary hover:bg-primary/5">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div className="font-medium">Click or drag files here</div>
              <div className="text-xs text-muted-foreground">
                Images, videos, PDFs or audio · up to 25 MB · max 6 files
              </div>
              <input
                type="file"
                multiple
                accept="image/*,video/*,application/pdf,audio/*"
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {f.type.startsWith("image") ? (
                        <ImageIcon className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                      <span className="truncate">{f.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {(f.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFiles((p) => p.filter((_, x) => x !== i))}
                      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Review your complaint</h3>
            <dl className="grid gap-3 rounded-lg border border-border bg-secondary/30 p-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Citizen</dt>
                <dd className="font-medium">{data.reporterName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Title</dt>
                <dd className="font-medium">{data.title || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Category</dt>
                <dd className="font-medium capitalize">{data.category}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Priority</dt>
                <dd className="font-medium">{data.priority}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Contact</dt>
                <dd className="font-medium">{data.contact || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Location</dt>
                <dd className="font-medium">
                  {[data.address, data.city, data.district, data.state, data.pincode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                  {gps && (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      ({gps.lat.toFixed(4)}, {gps.lng.toFixed(4)})
                    </span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Description</dt>
                <dd className="font-medium whitespace-pre-line">{data.description || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Evidence</dt>
                <dd className="font-medium">
                  {files.length ? `${files.length} file(s) attached` : "None"}
                </dd>
              </div>
            </dl>
            <div className="rounded-lg border border-info/30 bg-info/10 p-3 text-xs text-info">
              By submitting, you confirm the information is accurate. False complaints may attract
              penalties under the Public Grievance Act.
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between">
          <Button variant="ghost" onClick={prev} disabled={step === 0}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={next}
              className="bg-gradient-primary text-primary-foreground shadow-elegant"
            >
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              className="bg-gradient-primary text-primary-foreground shadow-elegant"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit complaint
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3" /> {msg}
    </p>
  );
}
