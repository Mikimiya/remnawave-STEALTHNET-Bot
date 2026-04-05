/**
 * Bulk i18n replacement script for client.routes.ts
 * Run: node backend/scripts/i18n-replace.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const FILE = "backend/src/modules/client/client.routes.ts";
let src = readFileSync(FILE, "utf8");

// Simple exact string replacements: { "exact old message": 'replacement expression' }
// We replace `message: "OLD"` with `message: t(reqLang(req), "key")`
// For cases inside functions/callbacks where req is available

const replacements = [
  // ── Password recovery (forgot-password) ──
  ['message: "Password recovery email is not configured. Contact administrator."', 'message: t(reqLang(req), "passwordRecoveryNotConfigured")'],
  ['message: "Public app URL is not set in settings."', 'message: t(reqLang(req), "publicAppUrlNotSet")'],
  ['message: "Password recovery is temporarily unavailable. Please contact administrator."', 'message: t(reqLang(req), "passwordRecoveryUnavailable")'],
  ['message: "Failed to send password reset email. Try again later."', 'message: t(reqLang(req), "failedToSendResetEmail")'],

  // ── verify-password-reset + reset-password ──
  // "Invalid input" already has a key
  // "Invalid or expired link" already has a key
  ['message: "Password reset successful"', 'message: t(reqLang(req), "passwordResetSuccess")'],

  // ── Login ──
  ['message: "Invalid email or password"', 'message: t(reqLang(req), "invalidEmailOrPassword")'],

  // ── Telegram miniapp ──
  ['message: "Invalid or expired Telegram data"', 'message: t(reqLang(req), "invalidOrExpiredTelegramData")'],
  ['message: "Missing user in init data"', 'message: t(reqLang(req), "missingUserData")'],
  ['message: "Сервис временно недоступен. Не удалось создать учётную запись VPN. Попробуйте позже."', 'message: t(reqLang(req), "serviceTemporarilyUnavailableVpnCreation")'],

  // ── 2FA login ──
  ['message: "Введите 6-значный код"', 'message: t(reqLang(req), "enter6DigitCode")'],
  ['message: "Сессия истекла. Войдите снова."', 'message: t(reqLang(req), "sessionExpiredLoginAgain")'],
  ['message: "2FA не включена. Войдите снова."', 'message: t(reqLang(req), "twoFANotEnabledLoginAgain")'],

  // ── Google / Apple login ──
  ['message: "Google login is not enabled"', 'message: t(reqLang(req), "googleLoginNotEnabled")'],
  ['message: "Invalid Google token"', 'message: t(reqLang(req), "invalidGoogleToken")'],
  ['message: "Apple login is not enabled"', 'message: t(reqLang(req), "appleLoginNotEnabled")'],
  ['message: "Invalid Apple token"', 'message: t(reqLang(req), "invalidAppleToken")'],
  ['message: "Service temporarily unavailable"', 'message: t(reqLang(req), "serviceTemporarilyUnavailable")'],

  // ── 2FA setup/confirm/disable ──
  ['message: "2FA уже включена"', 'message: t(reqLang(req), "twoFAAlreadyEnabled")'],
  ['message: "Введите 6-значный код из приложения"', 'message: t(reqLang(req), "enter6DigitCodeFromApp")'],
  ['message: "Сначала запустите настройку 2FA"', 'message: t(reqLang(req), "startTwoFASetupFirst")'],
  ['message: "Неверный код. Проверьте время на устройстве."', 'message: t(reqLang(req), "invalidCodeCheckTime")'],
  ['message: "Двухфакторная аутентификация включена"', 'message: t(reqLang(req), "twoFAEnabled")'],
  ['message: "2FA не включена"', 'message: t(reqLang(req), "twoFANotEnabled")'],
  ['message: "Двухфакторная аутентификация отключена"', 'message: t(reqLang(req), "twoFADisabled")'],

  // ── Password change/set ──
  ['message: "У вас нет пароля. Используйте вход через Telegram или Email."', 'message: t(reqLang(req), "noPasswordUseTelegramOrEmail")'],
  ['message: "Неверный текущий пароль"', 'message: t(reqLang(req), "incorrectCurrentPassword")'],
  ['message: "Пароль успешно изменён"', 'message: t(reqLang(req), "passwordChanged")'],
  ['message: "Пароль уже установлен. Используйте смену пароля."', 'message: t(reqLang(req), "passwordAlreadySet")'],
  ['message: "Пароль установлен"', 'message: t(reqLang(req), "passwordSet")'],

  // ── Telegram linking ──
  ['message: "Telegram уже привязан"', 'message: t(reqLang(req), "telegramAlreadyLinked")'],
  ['message: "Недействительные или устаревшие данные Telegram"', 'message: t(reqLang(req), "invalidOrExpiredTelegramData")'],
  ['message: "Нет данных пользователя"', 'message: t(reqLang(req), "missingUserData")'],

  // ── Email linking ──
  ['message: "Почта уже привязана"', 'message: t(reqLang(req), "emailAlreadyLinked")'],
  ['message: "Некорректный email"', 'message: t(reqLang(req), "invalidEmail")'],
  ['message: "Отправка писем не настроена. Обратитесь в поддержку."', 'message: t(reqLang(req), "smtpNotConfigured")'],
  ['message: "Эта почта уже используется другим аккаунтом"', 'message: t(reqLang(req), "emailAlreadyUsedByAnother")'],
  ['message: "Не задан URL приложения в настройках"', 'message: t(reqLang(req), "appUrlNotSetInSettings")'],
  ['message: "Не удалось отправить письмо. Попробуйте позже."', 'message: t(reqLang(req), "failedToSendEmail")'],
  ['message: "Письмо с ссылкой отправлено на указанный email"', 'message: t(reqLang(req), "verificationEmailSent")'],

  // ── Trial ──
  ['message: "Триал уже использован"', 'message: t(reqLang(req), "trialAlreadyUsed")'],
  ['message: "Триал не настроен"', 'message: t(reqLang(req), "trialNotConfigured")'],
  ['message: "Триал активирован"', 'message: t(reqLang(req), "trialActivated")'],
  ['message: "Ошибка создания пользователя"', 'message: t(reqLang(req), "errorCreatingUser")'],

  // ── Promo codes ──
  ['message: "Промокод не указан"', 'message: t(reqLang(req), "promoCodeNotSpecified")'],
  ['message: "Промокод не найден или неактивен"', 'message: t(reqLang(req), "promoCodeNotFoundOrInactive")'],
  ['message: "Вы уже активировали этот промокод"', 'message: t(reqLang(req), "promoCodeAlreadyActivated")'],
  ['message: "Лимит активаций промокода исчерпан"', 'message: t(reqLang(req), "promoCodeActivationLimitReached")'],
  ['message: "Ошибка создания пользователя VPN"', 'message: t(reqLang(req), "vpnUserCreationError")'],
  ['message: "Промокод активирован! Подписка подключена."', 'message: t(reqLang(req), "promoCodeActivated")'],
  ['message: "Промокод на скидку применяется при оплате тарифа"', 'message: t(reqLang(req), "discountPromoAppliedAtPayment")'],
  ['message: "Промокод не полностью настроен"', 'message: t(reqLang(req), "promoCodeNotFullyConfigured")'],

  // ── Subscription / devices ──
  ['message: "Подписка не привязана"', 'message: t(reqLang(req), "subscriptionNotLinked")'],
  ['message: "Устройство удалено"', 'message: t(reqLang(req), "deviceRemoved")'],

  // ── Flexible tariff ──
  ['message: "Гибкий тариф отключён"', 'message: t(reqLang(req), "flexibleTariffDisabled")'],

  // ── Options selling ──
  ['message: "Продажа опций отключена"', 'message: t(reqLang(req), "optionsSalesDisabled")'],
  ['message: "Опция не найдена"', 'message: t(reqLang(req), "optionNotFound")'],

  // ── Common payment ──
  ['message: "Укажите сумму и валюту"', 'message: t(reqLang(req), "specifyAmountAndCurrency")'],
  ['message: "Тариф не найден"', 'message: t(reqLang(req), "tariffNotFound")'],
  ['message: "Прокси-тариф не найден"', 'message: t(reqLang(req), "proxyTariffNotFound")'],
  ['message: "Тариф Sing-box не найден"', 'message: t(reqLang(req), "singboxTariffNotFound")'],
  ['message: "Минимальная сумма платежа — 1"', 'message: t(reqLang(req), "minimumPaymentAmount1")'],
  ['message: "Этот промокод не даёт скидку на оплату"', 'message: t(reqLang(req), "promoNotDiscount")'],
  ['message: "Итоговая сумма не может быть 0"', 'message: t(reqLang(req), "finalAmountCannotBeZero")'],

  // ── Platega ──
  ['message: "Platega не настроен"', 'message: t(reqLang(req), "plategaNotConfigured")'],
  ['message: "Метод оплаты недоступен"', 'message: t(reqLang(req), "paymentMethodNotAvailable")'],

  // ── Balance payment ──
  ['message: "Укажите tariffId, proxyTariffId или singboxTariffId"', 'message: t(reqLang(req), "specifyTariffId")'],

  // ── Custom build ──
  ['message: "Неверные параметры"', 'message: t(reqLang(req), "invalidParams")'],

  // ── Option applied ──
  ['message: "Опция применена. Списано с баланса."', 'message: t(reqLang(req), "optionAppliedFromBalance")'],

  // ── YooMoney ──
  ['message: "ЮMoney не настроен или не указан URL приложения"', 'message: t(reqLang(req), "yoomoneyNotConfiguredOrNoUrl")'],
  ['message: "Укажите сумму"', 'message: t(reqLang(req), "specifyAmount")'],
  ['message: "Сначала подключите кошелёк ЮMoney"', 'message: t(reqLang(req), "connectYoomoneyFirst")'],
  ['message: "ЮMoney не настроен"', 'message: t(reqLang(req), "yoomoneyNotConfigured")'],
  ['message: "Платёж не найден или уже обработан"', 'message: t(reqLang(req), "paymentNotFoundOrProcessed")'],
  ['message: "Кошелёк ЮMoney не подключён"', 'message: t(reqLang(req), "yoomoneyWalletNotConnected")'],
  ['message: "Платёж обрабатывается, повторите запрос через минуту"', 'message: t(reqLang(req), "paymentInProgress")'],
  ['message: "Баланс пополнен"', 'message: t(reqLang(req), "balanceToppedUp")'],
  ['message: "Укажите сумму и способ оплаты"', 'message: t(reqLang(req), "specifyAmountAndMethod")'],
  ['message: "Платёж не найден или уже оплачен"', 'message: t(reqLang(req), "paymentNotFoundOrPaid")'],

  // ── YooKassa ──
  ['message: "ЮKassa не настроена"', 'message: t(reqLang(req), "yookassaNotConfigured")'],
  ['message: "ЮKassa принимает только рубли (RUB)"', 'message: t(reqLang(req), "yookassaRubOnly")'],

  // ── CryptoPay ──
  ['message: "Crypto Pay не настроен"', 'message: t(reqLang(req), "cryptopayNotConfigured")'],
  ['message: "Crypto Pay: поддерживаются USD, RUB, EUR и др. Укажите валюту из списка."', 'message: t(reqLang(req), "cryptopayCurrencyNotSupported")'],
  ['message: "Минимальная сумма — 0.5"', 'message: t(reqLang(req), "minimumAmount05")'],

  // ── Heleket ──
  ['message: "Heleket не настроен"', 'message: t(reqLang(req), "heleketNotConfigured")'],

  // ── ePay ──
  ['message: "Invalid params"', 'message: t(reqLang(req), "invalidParams")'],
  ['message: "ePay not configured"', 'message: t(reqLang(req), "epayNotConfigured")'],
  ['message: "Custom build disabled"', 'message: t(reqLang(req), "flexibleTariffDisabled")'],
  ['message: "Options disabled"', 'message: t(reqLang(req), "optionsSalesDisabled")'],
  ['message: "Option not found"', 'message: t(reqLang(req), "optionNotFound")'],
  ['message: "Tariff not found"', 'message: t(reqLang(req), "tariffNotFound")'],
  ['message: "Proxy tariff not found"', 'message: t(reqLang(req), "proxyTariffNotFound")'],
  ['message: "Singbox tariff not found"', 'message: t(reqLang(req), "singboxTariffNotFound")'],
  ['message: "Amount required"', 'message: t(reqLang(req), "specifyAmount")'],
  ['message: "Minimum amount: 0.01"', 'message: t(reqLang(req), "minimumAmount001")'],
  ['message: "publicAppUrl not configured — ePay callbacks will not work"', 'message: t(reqLang(req), "publicAppUrlNotSet")'],

  // ── AI Chat ──
  ['message: "Неверный формат сообщений"', 'message: t(reqLang(req), "invalidMessageFormat")'],
  ['message: "AI-чат отключён"', 'message: t(reqLang(req), "aiChatDisabled")'],
  ['message: "Ошибка сервиса AI или превышены лимиты"', 'message: t(reqLang(req), "aiServiceError")'],
  ['message: "Внутренняя ошибка сервера"', 'message: t(reqLang(req), "internalServerError")'],

  // ── Tickets ──
  ['message: "Тикет-система отключена"', 'message: t(reqLang(req), "ticketSystemDisabled")'],
  ['message: "Тикет не найден"', 'message: t(reqLang(req), "ticketNotFound")'],

  // ── Link telegram from bot ──
  ['message: "Неверный или просроченный код"', 'message: t(reqLang(req), "invalidOrExpiredCode")'],
  ['message: "Код истёк. Запросите новый в кабинете."', 'message: t(reqLang(req), "codeExpiredRequestNew")'],
  ['message: "Telegram привязан"', 'message: t(reqLang(req), "telegramLinked")'],

  // ── Public tariffs errors ──
  ['message: "Ошибка загрузки тарифов"', 'message: t(reqLang(req), "errorLoadingTariffs")'],
  ['message: "Ошибка загрузки тарифов прокси"', 'message: t(reqLang(req), "errorLoadingProxyTariffs")'],
  ['message: "Ошибка загрузки тарифов Sing-box"', 'message: t(reqLang(req), "errorLoadingSingboxTariffs")'],

  // ── Common ──
  ['message: "Invalid input"', 'message: t(reqLang(req), "invalidInput")'],
  ['message: "Invalid or expired link"', 'message: t(reqLang(req), "invalidOrExpiredLink")'],
  ['message: "Account is blocked"', 'message: t(reqLang(req), "accountBlocked")'],
  ['message: "Unauthorized"', 'message: t(reqLang(req), "unauthorized")'],
  ['message: "Not found"', 'message: t(reqLang(req), "notFound")'],
  ['message: "Неверный код"', 'message: t(reqLang(req), "invalidCode")'],
  ['message: "Сервис временно недоступен"', 'message: t(reqLang(req), "serviceTemporarilyUnavailable")'],
  ['message: "paymentId required"', 'message: t(reqLang(req), "paymentIdRequired")'],
  ['message: "Минимальная сумма платежа — 1"', 'message: t(reqLang(req), "minimumPaymentAmount1")'],
];

let count = 0;
for (const [oldStr, newStr] of replacements) {
  const occurrences = src.split(oldStr).length - 1;
  if (occurrences > 0) {
    src = src.replaceAll(oldStr, newStr);
    count += occurrences;
    console.log(`  ✓ [${occurrences}x] ${oldStr.slice(0, 60)}...`);
  }
}

console.log(`\nTotal replacements: ${count}`);

// Now check if there are still hardcoded Russian messages remaining
const remaining = [];
const lines = src.split("\n");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('message: "') && !line.includes("t(reqLang") && !line.includes("t(null") && !line.includes("result.error") && !line.includes("message: message") && !line.includes("result.promo")) {
    // Check if it contains Cyrillic
    if (/[\u0400-\u04FF]/.test(line) || /[\u4e00-\u9fff]/.test(line)) {
      remaining.push(`  Line ${i+1}: ${line.trim()}`);
    }
  }
}

if (remaining.length > 0) {
  console.log(`\n⚠ Remaining hardcoded Cyrillic/Chinese messages (${remaining.length}):`);
  remaining.forEach(l => console.log(l));
}

writeFileSync(FILE, src, "utf8");
console.log("\n✅ File updated successfully.");
