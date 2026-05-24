/**
 * Simple scheduler for SLA checks and automated tasks
 * Uses setInterval instead of external cron library
 */
import { checkAndAutoEscalateSLABreaches } from "./services/sla.service.js";

let scheduledTasks: NodeJS.Timeout[] = [];

/**
 * Start all scheduled tasks
 * Call this after prisma is initialized
 */
export async function startScheduledTasks() {
  console.log("Starting scheduled tasks...");

  // Check SLA breaches every 5 minutes
  const slaCheckInterval = setInterval(
    async () => {
      try {
        await checkAndAutoEscalateSLABreaches();
      } catch (error) {
        console.error("Error in SLA check scheduled task:", error);
      }
    },
    5 * 60 * 1000, // 5 minutes
  );
  scheduledTasks.push(slaCheckInterval);
  console.log("✓ SLA breach checker scheduled (every 5 minutes)");

  // You can add more scheduled tasks here as needed
  // Example:
  // - Clean up old notifications (every 1 hour)
  // - Generate daily reports (at specific time)
  // - Archive resolved complaints (every 24 hours)
}

/**
 * Stop all scheduled tasks
 * Call this during graceful shutdown
 */
export function stopScheduledTasks() {
  console.log("Stopping scheduled tasks...");
  scheduledTasks.forEach((task) => clearInterval(task));
  scheduledTasks = [];
  console.log("✓ All scheduled tasks stopped");
}
