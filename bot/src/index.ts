/**
 * STEALTHNET 3.0 — Telegram-бот
 * Полный функционал кабинета: главная, тарифы, профиль, пополнение, триал, реферальная ссылка, VPN.
 * Цветные кнопки: style primary / success / danger (Telegram Bot API).
 */

import "dotenv/config";
import { Bot, InputFile } from "grammy";
import * as api from "./api.js";
import { L, formatDaysI18n, getDefaultMenuTexts } from "./locales/index.js";
import {
  mainMenu,
  backToMenu,
  supportSubMenu,
  topUpPresets,
  tariffPayButtons,
  tariffsOfCategoryButtons,
  tariffPaymentMethodButtons,
  proxyTariffPayButtons,
  proxyTariffsOfCategoryButtons,
  proxyCategoryButtons,
  proxyPaymentMethodButtons,
  singboxTariffPayButtons,
  singboxTariffsOfCategoryButtons,
  singboxPaymentMethodButtons,
  topupPaymentMethodButtons,
  payUrlMarkup,
  profileButtons,
  extraOptionsButtons,
  optionPaymentMethodButtons,
  langButtons,
  currencyButtons,
  trialConfirmButton,
  openSubscribePageMarkup,
  type InlineMarkup,
  type InnerEmojiIds,
} from "./keyboard.js";

function formatRuDays(n: number): string {
  const abs = Math.abs(n);
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${n} дней`;
  if (last === 1) return `${n} день`;
  if (last >= 2 && last <= 4) return `${n} дня`;
  return `${n} дней`;
}

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Set BOT_TOKEN in .env");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

let BOT_USERNAME = "";

// ——— Принудительная подписка на канал ———

type SubscriptionCheckState = "subscribed" | "not_subscribed" | "cannot_verify";

type ForceChannelTarget = {
  chatId: string | null;
  joinUrl: string | null;
};

function parseForceChannelTarget(channelInput: string): ForceChannelTarget {
  const raw = channelInput.trim();
  if (!raw) return { chatId: null, joinUrl: null };

  const looksLikeUrl = /^https?:\/\//i.test(raw) || /^t\.me\//i.test(raw);
  if (looksLikeUrl) {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const u = new URL(candidate);
      const hostOk = u.hostname === "t.me" || u.hostname.endsWith(".t.me");
      const path = u.pathname.replace(/^\/+|\/+$/g, "");
      if (hostOk && path) {
        if (path.startsWith("c/")) {
          const idPart = path.slice(2).split("/")[0];
          if (/^\d+$/.test(idPart)) {
            return { chatId: `-100${idPart}`, joinUrl: candidate };
          }
        }
        if (path.startsWith("+") || path.startsWith("joinchat/")) {
          return { chatId: null, joinUrl: candidate };
        }
        const uname = path.split("/")[0];
        if (/^[a-zA-Z0-9_]{5,}$/.test(uname)) {
          return { chatId: `@${uname}`, joinUrl: `https://t.me/${uname}` };
        }
      }
    } catch {
      // fallthrough
    }
  }

  if (raw.startsWith("@")) {
    const uname = raw.slice(1);
    if (/^[a-zA-Z0-9_]{5,}$/.test(uname)) {
      return { chatId: `@${uname}`, joinUrl: `https://t.me/${uname}` };
    }
  }

  if (/^[a-zA-Z0-9_]{5,}$/.test(raw)) {
    return { chatId: `@${raw}`, joinUrl: `https://t.me/${raw}` };
  }

  if (/^-?\d+$/.test(raw)) {
    const joinUrl = raw.startsWith("-100") ? `https://t.me/c/${raw.slice(4)}` : null;
    return { chatId: raw, joinUrl };
  }

  return { chatId: null, joinUrl: null };
}

/** Проверяет, подписан ли пользователь на указанный канал/группу. */
async function checkUserSubscription(userId: number, channelInput: string): Promise<{ state: SubscriptionCheckState; target: ForceChannelTarget; error?: string }> {
  const target = parseForceChannelTarget(channelInput);
  if (!target.chatId) {
    return { state: "cannot_verify", target, error: "invalid_channel_id" };
  }
  try {
    const member = await bot.api.getChatMember(target.chatId, userId);
    const subscribed = ["member", "administrator", "creator", "restricted"].includes(member.status);
    return { state: subscribed ? "subscribed" : "not_subscribed", target };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("getChatMember error:", msg, { channelInput, parsedChatId: target.chatId });
    return { state: "cannot_verify", target, error: msg };
  }
}

/** Генерирует клавиатуру «Подписаться + Проверить подписку» */
function subscribeKeyboard(channelInput: string, lang?: string): InlineMarkup {
  const target = parseForceChannelTarget(channelInput);
  const rows: InlineMarkup["inline_keyboard"] = [];
  if (target.joinUrl) {
    rows.push([{ text: L(lang ?? "zh", "forceSubscribeBtn"), url: target.joinUrl }]);
  }
  rows.push([{ text: L(lang ?? "zh", "forceSubscribeCheck"), callback_data: "check_subscribe" }]);
  return { inline_keyboard: rows };
}

/**
 * Проверяет подписку и, если не подписан, отправляет/редактирует сообщение.
 * Возвращает true если НЕ подписан (нужно прервать обработку).
 */
async function enforceSubscription(
  ctx: {
    from?: { id: number };
    reply: (text: string, opts?: { reply_markup?: InlineMarkup }) => Promise<unknown>;
  },
  config: Awaited<ReturnType<typeof api.getPublicConfig>>,
): Promise<boolean> {
  if (!config?.forceSubscribeEnabled) return false;
  const channelId = config.forceSubscribeChannelId?.trim();
  if (!channelId) return false;
  const userId = ctx.from?.id;
  if (!userId) return false;
  const result = await checkUserSubscription(userId, channelId);
  if (result.state === "subscribed") return false;
  const msg = config.forceSubscribeMessage?.trim() || L(getLang(userId), "forceSubscribeDefault");
  if (result.state === "cannot_verify") {
    await ctx.reply(
      `⚠️ ${msg}\n\n${L(getLang(userId), "forceSubscribeCheckUnavailable")}`,
      { reply_markup: subscribeKeyboard(channelId, getLang(userId)) }
    );
    return true;
  }
  await ctx.reply(`⚠️ ${msg}`, { reply_markup: subscribeKeyboard(channelId, getLang(userId)) });
  return true;
}

type TariffItem = {
  id: string;
  name: string;
  description?: string | null;
  durationDays: number;
  trafficLimitBytes?: number | null;
  deviceLimit?: number | null;
  price: number;
  currency: string;
};
type TariffCategory = { id: string; name: string; emoji?: string; emojiKey?: string | null; tariffs: TariffItem[] };

// Токены по telegram_id (в памяти; для продакшена лучше Redis/БД)
const tokenStore = new Map<number, string>();
// Кэш языка пользователя
const langStore = new Map<number, string>();

function getToken(userId: number): string | undefined {
  return tokenStore.get(userId);
}

function setToken(userId: number, token: string): void {
  tokenStore.set(userId, token);
}

function getLang(userId: number): string {
  return langStore.get(userId) || "zh";
}

function setLang(userId: number, lang: string): void {
  langStore.set(userId, lang);
}

// Пользователи, ожидающие ввода промокода
const awaitingPromoCode = new Set<number>();
// Активный промокод на скидку (хранится до оплаты)
const activeDiscountCode = new Map<number, string>();

// Админ: ожидание ввода поиска; последний поиск по userId для пагинации
const awaitingAdminSearch = new Set<number>();
const lastAdminSearch = new Map<number, string>();
// Админ: пополнение баланса клиента — ожидаем число
const awaitingAdminBalance = new Map<number, string>();
// Админ: рассылка — ожидаем текст или фото+подпись, затем канал
const awaitingBroadcastMessage = new Set<number>();
type BroadcastPayload = { text: string; photoFileId?: string };
const lastBroadcastMessage = new Map<number, string | BroadcastPayload>();
// Админ: сквады — список для добавления/удаления (clientId + items с uuid/name)
const lastSquadsForAdd = new Map<number, { clientId: string; items: { uuid: string; name: string }[] }>();
const lastSquadsForRemove = new Map<number, { clientId: string; items: { uuid: string; name: string }[] }>();
// Устройства (HWID): список для экрана «Удалить устройство» (индекс в callback)
const lastDevicesList = new Map<number, { devices: { hwid: string; platform?: string; deviceModel?: string }[] }>();

/** Достаём subscriptionUrl из ответа Remna */
function getSubscriptionUrl(sub: unknown): string | null {
  if (!sub || typeof sub !== "object") return null;
  const o = sub as Record<string, unknown>;
  const resp = o.response ?? o.data;
  if (resp && typeof resp === "object") {
    const r = resp as Record<string, unknown>;
    const url = r.subscriptionUrl ?? r.subscription_url;
    if (typeof url === "string" && url.trim()) return url.trim();
  }
  if (typeof o.subscriptionUrl === "string" && o.subscriptionUrl.trim()) return o.subscriptionUrl.trim();
  return null;
}

/** Достаём объект пользователя из ответа Remna (response или data или сам объект) */
function getSubUser(sub: unknown): Record<string, unknown> | null {
  if (!sub || typeof sub !== "object") return null;
  const o = sub as Record<string, unknown>;
  const resp = o.response ?? o.data ?? o;
  const r = typeof resp === "object" && resp !== null ? (resp as Record<string, unknown>) : null;
  if (r && (r.user != null || r.expireAt != null || r.subscriptionUrl != null)) {
    const user = r.user;
    return (typeof user === "object" && user !== null ? user : r) as Record<string, unknown>;
  }
  return r;
}

function bytesToGb(bytes: number): string {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}

/** Прогресс-бар из символов (0..1), длина barLen */
function progressBar(pct: number, barLen: number): string {
  const filled = Math.round(Math.max(0, Math.min(1, pct)) * barLen);
  return "█".repeat(filled) + "░".repeat(barLen - filled);
}

/** DEFAULT_MENU_TEXTS: now resolved per-language via getDefaultMenuTexts(lang) from locales */
function getDefaultMenuTextsForLang(lang: string): Record<string, string> {
  return getDefaultMenuTexts(lang);
}

function getDefaultTariffsText(lang: string): string { return L(lang, "defaultTariffsText"); }
function getDefaultPaymentText(lang: string): string { return L(lang, "defaultPaymentText"); }

type BotTariffLineFields = {
  name?: boolean;
  durationDays?: boolean;
  price?: boolean;
  currency?: boolean;
  trafficLimit?: boolean;
  deviceLimit?: boolean;
};

const DEFAULT_TARIFF_LINE_FIELDS: Required<BotTariffLineFields> = {
  name: true,
  durationDays: false,
  price: true,
  currency: true,
  trafficLimit: false,
  deviceLimit: false,
};

function formatDaysRu(days: number): string {
  const d = Math.abs(Math.trunc(days));
  const mod10 = d % 10;
  const mod100 = d % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

function formatTariffLine(tariff: TariffItem, fields: Required<BotTariffLineFields>, lang?: string): string {
  const lg = lang || "zh";
  const parts: string[] = [];
  if (fields.name) parts.push(tariff.name);
  if (fields.durationDays) parts.push(`${tariff.durationDays} ${formatDaysI18n(tariff.durationDays, lg)}`);
  if (fields.price) {
    const pricePart = fields.currency ? `${tariff.price} ${tariff.currency}` : `${tariff.price}`;
    parts.push(pricePart);
  } else if (fields.currency) {
    parts.push(`${tariff.currency}`);
  }
  if (fields.trafficLimit) {
    const limit = tariff.trafficLimitBytes;
    parts.push(limit == null ? L(lg, "trafficUnlimited") : `${L(lg, "trafficLabel")} ${bytesToGb(limit)} GB`);
  }
  if (fields.deviceLimit) {
    const limit = tariff.deviceLimit;
    parts.push(limit == null ? L(lg, "devicesUnlimited") : `${L(lg, "devicesLabelTariff")} ${limit}`);
  }
  if (!parts.length) return `• ${tariff.name}`;
  return `• ${parts.join(" — ")}`;
}

function renderTariffsText(template: string, category: string, tariffLines: string): string {
  return template
    .split("{{CATEGORY}}").join(category)
    .split("{{TARIFFS}}").join(tariffLines);
}

function renderPaymentText(
  template: string,
  vars: { name: string; price: string; amount: string; currency: string; action: string }
): string {
  return template
    .split("{{NAME}}").join(vars.name)
    .split("{{PRICE}}").join(vars.price)
    .split("{{AMOUNT}}").join(vars.amount)
    .split("{{CURRENCY}}").join(vars.currency)
    .split("{{ACTION}}").join(vars.action);
}

function buildPaymentMessage(
  config: Awaited<ReturnType<typeof api.getPublicConfig>> | null | undefined,
  vars: { name: string; price: string; amount: string; currency: string; action: string },
  lang?: string
): { text: string; entities: CustomEmojiEntity[] } {
  const template = (config?.botPaymentText ?? "").trim() || getDefaultPaymentText(lang || "zh");
  const base = renderPaymentText(template, vars);
  return applyCustomEmojiPlaceholders(base, config?.botEmojis);
}

function t(texts: Record<string, string> | null | undefined, key: string, lang?: string): string {
  return (texts?.[key] ?? getDefaultMenuTextsForLang(lang || "zh")[key]) || "";
}

/**
 * Selects the bot menu texts for the given language from botMenuTextsLocales.
 * Falls back to botMenuTexts (single-locale legacy) if locale not found.
 */
function getLocaleTexts(
  config: Awaited<ReturnType<typeof api.getPublicConfig>> | null | undefined,
  lang: string
): Record<string, string> | null {
  const locales = config?.botMenuTextsLocales;
  if (locales) {
    const normalized = lang.toLowerCase();
    const locale = locales[normalized] ?? locales[normalized.split("-")[0]] ?? locales["en"] ?? locales["zh"] ?? null;
    if (locale) return locale;
  }
  return config?.botMenuTexts ?? config?.resolvedBotMenuTexts ?? null;
}

/**
 * Maps a Telegram language_code (e.g. "zh-hans", "en-US") to a supported
 * activeLanguages entry. Falls back to first activeLanguage or "zh".
 * NOTE: Only used for NEW user registration. Existing users always use
 * their stored preferredLang from the database.
 */
function resolveLangCode(tgLang: string | undefined, activeLanguages?: string[] | null): string {
  const supported = activeLanguages?.length ? activeLanguages : ["zh", "en", "ru"];
  if (!tgLang) return supported[0] ?? "zh";
  const normalized = tgLang.toLowerCase().split("-")[0];
  // Map Telegram codes to our codes
  const aliases: Record<string, string> = { "zh": "zh", "hans": "zh", "hant": "zh" };
  const code = aliases[normalized] ?? normalized;
  return supported.includes(code) ? code : supported[0] ?? "zh";
}

/**
 * Format days count in the correct language.
 * ru: 1 день / 2-4 дня / 5+ дней
 * en: 1 day / N days
 * zh: N 天
 */
function formatDaysForLang(days: number, lang: string): string {
  const normalized = lang.toLowerCase().split("-")[0];
  if (normalized === "zh") return `${days} 天`;
  if (normalized === "en") return `${days} day${days === 1 ? "" : "s"}`;
  // default: Russian
  return `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`;
}

type CustomEmojiEntity = { type: "custom_emoji"; offset: number; length: number; custom_emoji_id: string };

/** Длина первого символа в UTF-16 (для entity) */
function firstCharLengthUtf16(s: string): number {
  if (!s.length) return 0;
  const cp = s.codePointAt(0);
  return cp != null && cp > 0xffff ? 2 : 1;
}

const DEFAULT_EMOJI_UNICODE: Record<string, string> = {
  PACKAGE: "📦", TARIFFS: "📦", CARD: "💳", LINK: "🔗", PUZZLE: "👤", PROFILE: "👤",
  TRIAL: "🎁", SERVERS: "🌐", CONNECT: "🌐",
  CHART: "📊",
  STATUS_ACTIVE: "🟡", STATUS_EXPIRED: "🔴", STATUS_INACTIVE: "🔴",
  STATUS_LIMITED: "🟡", STATUS_DISABLED: "🔴",
};
const DEFAULT_CUSTOM_EMOJI_CHAR = "🙂";

const DEFAULT_MENU_EMOJI_KEY_BY_ID: Record<string, string> = {
  tariffs: "PACKAGE",
  proxy: "SERVERS",
  my_proxy: "SERVERS",
  singbox: "SERVERS",
  my_singbox: "SERVERS",
  profile: "PUZZLE",
  devices: "DEVICES",
  topup: "CARD",
  referral: "LINK",
  trial: "TRIAL",
  vpn: "SERVERS",
  cabinet: "SERVERS",
  support: "NOTE",
  tickets: "NOTE",
  promocode: "STAR",
  extra_options: "PACKAGE",
};

function getMenuEmojiKey(
  config: Awaited<ReturnType<typeof api.getPublicConfig>> | null | undefined,
  menuId: string
): string | null | undefined {
  const btn = config?.botButtons?.find((b) => b.id === menuId);
  if (btn && btn.emojiKey === "") return null;
  return btn?.emojiKey || DEFAULT_MENU_EMOJI_KEY_BY_ID[menuId];
}

/** Заголовок с эмодзи: если в botEmojis есть tgEmojiId для ключа — добавляем entity (премиум-эмодзи в тексте). */
function titleWithEmoji(
  emojiKey: string,
  rest: string,
  botEmojis?: Record<string, { unicode?: string; tgEmojiId?: string }> | null
): { text: string; entities: CustomEmojiEntity[] } {
  const entry = botEmojis?.[emojiKey];
  const unicode = entry?.unicode?.trim() || DEFAULT_EMOJI_UNICODE[emojiKey] || "•";
  const space = rest.startsWith("\n") ? "" : " ";
  const text = unicode + space + rest;
  const entities: CustomEmojiEntity[] = [];
  if (entry?.tgEmojiId) {
    const len = firstCharLengthUtf16(unicode);
    if (len > 0) entities.push({ type: "custom_emoji", offset: 0, length: len, custom_emoji_id: entry.tgEmojiId });
  }
  return { text, entities };
}

function applyCustomEmojiPlaceholders(
  text: string,
  botEmojis?: Record<string, { unicode?: string; tgEmojiId?: string }> | null
): { text: string; entities: CustomEmojiEntity[] } {
  if (!text) return { text, entities: [] };
  const entities: CustomEmojiEntity[] = [];
  const re = /\{\{([A-Z0-9_]+)\}\}/g;
  let out = "";
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const key = match[1]!;
    out += text.slice(lastIdx, match.index);
    const entry = botEmojis?.[key];
    const fallbackUnicode = DEFAULT_EMOJI_UNICODE[key];
    const unicode = entry?.unicode?.trim() || (entry?.tgEmojiId ? DEFAULT_CUSTOM_EMOJI_CHAR : "") || fallbackUnicode || "";
    if (unicode) {
      const offset = out.length;
      out += unicode;
      if (entry?.tgEmojiId) {
        entities.push({ type: "custom_emoji", offset, length: unicode.length, custom_emoji_id: entry.tgEmojiId });
      }
    } else {
      out += match[0];
    }
    lastIdx = match.index + match[0].length;
  }
  out += text.slice(lastIdx);
  return { text: out, entities };
}

function titleWithEmojiAndCustomEmojis(
  emojiKey: string,
  rest: string,
  botEmojis?: Record<string, { unicode?: string; tgEmojiId?: string }> | null
): { text: string; entities: CustomEmojiEntity[] } {
  const entry = botEmojis?.[emojiKey];
  const unicode = entry?.unicode?.trim() || DEFAULT_EMOJI_UNICODE[emojiKey] || "•";
  const space = rest.startsWith("\n") ? "" : " ";
  const leading = unicode + space;
  const { text: restText, entities: restEntities } = applyCustomEmojiPlaceholders(rest, botEmojis);
  const entities: CustomEmojiEntity[] = [];
  if (entry?.tgEmojiId) {
    const len = firstCharLengthUtf16(unicode);
    if (len > 0) entities.push({ type: "custom_emoji", offset: 0, length: len, custom_emoji_id: entry.tgEmojiId });
  }
  for (const e of restEntities) {
    entities.push({ ...e, offset: e.offset + leading.length });
  }
  return { text: leading + restText, entities };
}

function titleWithOptionalEmoji(
  emojiKey: string | null | undefined,
  rest: string,
  botEmojis?: Record<string, { unicode?: string; tgEmojiId?: string }> | null
): { text: string; entities: CustomEmojiEntity[] } {
  if (!emojiKey) return applyCustomEmojiPlaceholders(rest, botEmojis);
  return titleWithEmojiAndCustomEmojis(emojiKey, rest, botEmojis);
}

/** Полный текст главного меню + entities для премиум-эмодзи в тексте (владелец бота должен иметь Telegram Premium). */
function buildMainMenuText(opts: {
  serviceName: string;
  balance: number;
  currency: string;
  subscription: unknown;
  /** Отображаемое имя тарифа с бэкенда: Триал, название с сайта или «Тариф не выбран» */
  tariffDisplayName?: string | null;
  menuTexts?: Record<string, string> | null;
  menuLineVisibility?: Record<string, boolean> | null;
  menuTextCustomEmojiIds?: Record<string, string> | null;
  botEmojis?: Record<string, { unicode?: string; tgEmojiId?: string }> | null;
  /** Client's preferred language (e.g. "ru", "en", "zh"). Defaults to "zh". */
  lang?: string;
}): { text: string; entities: CustomEmojiEntity[] } {
  const { serviceName, balance, currency, subscription, tariffDisplayName, menuTexts, menuLineVisibility, menuTextCustomEmojiIds, botEmojis, lang = "zh" } = opts;
  const name = serviceName.trim() || L(lang, "cabinet");
  const balanceStr = formatMoney(balance, currency);
  const lines: string[] = [];
  const lineStartKeys: (string | null)[] = [];
  const lineEntitiesByIndex: CustomEmojiEntity[][] = [];
  const shouldShow = (key: string) => menuLineVisibility?.[key] !== false;
  const pushLine = (key: string, text: string) => {
    if (!shouldShow(key)) return;
    const { text: processed, entities } = applyCustomEmojiPlaceholders(text, botEmojis);
    lines.push(processed);
    lineStartKeys.push(key);
    lineEntitiesByIndex.push(entities);
  };

  pushLine("welcomeGreeting", t(menuTexts, "welcomeGreeting", lang));
  pushLine("welcomeTitlePrefix", t(menuTexts, "welcomeTitlePrefix", lang) + name);
  pushLine("balancePrefix", t(menuTexts, "balancePrefix", lang) + balanceStr);

  const user = getSubUser(subscription);
  const url = getSubscriptionUrl(subscription);
  const tariffName = (tariffDisplayName && tariffDisplayName.trim()) || L(lang, "tariffNotSelected");
  pushLine("tariffPrefix", t(menuTexts, "tariffPrefix", lang) + tariffName);

  if (!user && !url) {
    pushLine("subscriptionPrefix", t(menuTexts, "subscriptionPrefix", lang) + t(menuTexts, "statusInactive", lang));
    pushLine("trafficPrefix", t(menuTexts, "trafficPrefix", lang) + " 0.00 GB");
    pushLine("chooseAction", t(menuTexts, "chooseAction", lang));
  } else {
    const expireAt = user?.expireAt ?? user?.expirationDate ?? user?.expire_at;
    let expireDate: Date | null = null;
    if (expireAt != null) {
      const d = typeof expireAt === "number" ? new Date(expireAt * 1000) : new Date(String(expireAt));
      if (!Number.isNaN(d.getTime())) expireDate = d;
    }
    const status = (user?.status ?? user?.userStatus ?? "ACTIVE") as string;
    const statusLabel =
      status === "ACTIVE" ? t(menuTexts, "statusActive", lang)
      : status === "EXPIRED" ? t(menuTexts, "statusExpired", lang)
      : status === "LIMITED" ? t(menuTexts, "statusLimited", lang)
      : status === "DISABLED" ? t(menuTexts, "statusDisabled", lang)
      : `🟡 ${status}`;
    const expireStr = expireDate
      ? expireDate.toLocaleString(lang === "zh" ? "zh-CN" : lang === "en" ? "en-GB" : "ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "—";
    const daysLeft =
      expireDate && expireDate > new Date()
        ? Math.max(0, Math.ceil((expireDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
        : null;

    pushLine("subscriptionPrefix", t(menuTexts, "subscriptionPrefix", lang) + statusLabel);
    pushLine("expirePrefix", t(menuTexts, "expirePrefix", lang) + expireStr);
    if (daysLeft != null) {
      pushLine("daysLeftPrefix", t(menuTexts, "daysLeftPrefix", lang) + formatDaysForLang(daysLeft, lang));
    }
    const deviceLimit = user?.hwidDeviceLimit ?? user?.deviceLimit ?? user?.device_limit;
    const devicesUsed = user?.devicesUsed ?? user?.devices_used;
    if (deviceLimit != null && typeof deviceLimit === "number") {
      const available = devicesUsed != null ? Math.max(0, deviceLimit - Number(devicesUsed)) : deviceLimit;
      pushLine("devicesLabel", t(menuTexts, "devicesLabel", lang) + available + t(menuTexts, "devicesAvailable", lang));
    }
    const trafficUsedBytes =
      (user?.userTraffic as { usedTrafficBytes?: number } | undefined)?.usedTrafficBytes ??
      user?.trafficUsedBytes ??
      user?.usedTrafficBytes ??
      user?.traffic_used_bytes;
    const trafficLimitBytes = user?.trafficLimitBytes ?? user?.traffic_limit_bytes;
    const usedNum = typeof trafficUsedBytes === "string" ? parseFloat(trafficUsedBytes) : Number(trafficUsedBytes);
    const limitNum = typeof trafficLimitBytes === "string" ? parseFloat(trafficLimitBytes) : Number(trafficLimitBytes);
    if (Number.isFinite(usedNum) && Number.isFinite(limitNum) && limitNum > 0) {
      const pct = usedNum / limitNum;
      const usedGb = bytesToGb(usedNum);
      const limitGb = bytesToGb(limitNum);
      const pctInt = Math.round(Math.min(100, pct * 100));
      pushLine("trafficPrefix", t(menuTexts, "trafficPrefix", lang) + `🟢 ${progressBar(pct, 14)} ${pctInt}% (${usedGb} / ${limitGb} GB)`);
    } else if (Number.isFinite(usedNum)) {
      pushLine("trafficPrefix", t(menuTexts, "trafficPrefix", lang) + ` ${bytesToGb(usedNum)} GB`);
    } else {
      pushLine("trafficPrefix", t(menuTexts, "trafficPrefix", lang) + " 0.00 GB");
    }
    if (url) {
      if (shouldShow("linkLabel")) {
        const { text: label, entities } = applyCustomEmojiPlaceholders(t(menuTexts, "linkLabel", lang), botEmojis);
        lines.push(label, url);
        lineStartKeys.push("linkLabel", null);
        lineEntitiesByIndex.push(entities, []);
      }
    }
    pushLine("chooseAction", t(menuTexts, "chooseAction", lang));
  }

  const text = lines.join("\n");
  const entities: CustomEmojiEntity[] = [];
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineEntities = lineEntitiesByIndex[i] ?? [];
    for (const e of lineEntities) {
      entities.push({ ...e, offset: e.offset + offset });
    }
    const key = lineStartKeys[i];
    if (key && menuTextCustomEmojiIds?.[key] && !lineEntities.some((e) => e.offset === 0)) {
      const line = lines[i]!;
      const firstLen = firstCharLengthUtf16(line);
      if (firstLen > 0) entities.push({ type: "custom_emoji", offset, length: firstLen, custom_emoji_id: menuTextCustomEmojiIds[key]! });
    }
    offset += lines[i]!.length + 1;
  }
  return { text, entities };
}

const TELEGRAM_CAPTION_MAX = 1024;

/** Логотип из настроек: data URL или URL → источник для sendPhoto/sendAnimation и признак GIF */
function logoToMediaSource(logo: string | null | undefined): { source: InputFile | string; isGif: boolean } | null {
  if (!logo || !logo.trim()) return null;
  const s = logo.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) {
    const isGif = /\.gif(\?|$)/i.test(s);
    return { source: s, isGif };
  }
  const base64Match = /^data:image\/([a-z]+);base64,(.+)$/i.exec(s);
  if (base64Match) {
    try {
      const subtype = (base64Match[1] ?? "").toLowerCase();
      const buf = Buffer.from(base64Match[2]!, "base64");
      if (buf.length > 0) {
        const isGif = subtype === "gif";
        const name = isGif ? "logo.gif" : "logo.png";
        return { source: new InputFile(buf, name), isGif };
      }
    } catch {
      return null;
    }
  }
  try {
    const buf = Buffer.from(s, "base64");
    if (buf.length > 0) return { source: new InputFile(buf, "logo.png"), isGif: false };
  } catch {
    // ignore
  }
  return null;
}

/** Редактировать сообщение: текст и клавиатура (если с фото/анимацией — caption, иначе text) */
async function editMessageContent(ctx: {
  editMessageCaption: (opts: { caption: string; caption_entities?: CustomEmojiEntity[]; reply_markup?: InlineMarkup }) => Promise<unknown>;
  editMessageText: (text: string, opts?: { entities?: CustomEmojiEntity[]; reply_markup?: InlineMarkup }) => Promise<unknown>;
  callbackQuery?: { message?: { photo?: unknown[]; animation?: unknown } };
}, text: string, reply_markup: InlineMarkup, entities?: CustomEmojiEntity[]): Promise<unknown> {
  const msg = ctx.callbackQuery?.message;
  const hasPhoto = msg && typeof msg === "object" && "photo" in msg && Array.isArray((msg as { photo: unknown[] }).photo) && (msg as { photo: unknown[] }).photo.length > 0;
  const hasAnimation = msg && typeof msg === "object" && "animation" in msg && (msg as { animation: unknown }).animation != null;
  const hasMediaWithCaption = hasPhoto || hasAnimation;
  const caption = text.length > TELEGRAM_CAPTION_MAX ? text.slice(0, TELEGRAM_CAPTION_MAX - 3) + "..." : text;
  const truncatedEntities = text.length > TELEGRAM_CAPTION_MAX && entities ? entities.filter((e) => e.offset + e.length <= TELEGRAM_CAPTION_MAX - 3) : entities;
  if (hasMediaWithCaption) return ctx.editMessageCaption({ caption, caption_entities: truncatedEntities?.length ? truncatedEntities : undefined, reply_markup });
  return ctx.editMessageText(text, { entities: entities?.length ? entities : undefined, reply_markup });
}

function formatMoney(amount: number, currency: string): string {
  const c = currency.toUpperCase();
  const sym = c === "RUB" ? "₽" : c === "USD" ? "$" : c === "CNY" ? "¥" : c;
  return `${amount} ${sym}`;
}

/** Парсинг start-параметра: ref_CODE, c_SOURCE_CAMPAIGN или c_SOURCE_MEDIUM_CAMPAIGN, можно комбинировать ref_ABC_c_facebook_summer */
function parseStartPayload(payload: string): { refCode?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  const out: { refCode?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string } = {};
  const cIdx = payload.indexOf("_c_");
  const refPart = cIdx >= 0 ? payload.slice(0, cIdx) : payload;
  const campaignPart = cIdx >= 0 ? payload.slice(cIdx + 3) : "";
  if (refPart && /^ref_?/i.test(refPart)) {
    const code = refPart.replace(/^ref_?/i, "").trim();
    if (code) out.refCode = code;
  }
  if (campaignPart) {
    const parts = campaignPart.split("_").filter(Boolean);
    if (parts.length >= 2) {
      out.utm_source = parts[0];
      out.utm_campaign = parts.length === 2 ? parts[1] : parts[parts.length - 1];
      if (parts.length >= 3) out.utm_medium = parts.slice(1, -1).join("_");
    }
  }
  return out;
}

// ——— /start с реферальным кодом (например /start ref_ABC123) или промо (/start promo_XXXX) или кампания (/start c_facebook_summer)
bot.command("start", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  const telegramId = String(from.id);
  const telegramUsername = from.username ?? undefined;
  const payload = ctx.match?.trim() || "";

  // Определяем тип deeplink
  const isPromo = /^promo_/i.test(payload);
  const promoCode = isPromo ? payload.replace(/^promo_/i, "") : undefined;
  const parsed = parseStartPayload(payload);
  const refCode = !isPromo ? (parsed.refCode ?? (payload.replace(/^ref_?/i, "").trim() || undefined)) : undefined;

  try {
    const config = await api.getPublicConfig();
    const name = config?.serviceName?.trim() || L("zh", "cabinet");

    const auth = await api.registerByTelegram({
      telegramId,
      telegramUsername,
      preferredLang: resolveLangCode(from.language_code, config?.activeLanguages),
      preferredCurrency: config?.defaultCurrency ?? "usd",
      referralCode: refCode,
      utm_source: parsed.utm_source,
      utm_medium: parsed.utm_medium,
      utm_campaign: parsed.utm_campaign,
    });

    setToken(from.id, auth.token);
    const client = auth.client;
    const clientLang = (client?.preferredLang ?? config?.activeLanguages?.[0] ?? "zh").toLowerCase();
    setLang(from.id, clientLang);

    // Если это промо-ссылка — активируем промокод
    if (promoCode) {
      try {
        const result = await api.activatePromo(auth.token, promoCode);
        await ctx.reply(`✅ ${result.message}\n\n${L(clientLang, "pressStartForMenu")}`);
        return;
      } catch (promoErr: unknown) {
        const promoMsg = promoErr instanceof Error ? promoErr.message : L(clientLang, "promoActivationError");
        await ctx.reply(`❌ ${promoMsg}\n\n${L(clientLang, "pressStartForMenu")}`);
        return;
      }
    }

    // Проверка подписки на канал
    if (await enforceSubscription(ctx, config)) return;

    const [subRes, proxyRes, singboxRes] = await Promise.all([
      api.getSubscription(auth.token).catch(() => ({ subscription: null })),
      api.getPublicProxyTariffs().catch(() => ({ items: [] })),
      api.getPublicSingboxTariffs().catch(() => ({ items: [] })),
    ]);
    const vpnUrl = getSubscriptionUrl(subRes.subscription);
    const showTrial = Boolean(config?.trialEnabled && !client?.trialUsed);
    const showProxy = proxyRes.items?.some((c: { tariffs: unknown[] }) => c.tariffs?.length > 0) ?? false;
    const showSingbox = singboxRes.items?.some((c: { tariffs: unknown[] }) => c.tariffs?.length > 0) ?? false;
    const appUrl = config?.publicAppUrl?.replace(/\/$/, "") ?? null;

    const { text, entities } = buildMainMenuText({
      serviceName: name,
      balance: client?.balance ?? 0,
      currency: client?.preferredCurrency ?? config?.defaultCurrency ?? "usd",
      subscription: subRes.subscription,
      tariffDisplayName: (subRes as { tariffDisplayName?: string | null }).tariffDisplayName ?? null,
      menuTexts: getLocaleTexts(config, clientLang),
      menuLineVisibility: config?.botMenuLineVisibility ?? null,
      menuTextCustomEmojiIds: config?.menuTextCustomEmojiIds ?? null,
      botEmojis: config?.botEmojis ?? null,
      lang: clientLang,
    });
    const caption = text.length > TELEGRAM_CAPTION_MAX ? text.slice(0, TELEGRAM_CAPTION_MAX - 3) + "..." : text;
    const captionEntities = text.length > TELEGRAM_CAPTION_MAX && entities.length ? entities.filter((e) => e.offset + e.length <= TELEGRAM_CAPTION_MAX - 3) : entities;
    const hasSupportLinks = !!(config?.supportLink || config?.agreementLink || config?.offerLink || config?.instructionsLink);
    const markup = mainMenu({
      showTrial,
      showVpn: Boolean(vpnUrl),
      showProxy,
      showSingbox,
      appUrl,
      botButtons: config?.botButtons ?? null,
      botBackLabel: config?.botBackLabel ?? null,
      hasSupportLinks,
      showTickets: config?.ticketsEnabled === true,
      showExtraOptions: config?.sellOptionsEnabled === true && (config?.sellOptions?.length ?? 0) > 0,
      buttonsPerRow: config?.botButtonsPerRow ?? 1,
      remnaSubscriptionUrl: config?.useRemnaSubscriptionPage ? vpnUrl : null,
      lang: clientLang,
    });
    const isBotAdmin = config?.botAdminTelegramIds?.includes(String(from.id)) ?? false;
    if (isBotAdmin) {
      markup.inline_keyboard.push([{ text: L(clientLang, "btnAdminPanel"), callback_data: "admin:menu" }]);
    }

    const media = logoToMediaSource(config?.logoBot);
    if (media) {
      const opts = { caption, caption_entities: captionEntities.length ? captionEntities : undefined, reply_markup: markup };
      if (media.isGif) {
        await ctx.replyWithAnimation(media.source, opts);
      } else {
        await ctx.replyWithPhoto(media.source, opts);
      }
    } else {
      await ctx.reply(text, { entities: entities.length ? entities : undefined, reply_markup: markup });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : L(getLang(from.id), "loginError");
    await ctx.reply(`❌ ${msg}`);
  }
});

// ——— /link КОД — привязка Telegram к аккаунту (код из кабинета на сайте)
bot.command("link", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  const lg = getLang(from.id);
  const code = (ctx.match?.trim() || "").replace(/\s+/g, " ");
  if (!code) {
    await ctx.reply(L(lg, "linkUsage"));
    return;
  }
  try {
    await api.linkTelegramFromBot(code, from.id, from.username ?? undefined);
    await ctx.reply(L(lg, "linkSuccess"));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : L(lg, "linkError");
    await ctx.reply(`❌ ${msg}`);
  }
});

// ——— Callback: меню и действия
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery().catch(() => {});

  // Админ-панель в боте (не требует токена пользователя)
  if (data.startsWith("admin:")) {
    const config = await api.getPublicConfig();
    const lg = getLang(userId);
    if (!config?.botAdminTelegramIds?.includes(String(userId))) {
      await ctx.answerCallbackQuery({ text: L(lg, "accessDenied"), show_alert: true }).catch(() => {});
      return;
    }
    if (data === "admin:menu") {
      lastAdminSearch.delete(userId);
      awaitingAdminSearch.delete(userId);
      awaitingAdminBalance.delete(userId);
      awaitingBroadcastMessage.delete(userId);
      lastBroadcastMessage.delete(userId);
      lastSquadsForAdd.delete(userId);
      lastSquadsForRemove.delete(userId);
      const markup: InlineMarkup = {
        inline_keyboard: [
          [{ text: L(lg, "adminStats"), callback_data: "admin:stats" }],
          [{ text: L(lg, "adminNotifications"), callback_data: "admin:notifications" }],
          [{ text: L(lg, "adminClients"), callback_data: "admin:clients:1" }],
          [{ text: L(lg, "adminSearch"), callback_data: "admin:search" }],
          [
            { text: L(lg, "adminPaymentsPending"), callback_data: "admin:payments:pending:1" },
            { text: L(lg, "adminPaymentsRecent"), callback_data: "admin:payments:paid:1" },
          ],
          [{ text: L(lg, "adminBroadcast"), callback_data: "admin:broadcast" }],
          [{ text: L(lg, "backToMenu"), callback_data: "menu:main" }],
        ],
      };
      await editMessageContent(ctx, L(lg, "adminTitle"), markup);
      return;
    }
    if (data === "admin:notifications") {
      const settings = await api.getBotAdminNotificationSettings(userId);
      const s = settings;
      const yesNo = (v: boolean) => (v ? L(lg, "adminOn") : L(lg, "adminOff"));
      const text =
        L(lg, "adminNotifTitle") + "\n\n" +
        `${L(lg, "adminNotifBalance")}: ${yesNo(s.notifyBalanceTopup)}\n` +
        `${L(lg, "adminNotifTariff")}: ${yesNo(s.notifyTariffPayment)}\n` +
        `${L(lg, "adminNotifNewClient")}: ${yesNo(s.notifyNewClient)}\n` +
        `${L(lg, "adminNotifNewTicket")}: ${yesNo(s.notifyNewTicket)}\n\n` +
        L(lg, "adminNotifToggleHint");
      const markup: InlineMarkup = {
        inline_keyboard: [
          [{ text: `💰 ${L(lg, "adminNotifBalance")}: ${yesNo(s.notifyBalanceTopup)}`, callback_data: "admin:notif:balance" }],
          [{ text: `📦 ${L(lg, "adminNotifTariff")}: ${yesNo(s.notifyTariffPayment)}`, callback_data: "admin:notif:tariff" }],
          [{ text: `👤 ${L(lg, "adminNotifNewClient")}: ${yesNo(s.notifyNewClient)}`, callback_data: "admin:notif:newclient" }],
          [{ text: `🎫 ${L(lg, "adminNotifNewTicket")}: ${yesNo(s.notifyNewTicket)}`, callback_data: "admin:notif:newticket" }],
          [{ text: L(lg, "backToAdmin"), callback_data: "admin:menu" }],
        ],
      };
      await editMessageContent(ctx, text, markup);
      return;
    }
    if (data.startsWith("admin:notif:")) {
      const kind = data.slice("admin:notif:".length);
      const current = await api.getBotAdminNotificationSettings(userId);
      const payload: Partial<api.BotAdminNotificationSettings> = {};
      if (kind === "balance") {
        payload.notifyBalanceTopup = !current.notifyBalanceTopup;
      } else if (kind === "tariff") {
        payload.notifyTariffPayment = !current.notifyTariffPayment;
      } else if (kind === "newclient") {
        payload.notifyNewClient = !current.notifyNewClient;
      } else if (kind === "newticket") {
        payload.notifyNewTicket = !current.notifyNewTicket;
      }
      const updated = await api.patchBotAdminNotificationSettings(userId, payload);
      const s = updated;
      const yesNo = (v: boolean) => (v ? L(lg, "adminOn") : L(lg, "adminOff"));
      const text =
        L(lg, "adminNotifTitle") + "\n\n" +
        `${L(lg, "adminNotifBalance")}: ${yesNo(s.notifyBalanceTopup)}\n` +
        `${L(lg, "adminNotifTariff")}: ${yesNo(s.notifyTariffPayment)}\n` +
        `${L(lg, "adminNotifNewClient")}: ${yesNo(s.notifyNewClient)}\n` +
        `${L(lg, "adminNotifNewTicket")}: ${yesNo(s.notifyNewTicket)}\n\n` +
        L(lg, "adminNotifToggleHint");
      const markup: InlineMarkup = {
        inline_keyboard: [
          [{ text: `💰 ${L(lg, "adminNotifBalance")}: ${yesNo(s.notifyBalanceTopup)}`, callback_data: "admin:notif:balance" }],
          [{ text: `📦 ${L(lg, "adminNotifTariff")}: ${yesNo(s.notifyTariffPayment)}`, callback_data: "admin:notif:tariff" }],
          [{ text: `👤 ${L(lg, "adminNotifNewClient")}: ${yesNo(s.notifyNewClient)}`, callback_data: "admin:notif:newclient" }],
          [{ text: `🎫 ${L(lg, "adminNotifNewTicket")}: ${yesNo(s.notifyNewTicket)}`, callback_data: "admin:notif:newticket" }],
          [{ text: L(lg, "backToAdmin"), callback_data: "admin:menu" }],
        ],
      };
      await editMessageContent(ctx, text, markup);
      return;
    }
    if (data === "admin:search") {
      awaitingAdminSearch.add(userId);
      await editMessageContent(
        ctx,
        L(lg, "adminSearchTitle"),
        { inline_keyboard: [[{ text: L(lg, "cancel"), callback_data: "admin:menu" }]] }
      );
      return;
    }
    if (data === "admin:stats") {
      const stats = await api.getBotAdminStats(userId);
      const u = stats.users;
      const s = stats.sales;
      const text =
        `${L(lg, "adminStatsTitle")}\n\n${L(lg, "adminStatsUsers")}: ${u.total}\n${L(lg, "adminStatsWithRemna")}: ${u.withRemna}\n${L(lg, "adminStatsNew7")}: ${u.newLast7Days}\n${L(lg, "adminStatsNew30")}: ${u.newLast30Days}\n\n` +
        `${L(lg, "adminStatsSalesTotal")}: ${s.totalAmount} ₽ (${s.totalCount})\n${L(lg, "adminStatsSales7")}: ${s.last7DaysAmount} ₽ (${s.last7DaysCount})\n${L(lg, "adminStatsSales30")}: ${s.last30DaysAmount} ₽ (${s.last30DaysCount})`;
      const back: InlineMarkup = { inline_keyboard: [[{ text: L(lg, "backToAdmin"), callback_data: "admin:menu" }]] };
      await editMessageContent(ctx, text, back);
      return;
    }
    if (data.startsWith("admin:clients:")) {
      const suffix = data.slice("admin:clients:".length);
      if (suffix === "clear") {
        lastAdminSearch.delete(userId);
        // Показать первую страницу без поиска
        const { items, total, limit } = await api.getBotAdminClients(userId, 1);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        let msg = `${L(lg, "adminClientsTitle")} (${total})\n\n`;
        items.forEach((c, i) => {
          const label = c.email || c.telegramUsername || c.telegramId || c.id.slice(0, 8);
          msg += `${i + 1}. ${label} ${c.isBlocked ? "🚫" : ""}\n`;
        });
        msg += `\n${L(lg, "adminPage")} 1/${totalPages}`;
        const rows: InlineMarkup["inline_keyboard"] = [];
        items.forEach((c) => {
          rows.push([
            {
              text: `${c.email || c.telegramUsername || c.telegramId || c.id.slice(0, 8)} ${c.isBlocked ? "🚫" : ""}`,
              callback_data: `admin:client:${c.id}`,
            },
          ]);
        });
        const nav: InlineMarkup["inline_keyboard"][0] = [];
        nav.push({ text: L(lg, "backToAdmin"), callback_data: "admin:menu" });
        if (totalPages > 1) nav.push({ text: L(lg, "adminNext"), callback_data: "admin:clients:2" });
        rows.push(nav);
        await editMessageContent(ctx, msg, { inline_keyboard: rows });
        return;
      }
      const page = parseInt(suffix, 10) || 1;
      const search = lastAdminSearch.get(userId);
      const { items, total, limit } = await api.getBotAdminClients(userId, page, search);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      let msg = search ? `${L(lg, "adminClientSearch")} «${search}» (${total})\n\n` : `${L(lg, "adminClientsTitle")} (${total})\n\n`;
      items.forEach((c, i) => {
        const label = c.email || c.telegramUsername || c.telegramId || c.id.slice(0, 8);
        msg += `${(page - 1) * limit + i + 1}. ${label} ${c.isBlocked ? "🚫" : ""}\n`;
      });
      msg += `\n${L(lg, "adminPage")} ${page}/${totalPages}`;
      const rows: InlineMarkup["inline_keyboard"] = [];
      items.forEach((c) => {
        rows.push([
          {
            text: `${c.email || c.telegramUsername || c.telegramId || c.id.slice(0, 8)} ${c.isBlocked ? "🚫" : ""}`,
            callback_data: `admin:client:${c.id}`,
          },
        ]);
      });
      const nav: InlineMarkup["inline_keyboard"][0] = [];
      if (page > 1) nav.push({ text: L(lg, "adminPrev"), callback_data: `admin:clients:${page - 1}` });
      nav.push({ text: L(lg, "backToAdmin"), callback_data: "admin:menu" });
      if (search) nav.push({ text: L(lg, "adminResetSearch"), callback_data: "admin:clients:clear" });
      if (page < totalPages) nav.push({ text: L(lg, "adminNext"), callback_data: `admin:clients:${page + 1}` });
      rows.push(nav);
      await editMessageContent(ctx, msg, { inline_keyboard: rows });
      return;
    }
    if (data.startsWith("admin:client:")) {
      const clientId = data.slice("admin:client:".length);
      if (!clientId) return;
      const client = await api.getBotAdminClient(userId, clientId);
      const created = client.createdAt ? new Date(client.createdAt).toLocaleString(lg === "zh" ? "zh-CN" : lg === "en" ? "en-US" : "ru-RU") : "—";
      let text = `👤 ${client.email || client.telegramUsername || client.telegramId || client.id}\n\n`;
      text += `${L(lg, "adminClientId")}: ${client.id}\n${L(lg, "adminClientBalance")}: ${client.balance}\n${L(lg, "adminClientReferrals")}: ${client._count?.referrals ?? 0}\n${L(lg, "adminClientCreated")}: ${created}\n`;
      if (client.isBlocked) text += `\n${L(lg, "adminClientBlocked")}${client.blockReason ? `: ${client.blockReason}` : ""}`;
      const kb: InlineMarkup["inline_keyboard"] = [];
      if (client.isBlocked) {
        kb.push([{ text: L(lg, "adminUnblock"), callback_data: `admin:unblock:${client.id}` }]);
      } else {
        kb.push([{ text: L(lg, "adminBlock"), callback_data: `admin:block:${client.id}` }]);
      }
      kb.push([{ text: L(lg, "adminTopupBalance"), callback_data: `admin:balance:${client.id}` }]);
      if (client.remnawaveUuid) {
        kb.push(
          [
            { text: L(lg, "adminRevokeSubscription"), callback_data: `admin:remna:revoke:${client.id}` },
            { text: L(lg, "adminDisableRemna"), callback_data: `admin:remna:disable:${client.id}` },
          ],
          [
            { text: L(lg, "adminEnableRemna"), callback_data: `admin:remna:enable:${client.id}` },
            { text: L(lg, "adminResetTraffic"), callback_data: `admin:remna:reset:${client.id}` },
          ],
          [
            { text: L(lg, "adminAddSquad"), callback_data: `admin:squad:add:${client.id}` },
            { text: L(lg, "adminRemoveSquad"), callback_data: `admin:squad:remove:${client.id}` },
          ]
        );
      }
      kb.push([{ text: L(lg, "backToList"), callback_data: "admin:clients:1" }]);
      await editMessageContent(ctx, text, { inline_keyboard: kb });
      return;
    }
    if (data.startsWith("admin:balance:")) {
      const clientId = data.slice("admin:balance:".length);
      if (!clientId) return;
      awaitingAdminBalance.set(userId, clientId);
      await editMessageContent(
        ctx,
        L(lg, "adminTopupBalanceTitle"),
        { inline_keyboard: [[{ text: L(lg, "cancel"), callback_data: "admin:menu" }]] }
      );
      return;
    }
    if (data.startsWith("admin:remna:revoke:")) {
      const clientId = data.slice("admin:remna:revoke:".length);
      if (!clientId) return;
      try {
        await api.postBotAdminClientRemnaRevoke(userId, clientId);
        await editMessageContent(ctx, L(lg, "adminSubscriptionRevoked"), {
          inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
        });
      } catch (e: unknown) {
        await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
          inline_keyboard: [[{ text: L(lg, "back"), callback_data: `admin:client:${clientId}` }]],
        });
      }
      return;
    }
    if (data.startsWith("admin:remna:disable:")) {
      const clientId = data.slice("admin:remna:disable:".length);
      if (!clientId) return;
      try {
        await api.postBotAdminClientRemnaDisable(userId, clientId);
        await editMessageContent(ctx, L(lg, "adminRemnaDisabled"), {
          inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
        });
      } catch (e: unknown) {
        await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
          inline_keyboard: [[{ text: L(lg, "back"), callback_data: `admin:client:${clientId}` }]],
        });
      }
      return;
    }
    if (data.startsWith("admin:remna:enable:")) {
      const clientId = data.slice("admin:remna:enable:".length);
      if (!clientId) return;
      try {
        await api.postBotAdminClientRemnaEnable(userId, clientId);
        await editMessageContent(ctx, L(lg, "adminRemnaEnabled"), {
          inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
        });
      } catch (e: unknown) {
        await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
          inline_keyboard: [[{ text: L(lg, "back"), callback_data: `admin:client:${clientId}` }]],
        });
      }
      return;
    }
    if (data.startsWith("admin:remna:reset:")) {
      const clientId = data.slice("admin:remna:reset:".length);
      if (!clientId) return;
      try {
        await api.postBotAdminClientRemnaResetTraffic(userId, clientId);
        await editMessageContent(ctx, L(lg, "adminTrafficReset"), {
          inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
        });
      } catch (e: unknown) {
        await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
          inline_keyboard: [[{ text: L(lg, "back"), callback_data: `admin:client:${clientId}` }]],
        });
      }
      return;
    }
    if (data.startsWith("admin:squad:add:")) {
      const rest = data.slice("admin:squad:add:".length);
      const parts = rest.split(":");
      const clientId = parts[0];
      const indexStr = parts[1];
      if (!clientId) return;
      if (indexStr !== undefined) {
        const index = parseInt(indexStr, 10);
        const stored = lastSquadsForAdd.get(userId);
        if (!stored || index < 0 || index >= stored.items.length) {
          await editMessageContent(ctx, L(lg, "adminSquadSessionExpired"), {
            inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
          });
          return;
        }
        const squadUuid = stored.items[index]!.uuid;
        try {
          await api.postBotAdminClientRemnaSquadAdd(userId, clientId, squadUuid);
          lastSquadsForAdd.delete(userId);
          await editMessageContent(ctx, L(lg, "adminSquadAdded").replace("{{name}}", stored.items[index]!.name), {
            inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
          });
        } catch (e: unknown) {
          await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
            inline_keyboard: [[{ text: L(lg, "back"), callback_data: `admin:squad:add:${clientId}` }]],
          });
        }
        return;
      }
      try {
        const { items } = await api.getBotAdminRemnaSquadsInternal(userId);
        if (!items.length) {
          await editMessageContent(ctx, L(lg, "adminNoSquads"), {
            inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
          });
          return;
        }
        lastSquadsForAdd.set(userId, { clientId, items });
        const rows: InlineMarkup["inline_keyboard"] = items.slice(0, 15).map((s, i) => [
          { text: `➕ ${s.name || s.uuid.slice(0, 8)}`, callback_data: `admin:squad:add:${clientId}:${i}` },
        ]);
        rows.push([{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]);
        await editMessageContent(ctx, L(lg, "adminChooseSquadAdd"), { inline_keyboard: rows });
      } catch (e: unknown) {
        await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
          inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
        });
      }
      return;
    }
    if (data.startsWith("admin:squad:remove:")) {
      const rest = data.slice("admin:squad:remove:".length);
      const parts = rest.split(":");
      const clientId = parts[0];
      const indexStr = parts[1];
      if (!clientId) return;
      if (indexStr !== undefined) {
        const index = parseInt(indexStr, 10);
        const stored = lastSquadsForRemove.get(userId);
        if (!stored || index < 0 || index >= stored.items.length) {
          await editMessageContent(ctx, L(lg, "adminSquadSessionExpired"), {
            inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
          });
          return;
        }
        const squadUuid = stored.items[index]!.uuid;
        try {
          await api.postBotAdminClientRemnaSquadRemove(userId, clientId, squadUuid);
          lastSquadsForRemove.delete(userId);
          await editMessageContent(ctx, L(lg, "adminSquadRemoved").replace("{{name}}", stored.items[index]!.name), {
            inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
          });
        } catch (e: unknown) {
          await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
            inline_keyboard: [[{ text: L(lg, "back"), callback_data: `admin:squad:remove:${clientId}` }]],
          });
        }
        return;
      }
      try {
        const remna = await api.getBotAdminClientRemna(userId, clientId);
        const allSquads = await api.getBotAdminRemnaSquadsInternal(userId);
        const uuidToName = new Map(allSquads.items.map((s) => [s.uuid, s.name || s.uuid.slice(0, 8)]));
        const current = remna.activeInternalSquads.map((uuid) => ({ uuid, name: uuidToName.get(uuid) ?? uuid.slice(0, 8) }));
        if (!current.length) {
          await editMessageContent(ctx, L(lg, "adminNoUserSquads"), {
            inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
          });
          return;
        }
        lastSquadsForRemove.set(userId, { clientId, items: current });
        const rows: InlineMarkup["inline_keyboard"] = current.slice(0, 15).map((s, i) => [
          { text: `➖ ${s.name}`, callback_data: `admin:squad:remove:${clientId}:${i}` },
        ]);
        rows.push([{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]);
        await editMessageContent(ctx, L(lg, "adminChooseSquadRemoveFromUser"), { inline_keyboard: rows });
      } catch (e: unknown) {
        await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
          inline_keyboard: [[{ text: L(lg, "backToClient"), callback_data: `admin:client:${clientId}` }]],
        });
      }
      return;
    }
    if (data.startsWith("admin:payments:")) {
      const rest = data.slice("admin:payments:".length);
      const [status, pageStr] = rest.split(":");
      const page = parseInt(pageStr ?? "1", 10) || 1;
      const isPending = status === "pending";
      const { items, total, limit } = await api.getBotAdminPayments(userId, isPending ? "PENDING" : "PAID", page);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const title = isPending ? `${L(lg, "adminPaymentsPendingTitle")} (${total})` : `${L(lg, "adminPaymentsRecentTitle")} (${total})`;
      let msg = `${title}\n\n`;
      const rows: InlineMarkup["inline_keyboard"] = [];
      items.forEach((p, i) => {
        const label = `${p.amount} ${p.currency} — ${p.clientTelegramUsername || p.clientEmail || p.clientTelegramId || "—"}`;
        msg += `${(page - 1) * limit + i + 1}. ${label}\n`;
        if (isPending) {
          rows.push([{ text: `✅ ${p.amount} ${p.currency} — ${L(lg, "adminMarkAsPaid")}`, callback_data: `admin:pay:${p.id}` }]);
        }
      });
      msg += `\n${L(lg, "adminPage")} ${page}/${totalPages}`;
      const nav: InlineMarkup["inline_keyboard"][0] = [];
      if (page > 1) nav.push({ text: L(lg, "adminPrev"), callback_data: `admin:payments:${status}:${page - 1}` });
      nav.push({ text: L(lg, "backToAdmin"), callback_data: "admin:menu" });
      if (page < totalPages) nav.push({ text: L(lg, "adminNext"), callback_data: `admin:payments:${status}:${page + 1}` });
      rows.push(nav);
      await editMessageContent(ctx, msg, { inline_keyboard: rows });
      return;
    }
    if (data.startsWith("admin:pay:")) {
      const paymentId = data.slice("admin:pay:".length);
      if (!paymentId) return;
      try {
        await api.patchBotAdminPaymentMarkPaid(userId, paymentId);
        await editMessageContent(ctx, L(lg, "adminPaymentConfirmed"), {
          inline_keyboard: [[{ text: L(lg, "adminBackToPayments"), callback_data: "admin:payments:pending:1" }]],
        });
      } catch (e: unknown) {
        await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
          inline_keyboard: [[{ text: L(lg, "back"), callback_data: "admin:payments:pending:1" }]],
        });
      }
      return;
    }
    if (data === "admin:broadcast") {
      const counts = await api.getBotAdminBroadcastCount(userId);
      awaitingBroadcastMessage.add(userId);
      await editMessageContent(
        ctx,
        `${L(lg, "adminBroadcastTitle")}\n\n${L(lg, "adminBroadcastNow")}: Telegram ${counts.withTelegram}, Email ${counts.withEmail}\n\n${L(lg, "adminBroadcastSendPrompt")}`,
        { inline_keyboard: [[{ text: L(lg, "cancel"), callback_data: "admin:menu" }]] }
      );
      return;
    }
    if (data.startsWith("admin:bc:")) {
      const channel = data.slice("admin:bc:".length) as "tg" | "email" | "both";
      const raw = lastBroadcastMessage.get(userId);
      if (raw == null) {
        await editMessageContent(ctx, L(lg, "adminBroadcastTextNotFound"), {
          inline_keyboard: [[{ text: L(lg, "backToAdmin"), callback_data: "admin:menu" }]],
        });
        return;
      }
      const msg: BroadcastPayload = typeof raw === "string" ? { text: raw } : raw;
      const ch: "telegram" | "email" | "both" = channel === "tg" ? "telegram" : channel === "email" ? "email" : "both";
      const channelLabel = ch === "telegram" ? "Telegram" : ch === "email" ? "Email" : "Telegram + Email";
      // Сразу показываем, что рассылка запущена, чтобы было понятно и не нажимали повторно
      await editMessageContent(ctx, L(lg, "adminBroadcastStarted").replace("{{channel}}", channelLabel), {
        inline_keyboard: [[{ text: L(lg, "backToAdmin"), callback_data: "admin:menu" }]],
      });
      lastBroadcastMessage.delete(userId);
      try {
        const result = await api.postBotAdminBroadcast(userId, msg.text, ch, msg.photoFileId);
        const text = `${L(lg, "adminBroadcastDone")}\n\n${L(lg, "adminBroadcastSentTg")} ${result.sentTelegram}, ${L(lg, "adminBroadcastFailedTg")} ${result.failedTelegram}\n${L(lg, "adminBroadcastSentEmail")} ${result.sentEmail}, ${L(lg, "adminBroadcastFailedTg")} ${result.failedEmail}${result.errors?.length ? "\n\n" + L(lg, "adminBroadcastErrors") + ": " + result.errors.slice(0, 3).join("; ") : ""}`;
        await editMessageContent(ctx, text, {
          inline_keyboard: [[{ text: L(lg, "backToAdmin"), callback_data: "admin:menu" }]],
        });
      } catch (e: unknown) {
        await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
          inline_keyboard: [[{ text: L(lg, "backToAdmin"), callback_data: "admin:menu" }]],
        });
      }
      return;
    }
    if (data.startsWith("admin:block:")) {
      const clientId = data.slice("admin:block:".length);
      if (!clientId) return;
      await api.patchBotAdminClientBlock(userId, clientId, true);
      const client = await api.getBotAdminClient(userId, clientId);
      const created = client.createdAt ? new Date(client.createdAt).toLocaleString(lg === "zh" ? "zh-CN" : lg === "en" ? "en-US" : "ru-RU") : "—";
      let text = `👤 ${client.email || client.telegramUsername || client.telegramId || client.id}\n\n${L(lg, "adminClientId")}: ${client.id}\n${L(lg, "adminClientBalance")}: ${client.balance}\n${L(lg, "adminClientReferrals")}: ${client._count?.referrals ?? 0}\n${L(lg, "adminClientCreated")}: ${created}\n\n${L(lg, "adminClientBlocked")}`;
      const kb: InlineMarkup["inline_keyboard"] = [
        [{ text: L(lg, "adminUnblock"), callback_data: `admin:unblock:${client.id}` }],
        [{ text: L(lg, "backToList"), callback_data: "admin:clients:1" }],
      ];
      await editMessageContent(ctx, text, { inline_keyboard: kb });
      return;
    }
    if (data.startsWith("admin:unblock:")) {
      const clientId = data.slice("admin:unblock:".length);
      if (!clientId) return;
      await api.patchBotAdminClientBlock(userId, clientId, false);
      const client = await api.getBotAdminClient(userId, clientId);
      const created = client.createdAt ? new Date(client.createdAt).toLocaleString(lg === "zh" ? "zh-CN" : lg === "en" ? "en-US" : "ru-RU") : "—";
      let text = `👤 ${client.email || client.telegramUsername || client.telegramId || client.id}\n\n${L(lg, "adminClientId")}: ${client.id}\n${L(lg, "adminClientBalance")}: ${client.balance}\n${L(lg, "adminClientReferrals")}: ${client._count?.referrals ?? 0}\n${L(lg, "adminClientCreated")}: ${created}`;
      const kb: InlineMarkup["inline_keyboard"] = [
        [{ text: L(lg, "adminBlock"), callback_data: `admin:block:${client.id}` }],
        [{ text: L(lg, "backToList"), callback_data: "admin:clients:1" }],
      ];
      await editMessageContent(ctx, text, { inline_keyboard: kb });
      return;
    }
    return;
  }

  const token = getToken(userId);
  if (!token) {
    await ctx.reply(L(getLang(userId), "sessionExpired") + " " + L(getLang(userId), "pressStartForMenu"));
    return;
  }

  // Resolve user's cached language for this session
  const lg = getLang(userId);

  try {
    const config = await api.getPublicConfig();

    // Обработка кнопки «Я подписался»
    if (data === "check_subscribe") {
      const channelId = config?.forceSubscribeChannelId?.trim();
      if (channelId && config?.forceSubscribeEnabled) {
        const result = await checkUserSubscription(userId, channelId);
        if (result.state === "cannot_verify") {
          await ctx.answerCallbackQuery({
            text: "⚠️ " + L(lg, "forceSubscribeCannotVerifyAlert"),
            show_alert: true,
          }).catch(() => {});
          await editMessageContent(
            ctx,
            `⚠️ ${L(lg, "forceSubscribeTempUnavailable")}`,
            subscribeKeyboard(channelId, getLang(userId))
          );
          return;
        }
        if (result.state !== "subscribed") {
          await ctx.answerCallbackQuery({ text: "❌ " + L(lg, "forceSubscribeNotYet"), show_alert: true }).catch(() => {});
          return;
        }
      }
      // Подписан — показываем основное меню через /start
      await ctx.answerCallbackQuery({ text: "✅ " + L(lg, "forceSubscribeConfirmed") }).catch(() => {});
      await ctx.reply(L(lg, "forceSubscribeOk"));
      return;
    }

    // Проверка подписки на канал для всех действий
    if (config?.forceSubscribeEnabled && config.forceSubscribeChannelId?.trim()) {
      const channelId = config.forceSubscribeChannelId.trim();
      const result = await checkUserSubscription(userId, channelId);
      if (result.state !== "subscribed") {
        const msg = config.forceSubscribeMessage?.trim() || L(lg, "forceSubscribeDefault");
        const details = result.state === "cannot_verify"
          ? "\n\n" + L(lg, "forceSubscribeCannotVerifyDetails")
          : "";
        await editMessageContent(ctx, `⚠️ ${msg}${details}`, subscribeKeyboard(channelId, getLang(userId)));
        return;
      }
    }

    const appUrl = config?.publicAppUrl?.replace(/\/$/, "") ?? null;
    const rawStyles = config?.botInnerButtonStyles;
    const innerStyles = {
      tariffPay: rawStyles?.tariffPay !== undefined ? rawStyles.tariffPay : "success",
      topup: rawStyles?.topup !== undefined ? rawStyles.topup : "primary",
      back: rawStyles?.back !== undefined ? rawStyles.back : "danger",
      profile: rawStyles?.profile !== undefined ? rawStyles.profile : "primary",
      trialConfirm: rawStyles?.trialConfirm !== undefined ? rawStyles.trialConfirm : "success",
      lang: rawStyles?.lang !== undefined ? rawStyles.lang : "primary",
      currency: rawStyles?.currency !== undefined ? rawStyles.currency : "primary",
    };
    const botEmojis = config?.botEmojis;
    const innerEmojiIds: InnerEmojiIds | undefined = botEmojis
      ? {
          back: botEmojis.BACK?.tgEmojiId,
          card: botEmojis.CARD?.tgEmojiId,
          tariff: botEmojis.PACKAGE?.tgEmojiId || botEmojis.TARIFFS?.tgEmojiId,
          trial: botEmojis.TRIAL?.tgEmojiId,
          profile: botEmojis.PUZZLE?.tgEmojiId || botEmojis.PROFILE?.tgEmojiId,
          connect: botEmojis.SERVERS?.tgEmojiId || botEmojis.CONNECT?.tgEmojiId,
        }
      : undefined;

    if (data === "menu:main") {
      const [client, subRes, proxyRes, singboxRes] = await Promise.all([
        api.getMe(token),
        api.getSubscription(token).catch(() => ({ subscription: null })),
        api.getPublicProxyTariffs().catch(() => ({ items: [] })),
        api.getPublicSingboxTariffs().catch(() => ({ items: [] })),
      ]);
      const vpnUrl = getSubscriptionUrl(subRes.subscription);
      const showTrial = Boolean(config?.trialEnabled && !client?.trialUsed);
      const showProxy = proxyRes.items?.some((c: { tariffs: unknown[] }) => c.tariffs?.length > 0) ?? false;
      const showSingbox = singboxRes.items?.some((c: { tariffs: unknown[] }) => c.tariffs?.length > 0) ?? false;
      const clientLang = (client?.preferredLang ?? "zh").toLowerCase();
      setLang(userId, clientLang);
      const name = config?.serviceName?.trim() || L(clientLang, "cabinet");
      const { text, entities } = buildMainMenuText({
        serviceName: name,
        balance: client?.balance ?? 0,
        currency: client?.preferredCurrency ?? config?.defaultCurrency ?? "usd",
        subscription: subRes.subscription,
        tariffDisplayName: (subRes as { tariffDisplayName?: string | null }).tariffDisplayName ?? null,
        menuTexts: getLocaleTexts(config, clientLang),
        menuLineVisibility: config?.botMenuLineVisibility ?? null,
        menuTextCustomEmojiIds: config?.menuTextCustomEmojiIds ?? null,
        botEmojis: config?.botEmojis ?? null,
        lang: clientLang,
      });
      const hasSupportLinks = !!(config?.supportLink || config?.agreementLink || config?.offerLink || config?.instructionsLink);
      const backMarkup = mainMenu({
        showTrial,
        showVpn: Boolean(vpnUrl),
        showProxy,
        showSingbox,
        appUrl,
        botButtons: config?.botButtons ?? null,
        botBackLabel: config?.botBackLabel ?? null,
        hasSupportLinks,
        showTickets: config?.ticketsEnabled === true,
        showExtraOptions: config?.sellOptionsEnabled === true && (config?.sellOptions?.length ?? 0) > 0,
        buttonsPerRow: config?.botButtonsPerRow ?? 1,
        remnaSubscriptionUrl: config?.useRemnaSubscriptionPage ? vpnUrl : null,
        lang: lg,
      });
      if (config?.botAdminTelegramIds?.includes(String(userId))) {
        backMarkup.inline_keyboard.push([{ text: L(clientLang, "btnAdminPanel"), callback_data: "admin:menu" }]);
      }
      await editMessageContent(ctx, text, backMarkup, entities);
      return;
    }

    if (data === "menu:support") {
      const hasAny = config?.supportLink || config?.agreementLink || config?.offerLink || config?.instructionsLink;
      if (!hasAny) {
        await editMessageContent(ctx, L(lg, "supportNotConfigured"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      await editMessageContent(
        ctx,
        L(lg, "supportTitle") + "\n\n" + L(lg, "supportChoose"),
        supportSubMenu(
          {
            support: config?.supportLink,
            agreement: config?.agreementLink,
            offer: config?.offerLink,
            instructions: config?.instructionsLink,
          },
          config?.botBackLabel ?? null,
          innerStyles?.back,
          innerEmojiIds,
          lg
        )
      );
      return;
    }

    if (data === "menu:tariffs") {
      const { items } = await api.getPublicTariffs();
      if (!items?.length) {
        await editMessageContent(ctx, L(lg, "tariffsNotConfigured"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const tariffsEmojiKey = getMenuEmojiKey(config, "tariffs");
      const tariffsEmojiEntry = tariffsEmojiKey ? config?.botEmojis?.[tariffsEmojiKey] : undefined;
      const tariffsEmojiUnicode = tariffsEmojiKey && !tariffsEmojiEntry?.tgEmojiId
        ? (tariffsEmojiEntry?.unicode?.trim() || DEFAULT_EMOJI_UNICODE[tariffsEmojiKey])
        : undefined;
      const tariffsEmojiIds = innerEmojiIds && tariffsEmojiEntry?.tgEmojiId
        ? { ...innerEmojiIds, tariff: tariffsEmojiEntry.tgEmojiId }
        : innerEmojiIds;
      if (items.length > 1) {
        const { text, entities } = titleWithOptionalEmoji(tariffsEmojiKey, L(lg, "tariffsTitle") + "\n\n" + L(lg, "tariffsChooseCategory"), config?.botEmojis);
        await editMessageContent(ctx, text, tariffPayButtons(items, config?.botBackLabel ?? null, innerStyles, tariffsEmojiIds, tariffsEmojiUnicode), entities);
        return;
      }
      const cat = items[0]!;
      const nameOnly = (cat.name || "").replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "").trim() || cat.name || "";
      const head = (cat.emoji && cat.emoji.trim() ? cat.emoji + " " : "") + nameOnly;
      const tariffFields = { ...DEFAULT_TARIFF_LINE_FIELDS, ...(config?.botTariffsFields ?? {}) };
      const template = (config?.botTariffsText ?? "").trim() || getDefaultTariffsText(lg);
      const tariffLines = cat.tariffs.map((t: TariffItem) => formatTariffLine(t, tariffFields, lg)).join("\n");
      const body = renderTariffsText(template, head, tariffLines);
      const { text, entities } = titleWithOptionalEmoji(tariffsEmojiKey, body, config?.botEmojis);
      await editMessageContent(ctx, text, tariffPayButtons(items, config?.botBackLabel ?? null, innerStyles, tariffsEmojiIds, tariffsEmojiUnicode), entities);
      return;
    }

    if (data.startsWith("cat_tariffs:")) {
      const categoryId = data.slice("cat_tariffs:".length);
      const { items } = await api.getPublicTariffs();
      const category = items?.find((c: TariffCategory) => c.id === categoryId);
      if (!category?.tariffs?.length) {
        await editMessageContent(ctx, L(lg, "categoryNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const nameOnly = (category.name || "").replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "").trim() || category.name || "";
      const head = (category.emoji && category.emoji.trim() ? category.emoji + " " : "") + nameOnly;
      const tariffsEmojiKey = getMenuEmojiKey(config, "tariffs");
      const tariffsEmojiEntry = tariffsEmojiKey ? config?.botEmojis?.[tariffsEmojiKey] : undefined;
      const tariffsEmojiUnicode = tariffsEmojiKey && !tariffsEmojiEntry?.tgEmojiId
        ? (tariffsEmojiEntry?.unicode?.trim() || DEFAULT_EMOJI_UNICODE[tariffsEmojiKey])
        : undefined;
      const tariffsEmojiIds = innerEmojiIds && tariffsEmojiEntry?.tgEmojiId
        ? { ...innerEmojiIds, tariff: tariffsEmojiEntry.tgEmojiId }
        : innerEmojiIds;
      const tariffFields = { ...DEFAULT_TARIFF_LINE_FIELDS, ...(config?.botTariffsFields ?? {}) };
      const template = (config?.botTariffsText ?? "").trim() || getDefaultTariffsText(lg);
      const tariffLines = category.tariffs.map((t: TariffItem) => formatTariffLine(t, tariffFields, lg)).join("\n");
      const body = renderTariffsText(template, head, tariffLines);
      const { text, entities } = titleWithOptionalEmoji(tariffsEmojiKey, body, config?.botEmojis);
      await editMessageContent(ctx, text, tariffsOfCategoryButtons(category, config?.botBackLabel ?? null, innerStyles, "menu:tariffs", tariffsEmojiIds, tariffsEmojiUnicode), entities);
      return;
    }

    if (data === "menu:proxy") {
      const { items } = await api.getPublicProxyTariffs();
      if (!items?.length || items.every((c: { tariffs: unknown[] }) => !c.tariffs?.length)) {
        await editMessageContent(ctx, L(lg, "proxyNotConfigured"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const cats = items.filter((c: { tariffs: unknown[] }) => c.tariffs?.length > 0);
      if (cats.length === 1 && cats[0]!.tariffs.length <= 5) {
        const head = cats[0]!.name;
        const lines = cats[0]!.tariffs.map((t: { name: string; price: number; currency: string }) => `• ${t.name} — ${t.price} ${t.currency}`).join("\n");
        await editMessageContent(ctx, `${L(lg, "proxyTitle")}\n\n${head}\n${lines}\n\n${L(lg, "proxyChooseTariff")}`, proxyTariffPayButtons(cats, config?.botBackLabel ?? null, innerStyles, innerEmojiIds));
      } else {
        await editMessageContent(ctx, `${L(lg, "proxyTitle")}\n\n${L(lg, "proxyChooseCategory")}`, proxyTariffPayButtons(cats, config?.botBackLabel ?? null, innerStyles, innerEmojiIds));
      }
      return;
    }

    if (data.startsWith("cat_proxy:")) {
      const categoryId = data.slice("cat_proxy:".length);
      const { items } = await api.getPublicProxyTariffs();
      const category = items?.find((c: { id: string }) => c.id === categoryId);
      if (!category?.tariffs?.length) {
        await editMessageContent(ctx, L(lg, "categoryNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const head = category.name;
      const lines = category.tariffs.map((t: { name: string; price: number; currency: string }) => `• ${t.name} — ${t.price} ${t.currency}`).join("\n");
      await editMessageContent(ctx, `🌐 ${head}\n\n${lines}\n\n${L(lg, "proxyChooseTariff")}`, proxyTariffsOfCategoryButtons(category, config?.botBackLabel ?? null, innerStyles, "menu:proxy", innerEmojiIds));
      return;
    }

    if (data === "menu:singbox") {
      const { items } = await api.getPublicSingboxTariffs();
      if (!items?.length || items.every((c: { tariffs: unknown[] }) => !c.tariffs?.length)) {
        await editMessageContent(ctx, L(lg, "singboxNotConfigured"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const cats = items.filter((c: { tariffs: unknown[] }) => c.tariffs?.length > 0);
      if (cats.length === 1 && cats[0]!.tariffs.length <= 5) {
        const head = cats[0]!.name;
        const lines = cats[0]!.tariffs.map((t: { name: string; price: number; currency: string }) => `• ${t.name} — ${t.price} ${t.currency}`).join("\n");
        await editMessageContent(ctx, `${L(lg, "singboxTitle")}\n\n${head}\n${lines}\n\n${L(lg, "singboxChooseTariff")}`, singboxTariffPayButtons(cats, config?.botBackLabel ?? null, innerStyles, innerEmojiIds));
      } else {
        await editMessageContent(ctx, `${L(lg, "singboxTitle")}\n\n${L(lg, "singboxChooseCategory")}`, singboxTariffPayButtons(cats, config?.botBackLabel ?? null, innerStyles, innerEmojiIds));
      }
      return;
    }

    if (data.startsWith("cat_singbox:")) {
      const categoryId = data.slice("cat_singbox:".length);
      const { items } = await api.getPublicSingboxTariffs();
      const category = items?.find((c: { id: string }) => c.id === categoryId);
      if (!category?.tariffs?.length) {
        await editMessageContent(ctx, L(lg, "categoryNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const head = category.name;
      const lines = category.tariffs.map((t: { name: string; price: number; currency: string }) => `• ${t.name} — ${t.price} ${t.currency}`).join("\n");
      await editMessageContent(ctx, `🔑 ${head}\n\n${lines}\n\n${L(lg, "singboxChooseTariff")}`, singboxTariffsOfCategoryButtons(category, config?.botBackLabel ?? null, innerStyles, "menu:singbox", innerEmojiIds));
      return;
    }

    if (data === "menu:my_singbox") {
      const slotsRes = await api.getSingboxSlots(token);
      const slots = slotsRes.slots ?? [];
      if (slots.length === 0) {
        await editMessageContent(ctx, L(lg, "mySingboxEmpty"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const lines = slots.map((s: { subscriptionLink: string; expiresAt: string; protocol: string }) => {
        const localeStr = lg === "zh" ? "zh-CN" : lg === "en" ? "en-GB" : "ru-RU";
        const exp = new Date(s.expiresAt).toLocaleDateString(localeStr, { day: "2-digit", month: "2-digit", year: "numeric" });
        return `${s.protocol} — ${L(lg, "singboxExpirePrefix")}${exp}\n${s.subscriptionLink}`;
      }).join("\n\n");
      const msg = `${L(lg, "mySingboxTitle")} (${slots.length})\n\n${L(lg, "mySingboxCopyHint")}\n\n${lines}`;
      await editMessageContent(ctx, msg.slice(0, 4096), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      return;
    }

    if (data === "menu:my_proxy") {
      const { slots } = await api.getProxySlots(token);
      if (!slots?.length) {
        await editMessageContent(ctx, L(lg, "myProxyEmpty"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      let text = L(lg, "myProxyTitle") + "\n\n";
      const localeStr = lg === "zh" ? "zh-CN" : lg === "en" ? "en-GB" : "ru-RU";
      for (const s of slots) {
        text += `• SOCKS5: \`socks5://${s.login}:${s.password}@${s.host}:${s.socksPort}\`\n`;
        text += `• HTTP: \`http://${s.login}:${s.password}@${s.host}:${s.httpPort}\`\n`;
        text += `${L(lg, "proxyExpirePrefix")}${new Date(s.expiresAt).toLocaleString(localeStr)}\n\n`;
      }
      text += L(lg, "myProxyCopyHint");
      await editMessageContent(ctx, text.slice(0, 4096), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      return;
    }

    if (data.startsWith("pay_proxy_balance:")) {
      const proxyTariffId = data.slice("pay_proxy_balance:".length);
      try {
        const result = await api.payByBalance(token, { proxyTariffId });
        await editMessageContent(ctx, `✅ ${result.message}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_proxy_yoomoney:")) {
      const proxyTariffId = data.slice("pay_proxy_yoomoney:".length);
      const { items } = await api.getPublicProxyTariffs();
      const tariff = items?.flatMap((c: { tariffs: { id: string; name: string; price: number; currency: string }[] }) => c.tariffs).find((t: { id: string }) => t.id === proxyTariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const payment = await api.createYoomoneyPayment(token, { amount: tariff.price, paymentType: "AC", proxyTariffId });
        const msg = buildPaymentMessage(config, {
          name: tariff.name,
          price: formatMoney(tariff.price, tariff.currency),
          amount: String(tariff.price),
          currency: tariff.currency,
          action: L(lg, "paymentClickYoomoney"),
        });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_proxy_yookassa:")) {
      const proxyTariffId = data.slice("pay_proxy_yookassa:".length);
      const { items } = await api.getPublicProxyTariffs();
      const tariff = items?.flatMap((c: { tariffs: { id: string; name: string; price: number; currency: string }[] }) => c.tariffs).find((t: { id: string }) => t.id === proxyTariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      if (tariff.currency.toUpperCase() !== "RUB") {
        await editMessageContent(ctx, L(lg, "yookassaRubOnly"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const payment = await api.createYookassaPayment(token, { amount: tariff.price, currency: "RUB", proxyTariffId });
        const msg = buildPaymentMessage(config, {
          name: tariff.name,
          price: formatMoney(tariff.price, tariff.currency),
          amount: String(tariff.price),
          currency: tariff.currency,
          action: L(lg, "paymentClickYookassa"),
        });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.confirmationUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_proxy_cryptopay:")) {
      const proxyTariffId = data.slice("pay_proxy_cryptopay:".length);
      const { items } = await api.getPublicProxyTariffs();
      const tariff = items?.flatMap((c: { tariffs: { id: string; name: string; price: number; currency: string }[] }) => c.tariffs).find((t: { id: string }) => t.id === proxyTariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const payment = await api.createCryptopayPayment(token, { amount: tariff.price, currency: tariff.currency, proxyTariffId });
        const msg = buildPaymentMessage(config, { name: tariff.name, price: formatMoney(tariff.price, tariff.currency), amount: String(tariff.price), currency: tariff.currency, action: L(lg, "paymentClickCryptoBot") });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.payUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_proxy:")) {
      const rest = data.slice("pay_proxy:".length);
      const parts = rest.split(":");
      const proxyTariffId = parts[0];
      const methodIdFromBtn = parts.length >= 2 ? Number(parts[1]) : null;
      const { items } = await api.getPublicProxyTariffs();
      const tariff = items?.flatMap((c: { tariffs: { id: string; name: string; price: number; currency: string }[] }) => c.tariffs).find((t: { id: string }) => t.id === proxyTariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const methods = config?.plategaMethods ?? [];
      const client = await api.getMe(token);
      const balanceLabel = client && client.balance >= tariff.price ? L(lg, "payBalanceBtnWithAmount").replace("{{amount}}", formatMoney(client.balance, client.preferredCurrency ?? "RUB")) : null;
      if (methodIdFromBtn != null && Number.isFinite(methodIdFromBtn)) {
        try {
          const payment = await api.createPlategaPayment(token, {
            amount: tariff.price,
            currency: tariff.currency,
            paymentMethod: methodIdFromBtn,
            description: `${L(lg, "descriptionProxy")}: ${tariff.name}`,
            proxyTariffId: tariff.id,
          });
          const msg = buildPaymentMessage(config, {
            name: tariff.name,
            price: formatMoney(tariff.price, tariff.currency),
            amount: String(tariff.price),
            currency: tariff.currency,
            action: L(lg, "paymentClickToPay"),
          });
          await editMessageContent(ctx, msg.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : L(lg, "error");
          await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        }
        return;
      }
      const markup = proxyPaymentMethodButtons(
        proxyTariffId,
        methods,
        config?.botBackLabel ?? null,
        innerStyles?.back,
        innerEmojiIds,
        balanceLabel,
        !!config?.yoomoneyEnabled,
        !!config?.yookassaEnabled,
        !!config?.cryptopayEnabled,
        tariff.currency,
        lg,
      );
      const msg = buildPaymentMessage(config, {
        name: tariff.name,
        price: formatMoney(tariff.price, tariff.currency),
        amount: String(tariff.price),
        currency: tariff.currency,
        action: L(lg, "choosePaymentMethod"),
      });
      await editMessageContent(ctx, msg.text, markup, msg.entities);
      return;
    }

    if (data.startsWith("pay_singbox_balance:")) {
      const singboxTariffId = data.slice("pay_singbox_balance:".length);
      try {
        const result = await api.payByBalance(token, { singboxTariffId });
        await editMessageContent(ctx, `✅ ${result.message}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_singbox_yoomoney:")) {
      const singboxTariffId = data.slice("pay_singbox_yoomoney:".length);
      const { items } = await api.getPublicSingboxTariffs();
      const tariff = items?.flatMap((c: { tariffs: { id: string; name: string; price: number; currency: string }[] }) => c.tariffs).find((t: { id: string }) => t.id === singboxTariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const payment = await api.createYoomoneyPayment(token, { amount: tariff.price, paymentType: "AC", singboxTariffId });
        const msg = buildPaymentMessage(config, {
          name: tariff.name,
          price: formatMoney(tariff.price, tariff.currency),
          amount: String(tariff.price),
          currency: tariff.currency,
          action: L(lg, "paymentClickYoomoney"),
        });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_singbox_yookassa:")) {
      const singboxTariffId = data.slice("pay_singbox_yookassa:".length);
      const { items } = await api.getPublicSingboxTariffs();
      const tariff = items?.flatMap((c: { tariffs: { id: string; name: string; price: number; currency: string }[] }) => c.tariffs).find((t: { id: string }) => t.id === singboxTariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      if (tariff.currency.toUpperCase() !== "RUB") {
        await editMessageContent(ctx, L(lg, "yookassaRubOnly"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const payment = await api.createYookassaPayment(token, { amount: tariff.price, currency: "RUB", singboxTariffId });
        const msg = buildPaymentMessage(config, {
          name: tariff.name,
          price: formatMoney(tariff.price, tariff.currency),
          amount: String(tariff.price),
          currency: tariff.currency,
          action: L(lg, "paymentClickYookassa"),
        });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.confirmationUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_singbox_cryptopay:")) {
      const singboxTariffId = data.slice("pay_singbox_cryptopay:".length);
      const { items } = await api.getPublicSingboxTariffs();
      const tariff = items?.flatMap((c: { tariffs: { id: string; name: string; price: number; currency: string }[] }) => c.tariffs).find((t: { id: string }) => t.id === singboxTariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const payment = await api.createCryptopayPayment(token, { amount: tariff.price, currency: tariff.currency, singboxTariffId });
        const msg = buildPaymentMessage(config, { name: tariff.name, price: formatMoney(tariff.price, tariff.currency), amount: String(tariff.price), currency: tariff.currency, action: L(lg, "paymentClickCryptoBot") });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.payUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_singbox:")) {
      const rest = data.slice("pay_singbox:".length);
      const parts = rest.split(":");
      const singboxTariffId = parts[0];
      const methodIdFromBtn = parts.length >= 2 ? Number(parts[1]) : null;
      const { items } = await api.getPublicSingboxTariffs();
      const tariff = items?.flatMap((c: { tariffs: { id: string; name: string; price: number; currency: string }[] }) => c.tariffs).find((t: { id: string }) => t.id === singboxTariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const methods = config?.plategaMethods ?? [];
      const client = await api.getMe(token);
      const balanceLabel = client && client.balance >= tariff.price ? L(lg, "payBalanceBtnWithAmount").replace("{{amount}}", formatMoney(client.balance, client.preferredCurrency ?? "RUB")) : null;
      if (methodIdFromBtn != null && Number.isFinite(methodIdFromBtn)) {
        try {
          const payment = await api.createPlategaPayment(token, {
            amount: tariff.price,
            currency: tariff.currency,
            paymentMethod: methodIdFromBtn,
            description: `${L(lg, "descriptionSingbox")}: ${tariff.name}`,
            singboxTariffId: tariff.id,
          });
          const msg = buildPaymentMessage(config, {
            name: tariff.name,
            price: formatMoney(tariff.price, tariff.currency),
            amount: String(tariff.price),
            currency: tariff.currency,
            action: L(lg, "paymentClickToPay"),
          });
          await editMessageContent(ctx, msg.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : L(lg, "error");
          await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        }
        return;
      }
      const markup = singboxPaymentMethodButtons(
        singboxTariffId,
        methods,
        config?.botBackLabel ?? null,
        innerStyles?.back,
        innerEmojiIds,
        balanceLabel,
        !!config?.yoomoneyEnabled,
        !!config?.yookassaEnabled,
        !!config?.cryptopayEnabled,
        tariff.currency,
        lg,
      );
      const msg = buildPaymentMessage(config, {
        name: tariff.name,
        price: formatMoney(tariff.price, tariff.currency),
        amount: String(tariff.price),
        currency: tariff.currency,
        action: L(lg, "choosePaymentMethod"),
      });
      await editMessageContent(ctx, msg.text, markup, msg.entities);
      return;
    }

    if (data.startsWith("pay_tariff_balance:")) {
      const tariffId = data.slice("pay_tariff_balance:".length);
      try {
        const promoCode = activeDiscountCode.get(userId);
        const result = await api.payByBalance(token, { tariffId, promoCode });
        if (promoCode) activeDiscountCode.delete(userId);
        await editMessageContent(ctx, `✅ ${result.message}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_tariff_yoomoney:")) {
      const tariffId = data.slice("pay_tariff_yoomoney:".length);
      const { items } = await api.getPublicTariffs();
      const tariff = items?.flatMap((c: TariffCategory) => c.tariffs).find((t: TariffItem) => t.id === tariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const promoCode = activeDiscountCode.get(userId);
        const payment = await api.createYoomoneyPayment(token, {
          amount: tariff.price,
          paymentType: "AC",
          tariffId: tariff.id,
          promoCode,
        });
        if (promoCode) activeDiscountCode.delete(userId);
        const msg = buildPaymentMessage(config, {
          name: tariff.name,
          price: formatMoney(tariff.price, tariff.currency),
          amount: String(tariff.price),
          currency: tariff.currency,
          action: L(lg, "paymentClickButtonYoomoney"),
        });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateErrorYoomoney");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_tariff_yookassa:")) {
      const tariffId = data.slice("pay_tariff_yookassa:".length);
      const { items } = await api.getPublicTariffs();
      const tariff = items?.flatMap((c: TariffCategory) => c.tariffs).find((t: TariffItem) => t.id === tariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      if (tariff.currency.toUpperCase() !== "RUB") {
        await editMessageContent(ctx, L(lg, "yookassaRubOnly"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const promoCode = activeDiscountCode.get(userId);
        const payment = await api.createYookassaPayment(token, {
          amount: tariff.price,
          currency: "RUB",
          tariffId: tariff.id,
          promoCode,
        });
        if (promoCode) activeDiscountCode.delete(userId);
        const msg = buildPaymentMessage(config, {
          name: tariff.name,
          price: formatMoney(tariff.price, tariff.currency),
          amount: String(tariff.price),
          currency: tariff.currency,
          action: L(lg, "paymentClickButtonYookassa"),
        });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.confirmationUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateErrorYookassa");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_tariff_cryptopay:")) {
      const tariffId = data.slice("pay_tariff_cryptopay:".length);
      const { items } = await api.getPublicTariffs();
      const tariff = items?.flatMap((c: TariffCategory) => c.tariffs).find((t: TariffItem) => t.id === tariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const promoCode = activeDiscountCode.get(userId);
        const payment = await api.createCryptopayPayment(token, { amount: tariff.price, currency: tariff.currency, tariffId: tariff.id, promoCode });
        if (promoCode) activeDiscountCode.delete(userId);
        const msg = buildPaymentMessage(config, { name: tariff.name, price: formatMoney(tariff.price, tariff.currency), amount: String(tariff.price), currency: tariff.currency, action: L(lg, "paymentClickButtonCryptoBot") });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.payUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data === "menu:extra_options") {
      const options = config?.sellOptions ?? [];
      if (!options.length) {
        await editMessageContent(ctx, L(lg, "extraOptionsUnavailable"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const { text, entities } = titleWithEmoji("PACKAGE", L(lg, "extraOptionsBody"), config?.botEmojis);
      await editMessageContent(ctx, text, extraOptionsButtons(options, config?.botBackLabel ?? null, innerStyles, innerEmojiIds), entities);
      return;
    }

    if (data.startsWith("pay_option_balance:")) {
      const parts = data.split(":");
      const kind = (parts[1] ?? "") as "traffic" | "devices" | "servers";
      const productId = parts.length > 2 ? parts.slice(2).join(":") : "";
      const options = config?.sellOptions ?? [];
      const option = options.find((o) => o.kind === kind && o.id === productId);
      if (!option) {
        await editMessageContent(ctx, L(lg, "extraOptionNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const result = await api.payOptionByBalance(token, { kind: option.kind, productId: option.id });
        await editMessageContent(ctx, `✅ ${result.message}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_option_yookassa:")) {
      const parts = data.split(":");
      const kind = (parts[1] ?? "") as "traffic" | "devices" | "servers";
      const productId = parts.length > 2 ? parts.slice(2).join(":") : "";
      const options = config?.sellOptions ?? [];
      const option = options.find((o) => o.kind === kind && o.id === productId);
      if (!option) {
        await editMessageContent(ctx, L(lg, "extraOptionNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const payment = await api.createYookassaPayment(token, {
          extraOption: { kind: option.kind, productId: option.id },
        });
        const optName = option.name || (option.kind === "traffic" ? `+${option.trafficGb} ${L(lg, "extraOptionTraffic")}` : option.kind === "devices" ? `+${option.deviceCount} ${L(lg, "extraOptionDevices")}` : L(lg, "extraOptionServer"));
        const msg = buildPaymentMessage(config, {
          name: optName,
          price: formatMoney(option.price, option.currency),
          amount: String(option.price),
          currency: option.currency,
          action: L(lg, "paymentClickButtonYookassa"),
        });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.confirmationUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateError");
        const isAuthError = /401|unauthorized|истек|авториз|токен/i.test(msg);
        const text = isAuthError ? L(lg, "sessionExpiredRestart") : `❌ ${msg}`;
        await editMessageContent(ctx, text, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_option_cryptopay:")) {
      const parts = data.split(":");
      const kind = (parts[1] ?? "") as "traffic" | "devices" | "servers";
      const productId = parts.length > 2 ? parts.slice(2).join(":") : "";
      const options = config?.sellOptions ?? [];
      const option = options.find((o) => o.kind === kind && o.id === productId);
      if (!option) {
        await editMessageContent(ctx, L(lg, "extraOptionNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const payment = await api.createCryptopayPayment(token, { extraOption: { kind: option.kind, productId: option.id } });
        const optName = option.name || (option.kind === "traffic" ? `+${option.trafficGb} ${L(lg, "extraOptionTraffic")}` : option.kind === "devices" ? `+${option.deviceCount} ${L(lg, "extraOptionDevices")}` : L(lg, "extraOptionServer"));
        const msg = buildPaymentMessage(config, { name: optName, price: formatMoney(option.price, option.currency), amount: String(option.price), currency: option.currency, action: L(lg, "paymentClickButtonCryptoBot") });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.payUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateError");
        const isAuthError = /401|unauthorized|истек|авториз|токен/i.test(msg);
        const text = isAuthError ? L(lg, "sessionExpiredRestart") : `❌ ${msg}`;
        await editMessageContent(ctx, text, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_option_yoomoney:")) {
      const parts = data.split(":");
      const kind = (parts[1] ?? "") as "traffic" | "devices" | "servers";
      const productId = parts.length > 2 ? parts.slice(2).join(":") : "";
      const options = config?.sellOptions ?? [];
      const option = options.find((o) => o.kind === kind && o.id === productId);
      if (!option) {
        await editMessageContent(ctx, L(lg, "extraOptionNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const payment = await api.createYoomoneyPayment(token, {
          amount: option.price,
          paymentType: "AC",
          extraOption: { kind: option.kind, productId: option.id },
        });
        const optName = option.name || (option.kind === "traffic" ? `+${option.trafficGb} ${L(lg, "extraOptionTraffic")}` : option.kind === "devices" ? `+${option.deviceCount} ${L(lg, "extraOptionDevices")}` : L(lg, "extraOptionServer"));
        const msg = buildPaymentMessage(config, {
          name: optName,
          price: formatMoney(option.price, option.currency),
          amount: String(option.price),
          currency: option.currency,
          action: L(lg, "paymentClickButtonYoomoney"),
        });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateErrorYoomoney");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_option_platega:")) {
      const parts = data.split(":");
      const kind = (parts[1] ?? "") as "traffic" | "devices" | "servers";
      const productId = parts.length > 3 ? parts.slice(2, -1).join(":") : parts[2] ?? "";
      const methodId = parts.length >= 4 ? Number(parts[parts.length - 1]) : Number(parts[2]);
      const options = config?.sellOptions ?? [];
      const option = options.find((o) => o.kind === kind && o.id === productId);
      if (!option) {
        await editMessageContent(ctx, L(lg, "extraOptionNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      if (!Number.isFinite(methodId)) {
        await editMessageContent(ctx, L(lg, "invalidPaymentMethod"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      try {
        const payment = await api.createPlategaPayment(token, {
          amount: option.price,
          currency: option.currency,
          paymentMethod: methodId,
          description: option.name || `${option.kind} ${option.id}`,
          extraOption: { kind: option.kind, productId: option.id },
        });
        const optName = option.name || (option.kind === "traffic" ? `+${option.trafficGb} ${L(lg, "extraOptionTraffic")}` : option.kind === "devices" ? `+${option.deviceCount} ${L(lg, "extraOptionDevices")}` : L(lg, "extraOptionServer"));
        const msg = buildPaymentMessage(config, {
          name: optName,
          price: formatMoney(option.price, option.currency),
          amount: String(option.price),
          currency: option.currency,
          action: L(lg, "paymentClickButtonBelow"),
        });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateError");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("pay_option:")) {
      const parts = data.split(":");
      const kind = (parts[1] ?? "") as "traffic" | "devices" | "servers";
      const productId = parts.length > 2 ? parts.slice(2).join(":") : "";
      const options = config?.sellOptions ?? [];
      const option = options.find((o) => o.kind === kind && o.id === productId);
      if (!option) {
        await editMessageContent(ctx, L(lg, "extraOptionNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      if (option.currency.toUpperCase() !== "RUB") {
        await editMessageContent(ctx, L(lg, "optionRubOnly"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const client = await api.getMe(token);
      const optName = option.name || (option.kind === "traffic" ? `+${option.trafficGb} ${L(lg, "extraOptionTraffic")}` : option.kind === "devices" ? `+${option.deviceCount} ${L(lg, "extraOptionDevices")}` : L(lg, "extraOptionServer"));
      const choiceText = buildPaymentMessage(config, {
        name: optName,
        price: formatMoney(option.price, option.currency),
        amount: String(option.price),
        currency: option.currency,
        action: L(lg, "choosePaymentMethod"),
      });
      const markup = optionPaymentMethodButtons(
        option,
        client?.balance ?? 0,
        config?.botBackLabel ?? null,
        innerStyles,
        innerEmojiIds,
        config?.plategaMethods ?? [],
        !!config?.yoomoneyEnabled,
        !!config?.yookassaEnabled,
        !!config?.cryptopayEnabled,
        lg,
      );
      await editMessageContent(ctx, choiceText.text, markup, choiceText.entities);
      return;
    }

    if (data.startsWith("pay_tariff:")) {
      const rest = data.slice("pay_tariff:".length);
      const parts = rest.split(":");
      const tariffId = parts[0];
      const methodIdFromBtn = parts.length >= 2 ? Number(parts[1]) : null;
      const { items } = await api.getPublicTariffs();
      const tariff = items?.flatMap((c: TariffCategory) => c.tariffs).find((t: TariffItem) => t.id === tariffId);
      if (!tariff) {
        await editMessageContent(ctx, L(lg, "tariffNotFound"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const methods = config?.plategaMethods ?? [];
      const client = await api.getMe(token);
      const balanceLabel = client && client.balance >= tariff.price ? L(lg, "payBalanceBtnWithAmount").replace("{{amount}}", formatMoney(client.balance, client.preferredCurrency ?? "RUB")) : null;

      if (methodIdFromBtn != null && Number.isFinite(methodIdFromBtn)) {
        const payment = await api.createPlategaPayment(token, {
          amount: tariff.price,
          currency: tariff.currency,
          paymentMethod: methodIdFromBtn,
          description: `${L(lg, "descriptionTariff")}: ${tariff.name}`,
          tariffId: tariff.id,
        });
        const msg = buildPaymentMessage(config, {
          name: tariff.name,
          price: formatMoney(tariff.price, tariff.currency),
          amount: String(tariff.price),
          currency: tariff.currency,
          action: L(lg, "paymentClickButtonBelow"),
        });
        await editMessageContent(ctx, msg.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), msg.entities);
        return;
      }
      // Показываем способы оплаты (всегда, чтобы была кнопка баланса)
      const pay2 = buildPaymentMessage(config, {
        name: tariff.name,
        price: formatMoney(tariff.price, tariff.currency),
        amount: String(tariff.price),
        currency: tariff.currency,
        action: L(lg, "choosePaymentMethod"),
      });
      await editMessageContent(ctx, pay2.text, tariffPaymentMethodButtons(tariffId, methods, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, balanceLabel, !!config?.yoomoneyEnabled, !!config?.yookassaEnabled, !!config?.cryptopayEnabled, tariff.currency, lg), pay2.entities);
      return;
    }

    if (data === "menu:profile") {
      const client = await api.getMe(token);
      const langs = config?.activeLanguages?.length ? config.activeLanguages : ["zh", "en"];
      const currencies = config?.activeCurrencies?.length ? config.activeCurrencies : ["usd", "rub"];
      const { text, entities } = titleWithEmoji(
        "PROFILE",
        `${L(lg, "profileTitle")}\n\n${L(lg, "profileBalance")}: ${formatMoney(client?.balance ?? 0, client?.preferredCurrency ?? "usd")}\n${L(lg, "profileLang")}: ${client?.preferredLang ?? "zh"}\n${L(lg, "profileCurrency")}: ${client?.preferredCurrency ?? "usd"}\n\n${L(lg, "profileChange")}`,
        config?.botEmojis
      );
      await editMessageContent(ctx, text, profileButtons(config?.botBackLabel ?? null, innerStyles, innerEmojiIds), entities);
      return;
    }

    if (data === "menu:devices") {
      try {
        const { total, devices } = await api.getClientDevices(token);
        lastDevicesList.set(userId, { devices });
        if (devices.length === 0) {
          await editMessageContent(
            ctx,
            L(lg, "devicesTitle") + "\n\n" + L(lg, "devicesEmpty"),
            { inline_keyboard: [[{ text: config?.botBackLabel ?? L(lg, "backToMenu"), callback_data: "menu:main" }]] }
          );
          return;
        }
        const lines = [L(lg, "devicesTitle") + "\n\n" + L(lg, "devicesDeleteHint") + "\n"];
        const rows: InlineMarkup["inline_keyboard"] = [];
        devices.slice(0, 15).forEach((d, i) => {
          const label = [d.platform, d.deviceModel].filter(Boolean).join(" · ") || d.hwid.slice(0, 12) + "…";
          lines.push(`${i + 1}. ${label}`);
          rows.push([{ text: `${L(lg, "btnDeleteDevice")}: ${label.slice(0, 25)}`, callback_data: `devices:delete:${i}` }]);
        });
        rows.push([{ text: config?.botBackLabel ?? L(lg, "backToMenu"), callback_data: "menu:main" }]);
        await editMessageContent(ctx, lines.join("\n"), { inline_keyboard: rows });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "error");
        await editMessageContent(ctx, L(lg, "devicesTitle") + "\n\n❌ " + msg, {
          inline_keyboard: [[{ text: config?.botBackLabel ?? L(lg, "backToMenu"), callback_data: "menu:main" }]],
        });
      }
      return;
    }

    if (data.startsWith("devices:delete:")) {
      const indexStr = data.slice("devices:delete:".length);
      const index = parseInt(indexStr, 10);
      const stored = lastDevicesList.get(userId);
      if (!stored || index < 0 || index >= stored.devices.length) {
        await editMessageContent(ctx, L(lg, "devicesSessionExpired"), {
          inline_keyboard: [[{ text: config?.botBackLabel ?? L(lg, "backToMenu"), callback_data: "menu:main" }]],
        });
        return;
      }
      const hwid = stored.devices[index]!.hwid;
      try {
        await api.postClientDeviceDelete(token, hwid);
        const nextDevices = stored.devices.filter((_, i) => i !== index);
        lastDevicesList.set(userId, { devices: nextDevices });
        if (nextDevices.length === 0) {
          await editMessageContent(
            ctx,
            L(lg, "devicesDeletedConnectNew"),
            { inline_keyboard: [[{ text: config?.botBackLabel ?? L(lg, "backToMenu"), callback_data: "menu:main" }]] }
          );
        } else {
          const lines = [L(lg, "devicesDeleted") + "\n\n" + L(lg, "devicesRemaining") + "\n"];
          const rows: InlineMarkup["inline_keyboard"] = [];
          nextDevices.slice(0, 15).forEach((d, i) => {
            const label = [d.platform, d.deviceModel].filter(Boolean).join(" · ") || d.hwid.slice(0, 12) + "…";
            lines.push(`${i + 1}. ${label}`);
            rows.push([{ text: `${L(lg, "btnDeleteDevice")}: ${label.slice(0, 25)}`, callback_data: `devices:delete:${i}` }]);
          });
          rows.push([{ text: config?.botBackLabel ?? L(lg, "backToMenu"), callback_data: "menu:main" }]);
          await editMessageContent(ctx, lines.join("\n"), { inline_keyboard: rows });
        }
      } catch (e: unknown) {
        await editMessageContent(ctx, `❌ ${e instanceof Error ? e.message : L(lg, "error")}`, {
          inline_keyboard: [[{ text: config?.botBackLabel ?? L(lg, "backToMenu"), callback_data: "menu:devices" }]],
        });
      }
      return;
    }

    if (data === "profile:lang") {
      const langs = config?.activeLanguages?.length ? config.activeLanguages : ["zh", "en"];
      await editMessageContent(ctx, L(lg, "chooseLang"), langButtons(langs, innerStyles, innerEmojiIds));
      return;
    }

    if (data.startsWith("set_lang:")) {
      const lang = data.slice("set_lang:".length);
      await api.updateProfile(token, { preferredLang: lang });
      setLang(userId, lang);
      await editMessageContent(ctx, `${L(lang, "langChanged")} ${lang.toUpperCase()}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      return;
    }

    if (data === "profile:currency") {
      const currencies = config?.activeCurrencies?.length ? config.activeCurrencies : ["usd", "rub"];
      await editMessageContent(ctx, L(lg, "chooseCurrency"), currencyButtons(currencies, innerStyles, innerEmojiIds));
      return;
    }

    if (data.startsWith("set_currency:")) {
      const currency = data.slice("set_currency:".length);
      await api.updateProfile(token, { preferredCurrency: currency });
      await editMessageContent(ctx, `${L(lg, "currencyChanged")} ${currency.toUpperCase()}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      return;
    }

    if (data === "menu:topup") {
      const client = await api.getMe(token);
      const methods = config?.plategaMethods ?? [];
      const yooEnabled = !!config?.yoomoneyEnabled;
      const yookassaEnabledTopup = !!config?.yookassaEnabled;
      if (!methods.length && !yooEnabled && !yookassaEnabledTopup) {
        await editMessageContent(ctx, L(lg, "topupUnavailable"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const topupTitle = titleWithEmoji("CARD", L(lg, "topupTitle") + "\n\n" + L(lg, "topupChooseAmount"), config?.botEmojis);
      await editMessageContent(ctx, topupTitle.text, topUpPresets(client.preferredCurrency, config?.botBackLabel ?? null, innerStyles, innerEmojiIds, lg), topupTitle.entities);
      return;
    }

    if (data.startsWith("topup_yoomoney:")) {
      const amountStr = data.slice("topup_yoomoney:".length);
      const amount = Number(amountStr);
      if (!Number.isFinite(amount) || amount <= 0) {
        await editMessageContent(ctx, L(lg, "topupInvalidAmount"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const client = await api.getMe(token);
      try {
        const payment = await api.createYoomoneyPayment(token, {
          amount,
          paymentType: "AC",
        });
        const yooTopup = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(amount, client.preferredCurrency)}\n\n${L(lg, "paymentClickButtonYoomoney")}:`, config?.botEmojis);
        await editMessageContent(ctx, yooTopup.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), yooTopup.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateErrorYoomoney");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("topup_yookassa:")) {
      const amountStr = data.slice("topup_yookassa:".length);
      const amount = Number(amountStr);
      if (!Number.isFinite(amount) || amount <= 0) {
        await editMessageContent(ctx, L(lg, "topupInvalidAmount"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const client = await api.getMe(token);
      try {
        const payment = await api.createYookassaPayment(token, { amount, currency: "RUB" });
        const yooTopup = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(amount, "RUB")}\n\n${L(lg, "paymentClickButtonYookassa")}:`, config?.botEmojis);
        await editMessageContent(ctx, yooTopup.text, payUrlMarkup(payment.confirmationUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), yooTopup.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateErrorYookassa");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("topup_cryptopay:")) {
      const amountStr = data.slice("topup_cryptopay:".length);
      const amount = Number(amountStr);
      if (!Number.isFinite(amount) || amount <= 0) {
        await editMessageContent(ctx, L(lg, "topupInvalidAmount"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const client = await api.getMe(token);
      try {
        const payment = await api.createCryptopayPayment(token, { amount, currency: client.preferredCurrency ?? "RUB" });
        const cpTopup = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(amount, client.preferredCurrency ?? "RUB")}\n\n${L(lg, "paymentClickButtonCryptoBot")}:`, config?.botEmojis);
        await editMessageContent(ctx, cpTopup.text, payUrlMarkup(payment.payUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), cpTopup.entities);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : L(lg, "paymentCreateErrorCryptoBot");
        await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      }
      return;
    }

    if (data.startsWith("topup:")) {
      const rest = data.slice("topup:".length);
      const parts = rest.split(":");
      const amountStr = parts[0];
      const amount = Number(amountStr);
      const methodIdFromBtn = parts.length >= 2 ? Number(parts[1]) : null;
      if (!Number.isFinite(amount) || amount <= 0) {
        await editMessageContent(ctx, L(lg, "topupInvalidAmount"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const client = await api.getMe(token);
      const methods = config?.plategaMethods ?? [];
      if (methodIdFromBtn != null && Number.isFinite(methodIdFromBtn)) {
        const payment = await api.createPlategaPayment(token, {
          amount,
          currency: client.preferredCurrency,
          paymentMethod: methodIdFromBtn,
          description: L(lg, "descriptionTopup"),
        });
        const topupPay1 = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(amount, client.preferredCurrency)}\n\n${L(lg, "paymentClickButtonBelow")}:`, config?.botEmojis);
        await editMessageContent(ctx, topupPay1.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), topupPay1.entities);
        return;
      }
      const yooEnabled = !!config?.yoomoneyEnabled;
      const yookassaEnabled = !!config?.yookassaEnabled;
      const cryptopayEnabled = !!config?.cryptopayEnabled;
      if (methods.length > 1 || (methods.length >= 1 && (yooEnabled || yookassaEnabled || cryptopayEnabled)) || (methods.length === 0 && ((yooEnabled && yookassaEnabled) || (yooEnabled && cryptopayEnabled) || (yookassaEnabled && cryptopayEnabled)))) {
        const topupPay2 = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(amount, client.preferredCurrency)}\n\n${L(lg, "topupChoosePayMethod")}:`, config?.botEmojis);
        await editMessageContent(ctx, topupPay2.text, topupPaymentMethodButtons(amountStr, methods, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, yooEnabled, yookassaEnabled, cryptopayEnabled, lg), topupPay2.entities);
        return;
      }
      // Если ЮMoney единственный способ (нет platega, нет ЮKassa) — сразу создаём платёж ЮMoney
      if (methods.length === 0 && yooEnabled && !yookassaEnabled) {
        try {
          const payment = await api.createYoomoneyPayment(token, { amount, paymentType: "AC" });
          const yooTopup = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(amount, client.preferredCurrency)}\n\n${L(lg, "paymentClickButtonYoomoney")}:`, config?.botEmojis);
          await editMessageContent(ctx, yooTopup.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), yooTopup.entities);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : L(lg, "paymentCreateErrorYoomoney");
          await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        }
        return;
      }
      // Если только ЮKassa — сразу создаём платёж ЮKassa
      if (methods.length === 0 && yookassaEnabled) {
        try {
          const payment = await api.createYookassaPayment(token, { amount, currency: "RUB" });
          const yooTopup = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(amount, "RUB")}\n\n${L(lg, "paymentClickButtonYookassa")}:`, config?.botEmojis);
          await editMessageContent(ctx, yooTopup.text, payUrlMarkup(payment.confirmationUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), yooTopup.entities);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : L(lg, "paymentCreateErrorYookassa");
          await editMessageContent(ctx, `❌ ${msg}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        }
        return;
      }
      const methodId = methods[0]?.id ?? 2;
      const payment = await api.createPlategaPayment(token, {
        amount,
        currency: client.preferredCurrency,
        paymentMethod: methodId,
        description: L(lg, "descriptionTopup"),
      });
      const topupPay3 = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(amount, client.preferredCurrency)}\n\n${L(lg, "paymentClickButtonBelow")}:`, config?.botEmojis);
      await editMessageContent(ctx, topupPay3.text, payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), topupPay3.entities);
      return;
    }

    if (data === "menu:referral") {
      const client = await api.getMe(token);
      if (!client.referralCode) {
        await editMessageContent(ctx, L(lg, "referralUnavailable"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const linkSite = appUrl ? `${appUrl}/cabinet/register?ref=${encodeURIComponent(client.referralCode)}` : null;
      const linkBot = `https://t.me/${BOT_USERNAME || "bot"}?start=ref_${client.referralCode}`;
      const p1 = (client.referralPercent != null && client.referralPercent > 0) ? client.referralPercent : (config?.defaultReferralPercent ?? 0);
      const p2 = config?.referralPercentLevel2 ?? 0;
      const p3 = config?.referralPercentLevel3 ?? 0;
      let rest = L(lg, "referralTitle") + "\n\n" + L(lg, "referralShareText") + "\n\n";
      rest += L(lg, "referralHowItWorks") + "\n";
      rest += `• ${L(lg, "referralLevel1").replace("{{pct}}", String(p1))}\n`;
      rest += `• ${L(lg, "referralLevel2").replace("{{pct}}", String(p2))}\n`;
      rest += `• ${L(lg, "referralLevel3").replace("{{pct}}", String(p3))}\n`;
      rest += "\n" + L(lg, "referralBonusNote");
      rest += "\n\n" + L(lg, "referralYourLinks");
      if (linkSite) rest += "\n\n" + L(lg, "referralSite") + "\n" + linkSite;
      rest += "\n\n" + L(lg, "referralBot") + "\n" + linkBot;
      const { text: refText, entities: refEntities } = titleWithEmoji("LINK", rest, config?.botEmojis);
      await editMessageContent(ctx, refText, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), refEntities);
      return;
    }

    if (data === "menu:promocode") {
      awaitingPromoCode.add(userId);
      await editMessageContent(
        ctx,
        L(lg, "promocodeTitle") + "\n\n" + L(lg, "promocodeSendHint"),
        backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg),
      );
      return;
    }

    if (data === "menu:trial") {
      const days = config?.trialDays ?? 0;
      const daysText = days > 0 ? formatDaysI18n(days, lg) + " " + L(lg, "trialDaysSuffix") : L(lg, "trialNoPay");
      const trialTitle = titleWithEmoji("TRIAL", `${L(lg, "trialTitle")}\n\n${daysText}\n\n${L(lg, "trialActivate")}`, config?.botEmojis);
      await editMessageContent(ctx, trialTitle.text, trialConfirmButton(innerStyles, innerEmojiIds), trialTitle.entities);
      return;
    }

    if (data === "trial:confirm") {
      const result = await api.activateTrial(token);
      await editMessageContent(ctx, `✅ ${result.message}`, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
      return;
    }

    if (data === "menu:vpn") {
      const subRes = await api.getSubscription(token);
      const vpnUrl = getSubscriptionUrl(subRes.subscription);
      if (!vpnUrl) {
        await editMessageContent(ctx, L(lg, "vpnUnavailable"), backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg));
        return;
      }
      const appUrl = config?.publicAppUrl?.replace(/\/$/, "") ?? null;
      const useRemna = config?.useRemnaSubscriptionPage === true;
      if (useRemna) {
        const vpnTitle = titleWithEmoji("SERVERS", L(lg, "vpnTitle") + "\n\n" + L(lg, "vpnClickBelow"), config?.botEmojis);
        await editMessageContent(ctx, vpnTitle.text, openSubscribePageMarkup(appUrl ?? "", config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, vpnUrl, lg), vpnTitle.entities);
      } else if (appUrl) {
        const vpnTitle = titleWithEmoji("SERVERS", L(lg, "vpnTitle") + "\n\n" + L(lg, "vpnClickBelowApps"), config?.botEmojis);
        await editMessageContent(ctx, vpnTitle.text, openSubscribePageMarkup(appUrl, config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, undefined, lg), vpnTitle.entities);
      } else {
        const vpnTitle2 = titleWithEmoji("SERVERS", `${L(lg, "vpnTitle")}\n\n${L(lg, "vpnOpenInApp")}\n${vpnUrl}`, config?.botEmojis);
        await editMessageContent(ctx, vpnTitle2.text, backToMenu(config?.botBackLabel ?? null, innerStyles?.back, innerEmojiIds, lg), vpnTitle2.entities);
      }
      return;
    }

    await ctx.answerCallbackQuery({ text: L(lg, "unknownAction") });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : L(lg, "error");
    await ctx.reply(`❌ ${msg}`).catch(() => {});
  }
});

// Сообщения с фото — админ может отправить фото с подписью для рассылки
bot.on("message:photo", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lg = getLang(userId);
  if (!awaitingBroadcastMessage.has(userId)) return;
  awaitingBroadcastMessage.delete(userId);
  const config = await api.getPublicConfig();
  if (!config?.botAdminTelegramIds?.includes(String(userId))) {
    await ctx.reply(L(lg, "accessDenied"));
    return;
  }
  const photos = ctx.message.photo;
  if (!photos?.length) {
    await ctx.reply(L(lg, "adminPhotoNotReceived"));
    return;
  }
  const largest = photos[photos.length - 1];
  const caption = ctx.message.caption?.trim() ?? "";
  lastBroadcastMessage.set(userId, { text: caption, photoFileId: largest.file_id });
  await ctx.reply(L(lg, "adminBroadcastTo"), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: L(lg, "adminBcTelegram"), callback_data: "admin:bc:tg" },
          { text: L(lg, "adminBcEmail"), callback_data: "admin:bc:email" },
        ],
        [{ text: L(lg, "adminBcBoth"), callback_data: "admin:bc:both" }],
        [{ text: L(lg, "cancel"), callback_data: "admin:menu" }],
      ],
    },
  });
});

// Сообщения с текстом — промокод или число для пополнения
bot.on("message:text", async (ctx) => {
  if (ctx.message.text?.startsWith("/")) return;
  const userId = ctx.from?.id;
  if (!userId) return;
  const lg = getLang(userId);

  // Админ: ввод текста рассылки
  if (awaitingBroadcastMessage.has(userId)) {
    awaitingBroadcastMessage.delete(userId);
    const config = await api.getPublicConfig();
    if (!config?.botAdminTelegramIds?.includes(String(userId))) {
      await ctx.reply(L(lg, "accessDenied"));
      return;
    }
    const text = ctx.message.text?.trim() ?? "";
    if (!text) {
      await ctx.reply(L(lg, "adminEnterNonEmpty"));
      return;
    }
    lastBroadcastMessage.set(userId, { text });
    await ctx.reply(L(lg, "adminBroadcastTo"), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: L(lg, "adminBcTelegram"), callback_data: "admin:bc:tg" },
            { text: L(lg, "adminBcEmail"), callback_data: "admin:bc:email" },
          ],
          [{ text: L(lg, "adminBcBoth"), callback_data: "admin:bc:both" }],
          [{ text: L(lg, "cancel"), callback_data: "admin:menu" }],
        ],
      },
    });
    return;
  }

  // Админ: ввод суммы пополнения баланса
  if (awaitingAdminBalance.has(userId)) {
    const clientId = awaitingAdminBalance.get(userId);
    awaitingAdminBalance.delete(userId);
    const config = await api.getPublicConfig();
    if (!config?.botAdminTelegramIds?.includes(String(userId)) || !clientId) {
      await ctx.reply(L(lg, "adminAccessDeniedOrExpired"));
      return;
    }
    const num = Number(ctx.message.text?.replace(/,/, "."));
    if (!Number.isFinite(num) || num <= 0 || num > 1000000) {
      await ctx.reply(L(lg, "adminEnterPositive"));
      return;
    }
    try {
      const result = await api.patchBotAdminClientBalance(userId, clientId, num);
      await ctx.reply(`${L(lg, "adminBalanceTopupped")} ${result.newBalance}`);
    } catch (e: unknown) {
      await ctx.reply(`❌ ${e instanceof Error ? e.message : L(lg, "error")}`);
    }
    return;
  }

  // Админ: ввод поиска (Telegram ID, @username, email)
  if (awaitingAdminSearch.has(userId)) {
    awaitingAdminSearch.delete(userId);
    const config = await api.getPublicConfig();
    if (!config?.botAdminTelegramIds?.includes(String(userId))) {
      await ctx.reply(L(lg, "accessDenied"));
      return;
    }
    const searchQuery = ctx.message.text?.trim() ?? "";
    lastAdminSearch.set(userId, searchQuery);
    try {
      const { items, total, limit } = await api.getBotAdminClients(userId, 1, searchQuery || undefined);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const msg =
        (searchQuery ? `${L(lg, "adminClientSearch")} «${searchQuery}» (${total})\n\n` : `${L(lg, "adminClientsTitle")} (${total})\n\n`) +
        items
          .map(
            (c, i) =>
              `${i + 1}. ${c.email || c.telegramUsername || c.telegramId || c.id.slice(0, 8)} ${c.isBlocked ? "🚫" : ""}`
          )
          .join("\n") +
        `\n\n${L(lg, "adminPage")} 1/${totalPages}`;
      const rows: InlineMarkup["inline_keyboard"] = items.map((c) => [
        {
          text: `${c.email || c.telegramUsername || c.telegramId || c.id.slice(0, 8)} ${c.isBlocked ? "🚫" : ""}`,
          callback_data: `admin:client:${c.id}`,
        },
      ]);
      const nav: InlineMarkup["inline_keyboard"][0] = [
        { text: L(lg, "backToAdmin"), callback_data: "admin:menu" },
      ];
      if (searchQuery) nav.push({ text: L(lg, "adminResetSearch"), callback_data: "admin:clients:clear" });
      if (totalPages > 1) nav.push({ text: L(lg, "adminNext"), callback_data: "admin:clients:2" });
      rows.push(nav);
      await ctx.reply(msg, { reply_markup: { inline_keyboard: rows } });
    } catch (e: unknown) {
      lastAdminSearch.delete(userId);
      const errMsg = e instanceof Error ? e.message : L(lg, "adminSearchError");
      await ctx.reply(`❌ ${errMsg}`);
    }
    return;
  }

  const token = getToken(userId);
  if (!token) return;
  const publicConfig = await api.getPublicConfig().catch(() => null);
  if (await enforceSubscription(ctx, publicConfig)) return;

  // Если пользователь ожидает ввод промокода
  if (awaitingPromoCode.has(userId)) {
    awaitingPromoCode.delete(userId);
    const code = ctx.message.text.trim();
    if (!code) {
      await ctx.reply(L(lg, "promocodeEmpty"));
      return;
    }
    try {
      // Сначала проверяем
      const checkResult = await api.checkPromoCode(token, code);
      if (checkResult.type === "FREE_DAYS") {
        // Активируем сразу
        const activateResult = await api.activatePromoCode(token, code);
        await ctx.reply(`✅ ${activateResult.message}\n\n${L(lg, "pressStartForMenu")}`);
      } else if (checkResult.type === "DISCOUNT") {
        const desc = checkResult.discountPercent
          ? L(lg, "promocodeDiscountPercent").replace("{{pct}}", String(checkResult.discountPercent))
          : checkResult.discountFixed
            ? L(lg, "promocodeDiscountFixed").replace("{{amount}}", String(checkResult.discountFixed))
            : L(lg, "promocodeDiscount");
        activeDiscountCode.set(userId, code);
        await ctx.reply(`${L(lg, "promocodeAccepted").replace("{{name}}", checkResult.name)} ${desc}.\n\n${L(lg, "promocodeWillApply")}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : L(lg, "promocodeActivationError");
      await ctx.reply(`❌ ${msg}`);
    }
    return;
  }

  const num = Number(ctx.message.text.replace(/,/, "."));
  if (!Number.isFinite(num) || num < 1 || num > 1000000) return;

  try {
    const config = publicConfig ?? await api.getPublicConfig();
    const methods = config?.plategaMethods ?? [];
    const yooEnabled = !!config?.yoomoneyEnabled;
    const yookassaEnabledMsg = !!config?.yookassaEnabled;
    const cryptopayEnabledMsg = !!config?.cryptopayEnabled;
    if (!methods.length && !yooEnabled && !yookassaEnabledMsg && !cryptopayEnabledMsg) {
      await ctx.reply(L(lg, "topupUnavailable"));
      return;
    }
    const client = await api.getMe(token);
    const rawStyles = config?.botInnerButtonStyles;
    const backStyle = rawStyles?.back !== undefined ? rawStyles.back : "danger";
    const botEmojis = config?.botEmojis;
    const msgEmojiIds: InnerEmojiIds | undefined = botEmojis
      ? {
          back: botEmojis.BACK?.tgEmojiId,
          card: botEmojis.CARD?.tgEmojiId,
          tariff: botEmojis.PACKAGE?.tgEmojiId || botEmojis.TARIFFS?.tgEmojiId,
          trial: botEmojis.TRIAL?.tgEmojiId,
          profile: botEmojis.PUZZLE?.tgEmojiId || botEmojis.PROFILE?.tgEmojiId,
          connect: botEmojis.SERVERS?.tgEmojiId || botEmojis.CONNECT?.tgEmojiId,
        }
      : undefined;
    if (methods.length > 1 || (methods.length >= 1 && (yooEnabled || yookassaEnabledMsg || cryptopayEnabledMsg)) || (methods.length === 0 && ((yooEnabled && yookassaEnabledMsg) || (yooEnabled && cryptopayEnabledMsg) || (yookassaEnabledMsg && cryptopayEnabledMsg)))) {
      const topupMsg1 = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(num, client.preferredCurrency)}\n\n${L(lg, "topupChoosePayMethod")}:`, config?.botEmojis);
      await ctx.reply(topupMsg1.text, {
        entities: topupMsg1.entities.length ? topupMsg1.entities : undefined,
        reply_markup: topupPaymentMethodButtons(String(num), methods, config?.botBackLabel ?? null, backStyle, msgEmojiIds, yooEnabled, yookassaEnabledMsg, cryptopayEnabledMsg),
      });
      return;
    }
    // Если только ЮMoney (нет platega, нет ЮKassa) — сразу создаём
    if (methods.length === 0 && yooEnabled) {
      const payment = await api.createYoomoneyPayment(token, { amount: num, paymentType: "AC" });
      const topupMsgYoo = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(num, client.preferredCurrency)}\n\n${L(lg, "paymentClickButtonYoomoney")}:`, config?.botEmojis);
      await ctx.reply(topupMsgYoo.text, {
        entities: topupMsgYoo.entities.length ? topupMsgYoo.entities : undefined,
        reply_markup: payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, backStyle, msgEmojiIds, lg),
      });
      return;
    }
    // Если только ЮKassa
    if (methods.length === 0 && yookassaEnabledMsg) {
      const payment = await api.createYookassaPayment(token, { amount: num, currency: "RUB" });
      const topupMsgYoo = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(num, "RUB")}\n\n${L(lg, "paymentClickButtonYookassa")}:`, config?.botEmojis);
      await ctx.reply(topupMsgYoo.text, {
        entities: topupMsgYoo.entities.length ? topupMsgYoo.entities : undefined,
        reply_markup: payUrlMarkup(payment.confirmationUrl, config?.botBackLabel ?? null, backStyle, msgEmojiIds, lg),
      });
      return;
    }
    // Если только Crypto Pay
    if (methods.length === 0 && cryptopayEnabledMsg) {
      const payment = await api.createCryptopayPayment(token, { amount: num, currency: client.preferredCurrency });
      const topupMsgCp = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(num, client.preferredCurrency)}\n\n${L(lg, "paymentClickButtonCryptoBot")}:`, config?.botEmojis);
      await ctx.reply(topupMsgCp.text, {
        entities: topupMsgCp.entities.length ? topupMsgCp.entities : undefined,
        reply_markup: payUrlMarkup(payment.payUrl, config?.botBackLabel ?? null, backStyle, msgEmojiIds, lg),
      });
      return;
    }
    const payment = await api.createPlategaPayment(token, {
      amount: num,
      currency: client.preferredCurrency,
      paymentMethod: methods[0].id,
      description: L(lg, "descriptionTopup"),
    });
    const topupMsg2 = titleWithEmoji("CARD", `${L(lg, "topupFor")} ${formatMoney(num, client.preferredCurrency)}\n\n${L(lg, "paymentClickButtonBelow")}:`, config?.botEmojis);
    await ctx.reply(topupMsg2.text, {
      entities: topupMsg2.entities.length ? topupMsg2.entities : undefined,
      reply_markup: payUrlMarkup(payment.paymentUrl, config?.botBackLabel ?? null, backStyle, msgEmojiIds, lg),
    });
  } catch {
    // не число или ошибка — игнорируем
  }
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.start({
  onStart: async (info) => {
    BOT_USERNAME = info.username || "";
    console.log(`Bot @${BOT_USERNAME} started`);
  },
});
