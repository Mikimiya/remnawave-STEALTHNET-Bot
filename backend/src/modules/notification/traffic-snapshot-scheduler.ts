/**
 * Daily traffic snapshot scheduler.
 * Runs once every 24 hours to record traffic usage for all clients.
 */

import { runDailyTrafficSnapshot } from "./traffic-log.service.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function startTrafficSnapshotScheduler(): void {
  if (intervalId) return;
  console.log("[TrafficSnapshot] Scheduler started (every 24h)");

  // Run once shortly after startup (2 min delay to let everything init)
  setTimeout(() => {
    runDailyTrafficSnapshot().catch((e) => console.error("[TrafficSnapshot] Error:", e));
  }, 2 * 60 * 1000);

  intervalId = setInterval(() => {
    runDailyTrafficSnapshot().catch((e) => console.error("[TrafficSnapshot] Error:", e));
  }, INTERVAL_MS);
}

export function stopTrafficSnapshotScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[TrafficSnapshot] Scheduler stopped");
  }
}
