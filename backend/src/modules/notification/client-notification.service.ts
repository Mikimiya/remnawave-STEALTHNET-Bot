/**
 * Client in-app notification service.
 * Creates / fetches / marks-read notifications shown in the cabinet notification center.
 */

import { prisma } from "../../db.js";

export type NotificationType =
  | "payment_success"
  | "trial_activated"
  | "subscription_expiring"
  | "subscription_expired"
  | "broadcast"
  | "promo_activated"
  | "balance_topup"
  | "system";

export interface CreateNotificationOpts {
  clientId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

/** Create an in-app notification for a client */
export async function createClientNotification(opts: CreateNotificationOpts) {
  return prisma.clientNotification.create({
    data: {
      clientId: opts.clientId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
    },
  });
}

/** Create notifications for multiple clients at once (e.g. broadcast) */
export async function createBulkNotifications(
  clientIds: string[],
  type: NotificationType,
  title: string,
  body: string,
) {
  if (clientIds.length === 0) return;
  await prisma.clientNotification.createMany({
    data: clientIds.map((clientId) => ({
      clientId,
      type,
      title,
      body,
    })),
  });
}

/** Get paginated notifications for a client (newest first) */
export async function getClientNotifications(
  clientId: string,
  opts: { cursor?: string; limit?: number } = {},
) {
  const limit = Math.min(opts.limit ?? 30, 100);

  const where: { clientId: string; id?: { lt: string } } = { clientId };
  if (opts.cursor) {
    where.id = { lt: opts.cursor };
  }

  const items = await prisma.clientNotification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return { items, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null };
}

/** Unread count for a client */
export async function getUnreadCount(clientId: string): Promise<number> {
  return prisma.clientNotification.count({
    where: { clientId, isRead: false },
  });
}

/** Mark specific notifications as read */
export async function markNotificationsRead(clientId: string, ids: string[]) {
  return prisma.clientNotification.updateMany({
    where: { clientId, id: { in: ids } },
    data: { isRead: true },
  });
}

/** Mark ALL notifications as read for a client */
export async function markAllNotificationsRead(clientId: string) {
  return prisma.clientNotification.updateMany({
    where: { clientId, isRead: false },
    data: { isRead: true },
  });
}
