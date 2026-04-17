/**
 * User notifications via Telegram (balance top-up, tariff payment).
 * Called from webhooks after successful payment processing.
 */

import { prisma } from "../../db.js";
import { getSystemConfig } from "../client/client.service.js";
import { t } from "../../i18n/index.js";

type AdminNotificationEventType = "balance_topup" | "tariff_payment" | "new_client" | "new_ticket";

type AdminNotificationPreferenceRow = {
  telegramId: string;
  notifyBalanceTopup: boolean;
  notifyTariffPayment: boolean;
  notifyNewClient: boolean;
  notifyNewTicket: boolean;
};

async function sendTelegramToUser(telegramId: string, text: string): Promise<void> {
  const config = await getSystemConfig();
  const token = config.telegramBotToken?.trim();
  if (!token) {
    console.warn("[Telegram notify] Bot token not configured, skip notification");
    return;
  }
  const chatId = telegramId.trim();
  if (!chatId) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || !data.ok) {
      console.warn("[Telegram notify] sendMessage failed", { chatId: chatId.slice(0, 8) + "...", error: data.description ?? res.statusText });
    }
  } catch (e) {
    console.warn("[Telegram notify] sendMessage error", e);
  }
}

async function sendTelegramToAdminsForEvent(eventType: AdminNotificationEventType, text: string): Promise<void> {
  const config = await getSystemConfig();
  const groupId = config.notificationTelegramGroupId?.trim();
  // If a group is specified — send only to the group; otherwise — to admins in DMs
  if (groupId) {
    await sendTelegramToUser(groupId, text).catch((e) => {
      console.warn("[Telegram notify] send to group failed", e);
    });
    return;
  }
  const adminIds = config.botAdminTelegramIds ?? [];
  if (!adminIds.length) return;
  const prefs = (await prisma.adminNotificationPreference.findMany({
    where: { telegramId: { in: adminIds } },
  })) as AdminNotificationPreferenceRow[];
  const byId = new Map<string, AdminNotificationPreferenceRow>(prefs.map((p) => [p.telegramId, p]));
  const shouldSend = (telegramId: string) => {
    const p = byId.get(telegramId);
    if (!p) return true;
    switch (eventType) {
      case "balance_topup":
        return p.notifyBalanceTopup;
      case "tariff_payment":
        return p.notifyTariffPayment;
      case "new_client":
        return p.notifyNewClient;
      case "new_ticket":
        return p.notifyNewTicket;
      default:
        return true;
    }
  };
  await Promise.all(
    adminIds
      .filter((id) => shouldSend(id))
      .map((id) =>
        sendTelegramToUser(id, text).catch((e) => {
          console.warn("[Telegram notify] send to admin failed", e);
        })
      )
  );
}

function formatMoney(amount: number, currency: string): string {
  const curr = (currency || "RUB").toUpperCase();
  if (curr === "RUB") return `${amount.toFixed(2)} ₽`;
  if (curr === "USD") return `$${amount.toFixed(2)}`;
  if (curr === "CNY") return `¥${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${curr}`;
}

/**
 * Send balance top-up notification.
 */
export async function notifyBalanceToppedUp(clientId: string, amount: number, currency: string): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { telegramId: true, email: true, telegramUsername: true, id: true, preferredLang: true },
  });
  if (!client) return;
  const lang = client.preferredLang;
  const amountStr = formatMoney(amount, currency);
  if (client.telegramId) {
    const textForClient = t(lang, "notifyBalanceTopup", { amount: amountStr });
    await sendTelegramToUser(client.telegramId, textForClient);
  }
  const clientLabel =
    client.email?.trim() ||
    (client.telegramUsername ? `@${client.telegramUsername}` : client.id);
  const textForAdmins = t(lang, "adminNotifyBalanceTopup", {
    client: escapeHtml(clientLabel),
    amount: formatMoney(amount, currency),
  });
  await sendTelegramToAdminsForEvent("balance_topup", textForAdmins);
}

/**
 * Send tariff payment and activation notification.
 */
export async function notifyTariffActivated(clientId: string, paymentId: string): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { telegramId: true, email: true, telegramUsername: true, id: true, preferredLang: true },
  });
  if (!client) return;
  const lang = client.preferredLang;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { tariff: { select: { name: true } } },
  });
  const tariffName = payment?.tariff?.name?.trim() || t(lang, "notifyTariffDefault");
  if (client.telegramId) {
    const textClient = t(lang, "notifyTariffActivated", { name: escapeHtml(tariffName) });
    await sendTelegramToUser(client.telegramId, textClient);
  }
  const clientLabel =
    client.email?.trim() ||
    (client.telegramUsername ? `@${client.telegramUsername}` : client.id);
  const textAdmins = t(lang, "adminNotifyTariffPayment", {
    client: escapeHtml(clientLabel),
    name: escapeHtml(tariffName),
  });
  await sendTelegramToAdminsForEvent("tariff_payment", textAdmins);
}

export async function notifyAdminsAboutNewTicket(params: {
  ticketId: string;
  clientId: string;
  subject: string;
  firstMessage: string;
}): Promise<void> {
  const [client, ticket] = await Promise.all([
    prisma.client.findUnique({
      where: { id: params.clientId },
      select: { email: true, telegramUsername: true, id: true },
    }),
    prisma.ticket.findUnique({
      where: { id: params.ticketId },
      select: { id: true, subject: true, status: true },
    }),
  ]);
  if (!ticket) return;
  const config = await getSystemConfig();
  const clientLabel =
    client?.email?.trim() ||
    (client?.telegramUsername ? `@${client.telegramUsername}` : client?.id || "unknown");
  const baseUrl = (config.publicAppUrl || "").replace(/\/+$/, "");
  const link =
    baseUrl && ticket.id
      ? `\n\n${t(null, "adminLabel")}: ${escapeHtml(`${baseUrl}/admin/tickets`)}`
      : "";
  const preview =
    params.firstMessage.length > 200
      ? `${params.firstMessage.slice(0, 197)}...`
      : params.firstMessage;
  const text = t(null, "adminNotifyNewTicket", {
    subject: escapeHtml(ticket.subject),
    client: escapeHtml(clientLabel),
    preview: escapeHtml(preview),
    link,
  });
  await sendTelegramToAdminsForEvent("new_ticket", text);
}

export async function notifyAdminsAboutClientTicketMessage(params: {
  ticketId: string;
  clientId: string;
  content: string;
}): Promise<void> {
  const [client, ticket] = await Promise.all([
    prisma.client.findUnique({
      where: { id: params.clientId },
      select: { email: true, telegramUsername: true, id: true },
    }),
    prisma.ticket.findUnique({
      where: { id: params.ticketId },
      select: { id: true, subject: true, status: true },
    }),
  ]);
  if (!ticket) return;
  const config = await getSystemConfig();
  const clientLabel =
    client?.email?.trim() ||
    (client?.telegramUsername ? `@${client.telegramUsername}` : client?.id || "unknown");
  const baseUrl = (config.publicAppUrl || "").replace(/\/+$/, "");
  const link =
    baseUrl && ticket.id
      ? `\n\n${t(null, "adminLabel")}: ${escapeHtml(`${baseUrl}/admin/tickets`)}`
      : "";
  const preview =
    params.content.length > 200 ? `${params.content.slice(0, 197)}...` : params.content;
  const text = t(null, "adminNotifyTicketMessage", {
    subject: escapeHtml(ticket.subject),
    client: escapeHtml(clientLabel),
    preview: escapeHtml(preview),
    link,
  });
  await sendTelegramToAdminsForEvent("new_ticket", text);
}

export async function notifyAdminsAboutSupportReply(params: {
  ticketId: string;
  clientId: string;
  content: string;
}): Promise<void> {
  const [client, ticket] = await Promise.all([
    prisma.client.findUnique({
      where: { id: params.clientId },
      select: { email: true, telegramUsername: true, id: true },
    }),
    prisma.ticket.findUnique({
      where: { id: params.ticketId },
      select: { id: true, subject: true, status: true },
    }),
  ]);
  if (!ticket) return;
  const config = await getSystemConfig();
  const clientLabel =
    client?.email?.trim() ||
    (client?.telegramUsername ? `@${client.telegramUsername}` : client?.id || "unknown");
  const baseUrl = (config.publicAppUrl || "").replace(/\/+$/, "");
  const link =
    baseUrl && ticket.id
      ? `\n\n${t(null, "adminLabel")}: ${escapeHtml(`${baseUrl}/admin/tickets`)}`
      : "";
  const preview =
    params.content.length > 200 ? `${params.content.slice(0, 197)}...` : params.content;
  const text = t(null, "adminNotifySupportReply", {
    subject: escapeHtml(ticket.subject),
    client: escapeHtml(clientLabel),
    preview: escapeHtml(preview),
    link,
  });
  await sendTelegramToAdminsForEvent("new_ticket", text);
}

export async function notifyAdminsAboutTicketStatusChange(params: {
  ticketId: string;
  clientId: string;
  subject: string;
  status: string;
}): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    select: { email: true, telegramUsername: true, id: true },
  });
  const config = await getSystemConfig();
  const clientLabel =
    client?.email?.trim() ||
    (client?.telegramUsername ? `@${client.telegramUsername}` : client?.id || "unknown");
  const baseUrl = (config.publicAppUrl || "").replace(/\/+$/, "");
  const link =
    baseUrl && params.ticketId
      ? `\n\n${t(null, "adminLabel")}: ${escapeHtml(`${baseUrl}/admin/tickets`)}`
      : "";
  const statusLabel = params.status === "closed" ? t(null, "ticketStatusClosed") : t(null, "ticketStatusOpen");
  const text = t(null, "adminNotifyTicketStatusChanged", {
    subject: escapeHtml(params.subject),
    client: escapeHtml(clientLabel),
    status: escapeHtml(statusLabel),
    link,
  });
  await sendTelegramToAdminsForEvent("new_ticket", text);
}

export async function notifyAdminsAboutNewClient(clientId: string): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, email: true, telegramUsername: true, createdAt: true },
  });
  if (!client) return;
  const config = await getSystemConfig();
  const baseUrl = (config.publicAppUrl || "").replace(/\/+$/, "");
  const clientLabel =
    client.email?.trim() ||
    (client.telegramUsername ? `@${client.telegramUsername}` : client.id);
  const link =
    baseUrl && client.id
      ? `\n\n${t(null, "clientsLabel")}: ${escapeHtml(`${baseUrl}/admin/clients`)}`
      : "";
  const createdAt = client.createdAt.toISOString().slice(0, 19).replace("T", " ");
  const text = t(null, "adminNotifyNewClient", {
    client: escapeHtml(clientLabel),
    createdAt: escapeHtml(createdAt),
    link,
  });
  await sendTelegramToAdminsForEvent("new_client", text);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send proxy slot creation notification (after payment).
 */
export async function notifyProxySlotsCreated(clientId: string, slotIds: string[], tariffName?: string): Promise<void> {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { telegramId: true, preferredLang: true } });
  if (!client?.telegramId || slotIds.length === 0) return;
  const lang = client.preferredLang;

  const slots = await prisma.proxySlot.findMany({
    where: { id: { in: slotIds } },
    select: { node: { select: { publicHost: true, socksPort: true, httpPort: true } }, login: true, password: true },
    orderBy: { createdAt: "asc" },
  });

  const name = tariffName?.trim() || t(lang, "notifyTariffDefault");
  let text = t(lang, "notifyProxyPaid", { name: escapeHtml(name) });
  for (const s of slots) {
    const host = s.node.publicHost ?? "host";
    text += `• SOCKS5: <code>socks5://${escapeHtml(s.login)}:${escapeHtml(s.password)}@${escapeHtml(host)}:${s.node.socksPort}</code>\n`;
    text += `• HTTP: <code>http://${escapeHtml(s.login)}:${escapeHtml(s.password)}@${escapeHtml(host)}:${s.node.httpPort}</code>\n\n`;
  }
  text += t(lang, "notifyProxyCopyHint");

  await sendTelegramToUser(client.telegramId, text);
}

/**
 * Send Sing-box slot creation notification (after payment).
 */
export async function notifySingboxSlotsCreated(clientId: string, slotIds: string[], tariffName?: string): Promise<void> {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { telegramId: true, preferredLang: true } });
  if (!client?.telegramId || slotIds.length === 0) return;
  const lang = client.preferredLang;

  const slots = await prisma.singboxSlot.findMany({
    where: { id: { in: slotIds } },
    select: {
      userIdentifier: true,
      secret: true,
      node: { select: { publicHost: true, port: true, protocol: true, tlsEnabled: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const { buildSingboxSlotSubscriptionLink } = await import("../singbox/singbox-link.js");
  const name = tariffName?.trim() || "Sing-box";
  let text = t(lang, "notifySingboxPaid", { name: escapeHtml(name) });
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]!;
    const link = buildSingboxSlotSubscriptionLink(
      { publicHost: s.node.publicHost ?? "", port: s.node.port ?? 443, protocol: s.node.protocol ?? "VLESS", tlsEnabled: s.node.tlsEnabled },
      { userIdentifier: s.userIdentifier, secret: s.secret },
      `${name}-${i + 1}`
    );
    text += `• <code>${escapeHtml(link)}</code>\n\n`;
  }
  text += t(lang, "notifySingboxCopyHint");

  await sendTelegramToUser(client.telegramId, text);
}
