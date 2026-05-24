// SLA (Service Level Agreement) Configuration for Civic Bridge Flow

/**
 * SLA deadlines in HOURS based on priority and category
 * These define the maximum response time for complaints
 */
export const SLA_DEADLINES = {
  // By Priority
  priority: {
    Critical: 2,
    High: 8,
    Medium: 24,
    Low: 72,
  },

  // By Category - overrides priority if more urgent
  category: {
    "Emergency": 1,
    "Corruption": 8,
    "Water Supply": 12,
    "Road Damage": 24,
    "Garbage Collection": 48,
    "Electricity": 16,
    "Drainage": 20,
    "Traffic": 24,
    "Street Light": 24,
    "Public Health": 12,
  },
} as const;

/**
 * Escalation thresholds
 * - WARNING: Notify admin when X% of SLA time remains
 * - CRITICAL: Auto-escalate when SLA deadline is breached
 */
export const SLA_THRESHOLDS = {
  WARNING_PERCENT: 75, // Warn when 75% of time has passed
  CRITICAL_PERCENT: 100, // Escalate when 100% (deadline) has passed
} as const;

/**
 * Auto-escalation configuration
 * Escalation chain: Officer → Senior Officer → Admin
 */
export const ESCALATION_CHAIN = [
  { level: "officer", maxTime: 8 }, // Officer has 8 hours
  { level: "senior_officer", maxTime: 6 }, // Senior has 6 hours
  { level: "admin", maxTime: 4 }, // Admin has 4 hours (final)
] as const;

/**
 * Calculate SLA deadline based on priority and category
 */
export function calculateSLADeadline(priority: string, category: string): Date {
  let deadlineHours: number = SLA_DEADLINES.priority[priority as keyof typeof SLA_DEADLINES.priority] || 24;

  const categoryDeadline = SLA_DEADLINES.category[category as keyof typeof SLA_DEADLINES.category];
  if (categoryDeadline && categoryDeadline < deadlineHours) {
    deadlineHours = categoryDeadline;
  }

  const deadline = new Date();
  deadline.setHours(deadline.getHours() + deadlineHours);
  return deadline;
}

/**
 * Calculate SLA risk score (0-1)
 * 0 = no risk
 * 1 = deadline breached
 */
export function calculateSLARiskScore(deadline: Date | null): number {
  if (!deadline) return 0;

  const now = new Date();
  if (deadline <= now) {
    return 1; // Breached
  }

  const totalTime = deadline.getTime();
  const remainingTime = deadline.getTime() - now.getTime();
  const riskScore = 1 - remainingTime / totalTime;

  return Math.max(0, Math.min(1, riskScore));
}

/**
 * Check if complaint breaches SLA
 */
export function isSLABreached(deadline: Date | null): boolean {
  if (!deadline) return false;
  return new Date() > deadline;
}

/**
 * Get SLA warning level
 */
export function getSLAWarningLevel(deadline: Date | null): "none" | "warning" | "critical" {
  if (!deadline) return "none";

  const riskScore = calculateSLARiskScore(deadline);

  if (riskScore >= 1) {
    return "critical";
  }

  if (riskScore >= SLA_THRESHOLDS.WARNING_PERCENT / 100) {
    return "warning";
  }

  return "none";
}

/**
 * Format remaining time in SLA
 */
export function formatSLATimeRemaining(deadline: Date | null): string {
  if (!deadline) return "No deadline";

  const now = new Date();
  const remaining = deadline.getTime() - now.getTime();

  if (remaining <= 0) {
    return "OVERDUE";
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}
