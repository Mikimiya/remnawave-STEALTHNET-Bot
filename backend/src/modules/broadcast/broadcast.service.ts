/**
 * Рассылка: отправка сообщения клиентам через Telegram и/или Email.
 */

import { prisma } from "../../db.js";
import { t } from "../../i18n/index.js";
import { getSystemConfig } from "../client/client.service.js";
import { sendEmail } from "../mail/mail.service.js";
import { createBulkNotifications } from "../notification/client-notification.service.js";

const TELEGRAM_SEND_DELAY_MS = 60;
const EMAIL_SEND_DELAY_MS = 200;

export type BroadcastChannel = "telegram" | "email" | "both";

export type BroadcastResult = {
  ok: boolean;
  sentTelegram: number;
  sentEmail: number;
  failedTelegram: number;
  failedEmail: number;
  errors: string[];
};

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Отправить текстовое сообщение в Telegram.
 */
async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
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
    if (res.ok && data.ok) return { ok: true };
    return { ok: false, error: data.description ?? res.statusText ?? "Unknown error" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Отправить фото в Telegram (caption = текст сообщения).
 */
async function sendTelegramPhoto(
  botToken: string,
  chatId: string,
  caption: string,
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ ok: boolean; error?: string }> {
  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
  try {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("photo", new Blob([buffer], { type: mimeType }), fileName || "image");
    if (caption) {
      form.append("caption", caption);
      form.append("parse_mode", "HTML");
    }
    const res = await fetch(url, { method: "POST", body: form });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (res.ok && data.ok) return { ok: true };
    return { ok: false, error: data.description ?? res.statusText ?? "Unknown error" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Отправить документ в Telegram (caption = текст сообщения).
 */
async function sendTelegramDocument(
  botToken: string,
  chatId: string,
  caption: string,
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ ok: boolean; error?: string }> {
  const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
  try {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("document", new Blob([buffer], { type: mimeType }), fileName || "file");
    if (caption) {
      form.append("caption", caption);
      form.append("parse_mode", "HTML");
    }
    const res = await fetch(url, { method: "POST", body: form });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (res.ok && data.ok) return { ok: true };
    return { ok: false, error: data.description ?? res.statusText ?? "Unknown error" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export type BroadcastAttachment = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

/**
 * Запустить рассылку: Telegram и/или Email.
 * subject используется только для email. attachment — опциональное изображение или файл.
 */
export async function runBroadcast(options: {
  channel: BroadcastChannel;
  subject: string;
  message: string;
  attachment?: BroadcastAttachment;
}): Promise<BroadcastResult> {
  const { channel, subject, message, attachment } = options;
  const result: BroadcastResult = {
    ok: true,
    sentTelegram: 0,
    sentEmail: 0,
    failedTelegram: 0,
    failedEmail: 0,
    errors: [],
  };

  const config = await getSystemConfig();
  const doTelegram = channel === "telegram" || channel === "both";
  const doEmail = channel === "email" || channel === "both";
  const isImage = attachment?.mimetype?.startsWith("image/") ?? false;

  if (doTelegram) {
    const botToken = config.telegramBotToken?.trim();
    if (!botToken) {
      result.errors.push(t("en", "broadcastTelegramTokenMissing"));
      result.ok = false;
    } else {
      const clients = await prisma.client.findMany({
        where: { telegramId: { not: null } },
        select: { id: true, telegramId: true },
      });
      for (const c of clients) {
        const tid = c.telegramId!.trim();
        if (!tid) continue;
        await delay(TELEGRAM_SEND_DELAY_MS);
        const send = attachment
          ? isImage
            ? await sendTelegramPhoto(
                botToken,
                tid,
                message,
                attachment.buffer,
                attachment.mimetype,
                attachment.originalname
              )
            : await sendTelegramDocument(
                botToken,
                tid,
                message,
                attachment.buffer,
                attachment.mimetype,
                attachment.originalname
              )
          : await sendTelegramMessage(botToken, tid, message);
        if (send.ok) result.sentTelegram++;
        else {
          result.failedTelegram++;
          if (result.errors.length < 10) result.errors.push(`Telegram ${tid}: ${send.error ?? "error"}`);
        }
      }
    }
  }

  if (doEmail) {
    const smtpConfig = {
      host: config.smtpHost || "",
      port: config.smtpPort ?? 587,
      secure: config.smtpSecure ?? false,
      user: config.smtpUser ?? null,
      password: config.smtpPassword ?? null,
      fromEmail: config.smtpFromEmail ?? null,
      fromName: config.smtpFromName ?? null,
    };
    if (!smtpConfig.host || !smtpConfig.fromEmail) {
      result.errors.push(t("en", "broadcastSmtpNotConfigured"));
      result.ok = false;
    } else {
      const clients = await prisma.client.findMany({
        where: { email: { not: null } },
        select: { id: true, email: true },
      });
      const serviceName = config.serviceName || t("en", "defaultServiceNameFallback");
      const subj = subject.trim() || t("en", "broadcastDefaultSubject", { name: serviceName });
      const html = message.trim().replace(/\n/g, "<br>\n");
      const htmlBody = `<!DOCTYPE html><html><body style="font-family: sans-serif;">${html}</body></html>`;
      const emailAttachments = attachment
        ? [{ filename: attachment.originalname || "file", content: attachment.buffer }]
        : undefined;
      for (const c of clients) {
        const email = c.email!.trim();
        if (!email) continue;
        await delay(EMAIL_SEND_DELAY_MS);
        const send = await sendEmail(smtpConfig, email, subj, htmlBody, emailAttachments);
        if (send.ok) result.sentEmail++;
        else {
          result.failedEmail++;
          if (result.errors.length < 10) result.errors.push(`Email ${email}: ${send.error ?? "error"}`);
        }
      }
    }
  }

  if (result.errors.length > 0) result.ok = false;

  // Also create in-app notifications for all non-blocked clients
  try {
    const allClients = await prisma.client.findMany({
      where: { isBlocked: false },
      select: { id: true },
    });
    const serviceName = config.serviceName || "STEALTHNET";
    await createBulkNotifications(
      allClients.map((c) => c.id),
      "broadcast",
      `📢 ${serviceName}`,
      message.length > 500 ? message.slice(0, 497) + "..." : message,
    );
  } catch (e) {
    console.error("[Broadcast] Failed to create in-app notifications:", e);
  }

  return result;
}

/**
 * Количество клиентов с telegramId и с email (для отображения в форме рассылки).
 */
export async function getBroadcastRecipientsCount(): Promise<{ withTelegram: number; withEmail: number }> {
  const [withTelegram, withEmail] = await Promise.all([
    prisma.client.count({ where: { telegramId: { not: null } } }),
    prisma.client.count({ where: { email: { not: null } } }),
  ]);
  return { withTelegram, withEmail };
}
