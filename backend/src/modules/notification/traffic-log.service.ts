/**
 * Traffic log service: records daily traffic snapshots and queries them for charts.
 */

import { prisma } from "../../db.js";
import { remnaGetUser } from "../remna/remna.client.js";

/**
 * Record a daily traffic snapshot for a VPN user.
 * Called by the daily cron job.
 */
export async function snapshotVpnTraffic(clientId: string, remnawaveUuid: string): Promise<void> {
  const result = await remnaGetUser(remnawaveUuid);
  if (result.error || !result.data) return;

  const user = result.data as Record<string, unknown>;
  const userTraffic = user.userTraffic && typeof user.userTraffic === "object"
    ? (user.userTraffic as Record<string, unknown>)
    : null;

  const usedBytes = typeof userTraffic?.usedTrafficBytes === "number"
    ? BigInt(Math.round(userTraffic.usedTrafficBytes as number))
    : typeof user.usedTrafficBytes === "number"
      ? BigInt(Math.round(user.usedTrafficBytes as number))
      : BigInt(0);

  const uploadBytes = typeof userTraffic?.uploadTrafficBytes === "number"
    ? BigInt(Math.round(userTraffic.uploadTrafficBytes as number))
    : BigInt(0);

  const downloadBytes = typeof userTraffic?.downloadTrafficBytes === "number"
    ? BigInt(Math.round(userTraffic.downloadTrafficBytes as number))
    : BigInt(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.trafficLog.upsert({
    where: {
      clientId_date_source: {
        clientId,
        date: today,
        source: "vpn",
      },
    },
    create: {
      clientId,
      date: today,
      usedBytes,
      uploadBytes,
      downloadBytes,
      source: "vpn",
    },
    update: {
      usedBytes,
      uploadBytes,
      downloadBytes,
    },
  });
}

/**
 * Snapshot proxy traffic for a client (from ProxySlot trafficUsedBytes).
 */
export async function snapshotProxyTraffic(clientId: string): Promise<void> {
  const slots = await prisma.proxySlot.findMany({
    where: { clientId, status: "ACTIVE" },
    select: { trafficUsedBytes: true },
  });
  if (slots.length === 0) return;

  const totalUsed = slots.reduce((sum, s) => sum + s.trafficUsedBytes, BigInt(0));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.trafficLog.upsert({
    where: {
      clientId_date_source: {
        clientId,
        date: today,
        source: "proxy",
      },
    },
    create: { clientId, date: today, usedBytes: totalUsed, uploadBytes: BigInt(0), downloadBytes: BigInt(0), source: "proxy" },
    update: { usedBytes: totalUsed },
  });
}

/**
 * Snapshot singbox traffic for a client.
 */
export async function snapshotSingboxTraffic(clientId: string): Promise<void> {
  const slots = await prisma.singboxSlot.findMany({
    where: { clientId, status: "ACTIVE" },
    select: { trafficUsedBytes: true },
  });
  if (slots.length === 0) return;

  const totalUsed = slots.reduce((sum, s) => sum + s.trafficUsedBytes, BigInt(0));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.trafficLog.upsert({
    where: {
      clientId_date_source: {
        clientId,
        date: today,
        source: "singbox",
      },
    },
    create: { clientId, date: today, usedBytes: totalUsed, uploadBytes: BigInt(0), downloadBytes: BigInt(0), source: "singbox" },
    update: { usedBytes: totalUsed },
  });
}

/**
 * Run a full traffic snapshot for ALL active clients (daily cron).
 */
export async function runDailyTrafficSnapshot(): Promise<{ snapshotted: number; errors: number }> {
  const clients = await prisma.client.findMany({
    where: { isBlocked: false },
    select: {
      id: true,
      remnawaveUuid: true,
      proxySlots: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
      singboxSlots: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
    },
  });

  let snapshotted = 0;
  let errors = 0;

  for (const client of clients) {
    try {
      if (client.remnawaveUuid) {
        await snapshotVpnTraffic(client.id, client.remnawaveUuid);
      }
      if (client.proxySlots.length > 0) {
        await snapshotProxyTraffic(client.id);
      }
      if (client.singboxSlots.length > 0) {
        await snapshotSingboxTraffic(client.id);
      }
      snapshotted++;
    } catch (e) {
      errors++;
      console.error(`[TrafficLog] Error snapshotting client ${client.id}:`, e);
    }
  }

  console.log(`[TrafficLog] Daily snapshot: ${snapshotted} clients, ${errors} errors`);
  return { snapshotted, errors };
}

/**
 * Get traffic logs for a client within a date range.
 */
export async function getTrafficLogs(
  clientId: string,
  opts: { days?: number; source?: string } = {},
): Promise<Array<{
  date: string;
  usedBytes: string;
  uploadBytes: string;
  downloadBytes: string;
  source: string;
}>> {
  const days = Math.min(opts.days ?? 30, 365);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const where: Record<string, unknown> = {
    clientId,
    date: { gte: since },
  };
  if (opts.source) where.source = opts.source;

  const logs = await prisma.trafficLog.findMany({
    where: where as any,
    orderBy: { date: "asc" },
  });

  return logs.map((l) => ({
    date: l.date.toISOString().split("T")[0],
    usedBytes: l.usedBytes.toString(),
    uploadBytes: l.uploadBytes.toString(),
    downloadBytes: l.downloadBytes.toString(),
    source: l.source,
  }));
}
