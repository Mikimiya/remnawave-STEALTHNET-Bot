/**
 * Russian locale strings for backend API responses and notifications.
 */
import type { LocaleKeys } from "./en.js";

export const ru: Record<LocaleKeys, string> = {
  // ── Client API error messages ──────────────────────────────────────
  invalidInput: "Неверный ввод",
  provideEmailOrTelegram: "Укажите email+пароль или telegramId",
  emailAlreadyRegistered: "Email уже зарегистрирован",
  checkEmailToComplete: "Проверьте почту для завершения регистрации",
  failedToSendVerificationEmail: "Не удалось отправить письмо подтверждения. Попробуйте позже.",
  emailRegistrationNotConfigured: "Регистрация по email не настроена. Свяжитесь с администратором.",
  publicAppUrlNotSet: "Публичный URL приложения не задан в настройках.",
  accountBlocked: "Аккаунт заблокирован",
  invalidOrExpiredLink: "Недействительная или просроченная ссылка",
  linkExpired: "Ссылка просрочена. Зарегистрируйтесь снова.",
  emailLinkExpired: "Ссылка просрочена. Запросите привязку почты снова.",
  emailAlreadyLinkedToAnother: "Эта почта уже привязана к другому аккаунту.",
  unauthorized: "Не авторизован",
  invalidEmailOrPassword: "Неверный email или пароль",

  // ── 2FA ────────────────────────────────────────────────────────────
  enter6DigitCode: "Введите 6-значный код",
  enter6DigitCodeFromApp: "Введите 6-значный код из приложения",
  sessionExpiredLoginAgain: "Сессия истекла. Войдите снова.",
  twoFANotEnabled: "2FA не включена",
  twoFANotEnabledLoginAgain: "2FA не включена. Войдите снова.",
  invalidCode: "Неверный код",
  invalidCodeCheckTime: "Неверный код. Проверьте время на устройстве.",
  twoFAAlreadyEnabled: "2FA уже включена",
  startTwoFASetupFirst: "Сначала запустите настройку 2FA или 2FA уже включена",
  twoFAEnabled: "Двухфакторная аутентификация включена",
  twoFADisabled: "Двухфакторная аутентификация отключена",

  // ── Password ───────────────────────────────────────────────────────
  noPasswordUseTelegramOrEmail: "У вас нет пароля. Используйте вход через Telegram или Email.",
  incorrectCurrentPassword: "Неверный текущий пароль",
  passwordChanged: "Пароль успешно изменён",
  passwordAlreadySet: "Пароль уже установлен. Используйте смену пароля.",
  passwordSet: "Пароль установлен",
  passwordResetLinkValid: "Ссылка действительна. Можно задать новый пароль.",
  passwordResetSuccess: "Пароль успешно сброшен",
  passwordRecoveryNotConfigured: "Восстановление пароля не настроено. Свяжитесь с администратором.",
  passwordRecoveryUnavailable: "Восстановление пароля временно недоступно. Свяжитесь с администратором.",
  failedToSendResetEmail: "Не удалось отправить письмо для сброса пароля. Попробуйте позже.",
  passwordResetEmailSentIfExists: "Если аккаунт с этой почтой существует, мы отправили письмо для сброса пароля.",

  // ── Telegram linking ──────────────────────────────────────────────
  telegramAlreadyLinked: "Telegram уже привязан",
  invalidOrExpiredTelegramData: "Недействительные или устаревшие данные Telegram",
  missingUserData: "Нет данных пользователя",
  telegramLinked: "Telegram привязан",

  // ── Email linking ─────────────────────────────────────────────────
  emailAlreadyLinked: "Почта уже привязана",
  invalidEmail: "Некорректный email",
  smtpNotConfigured: "Отправка писем не настроена. Обратитесь в поддержку.",
  emailAlreadyUsedByAnother: "Эта почта уже используется другим аккаунтом",
  appUrlNotSetInSettings: "Не задан URL приложения в настройках",
  failedToSendEmail: "Не удалось отправить письмо. Попробуйте позже.",
  verificationEmailSent: "Письмо с ссылкой отправлено на указанный email",

  // ── Trial ─────────────────────────────────────────────────────────
  trialAlreadyUsed: "Триал уже использован",
  trialNotConfigured: "Триал не настроен",
  serviceTemporarilyUnavailable: "Сервис временно недоступен",
  serviceTemporarilyUnavailableVpnCreation: "Сервис временно недоступен. Не удалось создать учётную запись VPN. Попробуйте позже.",
  errorCreatingUser: "Ошибка создания пользователя",
  trialActivated: "Триал активирован",

  // ── Promo codes ───────────────────────────────────────────────────
  promoCodeNotSpecified: "Промокод не указан",
  promoCodeNotFoundOrInactive: "Промокод не найден или неактивен",
  promoCodeAlreadyActivated: "Вы уже активировали этот промокод",
  promoCodeActivationLimitReached: "Лимит активаций промокода исчерпан",
  vpnUserCreationError: "Ошибка создания пользователя VPN",
  promoCodeActivated: "Промокод активирован! Подписка подключена.",
  discountPromoAppliedAtPayment: "Промокод на скидку применяется при оплате тарифа",
  promoCodeNotFullyConfigured: "Промокод не полностью настроен",

  // ── Subscription ──────────────────────────────────────────────────
  subscriptionNotLinked: "Подписка не привязана",
  deviceRemoved: "Устройство удалено",
  flexibleTariffDisabled: "Гибкий тариф отключён",

  // ── Payment common ────────────────────────────────────────────────
  optionsSalesDisabled: "Продажа опций отключена",
  optionNotFound: "Опция не найдена",
  specifyAmountAndCurrency: "Укажите сумму и валюту",
  tariffNotFound: "Тариф не найден",
  proxyTariffNotFound: "Прокси-тариф не найден",
  singboxTariffNotFound: "Тариф Sing-box не найден",
  minimumPaymentAmount1: "Минимальная сумма платежа — 1",
  promoNotDiscount: "Этот промокод не даёт скидку на оплату",
  finalAmountCannotBeZero: "Итоговая сумма не может быть 0",
  specifyTariffId: "Укажите tariffId, proxyTariffId или singboxTariffId",
  invalidParams: "Неверные параметры",
  specifyAmount: "Укажите сумму",
  specifyAmountAndMethod: "Укажите сумму и способ оплаты",
  optionAppliedFromBalance: "Опция применена. Списано с баланса.",
  paymentIdRequired: "paymentId обязателен",
  balanceToppedUp: "Баланс пополнен",
  paymentInProgress: "Платёж обрабатывается, повторите запрос через минуту",
  paymentNotFoundOrProcessed: "Платёж не найден или уже обработан",
  paymentNotFoundOrPaid: "Платёж не найден или уже оплачен",
  paymentMethodNotAvailable: "Метод оплаты недоступен",

  // ── Payment gateways ──────────────────────────────────────────────
  plategaNotConfigured: "Platega не настроен",
  yoomoneyNotConfiguredOrNoUrl: "ЮMoney не настроен или не указан URL приложения",
  connectYoomoneyFirst: "Сначала подключите кошелёк ЮMoney",
  yoomoneyNotConfigured: "ЮMoney не настроен",
  yoomoneyWalletNotConnected: "Кошелёк ЮMoney не подключён",
  yookassaNotConfigured: "ЮKassa не настроена",
  yookassaRubOnly: "ЮKassa принимает только рубли (RUB)",
  cryptopayNotConfigured: "Crypto Pay не настроен",
  cryptopayCurrencyNotSupported: "Crypto Pay: поддерживаются USD, RUB, EUR и др. Укажите валюту из списка.",
  minimumAmount05: "Минимальная сумма — 0.5",
  heleketNotConfigured: "Heleket не настроен",
  epayNotConfigured: "ePay не настроен",
  minimumAmount001: "Минимальная сумма: 0.01",

  // ── Dynamic payment messages ──────────────────────────────────────
  daysDevicesLimit: "Дни: 1–{maxDays}, устройств: 1–{maxDevices}",
  insufficientFunds: "Недостаточно средств. Баланс: {balance}, нужно: {needed}",
  proxyPaidFromBalance: "Прокси «{name}» оплачены! Списано {amount} {currency} с баланса.",
  singboxPaidFromBalance: "Доступы «{name}» оплачены! Списано {amount} {currency} с баланса.",
  tariffActivatedFromBalance: "Тариф «{name}» активирован! Списано {amount} {currency} с баланса.",
  customBuildActivated: "Подписка на {days} дн., {devices} устройств активирована. Списано {amount} {currency}.",
  promoActivatedWithDays: "Промокод активирован! Подписка на {days} дн. подключена.",

  // ── AI Chat ───────────────────────────────────────────────────────
  invalidMessageFormat: "Неверный формат сообщений",
  aiChatDisabled: "AI-чат отключён",
  aiServiceError: "Ошибка сервиса AI или превышены лимиты",
  internalServerError: "Внутренняя ошибка сервера",

  // ── Tickets ───────────────────────────────────────────────────────
  ticketSystemDisabled: "Тикет-система отключена",

  // ── Link telegram from bot ────────────────────────────────────────
  invalidOrExpiredCode: "Неверный или просроченный код",
  codeExpiredRequestNew: "Код истёк. Запросите новый в кабинете.",

  // ── Public tariffs ────────────────────────────────────────────────
  errorLoadingTariffs: "Ошибка загрузки тарифов",
  errorLoadingProxyTariffs: "Ошибка загрузки тарифов прокси",
  errorLoadingSingboxTariffs: "Ошибка загрузки тарифов Sing-box",

  // ── Google / Apple login ──────────────────────────────────────────
  googleLoginNotEnabled: "Вход через Google не включён",
  invalidGoogleToken: "Недействительный токен Google",
  appleLoginNotEnabled: "Вход через Apple не включён",
  invalidAppleToken: "Недействительный токен Apple",

  // ── Telegram notifications (user-facing) ──────────────────────────
  notifyBalanceTopup: "✅ <b>Баланс пополнен</b> на {amount}.",
  notifyTariffActivated: '✅ <b>Тариф «{name}»</b> оплачен и активирован.\n\nМожете подключаться к VPN.',
  notifyTariffDefault: "Тариф",
  notifyProxyPaid: '✅ <b>Прокси «{name}»</b> оплачены.\n\n',
  notifyProxyCopyHint: "Скопируйте строку в настройки прокси вашего приложения.",
  notifySingboxPaid: '✅ <b>Доступы «{name}»</b> оплачены.\n\n',
  notifySingboxCopyHint: "Скопируйте ссылку в приложение (v2rayN, Nekoray, Shadowrocket и др.).",

  // ── In-app notifications ──────────────────────────────────────────
  inAppBalanceTopupTitle: "💰 Баланс пополнен",
  inAppBalanceTopupBody: "Ваш баланс пополнен на {amount}.",
  inAppTariffActivatedTitle: "✅ Тариф активирован",
  inAppTariffActivatedBody: "Тариф «{name}» оплачен и активирован. Можете подключаться к VPN.",
  inAppTrialActivatedTitle: "🎁 Пробный период активирован",
  inAppTrialActivatedBody: "Ваш бесплатный пробный период на {days} дней активирован.",
  optionApplyError: "Ошибка применения опции",
  paymentCreationError: "Ошибка создания платежа",
  tariffNotSelected: "Тариф не выбран",
  trialLabel: "Триал",
  balanceTopupDescription: "Пополнение баланса {service} #{orderId}",
  balanceTopupMessage: "Пополнение баланса {service}. Заказ {orderId}",
  balanceTopupComment: "Пополнение баланса",
  payDescTariff: "Тариф {service} #{orderId}",
  payDescProxy: "Прокси {service} #{orderId}",
  payDescAccess: "Доступы {service} #{orderId}",
  payDescFlexTariff: "Гибкий тариф {service} #{orderId}",
  payDescOption: "Опция {service} #{orderId}",

  // ── Admin Telegram notifications ──────────────────────────────────
  adminNotifyBalanceTopup: "💰 <b>Пополнение баланса</b>\n\nКлиент: {client}\nСумма: {amount}",
  adminNotifyTariffPayment: '📦 <b>Оплата тарифа</b>\n\nКлиент: {client}\nТариф: «{name}»',
  adminNotifyNewTicket: "🆕 <b>Новый тикет</b>\n\nТема: <b>{subject}</b>\nКлиент: {client}\n\n{preview}{link}",
  adminNotifyTicketMessage: "💬 <b>Новое сообщение в тикете</b>\n\nТема: <b>{subject}</b>\nКлиент: {client}\n\n{preview}{link}",
  adminNotifySupportReply: "✅ <b>Ответ поддержки в тикете</b>\n\nТема: <b>{subject}</b>\nКлиент: {client}\n\n{preview}{link}",
  adminNotifyTicketStatusChanged: "ℹ️ <b>Статус тикета изменён</b>\n\nТема: <b>{subject}</b>\nКлиент: {client}\nНовый статус: <b>{status}</b>{link}",
  adminNotifyNewClient: "👤 <b>Новый клиент</b>\n\nКлиент: {client}\nСоздан: {createdAt}{link}",
  adminLabel: "Админка",
  clientsLabel: "Клиенты",
  ticketStatusClosed: "закрыт",
  ticketStatusOpen: "открыт",

  // ── Admin API error messages ──────────────────────────────────────
  tariffTablesNotFound: "Таблицы тарифов не найдены. Выполните в папке backend: npx prisma db push",
  errorLoadingTariffCategories: "Ошибка загрузки категорий тарифов",
  invalidData: "Неверные данные",
  categoryNotFound: "Категория не найдена",
  clientNotFound: "Клиент не найден",
  clientNotLinkedToRemna: "Клиент не привязан к Remna",
  errorLoadingClients: "Ошибка загрузки клиентов. Выполните: cd backend && npx prisma db push",
  ticketNotFound: "Тикет не найден",
  promoCodeAlreadyExists: "Промокод с таким кодом уже существует",

  // ── Contest ───────────────────────────────────────────────────────
  contestNotFound: "Конкурс не найден",
  specifyStatus: "Укажите status",
  contestLaunchedNotificationSent: "Конкурс запущен, уведомление отправлено",
  drawCompleted: "Розыгрыш проведён",
  prizeBalance: "{value} ₽ на баланс",
  prizeVpnDays: "{value} дней VPN",
  contestStartTitle: '🏆 Конкурс «{name}» запущен!',
  contestPeriod: "📅 Период: с {start} по {end}.",
  contestPrizes: "🎁 Призы:",
  contestPlace: "{place} место — {prize}",
  contestDailyReminder: '🏆 Конкурс «{name}» идёт до {endDate}. Участвуйте — призы за 1, 2 и 3 место!',
  contestBotTokenNotSet: "Не задан токен бота (Настройки → Telegram)",

  // ── Bot admin ─────────────────────────────────────────────────────
  specifyMessageOrPhoto: "Укажите текст сообщения или приложите фото.",
  botTokenNotConfigured: "Токен бота не настроен.",
  failedToDownloadPhoto: "Не удалось скачать фото из Telegram.",

  // ── Auto-broadcast ────────────────────────────────────────────────
  defaultServiceName: "Сервис",
  defaultBroadcastSubject: "Сообщение от {serviceName}",

  // ── Auth middleware ───────────────────────────────────────────────
  missingOrInvalidAuthHeader: "Отсутствует или неверный заголовок Authorization",
  invalidOrExpiredToken: "Недействительный или истёкший токен",
  userNotFound: "Пользователь не найден",
  dbErrorCheckUrl: "Ошибка базы данных. Проверьте DATABASE_URL и выполните: npx prisma db push",
  accessDeniedAdminOnly: "Доступ запрещён. Только полный администратор может управлять менеджерами.",
  accessDeniedToSection: "Доступ к этому разделу запрещён.",
  invalidOrExpiredRefreshToken: "Недействительный или истёкший refresh-токен",
  currentPasswordIncorrect: "Неверный текущий пароль",

  // ── Manager management ────────────────────────────────────────────
  onlyAdminCanListManagers: "Только администратор может просматривать менеджеров",
  onlyAdminCanCreateManagers: "Только администратор может создавать менеджеров",
  onlyAdminCanUpdateManagers: "Только администратор может обновлять менеджеров",
  cannotModifyFullAdmin: "Нельзя изменить полного администратора",
  notFound: "Не найдено",
  validationError: "Ошибка валидации",
};
