/**
 * Backend i18n helper.
 *
 * Usage:
 *   import { t } from "../../i18n/index.js";
 *   t("zh", "emailAlreadyRegistered")           // → "邮箱已注册"
 *   t("en", "notifyBalanceTopup", { amount })    // → "✅ <b>Balance topped up</b> by $10.00."
 */

import { en, type LocaleKeys } from "./locales/en.js";
import { zh } from "./locales/zh.js";
import { ru } from "./locales/ru.js";

export type { LocaleKeys };

const locales: Record<string, Record<LocaleKeys, string>> = { en, zh, ru };

/**
 * Resolve a locale map from a language string.
 * Accepts "zh", "en", "ru" or any prefix like "zh-CN", "en-US".
 * Falls back to `en` if not found.
 */
function resolveLocale(lang?: string | null): Record<LocaleKeys, string> {
  if (!lang) return en;
  const code = lang.trim().toLowerCase().slice(0, 2);
  return locales[code] ?? en;
}

/**
 * Translate a key with optional interpolation.
 * Placeholders use `{name}` syntax.
 *
 * @param lang  - user's preferred language (e.g. "zh", "en", "ru")
 * @param key   - key from LocaleKeys
 * @param vars  - optional placeholder values
 */
export function t(lang: string | null | undefined, key: LocaleKeys, vars?: Record<string, string | number>): string {
  const locale = resolveLocale(lang);
  let text = locale[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}
