import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ru from "./ru";
import en from "./en";
import zh from "./zh";

export const SUPPORTED_LANGUAGES = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: "en",
    supportedLngs: ["ru", "en", "zh"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "stealthnet_lang",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

// ── 多语言天数格式化工具 ──────────────────────────────────────────────────────

function formatRuDays(n: number): string {
  const abs = Math.abs(n);
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${n} дней`;
  if (last === 1) return `${n} день`;
  if (last >= 2 && last <= 4) return `${n} дня`;
  return `${n} дней`;
}

/** 按当前 UI 语言格式化天数（ru/en/zh） */
export function formatDays(n: number, lang: string): string {
  const l = (lang || "ru").toLowerCase().slice(0, 2);
  if (l === "zh") return `${n} 天`;
  if (l === "en") return n === 1 ? `${n} day` : `${n} days`;
  return formatRuDays(n);
}
