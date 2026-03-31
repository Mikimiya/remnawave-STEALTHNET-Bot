import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TFunction } from "i18next";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Map of known Russian backend error / label strings → i18n keys.
 * Used to translate hardcoded Russian messages returned by the backend.
 */
const BACKEND_RU_MAP: Record<string, string> = {
  // Payment / Platega
  "Platega не настроен": "backendErrors.plategaNotConfigured",
  "Метод оплаты недоступен": "backendErrors.paymentMethodUnavailable",
  "Итоговая сумма не может быть 0": "backendErrors.amountCannotBeZero",
  // Trial
  "Триал уже использован": "backendErrors.trialAlreadyUsed",
  "Триал не настроен": "backendErrors.trialNotConfigured",
  "Сервис временно недоступен": "backendErrors.serviceUnavailable",
  "Триал активирован": "backendErrors.trialActivated",
  // Promo
  "Промокод не указан": "backendErrors.promoCodeEmpty",
  "Промокод не найден или неактивен": "backendErrors.promoCodeNotFound",
  "Вы уже активировали этот промокод": "backendErrors.promoCodeAlreadyUsed",
  "Лимит активаций промокода исчерпан": "backendErrors.promoCodeLimitReached",
  "Срок действия промокода истёк": "backendErrors.promoCodeExpired",
  "Лимит использований промокода исчерпан": "backendErrors.promoCodeUsesExhausted",
  "Вы уже использовали этот промокод": "backendErrors.promoCodeAlreadyUsedByYou",
  "Промокод активирован! Подписка подключена.": "backendErrors.promoCodeActivated",
  "Промокод на скидку применяется при оплате тарифа": "backendErrors.promoCodeDiscountOnly",
  "Промокод не полностью настроен": "backendErrors.promoCodeNotFullyConfigured",
  // 2FA
  "Неверный код": "backendErrors.invalidCode",
  "Неверный код. Проверьте время на устройстве.": "backendErrors.invalidCodeCheckTime",
  "Сначала запустите настройку 2FA": "backendErrors.start2FAFirst",
  "Введите 6-значный код из приложения": "backendErrors.enter6DigitCode",
  "Введите 6-значный код": "backendErrors.enter6DigitCode",
  "Двухфакторная аутентификация включена": "backendErrors.twoFaEnabled",
  "Двухфакторная аутентификация отключена": "backendErrors.twoFaDisabled",
  // Password
  "Неверный текущий пароль": "backendErrors.wrongCurrentPassword",
  "Пароль уже установлен. Используйте смену пароля.": "backendErrors.passwordAlreadySet",
  "Пароль успешно изменён": "backendErrors.passwordChanged",
  "Пароль установлен": "backendErrors.passwordSet",
  "У вас нет пароля. Используйте вход через Telegram или Email.": "backendErrors.noPasswordUseOther",
  // Email
  "Почта уже привязана": "backendErrors.emailAlreadyLinked",
  "Некорректный email": "backendErrors.invalidEmail",
  "Эта почта уже используется другим аккаунтом": "backendErrors.emailUsedByOther",
  "Не удалось отправить письмо. Попробуйте позже.": "backendErrors.emailSendFailed",
  "Отправка писем не настроена. Обратитесь в поддержку.": "backendErrors.emailNotConfigured",
  "Письмо с ссылкой отправлено на указанный email": "backendErrors.emailLinkSent",
  "Не задан URL приложения в настройках": "backendErrors.appUrlNotSet",
  // Auth / Telegram
  "Недействительные или устаревшие данные Telegram": "backendErrors.invalidTelegramData",
  "Нет данных пользователя": "backendErrors.noUserData",
  "Сессия истекла. Войдите снова.": "backendErrors.sessionExpired",
  "Ошибка создания пользователя": "backendErrors.userCreationError",
  "Ошибка создания пользователя VPN": "backendErrors.vpnUserCreationError",
  "Сервис временно недоступен. Не удалось создать учётную запись VPN. Попробуйте позже.": "backendErrors.vpnAccountCreationFailed",
  // Link
  "Недействительная или просроченная ссылка": "backendErrors.invalidOrExpiredLink",
  "Ссылка просрочена. Запросите привязку почты снова.": "backendErrors.linkExpiredRetry",
  "Эта почта уже привязана к другому аккаунту.": "backendErrors.emailAlreadyLinkedOther",
  // Subscription
  "Подписка не привязана": "backendErrors.subscriptionNotLinked",
  "Устройство удалено": "backendErrors.deviceRemoved",
  // Password reset
  "Если аккаунт с этой почтой существует, мы отправили письмо для сброса пароля.": "backendErrors.resetEmailSentIfExists",
  "Ссылка действительна. Можно задать новый пароль.": "backendErrors.resetLinkValid",
};

/**
 * Translate a backend error message using i18n.
 * Falls back to the original string if no translation is found.
 */
export function translateBackendMessage(msg: string, t: TFunction): string {
  const key = BACKEND_RU_MAP[msg];
  if (key) {
    const translated = t(key, { defaultValue: "" });
    if (translated && translated !== key) return translated;
  }
  return msg;
}

/**
 * Map of known Platega method IDs → i18n keys for labels.
 */
const PLATEGA_METHOD_I18N: Record<number, string> = {
  2: "platega.methods.spb",
  11: "platega.methods.cards",
  12: "platega.methods.international",
  13: "platega.methods.crypto",
};

/**
 * Translate a Platega method label.
 * If the label matches the known Russian default, use i18n; otherwise keep admin-customised label.
 */
const PLATEGA_RU_LABELS: Record<number, string> = {
  2: "СПБ",
  11: "Карты",
  12: "Международный",
  13: "Криптовалюта",
};

export function translatePlategaLabel(
  method: { id: number; label: string },
  t: TFunction,
): string {
  // Only translate if the label is the default Russian one
  if (PLATEGA_RU_LABELS[method.id] && method.label === PLATEGA_RU_LABELS[method.id]) {
    const key = PLATEGA_METHOD_I18N[method.id];
    if (key) {
      const translated = t(key, { defaultValue: "" });
      if (translated && translated !== key) return translated;
    }
  }
  return method.label;
}

/**
 * Format a monetary amount with the correct currency symbol & locale.
 * Supports any ISO 4217 currency code; picks a sensible locale automatically.
 */
export function formatMoney(
  amount: number,
  currency: string,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
) {
  const code = currency.toUpperCase();
  const locale =
    code === "RUB" ? "ru-RU" :
    code === "CNY" ? "zh-CN" :
    code === "JPY" ? "ja-JP" :
    code === "KRW" ? "ko-KR" :
    code === "EUR" ? "de-DE" :
    code === "GBP" ? "en-GB" :
    "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: opts?.minimumFractionDigits ?? 0,
      maximumFractionDigits: opts?.maximumFractionDigits ?? 0,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}
