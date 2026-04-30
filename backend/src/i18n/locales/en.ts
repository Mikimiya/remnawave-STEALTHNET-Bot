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
  oauthEmailRequired: "Cannot register: the OAuth provider did not return an email address. Please register with email/password, or enable email sharing in your Apple ID settings and try again.",

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

  // ── Zod schema messages (static, no req context) ──────────────────
  zodCode6Digits: "Code must be 6 digits",
  zodCurrentPasswordRequired: "Enter current password",
  zodMinChars6: "Minimum 6 characters",
  zodMinChars8: "Minimum 8 characters",
  zodBroadcastMessageRequired: "Message text is required",
  zodNodeNameRequired: "Specify node name",

  // ── Promo code validation ─────────────────────────────────────────
  promoNotFoundOrInactive: "Promo code not found or inactive",
  promoExpired: "Promo code has expired",
  promoUsageLimitReached: "Promo code usage limit reached",
  promoAlreadyUsedByYou: "You have already used this promo code",
  promoNotForThisCategory: "This promo code is not applicable to this category",
  promoNotForThisSubGroup: "This promo code is not applicable to this plan group",
  promoNotForThisTariff: "This promo code is not applicable to this tariff",

  // ── AI chat fallbacks ─────────────────────────────────────────────
  aiNotConfigured: "Sorry, the AI assistant is not configured yet. Please contact support or set up the Groq API Key in the admin panel.",
  aiNoResponse: "Failed to get a response.",

  // ── YooKassa service ──────────────────────────────────────────────
  yookassaDefaultDescription: "Subscription payment",
  yookassaNetworkError: "Server cannot connect to YooKassa (api.yookassa.ru). Check internet access, firewall and DNS on the server.",

  // ── Tariff activation service ─────────────────────────────────────
  serviceUnavailable: "Service temporarily unavailable",
  vpnUserCreationFailed: "VPN user creation error",
  paymentNotFound: "Payment not found",
  clientNotFoundShort: "Client not found",
  tariffNotFoundShort: "Tariff not found",
  tariffNotLinkedToPayment: "Tariff is not linked to payment",

  // ── Singbox ───────────────────────────────────────────────────────
  singboxInstructionsNoUrl: "Copy the block above. Set the panel URL in settings or replace {{STEALTHNET_API_URL}} manually. Save as docker-compose.yml and run: docker compose up -d --build",
  singboxInstructionsWithUrl: "Copy the block above. Panel URL is set. Save as docker-compose.yml and run: docker compose up -d --build",
  singboxCategoryNotFound: "Category not found",
  singboxTariffNotFoundOrDisabled: "Sing-box tariff not found or disabled",
  singboxNoAvailableNodes: "No available Sing-box nodes. Please try later.",
  singboxNoFreeSlots: "No free slots on nodes",
  singboxTariffNotLinkedToPayment: "Sing-box tariff is not linked to payment",

  // ── Proxy ─────────────────────────────────────────────────────────
  proxyInstructionsNoUrl: "Copy the block above. Set the panel URL in settings (Settings → App URL) or replace {{STEALTHNET_API_URL}} manually. Save as docker-compose.yml on the server and run: docker compose up -d --build",
  proxyInstructionsWithUrl: "Copy the block above. Panel URL is already set from settings. Save as docker-compose.yml on the server and run: docker compose up -d --build",
  proxyCategoryNotFound: "Category not found",
  proxyTariffNotFoundOrDisabled: "Proxy tariff not found or disabled",
  proxyNoAvailableNodes: "No available proxy nodes. Please try later.",
  proxyNoFreeSlots: "No free slots on nodes",
  proxyTariffNotLinkedToPayment: "Proxy tariff is not linked to payment",

  // ── Admin analytics ───────────────────────────────────────────────
  providerBalance: "Balance",

  // ── Extra options service ─────────────────────────────────────────
  remnaApiNotConfigured: "Remna API is not configured",
  paymentNotFoundGeneric: "Payment not found",
  paymentNotOptionPurchase: "Payment is not an option purchase",
  clientNotLinkedToVpn: "Client is not linked to VPN (no remnawaveUuid). Subscribe first.",
  unknownOptionType: "Unknown option type",

  // ── Payment gateway network errors ────────────────────────────────
  heleketNetworkError: "Cannot connect to Heleket. Check internet and settings.",
  cryptopayNetworkError: "Cannot connect to Crypto Pay. Check internet and settings.",

  // ── Contest service ───────────────────────────────────────────────
  contestNotFoundService: "Contest not found",
  drawAlreadyDone: "Draw has already been completed",
  winnersAlreadyRecorded: "Winners already recorded",
  notEnoughParticipants: "Not enough participants (minimum 3 required)",

  // ── Broadcast service ─────────────────────────────────────────────
  defaultServiceNameFallback: "Service",
  broadcastSmtpNotConfigured: "Email: SMTP is not configured (Settings → Payments / Mail)",
  broadcastDefaultSubject: "Message from {name}",

  // ── Backup ────────────────────────────────────────────────────────
  databaseUrlNotSet: "DATABASE_URL is not set",
  invalidDatabaseUrl: "Invalid DATABASE_URL format",
  backupCreationError: "Backup creation error. Ensure postgresql-client is installed in the container.",
  backupListError: "Error reading backup list",
  specifyBackupPath: "Specify path parameter (relative path to backup)",
  backupNotFound: "Backup not found",
  confirmRestore: "Confirm restore: specify confirm: RESTORE",
  backupNotFoundOnServer: "Backup not found on server",
  selectBackupFile: "Select a backup file (.sql) or specify path to saved backup",
  databaseRestoredFromBackup: "Database restored from backup.",
  noOutput: "No output",
  psqlNotStarted: "psql not started: {msg}. Install postgresql-client.",
  psqlExitCode: "psql exited with code {code}{signal}. {output}",

  // ── Mail templates ────────────────────────────────────────────────
  mailGreeting: "Hello!",
  mailVerifyLinkValid24h: "The link is valid for 24 hours.",
  mailVerifyIgnore: "If you did not register, please ignore this email.",
  mailLinkEmailValid24h: "The link is valid for 24 hours.",
  mailLinkEmailIgnore: "If you did not request email linking, please ignore this email.",
  mailResetLinkValid1h: "The link is valid for 1 hour and can only be used once.",
  mailResetIgnore: "If this was not you, just ignore this email — your password will not change.",

  // ── Broadcast (telegram) ──────────────────────────────────────────
  broadcastTelegramTokenMissing: "Telegram: bot token is not set (Settings → Mail & Telegram)",

  // ── Analytics ─────────────────────────────────────────────────────
  analyticsNoLabel: "(no label)",

  // ── Crypto Pay ────────────────────────────────────────────────────
  cryptopayNotJson: "Crypto Pay: not JSON ({status})",
  cryptopayMissingInvoice: "Crypto Pay: no invoice_id or pay URL in response",

  // ── Heleket (extra) ────────────────────────────────────────────────
  heleketNotJson: "Heleket: not JSON ({status})",
  heleketMissingUuid: "Heleket: no uuid or url in response",

  // ── Platega ───────────────────────────────────────────────────────
  plategaInvalidCredentials: "Platega: invalid Merchant ID or secret",
  plategaNoPaymentUrl: "Platega did not return a payment URL",
  plategaPaymentDescription: "Payment for order {orderId}",

  // ── Sync service ──────────────────────────────────────────────────
  remnaApiNotConfiguredFull: "Remna API is not configured (REMNA_API_URL, REMNA_ADMIN_TOKEN)",
  remnaApiNotConfiguredShort: "Remna API is not configured",
} as const;

export type LocaleKeys = keyof typeof en;
