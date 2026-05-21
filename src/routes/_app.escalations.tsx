import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  AlertTriangle,
  ChevronRight,
  Clock3,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Triangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { statusTone, priorityTone, type ComplaintStatus } from "@/lib/complaint-status";
import {
  fetchComplaintSummary,
  listComplaints,
  type ComplaintListResult,
  type ComplaintRecord,
  type ComplaintSummary,
} from "@/lib/smartgov-api";

const priorityLevels = ["All", "Low", "Medium", "High", "Critical"] as const;
const escalationLevels = ["All", "Level 1", "Level 2", "Level 3", "Level 4"] as const;

function formatDelay(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const diffMs = Date.now() - created;
  const hours = Math.floor(diffMs / 1000 / 60 / 60);
  const days = Math.floor(hours / 24);

  if (days >= 2) return `${days}d ${hours % 24}h`;
  if (hours >= 1) return `${hours}h ${Math.floor((diffMs / 1000 / 60) % 60)}m`;
  return "<1h";
}

function escalationLevelLabel(level?: number | null) {
  switch (level) {
    case 2:
      return "Level 2";
    case 3:
      return "Level 3";
    case 4:
      return "Level 4";
    default:
      return "Level 1";
  }
}

function EscalationStatusBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${priorityTone(priority)}`}>
      {priority}
    </span>
  );
}

function isMatchFilter(value: string, filter: string) {
  return filter === "All" || value?.toLowerCase().includes(filter.toLowerCase());
}

function EscalationEmptyState() {
  return (
    <div className="rounded-3xl border border-success/30 bg-success/10 p-12 text-center shadow-card">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold">🎉 No escalated complaints right now.</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        All citizen grievances are being handled within SLA timelines. Your escalation control center is stable.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link to="/admin/dashboard">View operations dashboard</Link>
        </Button>
        <Button variant="outline">Refresh status</Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/escalations")({
  head: () => ({ meta: [{ title: "Escalation Management Center" }] }),
  component: EscalationManagementCenter,
});

function EscalationManagementCenter() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterOfficer, setFilterOfficer] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([listComplaints({ view: "all", status: "Escalated" }), fetchComplaintSummary()])
      .then(([result, summaryResult]) => {
        if (!active) return;
        setComplaints(result.complaints);
        setSummary(summaryResult);
      })
      .catch(() => {
        if (!active) return;
        setComplaints([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const districts = useMemo(() => ["All", ...Array.from(new Set(complaints.map((item) => item.district).filter(Boolean)))], [complaints]);
  const departments = useMemo(() => ["All", ...Array.from(new Set(complaints.map((item) => item.department).filter(Boolean)))], [complaints]);
  const officers = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          complaints
            .map((item) => item.assignedOfficerName ?? item.assignedOfficer?.fullName ?? "")
            .filter(Boolean),
        ),
      ),
    ],
    [complaints],
  );

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const searchString = `${complaint.grievanceId} ${complaint.title} ${complaint.category} ${complaint.city} ${complaint.district} ${complaint.reporterName}`.toLowerCase();
      const queryMatch = !search || searchString.includes(search.toLowerCase());
      const districtMatch = filterDistrict === "All" || complaint.district === filterDistrict;
      const departmentMatch = filterDepartment === "All" || complaint.department === filterDepartment;
      const priorityMatch = filterPriority === "All" || complaint.priority === filterPriority;
      const officerMatch = filterOfficer === "All" || complaint.assignedOfficerName === filterOfficer || complaint.assignedOfficer?.fullName === filterOfficer;
      const levelMatch = filterLevel === "All" || escalationLevelLabel(complaint.escalationLevel) === filterLevel;
      return queryMatch && districtMatch && departmentMatch && priorityMatch && officerMatch && levelMatch;
    });
  }, [complaints, search, filterDistrict, filterDepartment, filterPriority, filterOfficer, filterLevel]);

  const criticalCount = filteredComplaints.filter((complaint) => complaint.priority === "Critical").length;

  const activeEscalations = summary?.escalated ?? filteredComplaints.length;
  const pendingEscalationCount = filteredComplaints.length;
  const resolvedEscalations = summary?.resolved ?? 0;

  const openComplaint = (complaint: ComplaintRecord) => {
    setSelectedComplaint(complaint);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-card">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Escalation Management Center</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Monitor high-priority unresolved citizen grievances.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                See escalated complaints, intervene on service breakdowns, and keep operations within SLA.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Badge variant="destructive" className="inline-flex items-center gap-2">
                <Triangle className="h-4 w-4" /> Live escalation feed
              </Badge>
              <Badge variant="secondary" className="inline-flex items-center gap-2">
                <Bell className="h-4 w-4" /> SLA breach detection active
              </Badge>
            </div>
          </div>
        </div>

        <div className={`rounded-3xl border ${criticalCount > 0 ? "border-destructive/20 bg-destructive/5" : "border-success/20 bg-success/5"} p-6 shadow-card transition-all`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <AlertTriangle className="h-4 w-4" /> Priority alert
              </div>
              {criticalCount > 0 ? (
                <p className="text-xl font-semibold text-destructive sm:text-2xl">
                  {criticalCount} critical complaints require immediate action.
                </p>
              ) : (
                <p className="text-xl font-semibold text-success sm:text-2xl">
                  No critical escalations in the last hour.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-destructive text-destructive-foreground px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                Live
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">Updated just now</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="border-border/70 bg-white/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Total Escalations</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{activeEscalations}</CardDescription>
          </CardHeader>
          <CardFooter>
            <span className="text-sm text-muted-foreground">Across all districts</span>
          </CardFooter>
        </Card>
        <Card className="border-border/70 bg-white/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Pending Escalations</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{pendingEscalationCount}</CardDescription>
          </CardHeader>
          <CardFooter>
            <span className="text-sm text-muted-foreground">Needs frontline intervention</span>
          </CardFooter>
        </Card>
        <Card className="border-border/70 bg-white/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Critical Cases</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{criticalCount}</CardDescription>
          </CardHeader>
          <CardFooter>
            <span className="text-sm text-muted-foreground">High and critical priority</span>
          </CardFooter>
        </Card>
        <Card className="border-border/70 bg-white/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Resolved Escalations</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{resolvedEscalations}</CardDescription>
          </CardHeader>
          <CardFooter>
            <span className="text-sm text-muted-foreground">Closed or resolved cases</span>
          </CardFooter>
        </Card>
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-card">
        <div className="sticky top-0 z-10 border-b border-border/70 bg-card/95 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">Escalation workflows</h2>
              <p className="text-sm text-muted-foreground">
                Search, filter, and surface the most urgent escalated grievances in your queue.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by complaint, citizen, location…"
                className="max-w-xs"
              />
              <Select onValueChange={(value) => setFilterDistrict(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="District" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => setFilterDepartment(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => setFilterPriority(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityLevels.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select onValueChange={(value) => setFilterOfficer(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Officer" />
              </SelectTrigger>
              <SelectContent>
                {officers.map((officer) => (
                  <SelectItem key={officer} value={officer}>
                    {officer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setFilterLevel(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Escalation Level" />
              </SelectTrigger>
              <SelectContent>
                {escalationLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setFilterDistrict("All");
              setFilterDepartment("All");
              setFilterPriority("All");
              setFilterOfficer("All");
              setFilterLevel("All");
              setSearch("");
            }}>
              Reset filters
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Complaint ID</th>
                <th className="px-4 py-3 text-left font-medium">Citizen</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Area</th>
                <th className="px-4 py-3 text-left font-medium">Assigned Officer</th>
                <th className="px-4 py-3 text-left font-medium">Escalation Level</th>
                <th className="px-4 py-3 text-left font-medium">Delay Time</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Loading escalations…
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16">
                    <EscalationEmptyState />
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => (
                  <tr key={complaint.grievanceId} className="hover:bg-secondary/40">
                    <td className="px-4 py-4 font-mono text-xs text-foreground">{complaint.grievanceId}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium">{complaint.reporterName}</div>
                      <div className="text-xs text-muted-foreground">{complaint.reporterMobile || complaint.reporterEmail}</div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{complaint.category}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {complaint.city}, {complaint.district}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {complaint.assignedOfficerName || complaint.assignedOfficer?.fullName || "Unassigned"}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{escalationLevelLabel(complaint.escalationLevel)}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{formatDelay(complaint.createdAt)}</td>
                    <td className="px-4 py-4">
                      <EscalationStatusBadge priority={complaint.priority} />
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusTone(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openComplaint(complaint)}>
                          View
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openComplaint(complaint)}>
                          Chat
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={(open) => { if (!open) setSelectedComplaint(null); setDrawerOpen(open); }}>
        <SheetContent side="right" className="max-w-xl">
          <SheetHeader>
            <SheetTitle>Escalation details</SheetTitle>
            <SheetDescription>
              Review case context, timeline, evidence, and escalation signals for the selected complaint.
            </SheetDescription>
          </SheetHeader>

          {selectedComplaint ? (
            <div className="space-y-6 py-4">
              <Card className="border-border/80 bg-secondary/5">
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Complaint</p>
                      <p className="mt-2 text-lg font-semibold">{selectedComplaint.title}</p>
                    </div>
                    <Badge variant="destructive">{selectedComplaint.priority}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-card p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Escalation</p>
                      <p className="mt-2 text-sm font-semibold">{escalationLevelLabel(selectedComplaint.escalationLevel)}</p>
                      <p className="text-xs text-muted-foreground">{selectedComplaint.escalationReason || "Citizen requested escalation due to delay."}</p>
                    </div>
                    <div className="rounded-2xl bg-card p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Delay</p>
                      <p className="mt-2 text-sm font-semibold">{formatDelay(selectedComplaint.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">Filed {new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Citizen Details</CardTitle>
                    <CardDescription>Registered reporter and location context.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-foreground">
                      <p className="font-semibold">{selectedComplaint.reporterName}</p>
                      <p className="text-muted-foreground">{selectedComplaint.reporterEmail || "No email provided"}</p>
                      <p className="text-muted-foreground">{selectedComplaint.reporterMobile || "No mobile provided"}</p>
                    </div>
                    <div className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
                      <p>{selectedComplaint.address}, {selectedComplaint.city}, {selectedComplaint.district}</p>
                      <p>{selectedComplaint.state} • {selectedComplaint.pincode}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Officer History</CardTitle>
                    <CardDescription>Assignment and escalation review.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{selectedComplaint.assignedOfficerName || selectedComplaint.assignedOfficer?.fullName || "Unassigned"}</p>
                    <p>{selectedComplaint.assignedDepartment || selectedComplaint.department}</p>
                    <p>{selectedComplaint.assignedArea || selectedComplaint.city}</p>
                    <div className="rounded-2xl bg-muted p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Assigned</p>
                      <p>{selectedComplaint.assignedOfficerName ? "In review" : "Pending assignment"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Complaint Timeline</CardTitle>
                  <CardDescription>Live escalation sequence and audit trail.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {selectedComplaint.timeline.slice(0, 6).map((entry, index) => (
                      <div key={`${entry.date}-${index}`} className="flex gap-3">
                        <div className="min-w-[2rem] text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</div>
                        <div className="flex-1 rounded-2xl border border-border p-3 bg-card">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold">{entry.action}</p>
                            <span className="text-xs text-muted-foreground">{entry.by}</span>
                          </div>
                          {entry.note ? <p className="mt-2 text-sm text-muted-foreground">{entry.note}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Evidence</CardTitle>
                    <CardDescription>Submitted files and documentation.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {selectedComplaint.evidence.length > 0 ? (
                      selectedComplaint.evidence.slice(0, 3).map((item) => (
                        <div key={item.name} className="rounded-2xl border border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{item.name}</p>
                            <span className="text-xs uppercase tracking-[0.2em]">{item.type}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{Math.round(item.size / 1024)} KB</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No evidence uploaded yet.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Live Support</CardTitle>
                    <CardDescription>Start a direct citizen/officer intervention.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Open the chat and attach escalation notes for the officer and admin team.
                    </p>
                    <Button variant="secondary" className="w-full">
                      <MessageSquare className="mr-2 h-4 w-4" /> Open case chat
                    </Button>
                    <Button variant="outline" className="w-full">
                      <ShieldAlert className="mr-2 h-4 w-4" /> Warn officer
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Select a complaint to inspect escalation details.</div>
          )}

          <SheetFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setDrawerOpen(false)}>Acknowledge</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
