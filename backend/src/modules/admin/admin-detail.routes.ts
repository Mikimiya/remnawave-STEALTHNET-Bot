/**
 * Дополнительные админские эндпоинты для углублённого просмотра:
 *  - GET /admin/clients/:id/overview   — агрегированные KPI клиента
 *  - GET /admin/clients/:id/payments   — все его платежи (с фильтром)
 *  - GET /admin/clients/:id/referrals  — рефереры/рефералы/начисления
 *  - GET /admin/clients/:id/services   — proxy/singbox слоты, промо
 *  - GET /admin/payments/:id           — полная карточка одного платежа
 *
 * Никаких изменений схемы. Только чтение существующих таблиц.
 */

import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";

export const adminDetailRouter = Router();

const idParam = z.object({ id: z.string().min(1) });

/** Безопасный парс metadata (JSON-строка) платежа: возвращает разобранный объект или null. */
function parseMetadata(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") return obj as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

/** Определяем тип платежа по содержимому. */
function paymentType(p: {
  tariffId: string | null;
  proxyTariffId: string | null;
  singboxTariffId: string | null;
  metadata: string | null;
}): "vpn" | "proxy" | "singbox" | "extra" | "topup" {
  if (p.tariffId) return "vpn";
  if (p.proxyTariffId) return "proxy";
  if (p.singboxTariffId) return "singbox";
  const meta = parseMetadata(p.metadata);
  if (meta && meta.extraOption && typeof meta.extraOption === "object") return "extra";
  return "topup";
}

/** Сериализация платежа в безопасный JSON (BigInt не используется в payment). */
function serializePayment(p: {
  id: string;
  orderId: string;
  externalId: string | null;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  tariffId: string | null;
  proxyTariffId: string | null;
  singboxTariffId: string | null;
  metadata: string | null;
  createdAt: Date;
  paidAt: Date | null;
  referralDistributedAt: Date | null;
  remnawaveUserId: string | null;
}) {
  const meta = parseMetadata(p.metadata);
  let promoCode: string | null = null;
  let originalAmount: number | null = null;
  let extraOption: unknown = null;
  if (meta) {
    if (typeof meta.promoCode === "string") promoCode = meta.promoCode;
    else if (typeof meta.promoCodeId === "string") promoCode = meta.promoCodeId;
    if (typeof meta.originalAmount === "number") originalAmount = meta.originalAmount;
    else if (typeof meta.originalPrice === "number") originalAmount = meta.originalPrice;
    if (meta.extraOption && typeof meta.extraOption === "object") extraOption = meta.extraOption;
  }
  return {
    id: p.id,
    orderId: p.orderId,
    externalId: p.externalId,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    provider: p.provider,
    type: paymentType(p),
    tariffId: p.tariffId,
    proxyTariffId: p.proxyTariffId,
    singboxTariffId: p.singboxTariffId,
    remnawaveUserId: p.remnawaveUserId,
    promoCode,
    originalAmount,
    discount: originalAmount != null ? Math.max(0, originalAmount - p.amount) : null,
    extraOption,
    metadataRaw: p.metadata,
    createdAt: p.createdAt.toISOString(),
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    referralDistributedAt: p.referralDistributedAt ? p.referralDistributedAt.toISOString() : null,
  };
}

// ───────────────────────────────────────────────────────────────
// GET /admin/clients/:id/overview
// Возвращает: stats (totalPaid/paymentsCount/lastPaymentAt/refEarnings/...),
// referrer (краткая карточка), counts по типам и т.п.
// ───────────────────────────────────────────────────────────────
adminDetailRouter.get("/clients/:id/overview", async (req, res) => {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid client id" });
  const clientId = parsed.data.id;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      email: true,
      telegramId: true,
      telegramUsername: true,
      preferredLang: true,
      preferredCurrency: true,
      balance: true,
      referralCode: true,
      referrerId: true,
      referralPercent: true,
      remnawaveUuid: true,
      isBlocked: true,
      blockReason: true,
      trialUsed: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      createdAt: true,
      _count: { select: { referrals: true, payments: true, tickets: true } },
    },
  });
  if (!client) return res.status(404).json({ message: "Client not found" });

  // Реферер (1 уровень вверх)
  let referrer: { id: string; email: string | null; telegramUsername: string | null; telegramId: string | null } | null = null;
  if (client.referrerId) {
    referrer = await prisma.client.findUnique({
      where: { id: client.referrerId },
      select: { id: true, email: true, telegramUsername: true, telegramId: true },
    });
  }

  // Платёжные агрегации
  const [paidAgg, paidCount, lastPaid, pendingCount,
    refEarningsAgg, refDirectCount, ticketsOpen,
    proxySlotsActive, singboxSlotsActive,
    promoActsCount, promoCodesUsedCount,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { clientId, status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.count({ where: { clientId, status: "PAID" } }),
    prisma.payment.findFirst({
      where: { clientId, status: "PAID" },
      orderBy: { paidAt: "desc" },
      select: { paidAt: true, amount: true, currency: true },
    }),
    prisma.payment.count({ where: { clientId, status: "PENDING" } }),
    prisma.referralCredit.aggregate({ where: { referrerId: clientId }, _sum: { amount: true } }),
    prisma.client.count({ where: { referrerId: clientId } }),
    prisma.ticket.count({ where: { clientId, status: { not: "closed" } } }),
    prisma.proxySlot.count({ where: { clientId, status: "ACTIVE" } }),
    prisma.singboxSlot.count({ where: { clientId, status: "ACTIVE" } }),
    prisma.promoActivation.count({ where: { clientId } }),
    prisma.promoCodeUsage.count({ where: { clientId } }),
  ]);

  return res.json({
    client: {
      id: client.id,
      email: client.email,
      telegramId: client.telegramId,
      telegramUsername: client.telegramUsername,
      preferredLang: client.preferredLang,
      preferredCurrency: client.preferredCurrency,
      balance: client.balance,
      referralCode: client.referralCode,
      referralPercent: client.referralPercent,
      remnawaveUuid: client.remnawaveUuid,
      isBlocked: client.isBlocked,
      blockReason: client.blockReason,
      trialUsed: client.trialUsed,
      utmSource: client.utmSource,
      utmMedium: client.utmMedium,
      utmCampaign: client.utmCampaign,
      createdAt: client.createdAt.toISOString(),
    },
    referrer,
    stats: {
      paymentsTotal: client._count.payments,
      paymentsPaid: paidCount,
      paymentsPending: pendingCount,
      totalPaidAmount: paidAgg._sum.amount ?? 0,
      lastPaymentAt: lastPaid?.paidAt ? lastPaid.paidAt.toISOString() : null,
      lastPaymentAmount: lastPaid?.amount ?? null,
      lastPaymentCurrency: lastPaid?.currency ?? null,
      referralsCount: client._count.referrals,
      referralsDirectCount: refDirectCount,
      referralEarnings: refEarningsAgg._sum.amount ?? 0,
      ticketsTotal: client._count.tickets,
      ticketsOpen,
      proxySlotsActive,
      singboxSlotsActive,
      promoActivations: promoActsCount,
      promoCodesUsed: promoCodesUsedCount,
    },
  });
});

// ───────────────────────────────────────────────────────────────
// GET /admin/clients/:id/payments?status=&type=&provider=&page=&limit=
// ───────────────────────────────────────────────────────────────
adminDetailRouter.get("/clients/:id/payments", async (req, res) => {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid client id" });
  const clientId = parsed.data.id;
  const exists = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!exists) return res.status(404).json({ message: "Client not found" });

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const provider = typeof req.query.provider === "string" ? req.query.provider.trim() : "";
  const type = typeof req.query.type === "string" ? req.query.type.trim() : "";

  const where: Prisma.PaymentWhereInput = { clientId };
  if (status) where.status = status;
  if (provider) where.provider = provider;
  // Тип фильтра по содержимому колонок tariffId/proxyTariffId/singboxTariffId
  if (type === "vpn") where.tariffId = { not: null };
  else if (type === "proxy") where.proxyTariffId = { not: null };
  else if (type === "singbox") where.singboxTariffId = { not: null };
  else if (type === "topup") {
    where.tariffId = null;
    where.proxyTariffId = null;
    where.singboxTariffId = null;
  }

  const [items, total, paidAgg] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tariff: { select: { id: true, name: true } },
        proxyTariff: { select: { id: true, name: true } },
        singboxTariff: { select: { id: true, name: true } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where: { ...where, status: "PAID" }, _sum: { amount: true } }),
  ]);

  return res.json({
    items: items.map((p) => ({
      ...serializePayment(p),
      tariffName: p.tariff?.name ?? p.proxyTariff?.name ?? p.singboxTariff?.name ?? null,
    })),
    total,
    page,
    limit,
    totalPaidAmount: paidAgg._sum.amount ?? 0,
  });
});

// ───────────────────────────────────────────────────────────────
// GET /admin/clients/:id/referrals
//   - referrer (1 уровень вверх) с краткой инфо
//   - directReferrals (level 1, paginated, with totalPaid)
//   - referralCreditsRecent: последние начисления (как REFERRER)
//   - countsByLevel
// ───────────────────────────────────────────────────────────────
adminDetailRouter.get("/clients/:id/referrals", async (req, res) => {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid client id" });
  const clientId = parsed.data.id;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true, referrerId: true, referralCode: true, referralPercent: true,
    },
  });
  if (!client) return res.status(404).json({ message: "Client not found" });

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));

  // Referrer (level 1 up)
  let referrer: { id: string; email: string | null; telegramUsername: string | null; telegramId: string | null; referralCode: string | null } | null = null;
  if (client.referrerId) {
    referrer = await prisma.client.findUnique({
      where: { id: client.referrerId },
      select: { id: true, email: true, telegramUsername: true, telegramId: true, referralCode: true },
    });
  }

  // Direct referrals (level 1) — paginated + totalPaid per ref via aggregation
  const [directReferrals, directCount] = await Promise.all([
    prisma.client.findMany({
      where: { referrerId: clientId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, email: true, telegramId: true, telegramUsername: true,
        createdAt: true, isBlocked: true,
      },
    }),
    prisma.client.count({ where: { referrerId: clientId } }),
  ]);

  // Подсчёт totalPaid на каждого реферала (одним groupBy)
  const refIds = directReferrals.map((r) => r.id);
  let paidMap: Record<string, number> = {};
  if (refIds.length > 0) {
    const grp = await prisma.payment.groupBy({
      by: ["clientId"],
      where: { clientId: { in: refIds }, status: "PAID" },
      _sum: { amount: true },
    });
    paidMap = Object.fromEntries(grp.map((g) => [g.clientId, g._sum.amount ?? 0]));
  }

  // Подсчёт реферальных уровней (примерно): L1 = directCount.
  // L2 = клиенты, чей referrer находится в списке наших L1 (без пагинации, считаем на всех L1)
  const allL1 = await prisma.client.findMany({
    where: { referrerId: clientId },
    select: { id: true },
  });
  const l1Ids = allL1.map((c) => c.id);
  const l2Count = l1Ids.length === 0 ? 0 : await prisma.client.count({ where: { referrerId: { in: l1Ids } } });

  let l3Count = 0;
  if (l2Count > 0) {
    const allL2 = await prisma.client.findMany({
      where: { referrerId: { in: l1Ids } },
      select: { id: true },
    });
    const l2Ids = allL2.map((c) => c.id);
    l3Count = l2Ids.length === 0 ? 0 : await prisma.client.count({ where: { referrerId: { in: l2Ids } } });
  }

  // Last referral credits as REFERRER
  const [referralCreditsRecent, referralCreditsAgg, referralCreditsByLevel] = await Promise.all([
    prisma.referralCredit.findMany({
      where: { referrerId: clientId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        payment: {
          select: {
            id: true, orderId: true, amount: true, currency: true, paidAt: true,
            client: { select: { id: true, email: true, telegramUsername: true, telegramId: true } },
          },
        },
      },
    }),
    prisma.referralCredit.aggregate({ where: { referrerId: clientId }, _sum: { amount: true } }),
    prisma.referralCredit.groupBy({
      by: ["level"],
      where: { referrerId: clientId },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return res.json({
    referralCode: client.referralCode,
    referralPercent: client.referralPercent,
    referrer,
    directReferrals: {
      items: directReferrals.map((r) => ({
        id: r.id,
        email: r.email,
        telegramId: r.telegramId,
        telegramUsername: r.telegramUsername,
        createdAt: r.createdAt.toISOString(),
        isBlocked: r.isBlocked,
        totalPaid: paidMap[r.id] ?? 0,
      })),
      total: directCount,
      page, limit,
    },
    countsByLevel: { l1: directCount, l2: l2Count, l3: l3Count, total: directCount + l2Count + l3Count },
    earnings: {
      total: referralCreditsAgg._sum.amount ?? 0,
      byLevel: referralCreditsByLevel.map((g) => ({
        level: g.level,
        count: g._count,
        amount: g._sum.amount ?? 0,
      })),
    },
    recentCredits: referralCreditsRecent.map((rc) => ({
      id: rc.id,
      amount: rc.amount,
      level: rc.level,
      createdAt: rc.createdAt.toISOString(),
      payment: rc.payment ? {
        id: rc.payment.id,
        orderId: rc.payment.orderId,
        amount: rc.payment.amount,
        currency: rc.payment.currency,
        paidAt: rc.payment.paidAt ? rc.payment.paidAt.toISOString() : null,
        fromClient: rc.payment.client ? {
          id: rc.payment.client.id,
          email: rc.payment.client.email,
          telegramId: rc.payment.client.telegramId,
          telegramUsername: rc.payment.client.telegramUsername,
        } : null,
      } : null,
    })),
  });
});

// ───────────────────────────────────────────────────────────────
// GET /admin/clients/:id/services
//   - proxySlots / singboxSlots (active + recent)
//   - promoActivations / promoCodeUsages
//   - tickets (recent)
// ───────────────────────────────────────────────────────────────
function bigintToNumberSafe(b: bigint | null | undefined): number | null {
  if (b == null) return null;
  // BigInt в JSON → number; превышения 2^53 в этом домене не ожидается, но защитимся
  const n = Number(b);
  return Number.isFinite(n) ? n : null;
}

adminDetailRouter.get("/clients/:id/services", async (req, res) => {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid client id" });
  const clientId = parsed.data.id;
  const exists = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!exists) return res.status(404).json({ message: "Client not found" });

  const [proxySlots, singboxSlots, promoActivations, promoCodeUsages, tickets] = await Promise.all([
    prisma.proxySlot.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        node: { select: { id: true, name: true, publicHost: true } },
        proxyTariff: { select: { id: true, name: true } },
      },
    }),
    prisma.singboxSlot.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        node: { select: { id: true, name: true, publicHost: true, protocol: true } },
        singboxTariff: { select: { id: true, name: true } },
      },
    }),
    prisma.promoActivation.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: { promoGroup: { select: { id: true, name: true, code: true } } },
    }),
    prisma.promoCodeUsage.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: { promoCode: { select: { id: true, code: true, name: true, type: true } } },
    }),
    prisma.ticket.findMany({
      where: { clientId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, subject: true, status: true, createdAt: true, updatedAt: true },
    }),
  ]);

  return res.json({
    proxySlots: proxySlots.map((s) => ({
      id: s.id,
      login: s.login,
      status: s.status,
      expiresAt: s.expiresAt.toISOString(),
      trafficLimitBytes: bigintToNumberSafe(s.trafficLimitBytes),
      trafficUsedBytes: bigintToNumberSafe(s.trafficUsedBytes),
      currentConnections: s.currentConnections,
      connectionLimit: s.connectionLimit,
      createdAt: s.createdAt.toISOString(),
      node: s.node ? { id: s.node.id, name: s.node.name, publicHost: s.node.publicHost } : null,
      tariff: s.proxyTariff ? { id: s.proxyTariff.id, name: s.proxyTariff.name } : null,
    })),
    singboxSlots: singboxSlots.map((s) => ({
      id: s.id,
      userIdentifier: s.userIdentifier,
      status: s.status,
      expiresAt: s.expiresAt.toISOString(),
      trafficLimitBytes: bigintToNumberSafe(s.trafficLimitBytes),
      trafficUsedBytes: bigintToNumberSafe(s.trafficUsedBytes),
      currentConnections: s.currentConnections,
      createdAt: s.createdAt.toISOString(),
      node: s.node ? { id: s.node.id, name: s.node.name, publicHost: s.node.publicHost, protocol: s.node.protocol } : null,
      tariff: s.singboxTariff ? { id: s.singboxTariff.id, name: s.singboxTariff.name } : null,
    })),
    promoActivations: promoActivations.map((p) => ({
      id: p.id,
      createdAt: p.createdAt.toISOString(),
      group: { id: p.promoGroup.id, name: p.promoGroup.name, code: p.promoGroup.code },
    })),
    promoCodeUsages: promoCodeUsages.map((u) => ({
      id: u.id,
      createdAt: u.createdAt.toISOString(),
      code: u.promoCode ? { id: u.promoCode.id, code: u.promoCode.code, name: u.promoCode.name, type: u.promoCode.type } : null,
    })),
    tickets: tickets.map((tk) => ({
      id: tk.id,
      subject: tk.subject,
      status: tk.status,
      createdAt: tk.createdAt.toISOString(),
      updatedAt: tk.updatedAt.toISOString(),
    })),
  });
});

// ───────────────────────────────────────────────────────────────
// GET /admin/payments/:id  — полная карточка платежа
// ───────────────────────────────────────────────────────────────
adminDetailRouter.get("/payments/:id", async (req, res) => {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payment id" });

  const payment = await prisma.payment.findUnique({
    where: { id: parsed.data.id },
    include: {
      client: {
        select: {
          id: true, email: true, telegramId: true, telegramUsername: true,
          isBlocked: true, balance: true, referralCode: true,
        },
      },
      tariff: { select: { id: true, name: true, durationDays: true, price: true, currency: true } },
      proxyTariff: { select: { id: true, name: true, durationDays: true, proxyCount: true, price: true, currency: true } },
      singboxTariff: { select: { id: true, name: true, durationDays: true, slotCount: true, price: true, currency: true } },
      referralCredits: {
        include: {
          referrer: { select: { id: true, email: true, telegramUsername: true, telegramId: true } },
        },
      },
    },
  });
  if (!payment) return res.status(404).json({ message: "Payment not found" });

  const ser = serializePayment(payment);
  return res.json({
    ...ser,
    client: payment.client,
    product: payment.tariff
      ? { kind: "vpn", ...payment.tariff }
      : payment.proxyTariff
        ? { kind: "proxy", ...payment.proxyTariff }
        : payment.singboxTariff
          ? { kind: "singbox", ...payment.singboxTariff }
          : null,
    referralCredits: payment.referralCredits.map((rc) => ({
      id: rc.id,
      amount: rc.amount,
      level: rc.level,
      createdAt: rc.createdAt.toISOString(),
      referrer: rc.referrer,
    })),
  });
});
