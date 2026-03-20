/**
 * Webhook ePay (易支付): 异步通知 notify_url。
 * 签名验证：MD5（参数按 ASCII 排序 + 密钥）。
 * 文档：https://motionpay.net/doc.html
 *
 * ePay 通知以 GET 方式发送，成功后需返回纯文本 "success"。
 */

import { Router, Request, Response } from "express";
import { prisma } from "../../db.js";
import { getSystemConfig } from "../client/client.service.js";
import { verifyEpayNotification } from "../epay/epay.service.js";
import { activateTariffByPaymentId } from "../tariff/tariff-activation.service.js";
import { createProxySlotsByPaymentId } from "../proxy/proxy-slots-activation.service.js";
import { createSingboxSlotsByPaymentId } from "../singbox/singbox-slots-activation.service.js";
import { applyExtraOptionByPaymentId } from "../extra-options/extra-options.service.js";
import { distributeReferralRewards } from "../referral/referral.service.js";
import { notifyBalanceToppedUp, notifyTariffActivated, notifyProxySlotsCreated, notifySingboxSlotsCreated } from "../notification/telegram-notify.service.js";

function hasExtraOptionInMetadata(metadata: string | null): boolean {
  if (!metadata?.trim()) return false;
  try {
    const obj = JSON.parse(metadata) as Record<string, unknown>;
    return obj?.extraOption != null && typeof obj.extraOption === "object";
  } catch {
    return false;
  }
}

export const epayWebhooksRouter = Router();

/** 核心处理逻辑，GET 和 POST 共用 */
async function handleEpayNotification(params: Record<string, string>, res: Response) {
  if (!params.out_trade_no || !params.sign) {
    console.warn("[ePay Webhook] Missing params");
    return res.status(200).send("fail");
  }

  const config = await getSystemConfig();
  const epayKey = (config as { epayKey?: string | null }).epayKey?.trim();
  if (!epayKey) {
    console.warn("[ePay Webhook] ePay not configured");
    return res.status(200).send("fail");
  }

  if (!verifyEpayNotification(params, epayKey)) {
    console.warn("[ePay Webhook] Invalid signature");
    return res.status(200).send("fail");
  }

  if (params.trade_status !== "TRADE_SUCCESS") {
    return res.status(200).send("success");
  }

  const outTradeNo = params.out_trade_no.trim();

  const payment = await prisma.payment.findFirst({
    where: { orderId: outTradeNo, provider: "epay" },
    select: { id: true, clientId: true, amount: true, currency: true, tariffId: true, proxyTariffId: true, singboxTariffId: true, status: true, metadata: true },
  });

  if (!payment) {
    console.warn("[ePay Webhook] Payment not found", { outTradeNo });
    return res.status(200).send("success");
  }

  if (payment.status === "PAID") {
    return res.status(200).send("success");
  }

  const tradeNo = params.trade_no ?? null;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", paidAt: new Date(), externalId: tradeNo },
  });

  const isExtraOption = hasExtraOptionInMetadata(payment.metadata);
  const isTopUp = !payment.tariffId && !payment.proxyTariffId && !payment.singboxTariffId && !isExtraOption;

  if (isTopUp) {
    await prisma.client.update({
      where: { id: payment.clientId },
      data: { balance: { increment: payment.amount } },
    });
    await notifyBalanceToppedUp(payment.clientId, payment.amount, payment.currency || "USD").catch(() => {});
  } else if (isExtraOption) {
    await applyExtraOptionByPaymentId(payment.id);
  } else if (payment.proxyTariffId) {
    const proxyResult = await createProxySlotsByPaymentId(payment.id);
    if (proxyResult.ok) {
      const tariff = await prisma.proxyTariff.findUnique({ where: { id: payment.proxyTariffId }, select: { name: true } });
      await notifyProxySlotsCreated(payment.clientId, proxyResult.slotIds, tariff?.name ?? undefined).catch(() => {});
    }
  } else if (payment.singboxTariffId) {
    const singboxResult = await createSingboxSlotsByPaymentId(payment.id);
    if (singboxResult.ok) {
      const tariff = await prisma.singboxTariff.findUnique({ where: { id: payment.singboxTariffId }, select: { name: true } });
      await notifySingboxSlotsCreated(payment.clientId, singboxResult.slotIds, tariff?.name ?? undefined).catch(() => {});
    }
  } else {
    const activation = await activateTariffByPaymentId(payment.id);
    if (activation.ok) await notifyTariffActivated(payment.clientId, payment.id).catch(() => {});
  }

  await distributeReferralRewards(payment.id).catch(() => {});

  return res.status(200).send("success");
}

/** 提取参数工具 */
function extractParams(req: Request): Record<string, string> {
  const params: Record<string, string> = {};
  const src = { ...req.query, ...(typeof req.body === "object" && req.body !== null ? req.body : {}) };
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === "string") params[k] = v;
    else if (v != null) params[k] = String(v);
  }
  return params;
}

/** GET /api/webhooks/epay — ePay 异步通知 */
epayWebhooksRouter.get("/", async (req: Request, res: Response) => {
  return handleEpayNotification(extractParams(req), res);
});

/** POST /api/webhooks/epay — 部分易支付平台以 POST 发通知 */
epayWebhooksRouter.post("/", async (req: Request, res: Response) => {
  return handleEpayNotification(extractParams(req), res);
});
