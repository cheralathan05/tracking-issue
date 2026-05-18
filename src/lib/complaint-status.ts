export type ComplaintStatus =
  | "Submitted"
  | "Under Review"
  | "Assigned"
  | "In Progress"
  | "Awaiting Information"
  | "Resolved"
  | "Escalated"
  | "Rejected"
  | "Closed";

export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";

export function statusTone(status: string) {
  switch (status) {
    case "Resolved":
    case "Closed":
      return "bg-success/15 text-success border-success/30";
    case "Escalated":
    case "Rejected":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "In Progress":
    case "Assigned":
      return "bg-info/15 text-info border-info/30";
    case "Awaiting Information":
      return "bg-warning/20 text-warning-foreground border-warning/40";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function priorityTone(priority: string) {
  switch (priority) {
    case "Critical":
      return "bg-destructive text-destructive-foreground";
    case "High":
      return "bg-warning text-warning-foreground";
    case "Medium":
      return "bg-info text-info-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}
