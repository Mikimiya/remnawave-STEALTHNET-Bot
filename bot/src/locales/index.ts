/**
 * STEALTHNET 3.0 — i18n module for bot
 */
import ru from "./ru.js";
import en from "./en.js";
import zh from "./zh.js";
import type { LocaleStrings } from "./ru.js";

export type { LocaleStrings };

const locales: Record<string, LocaleStrings> = { ru, en, zh };

/**
 * Resolve a locale string by key for a given language.
 * Falls back: lang → en → zh.
 */
export function L(lang: string, key: keyof LocaleStrings): string {
  const normalized = (lang || "zh").toLowerCase().split("-")[0]!;
  const dict = locales[normalized] ?? locales["en"] ?? locales["zh"]!;
  return dict[key] ?? zh[key] ?? "";
}

/**
 * Format days in the user's language.
 */
export function formatDaysI18n(days: number, lang: string): string {
  const normalized = (lang || "zh").toLowerCase().split("-")[0]!;
  if (normalized === "zh") return `${days} 天`;
  if (normalized === "en") return `${days} day${days === 1 ? "" : "s"}`;
  // Russian
  const abs = Math.abs(days);
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${days} дней`;
  if (last === 1) return `${days} день`;
  if (last >= 2 && last <= 4) return `${days} дня`;
  return `${days} дней`;
}

/**
 * Get the full DEFAULT_MENU_TEXTS for a given language (used by buildMainMenuText fallback).
 */
export function getDefaultMenuTexts(lang: string): Record<string, string> {
  const normalized = (lang || "zh").toLowerCase().split("-")[0]!;
  const dict = locales[normalized] ?? locales["zh"]!;
  return {
    welcomeTitlePrefix: dict.welcomeTitlePrefix,
    welcomeGreeting: dict.welcomeGreeting,
    balancePrefix: dict.balancePrefix,
    tariffPrefix: dict.tariffPrefix,
    subscriptionPrefix: dict.subscriptionPrefix,
    statusInactive: dict.statusInactive,
    statusActive: dict.statusActive,
    statusExpired: dict.statusExpired,
    statusLimited: dict.statusLimited,
    statusDisabled: dict.statusDisabled,
    expirePrefix: dict.expirePrefix,
    daysLeftPrefix: dict.daysLeftPrefix,
    devicesLabel: dict.devicesLabel,
    devicesAvailable: dict.devicesAvailable,
    trafficPrefix: dict.trafficPrefix,
    linkLabel: dict.linkLabel,
    chooseAction: dict.chooseAction,
  };
}
