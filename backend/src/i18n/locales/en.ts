/**
 * English locale strings for backend API responses and notifications.
 */
export const en = {
  // ── Client API error messages ──────────────────────────────────────
  invalidInput: "Invalid input",
  provideEmailOrTelegram: "Provide email+password or telegramId",
  emailAlreadyRegistered: "Email already registered",
  checkEmailToComplete: "Check your email to complete registration",
  failedToSendVerificationEmail: "Failed to send verification email. Try again later.",
  emailRegistrationNotConfigured: "Email registration is not configured. Contact administrator.",
  publicAppUrlNotSet: "Public app URL is not set in settings.",
  accountBlocked: "Account is blocked",
  invalidOrExpiredLink: "Invalid or expired link",
  linkExpired: "Link expired. Please register again.",
  emailLinkExpired: "Link expired. Please request email linking again.",
  emailAlreadyLinkedToAnother: "This email is already linked to another account.",
  unauthorized: "Unauthorized",
  invalidEmailOrPassword: "Invalid email or password",

  // ── 2FA ────────────────────────────────────────────────────────────
  enter6DigitCode: "Enter 6-digit code",
  enter6DigitCodeFromApp: "Enter the 6-digit code from your authenticator app",
  sessionExpiredLoginAgain: "Session expired. Please log in again.",
  twoFANotEnabled: "2FA is not enabled",
  twoFANotEnabledLoginAgain: "2FA is not enabled. Please log in again.",
  invalidCode: "Invalid code",
  invalidCodeCheckTime: "Invalid code. Check the time on your device.",
  twoFAAlreadyEnabled: "2FA is already enabled",
  startTwoFASetupFirst: "Start 2FA setup first, or 2FA is already enabled",
  twoFAEnabled: "Two-factor authentication enabled",
  twoFADisabled: "Two-factor authentication disabled",

  // ── Password ───────────────────────────────────────────────────────
  noPasswordUseTelegramOrEmail: "You don't have a password. Use Telegram or email login.",
  incorrectCurrentPassword: "Incorrect current password",
  passwordChanged: "Password changed successfully",
  passwordAlreadySet: "Password already set. Use change password.",
  passwordSet: "Password set",
  passwordResetLinkValid: "Link is valid. You can set a new password.",
  passwordResetSuccess: "Password reset successful",
  passwordRecoveryNotConfigured: "Password recovery email is not configured. Contact administrator.",
  passwordRecoveryUnavailable: "Password recovery is temporarily unavailable. Please contact administrator.",
  failedToSendResetEmail: "Failed to send password reset email. Try again later.",
  passwordResetEmailSentIfExists: "If an account with this email exists, we've sent a password reset email.",

  // ── Telegram linking ──────────────────────────────────────────────
  telegramAlreadyLinked: "Telegram already linked",
  invalidOrExpiredTelegramData: "Invalid or expired Telegram data",
  missingUserData: "Missing user data",
  telegramLinked: "Telegram linked",

  // ── Email linking ─────────────────────────────────────────────────
  emailAlreadyLinked: "Email already linked",
  invalidEmail: "Invalid email",
  smtpNotConfigured: "Email sending is not configured. Contact support.",
  emailAlreadyUsedByAnother: "This email is already used by another account",
  appUrlNotSetInSettings: "App URL is not set in settings",
  failedToSendEmail: "Failed to send email. Try again later.",
  verificationEmailSent: "Verification link sent to the specified email",

  // ── Trial ─────────────────────────────────────────────────────────
  trialAlreadyUsed: "Trial already used",
  trialNotConfigured: "Trial is not configured",
  serviceTemporarilyUnavailable: "Service temporarily unavailable",
  serviceTemporarilyUnavailableVpnCreation: "Service temporarily unavailable. Failed to create VPN account. Please try later.",
  errorCreatingUser: "Error creating user",
  trialActivated: "Trial activated",

  // ── Promo codes ───────────────────────────────────────────────────
  promoCodeNotSpecified: "Promo code not specified",
  promoCodeNotFoundOrInactive: "Promo code not found or inactive",
  promoCodeAlreadyActivated: "You have already activated this promo code",
  promoCodeActivationLimitReached: "Promo code activation limit reached",
  vpnUserCreationError: "VPN user creation error",
  promoCodeActivated: "Promo code activated! Subscription connected.",
  discountPromoAppliedAtPayment: "Discount promo code is applied at tariff payment",
  promoCodeNotFullyConfigured: "Promo code is not fully configured",

  // ── Subscription ──────────────────────────────────────────────────
  subscriptionNotLinked: "Subscription not linked",
  deviceRemoved: "Device removed",
  flexibleTariffDisabled: "Flexible tariff is disabled",

  // ── Payment common ────────────────────────────────────────────────
  optionsSalesDisabled: "Options sales disabled",
  optionNotFound: "Option not found",
  specifyAmountAndCurrency: "Specify amount and currency",
  tariffNotFound: "Tariff not found",
  proxyTariffNotFound: "Proxy tariff not found",
  singboxTariffNotFound: "Sing-box tariff not found",
  minimumPaymentAmount1: "Minimum payment amount is 1",
  promoNotDiscount: "This promo code does not provide a payment discount",
  finalAmountCannotBeZero: "Total amount cannot be 0",
  specifyTariffId: "Specify tariffId, proxyTariffId or singboxTariffId",
  invalidParams: "Invalid parameters",
  specifyAmount: "Specify amount",
  specifyAmountAndMethod: "Specify amount and payment method",
  optionAppliedFromBalance: "Option applied. Deducted from balance.",
  paymentIdRequired: "paymentId required",
  balanceToppedUp: "Balance topped up",
  paymentInProgress: "Payment is being processed, retry in a minute",
  paymentNotFoundOrProcessed: "Payment not found or already processed",
  paymentNotFoundOrPaid: "Payment not found or already paid",
  paymentMethodNotAvailable: "Payment method not available",

  // ── Payment gateways ──────────────────────────────────────────────
  plategaNotConfigured: "Platega is not configured",
  yoomoneyNotConfiguredOrNoUrl: "YooMoney not configured or app URL not set",
  connectYoomoneyFirst: "Connect your YooMoney wallet first",
  yoomoneyNotConfigured: "YooMoney is not configured",
  yoomoneyWalletNotConnected: "YooMoney wallet not connected",
  yookassaNotConfigured: "YooKassa is not configured",
  yookassaRubOnly: "YooKassa only accepts rubles (RUB)",
  cryptopayNotConfigured: "Crypto Pay is not configured",
  cryptopayCurrencyNotSupported: "Crypto Pay: supported currencies are USD, RUB, EUR, etc. Specify a currency from the list.",
  minimumAmount05: "Minimum amount is 0.5",
  heleketNotConfigured: "Heleket is not configured",
  epayNotConfigured: "ePay is not configured",
  minimumAmount001: "Minimum amount: 0.01",

  // ── Dynamic payment messages ──────────────────────────────────────
  daysDevicesLimit: "Days: 1–{maxDays}, devices: 1–{maxDevices}",
  insufficientFunds: "Insufficient funds. Balance: {balance}, needed: {needed}",
  proxyPaidFromBalance: 'Proxy "{name}" paid! {amount} {currency} deducted from balance.',
  singboxPaidFromBalance: 'Access "{name}" paid! {amount} {currency} deducted from balance.',
  tariffActivatedFromBalance: 'Tariff "{name}" activated! {amount} {currency} deducted from balance.',
  customBuildActivated: "Subscription for {days} day(s), {devices} device(s) activated. {amount} {currency} deducted.",
  promoActivatedWithDays: "Promo code activated! {days}-day subscription connected.",

  // ── AI Chat ───────────────────────────────────────────────────────
  invalidMessageFormat: "Invalid message format",
  aiChatDisabled: "AI chat is disabled",
  aiServiceError: "AI service error or rate limit exceeded",
  internalServerError: "Internal server error",

  // ── Tickets ───────────────────────────────────────────────────────
  ticketSystemDisabled: "Ticket system is disabled",

  // ── Link telegram from bot ────────────────────────────────────────
  invalidOrExpiredCode: "Invalid or expired code",
  codeExpiredRequestNew: "Code expired. Request a new one in your dashboard.",

  // ── Public tariffs ────────────────────────────────────────────────
  errorLoadingTariffs: "Error loading tariffs",
  errorLoadingProxyTariffs: "Error loading proxy tariffs",
  errorLoadingSingboxTariffs: "Error loading Sing-box tariffs",

  // ── Google / Apple login ──────────────────────────────────────────
  googleLoginNotEnabled: "Google login is not enabled",
  invalidGoogleToken: "Invalid Google token",
  appleLoginNotEnabled: "Apple login is not enabled",
  invalidAppleToken: "Invalid Apple token",

  // ── Telegram notifications (user-facing) ──────────────────────────
  notifyBalanceTopup: "✅ <b>Balance topped up</b> by {amount}.",
  notifyTariffActivated: '✅ <b>Tariff "{name}"</b> paid and activated.\n\nYou can now connect to the VPN.',
  notifyTariffDefault: "Tariff",
  notifyProxyPaid: '✅ <b>Proxy "{name}"</b> paid.\n\n',
  notifyProxyCopyHint: "Copy the string into your application's proxy settings.",
  notifySingboxPaid: '✅ <b>Access "{name}"</b> paid.\n\n',
  notifySingboxCopyHint: "Copy the link into your app (v2rayN, Nekoray, Shadowrocket, etc.).",

  // ── In-app notifications ──────────────────────────────────────────
  inAppBalanceTopupTitle: "💰 Balance topped up",
  inAppBalanceTopupBody: "Your balance has been topped up by {amount}.",
  inAppTariffActivatedTitle: "✅ Tariff activated",
  inAppTariffActivatedBody: 'Tariff "{name}" has been paid and activated. You can now connect to the VPN.',
  inAppTrialActivatedTitle: "🎁 Trial activated",
  inAppTrialActivatedBody: "Your {days}-day free trial has been activated.",
  optionApplyError: "Error applying option",
  paymentCreationError: "Payment creation error",
  tariffNotSelected: "No tariff selected",
  trialLabel: "Trial",
  balanceTopupDescription: "Balance top-up {service} #{orderId}",
  balanceTopupMessage: "Balance top-up {service}. Order {orderId}",
  balanceTopupComment: "Balance top-up",
  payDescTariff: "Tariff {service} #{orderId}",
  payDescProxy: "Proxy {service} #{orderId}",
  payDescAccess: "Access {service} #{orderId}",
  payDescFlexTariff: "Flex tariff {service} #{orderId}",
  payDescOption: "Option {service} #{orderId}",

  // ── Admin Telegram notifications ──────────────────────────────────
  adminNotifyBalanceTopup: "💰 <b>Balance top-up</b>\n\nClient: {client}\nAmount: {amount}",
  adminNotifyTariffPayment: '📦 <b>Tariff payment</b>\n\nClient: {client}\nTariff: "{name}"',
  adminNotifyNewTicket: "🆕 <b>New ticket</b>\n\nSubject: <b>{subject}</b>\nClient: {client}\n\n{preview}{link}",
  adminNotifyTicketMessage: "💬 <b>New ticket message</b>\n\nSubject: <b>{subject}</b>\nClient: {client}\n\n{preview}{link}",
  adminNotifySupportReply: "✅ <b>Support reply in ticket</b>\n\nSubject: <b>{subject}</b>\nClient: {client}\n\n{preview}{link}",
  adminNotifyTicketStatusChanged: "ℹ️ <b>Ticket status changed</b>\n\nSubject: <b>{subject}</b>\nClient: {client}\nNew status: <b>{status}</b>{link}",
  adminNotifyNewClient: "👤 <b>New client</b>\n\nClient: {client}\nCreated: {createdAt}{link}",
  adminLabel: "Admin panel",
  clientsLabel: "Clients",
  ticketStatusClosed: "closed",
  ticketStatusOpen: "open",

  // ── Admin API error messages ──────────────────────────────────────
  tariffTablesNotFound: "Tariff tables not found. Run in backend folder: npx prisma db push",
  errorLoadingTariffCategories: "Error loading tariff categories",
  invalidData: "Invalid data",
  categoryNotFound: "Category not found",
  clientNotFound: "Client not found",
  clientNotLinkedToRemna: "Client is not linked to Remna",
  errorLoadingClients: "Error loading clients. Run: cd backend && npx prisma db push",
  ticketNotFound: "Ticket not found",
  promoCodeAlreadyExists: "Promo code with this code already exists",

  // ── Contest ───────────────────────────────────────────────────────
  contestNotFound: "Contest not found",
  specifyStatus: "Specify status",
  contestLaunchedNotificationSent: "Contest launched, notification sent",
  drawCompleted: "Draw completed",
  prizeBalance: "{value} to balance",
  prizeVpnDays: "{value} days VPN",
  contestStartTitle: '🏆 Contest "{name}" launched!',
  contestPeriod: "📅 Period: from {start} to {end}.",
  contestPrizes: "🎁 Prizes:",
  contestPlace: "{place} place — {prize}",
  contestDailyReminder: '🏆 Contest "{name}" is ongoing until {endDate}. Participate — prizes for 1st, 2nd and 3rd place!',
  contestBotTokenNotSet: "Bot token is not set (Settings → Telegram)",

  // ── Bot admin ─────────────────────────────────────────────────────
  specifyMessageOrPhoto: "Specify message text or attach a photo.",
  botTokenNotConfigured: "Bot token is not configured.",
  failedToDownloadPhoto: "Failed to download photo from Telegram.",

  // ── Auto-broadcast ────────────────────────────────────────────────
  defaultServiceName: "Service",
  defaultBroadcastSubject: "Message from {serviceName}",

  // ── Auth middleware ───────────────────────────────────────────────
  missingOrInvalidAuthHeader: "Missing or invalid Authorization header",
  invalidOrExpiredToken: "Invalid or expired token",
  userNotFound: "User not found",
  dbErrorCheckUrl: "Database error. Check DATABASE_URL and run: npx prisma db push",
  accessDeniedAdminOnly: "Access denied. Only full admin can manage managers.",
  accessDeniedToSection: "Access denied to this section.",
  invalidOrExpiredRefreshToken: "Invalid or expired refresh token",
  currentPasswordIncorrect: "Current password is incorrect",

  // ── Manager management ────────────────────────────────────────────
  onlyAdminCanListManagers: "Only admin can list managers",
  onlyAdminCanCreateManagers: "Only admin can create managers",
  onlyAdminCanUpdateManagers: "Only admin can update managers",
  cannotModifyFullAdmin: "Cannot modify full admin",
  notFound: "Not found",
  validationError: "Validation error",
} as const;

export type LocaleKeys = keyof typeof en;
