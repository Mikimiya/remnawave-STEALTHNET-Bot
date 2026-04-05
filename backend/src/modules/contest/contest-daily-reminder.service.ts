/**
 * Ежедневное напоминание об активном конкурсе: рассылка в Telegram всем клиентам с привязанным ботом.
 * Использует telegram_bot_token из настроек (как авто-рассылка).
 */

import { prisma } from "../../db.js";
import { getSystemConfig } from "../client/client.service.js";
import { t } from "../../i18n/index.js";

const TELEGRAM_DELAY_MS = 80;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendTelegram(botToken: string, chatId: string, text: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
    return Boolean(res.ok && data.ok);
  } catch {
    return false;
  }
}

function activeContestWhere(now: Date) {
  return {
    startAt: { lte: now },
    endAt: { gte: now },
    status: { in: ["active", "draft", "ended"] },
  };
}

function formatPrizeLine(prizeType: string, prizeValue: string, lang: string): string {
  const v = (prizeValue || "").trim();
  if (!v) return "—";
  if (prizeType === "balance") return t(lang, "prizeBalance", { value: v });
  if (prizeType === "vpn_days") return t(lang, "prizeVpnDays", { value: v });
  return v;
}

/** Собирает полный текст уведомления о старте конкурса: название, период, описание (dailyMessage), призы. */
function buildContestStartMessage(contest: { name: string; startAt: Date; endAt: Date; dailyMessage: string | null; prize1Type: string; prize1Value: string; prize2Type: string; prize2Value: string; prize3Type: string; prize3Value: string }, lang: string): string {
  const startStr = contest.startAt.toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" });
  const endStr = contest.endAt.toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" });
  const lines: string[] = [
    t(lang, "contestStartTitle", { name: contest.name }),
    "",
    t(lang, "contestPeriod", { start: startStr, end: endStr }),
  ];
  if (contest.dailyMessage && contest.dailyMessage.trim()) {
    lines.push("", contest.dailyMessage.trim());
  }
  lines.push(
    "",
    t(lang, "contestPrizes"),
    t(lang, "contestPlace", { place: "1", prize: formatPrizeLine(contest.prize1Type, contest.prize1Value, lang) }),
    t(lang, "contestPlace", { place: "2", prize: formatPrizeLine(contest.prize2Type, contest.prize2Value, lang) }),
    t(lang, "contestPlace", { place: "3", prize: formatPrizeLine(contest.prize3Type, contest.prize3Value, lang) })
  );
  return lines.join("\n");
}

/**
 * 1) При старте конкурса: один раз отправить всем уведомление «Конкурс запущен!»
 * 2) Каждый день: отправлять ежедневное напоминание (dailyMessage или шаблон).
 */
export async function runContestDailyReminder(): Promise<{ sent: number; errors: number }> {
  const now = new Date();
  const config = await getSystemConfig();
  const botToken = config.telegramBotToken?.trim();
  if (!botToken) {
    console.warn("[contest-daily-reminder] telegram_bot_token not set, skip");
    return { sent: 0, errors: 0 };
  }

  const clients = await prisma.client.findMany({
    where: { telegramId: { not: null }, isBlocked: false },
    select: { telegramId: true, preferredLang: true },
  });
  if (clients.length === 0) return { sent: 0, errors: 0 };

  let totalSent = 0;
  let totalErrors = 0;

  // Сначала — ежедневное напоминание по конкурсам, у которых уже отправлено уведомление о старте
  const contestsForDaily = await prisma.contest.findMany({
    where: { ...activeContestWhere(now), startNotificationSentAt: { not: null } },
    orderBy: { startAt: "desc" },
  });
  for (const contest of contestsForDaily) {
    let sent = 0;
    let err = 0;
    for (const c of clients) {
      const tid = c.telegramId?.trim();
      if (!tid) continue;
      const lang = c.preferredLang || "en";
      const text =
        (contest.dailyMessage && contest.dailyMessage.trim()) ||
        t(lang, "contestDailyReminder", { name: contest.name, endDate: contest.endAt.toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" }) });
      if (await sendTelegram(botToken, tid, text)) sent++;
      else err++;
      await delay(TELEGRAM_DELAY_MS);
    }
    totalSent += sent;
    totalErrors += err;
    if (sent > 0 || err > 0) {
      console.log(`[contest-daily-reminder] Contest "${contest.name}" daily: sent=${sent}, errors=${err}`);
    }
  }

  // Конкурс только что стартовал — один раз отправить всем «Конкурс запущен!»
  const contestJustStarted = await prisma.contest.findFirst({
    where: { ...activeContestWhere(now), startNotificationSentAt: null },
    orderBy: { startAt: "desc" },
  });
  if (contestJustStarted) {
    let sent = 0;
    let err = 0;
    for (const c of clients) {
      const tid = c.telegramId?.trim();
      if (!tid) continue;
      const lang = c.preferredLang || "en";
      const text = buildContestStartMessage(contestJustStarted, lang);
      if (await sendTelegram(botToken, tid, text)) sent++;
      else err++;
      await delay(TELEGRAM_DELAY_MS);
    }
    await prisma.contest.update({
      where: { id: contestJustStarted.id },
      data: { startNotificationSentAt: now },
    });
    totalSent += sent;
    totalErrors += err;
    console.log(`[contest-daily-reminder] Contest "${contestJustStarted.name}" start notification: sent=${sent}, errors=${err}`);
  }

  return { sent: totalSent, errors: totalErrors };
}

/**
 * Вручную запустить конкурс: отправить уведомление «Конкурс запущен!» всем и выставить status = active.
 * Вызывается из админки по кнопке «Запустить».
 */
export async function sendContestStartNotification(contestId: string): Promise<{ ok: boolean; sent?: number; errors?: number; error?: string }> {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return { ok: false, error: t("en", "contestNotFound") };

  const config = await getSystemConfig();
  const botToken = config.telegramBotToken?.trim();
  if (!botToken) return { ok: false, error: t("en", "contestBotTokenNotSet") };

  const clients = await prisma.client.findMany({
    where: { telegramId: { not: null }, isBlocked: false },
    select: { telegramId: true, preferredLang: true },
  });

  const now = new Date();

  let sent = 0;
  let err = 0;
  for (const c of clients) {
    const tid = c.telegramId?.trim();
    if (!tid) continue;
    const lang = c.preferredLang || "en";
    const text = buildContestStartMessage(contest, lang);
    if (await sendTelegram(botToken, tid, text)) sent++;
    else err++;
    await delay(TELEGRAM_DELAY_MS);
  }

  await prisma.contest.update({
    where: { id: contestId },
    data: { status: "active", startNotificationSentAt: now },
  });
  return { ok: true, sent, errors: err };
}
