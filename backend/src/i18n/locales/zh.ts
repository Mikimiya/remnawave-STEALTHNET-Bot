/**
 * Chinese locale strings for backend API responses and notifications.
 */
import type { LocaleKeys } from "./en.js";

export const zh: Record<LocaleKeys, string> = {
  // ── Client API error messages ──────────────────────────────────────
  invalidInput: "输入无效",
  provideEmailOrTelegram: "请提供邮箱+密码或 Telegram ID",
  emailAlreadyRegistered: "邮箱已注册",
  checkEmailToComplete: "请查收邮件完成注册",
  failedToSendVerificationEmail: "发送验证邮件失败，请稍后再试。",
  emailRegistrationNotConfigured: "邮箱注册未配置，请联系管理员。",
  publicAppUrlNotSet: "设置中未配置应用公开 URL。",
  accountBlocked: "账户已被封禁",
  invalidOrExpiredLink: "链接无效或已过期",
  linkExpired: "链接已过期，请重新注册。",
  emailLinkExpired: "链接已过期，请重新绑定邮箱。",
  emailAlreadyLinkedToAnother: "该邮箱已绑定到其他账户。",
  unauthorized: "未授权",
  invalidEmailOrPassword: "邮箱或密码错误",

  // ── 2FA ────────────────────────────────────────────────────────────
  enter6DigitCode: "请输入6位验证码",
  enter6DigitCodeFromApp: "请输入验证器应用中的6位验证码",
  sessionExpiredLoginAgain: "会话已过期，请重新登录。",
  twoFANotEnabled: "2FA 未启用",
  twoFANotEnabledLoginAgain: "2FA 未启用，请重新登录。",
  invalidCode: "验证码错误",
  invalidCodeCheckTime: "验证码错误，请检查设备时间。",
  twoFAAlreadyEnabled: "2FA 已启用",
  startTwoFASetupFirst: "请先启动2FA设置，或2FA已启用",
  twoFAEnabled: "两步验证已启用",
  twoFADisabled: "两步验证已关闭",

  // ── Password ───────────────────────────────────────────────────────
  noPasswordUseTelegramOrEmail: "您没有密码。请使用 Telegram 或邮箱登录。",
  incorrectCurrentPassword: "当前密码错误",
  passwordChanged: "密码修改成功",
  passwordAlreadySet: "密码已设置，请使用修改密码功能。",
  passwordSet: "密码已设置",
  passwordResetLinkValid: "链接有效，您可以设置新密码。",
  passwordResetSuccess: "密码重置成功",
  passwordRecoveryNotConfigured: "密码找回邮件未配置，请联系管理员。",
  passwordRecoveryUnavailable: "密码找回功能暂不可用，请联系管理员。",
  failedToSendResetEmail: "发送密码重置邮件失败，请稍后再试。",
  passwordResetEmailSentIfExists: "如果该邮箱已注册，我们已向您发送重置密码邮件。",

  // ── Telegram linking ──────────────────────────────────────────────
  telegramAlreadyLinked: "Telegram 已绑定",
  invalidOrExpiredTelegramData: "Telegram 数据无效或已过期",
  missingUserData: "缺少用户数据",
  telegramLinked: "Telegram 已绑定成功",

  // ── Email linking ─────────────────────────────────────────────────
  emailAlreadyLinked: "邮箱已绑定",
  invalidEmail: "邮箱格式错误",
  smtpNotConfigured: "邮件发送未配置，请联系客服。",
  emailAlreadyUsedByAnother: "该邮箱已被其他账户使用",
  appUrlNotSetInSettings: "设置中未配置应用 URL",
  failedToSendEmail: "邮件发送失败，请稍后再试。",
  verificationEmailSent: "验证链接已发送到指定邮箱",

  // ── Trial ─────────────────────────────────────────────────────────
  trialAlreadyUsed: "试用已使用",
  trialNotConfigured: "试用未配置",
  serviceTemporarilyUnavailable: "服务暂不可用",
  serviceTemporarilyUnavailableVpnCreation: "服务暂不可用，VPN 账户创建失败，请稍后再试。",
  errorCreatingUser: "创建用户失败",
  trialActivated: "试用已激活",

  // ── Promo codes ───────────────────────────────────────────────────
  promoCodeNotSpecified: "未输入优惠码",
  promoCodeNotFoundOrInactive: "优惠码未找到或已停用",
  promoCodeAlreadyActivated: "您已激活过此优惠码",
  promoCodeActivationLimitReached: "优惠码激活次数已达上限",
  vpnUserCreationError: "VPN 用户创建失败",
  promoCodeActivated: "优惠码已激活！订阅已连接。",
  discountPromoAppliedAtPayment: "折扣优惠码在支付套餐时使用",
  promoCodeNotFullyConfigured: "优惠码配置不完整",

  // ── Subscription ──────────────────────────────────────────────────
  subscriptionNotLinked: "订阅未绑定",
  deviceRemoved: "设备已删除",
  flexibleTariffDisabled: "弹性套餐已禁用",

  // ── Payment common ────────────────────────────────────────────────
  optionsSalesDisabled: "选项销售已关闭",
  optionNotFound: "选项未找到",
  specifyAmountAndCurrency: "请指定金额和币种",
  tariffNotFound: "套餐未找到",
  proxyTariffNotFound: "代理套餐未找到",
  singboxTariffNotFound: "Sing-box 套餐未找到",
  minimumPaymentAmount1: "最低支付金额为 1",
  promoNotDiscount: "该优惠码不提供支付折扣",
  finalAmountCannotBeZero: "最终金额不能为 0",
  specifyTariffId: "请指定 tariffId、proxyTariffId 或 singboxTariffId",
  invalidParams: "参数无效",
  specifyAmount: "请指定金额",
  specifyAmountAndMethod: "请指定金额和支付方式",
  optionAppliedFromBalance: "选项已应用，已从余额扣除。",
  paymentIdRequired: "paymentId 为必填项",
  balanceToppedUp: "余额已充值",
  paymentInProgress: "支付正在处理中，请一分钟后重试",
  paymentNotFoundOrProcessed: "支付未找到或已处理",
  paymentNotFoundOrPaid: "支付未找到或已支付",
  paymentMethodNotAvailable: "支付方式不可用",

  // ── Payment gateways ──────────────────────────────────────────────
  plategaNotConfigured: "Platega 未配置",
  yoomoneyNotConfiguredOrNoUrl: "YooMoney 未配置或未设置应用 URL",
  connectYoomoneyFirst: "请先绑定 YooMoney 钱包",
  yoomoneyNotConfigured: "YooMoney 未配置",
  yoomoneyWalletNotConnected: "YooMoney 钱包未绑定",
  yookassaNotConfigured: "YooKassa 未配置",
  yookassaRubOnly: "YooKassa 仅接受卢布 (RUB)",
  cryptopayNotConfigured: "Crypto Pay 未配置",
  cryptopayCurrencyNotSupported: "Crypto Pay：支持 USD、RUB、EUR 等。请从列表中选择币种。",
  minimumAmount05: "最低金额为 0.5",
  heleketNotConfigured: "Heleket 未配置",
  epayNotConfigured: "ePay 未配置",
  minimumAmount001: "最低金额：0.01",

  // ── Dynamic payment messages ──────────────────────────────────────
  daysDevicesLimit: "天数：1–{maxDays}，设备：1–{maxDevices}",
  insufficientFunds: "余额不足。余额：{balance}，需要：{needed}",
  proxyPaidFromBalance: "代理「{name}」已支付！已从余额扣除 {amount} {currency}。",
  singboxPaidFromBalance: "访问「{name}」已支付！已从余额扣除 {amount} {currency}。",
  tariffActivatedFromBalance: "套餐「{name}」已激活！已从余额扣除 {amount} {currency}。",
  customBuildActivated: "订阅 {days} 天、{devices} 台设备已激活。已扣除 {amount} {currency}。",
  promoActivatedWithDays: "优惠码已激活！{days} 天订阅已连接。",

  // ── AI Chat ───────────────────────────────────────────────────────
  invalidMessageFormat: "消息格式无效",
  aiChatDisabled: "AI 聊天已关闭",
  aiServiceError: "AI 服务错误或超出速率限制",
  internalServerError: "内部服务器错误",

  // ── Tickets ───────────────────────────────────────────────────────
  ticketSystemDisabled: "工单系统已关闭",

  // ── Link telegram from bot ────────────────────────────────────────
  invalidOrExpiredCode: "验证码无效或已过期",
  codeExpiredRequestNew: "验证码已过期，请在控制面板重新获取。",

  // ── Public tariffs ────────────────────────────────────────────────
  errorLoadingTariffs: "加载套餐失败",
  errorLoadingProxyTariffs: "加载代理套餐失败",
  errorLoadingSingboxTariffs: "加载 Sing-box 套餐失败",

  // ── Google / Apple login ──────────────────────────────────────────
  googleLoginNotEnabled: "Google 登录未启用",
  invalidGoogleToken: "Google 令牌无效",
  appleLoginNotEnabled: "Apple 登录未启用",
  invalidAppleToken: "Apple 令牌无效",

  // ── Telegram notifications (user-facing) ──────────────────────────
  notifyBalanceTopup: "✅ <b>余额已充值</b> {amount}。",
  notifyTariffActivated: '✅ <b>套餐「{name}」</b>已付款并激活。\n\n您现在可以连接 VPN。',
  notifyTariffDefault: "套餐",
  notifyProxyPaid: '✅ <b>代理「{name}」</b>已付款。\n\n',
  notifyProxyCopyHint: "请将连接串复制到您应用的代理设置中。",
  notifySingboxPaid: '✅ <b>访问「{name}」</b>已付款。\n\n',
  notifySingboxCopyHint: "请将链接复制到客户端应用（v2rayN、Nekoray、Shadowrocket 等）。",

  // ── In-app notifications ──────────────────────────────────────────
  inAppBalanceTopupTitle: "💰 余额充值成功",
  inAppBalanceTopupBody: "您的余额已充值 {amount}。",
  inAppTariffActivatedTitle: "✅ 套餐已激活",
  inAppTariffActivatedBody: "套餐「{name}」已付款并激活，您现在可以连接 VPN。",
  inAppTrialActivatedTitle: "🎁 试用已激活",
  inAppTrialActivatedBody: "您的 {days} 天免费试用已成功激活。",
  optionApplyError: "选项应用失败",
  paymentCreationError: "支付创建失败",
  tariffNotSelected: "未选择套餐",
  trialLabel: "试用",
  balanceTopupDescription: "充值余额 {service} #{orderId}",
  balanceTopupMessage: "充值余额 {service}，订单 {orderId}",
  balanceTopupComment: "充值余额",
  payDescTariff: "套餐 {service} #{orderId}",
  payDescProxy: "代理 {service} #{orderId}",
  payDescAccess: "访问 {service} #{orderId}",
  payDescFlexTariff: "灵活套餐 {service} #{orderId}",
  payDescOption: "选项 {service} #{orderId}",

  // ── Admin Telegram notifications ──────────────────────────────────
  adminNotifyBalanceTopup: "💰 <b>余额充值</b>\n\n客户：{client}\n金额：{amount}",
  adminNotifyTariffPayment: '📦 <b>套餐付款</b>\n\n客户：{client}\n套餐：「{name}」',
  adminNotifyNewTicket: "🆕 <b>新工单</b>\n\n主题：<b>{subject}</b>\n客户：{client}\n\n{preview}{link}",
  adminNotifyTicketMessage: "💬 <b>工单新消息</b>\n\n主题：<b>{subject}</b>\n客户：{client}\n\n{preview}{link}",
  adminNotifySupportReply: "✅ <b>客服回复工单</b>\n\n主题：<b>{subject}</b>\n客户：{client}\n\n{preview}{link}",
  adminNotifyTicketStatusChanged: "ℹ️ <b>工单状态变更</b>\n\n主题：<b>{subject}</b>\n客户：{client}\n新状态：<b>{status}</b>{link}",
  adminNotifyNewClient: "👤 <b>新客户</b>\n\n客户：{client}\n创建时间：{createdAt}{link}",
  adminLabel: "管理后台",
  clientsLabel: "客户列表",
  ticketStatusClosed: "已关闭",
  ticketStatusOpen: "已打开",

  // ── Admin API error messages ──────────────────────────────────────
  tariffTablesNotFound: "套餐表未找到。请在 backend 目录执行：npx prisma db push",
  errorLoadingTariffCategories: "加载套餐分类失败",
  invalidData: "数据无效",
  categoryNotFound: "分类未找到",
  clientNotFound: "客户未找到",
  clientNotLinkedToRemna: "客户未关联 Remna",
  errorLoadingClients: "加载客户列表失败。请执行：cd backend && npx prisma db push",
  ticketNotFound: "工单未找到",
  promoCodeAlreadyExists: "该优惠码已存在",

  // ── Contest ───────────────────────────────────────────────────────
  contestNotFound: "竞赛未找到",
  specifyStatus: "请指定 status",
  contestLaunchedNotificationSent: "竞赛已启动，通知已发送",
  drawCompleted: "抽奖已完成",
  prizeBalance: "{value} 充值到余额",
  prizeVpnDays: "{value} 天 VPN",
  contestStartTitle: '🏆 竞赛「{name}」已开始！',
  contestPeriod: "📅 时间：{start} 至 {end}。",
  contestPrizes: "🎁 奖品：",
  contestPlace: "第{place}名 — {prize}",
  contestDailyReminder: '🏆 竞赛「{name}」进行中，截止到 {endDate}。快来参加吧——第1、2、3名均有奖品！',
  contestBotTokenNotSet: "未配置机器人令牌（设置 → Telegram）",

  // ── Bot admin ─────────────────────────────────────────────────────
  specifyMessageOrPhoto: "请输入消息文本或附加图片。",
  botTokenNotConfigured: "机器人令牌未配置。",
  failedToDownloadPhoto: "从 Telegram 下载图片失败。",

  // ── Auto-broadcast ────────────────────────────────────────────────
  defaultServiceName: "服务",
  defaultBroadcastSubject: "来自 {serviceName} 的消息",

  // ── Auth middleware ───────────────────────────────────────────────
  missingOrInvalidAuthHeader: "缺少或无效的 Authorization 请求头",
  invalidOrExpiredToken: "令牌无效或已过期",
  userNotFound: "用户未找到",
  dbErrorCheckUrl: "数据库错误。请检查 DATABASE_URL 并执行：npx prisma db push",
  accessDeniedAdminOnly: "访问被拒绝。只有管理员可以管理经理。",
  accessDeniedToSection: "该功能区的访问被拒绝。",
  invalidOrExpiredRefreshToken: "刷新令牌无效或已过期",
  currentPasswordIncorrect: "当前密码错误",

  // ── Manager management ────────────────────────────────────────────
  onlyAdminCanListManagers: "只有管理员可以查看经理列表",
  onlyAdminCanCreateManagers: "只有管理员可以创建经理",
  onlyAdminCanUpdateManagers: "只有管理员可以更新经理",
  cannotModifyFullAdmin: "无法修改完全管理员",
  notFound: "未找到",
  validationError: "验证错误",

  // ── Zod schema messages ───────────────────────────────────────────
  zodCode6Digits: "验证码必须为6位数字",
  zodCurrentPasswordRequired: "请输入当前密码",
  zodMinChars6: "最少6个字符",
  zodMinChars8: "最少8个字符",
  zodBroadcastMessageRequired: "消息内容为必填项",
  zodNodeNameRequired: "请填写节点名称",

  // ── Promo code validation ─────────────────────────────────────────
  promoNotFoundOrInactive: "促销码未找到或已停用",
  promoExpired: "促销码已过期",
  promoUsageLimitReached: "促销码使用次数已达上限",
  promoAlreadyUsedByYou: "您已使用过此促销码",
  promoNotForThisCategory: "此促销码不适用于该分类",
  promoNotForThisSubGroup: "此促销码不适用于该子分组",
  promoNotForThisTariff: "此促销码不适用于该套餐",

  // ── AI chat fallbacks ─────────────────────────────────────────────
  aiNotConfigured: "抱歉，AI助手尚未配置。请联系客服或在管理面板中配置 Groq API Key。",
  aiNoResponse: "无法获取回复。",

  // ── YooKassa service ──────────────────────────────────────────────
  yookassaDefaultDescription: "订阅付款",
  yookassaNetworkError: "服务器无法连接 YooKassa (api.yookassa.ru)。请检查服务器的网络连接、防火墙和DNS。",

  // ── Tariff activation service ─────────────────────────────────────
  serviceUnavailable: "服务暂时不可用",
  vpnUserCreationFailed: "VPN 用户创建错误",
  paymentNotFound: "支付记录未找到",
  clientNotFoundShort: "客户未找到",
  tariffNotFoundShort: "套餐未找到",
  tariffNotLinkedToPayment: "套餐未关联到此支付",

  // ── Singbox ───────────────────────────────────────────────────────
  singboxInstructionsNoUrl: "复制上方内容。请在设置中填写面板URL或手动替换 {{STEALTHNET_API_URL}}。保存为 docker-compose.yml 后执行：docker compose up -d --build",
  singboxInstructionsWithUrl: "复制上方内容。面板URL已自动填入。保存为 docker-compose.yml 后执行：docker compose up -d --build",
  singboxCategoryNotFound: "分类未找到",
  singboxTariffNotFoundOrDisabled: "Sing-box 套餐未找到或已停用",
  singboxNoAvailableNodes: "无可用 Sing-box 节点，请稍后再试。",
  singboxNoFreeSlots: "节点无空闲位置",
  singboxTariffNotLinkedToPayment: "Sing-box 套餐未关联到此支付",

  // ── Proxy ─────────────────────────────────────────────────────────
  proxyInstructionsNoUrl: "复制上方内容。请在设置中填写面板URL（设置→应用URL）或手动替换 {{STEALTHNET_API_URL}}。保存为 docker-compose.yml 后执行：docker compose up -d --build",
  proxyInstructionsWithUrl: "复制上方内容。面板URL已从设置自动填入。保存为 docker-compose.yml 后执行：docker compose up -d --build",
  proxyCategoryNotFound: "分类未找到",
  proxyTariffNotFoundOrDisabled: "代理套餐未找到或已停用",
  proxyNoAvailableNodes: "无可用代理节点，请稍后再试。",
  proxyNoFreeSlots: "节点无空闲位置",
  proxyTariffNotLinkedToPayment: "代理套餐未关联到此支付",

  // ── Admin analytics ───────────────────────────────────────────────
  providerBalance: "余额",

  // ── Extra options service ─────────────────────────────────────────
  remnaApiNotConfigured: "Remna API 未配置",
  paymentNotFoundGeneric: "支付记录未找到",
  paymentNotOptionPurchase: "该支付不是购买附加选项",
  clientNotLinkedToVpn: "客户未关联 VPN（无 remnawaveUuid）。请先订阅。",
  unknownOptionType: "未知选项类型",

  // ── Payment gateway network errors ────────────────────────────────
  heleketNetworkError: "无法连接 Heleket。请检查网络连接和设置。",
  cryptopayNetworkError: "无法连接 Crypto Pay。请检查网络连接和设置。",

  // ── Contest service ───────────────────────────────────────────────
  contestNotFoundService: "竞赛未找到",
  drawAlreadyDone: "抽奖已完成",
  winnersAlreadyRecorded: "获奖者已记录",
  notEnoughParticipants: "参与者不足（至少需要3人）",

  // ── Broadcast service ─────────────────────────────────────────────
  defaultServiceNameFallback: "服务",
  broadcastSmtpNotConfigured: "邮件：SMTP 未配置（设置 → 支付 / 邮件）",
  broadcastDefaultSubject: "来自 {name} 的消息",

  // ── Backup ────────────────────────────────────────────────────────
  databaseUrlNotSet: "DATABASE_URL 未设置",
  invalidDatabaseUrl: "DATABASE_URL 格式无效",
  backupCreationError: "备份创建错误。请确保容器中已安装 postgresql-client。",
  backupListError: "读取备份列表错误",
  specifyBackupPath: "请指定 path 参数（备份的相对路径）",
  backupNotFound: "备份未找到",
  confirmRestore: "请确认恢复：指定 confirm: RESTORE",
  backupNotFoundOnServer: "服务器上未找到备份",
  selectBackupFile: "请选择备份文件（.sql）或指定已保存备份的 path",
  databaseRestoredFromBackup: "数据库已从备份恢复。",
  noOutput: "无输出",
  psqlNotStarted: "psql 未启动：{msg}。请安装 postgresql-client。",
  psqlExitCode: "psql 退出代码 {code}{signal}。{output}",

  // ── Mail templates ────────────────────────────────────────────────
  mailGreeting: "您好！",
  mailVerifyLinkValid24h: "链接有效期为24小时。",
  mailVerifyIgnore: "如果您未注册，请忽略此邮件。",
  mailLinkEmailValid24h: "链接有效期为24小时。",
  mailLinkEmailIgnore: "如果您未请求绑定邮箱，请忽略此邮件。",
  mailResetLinkValid1h: "链接有效期为1小时，且只能使用一次。",
  mailResetIgnore: "如果这不是您的操作，请忽略此邮件——您的密码不会更改。",

  // ── Broadcast (telegram) ──────────────────────────────────────────
  broadcastTelegramTokenMissing: "Telegram：未设置机器人令牌（设置 → 邮件和 Telegram）",

  // ── Analytics ─────────────────────────────────────────────────────
  analyticsNoLabel: "（无标签）",

  // ── Crypto Pay ────────────────────────────────────────────────────
  cryptopayNotJson: "Crypto Pay：非 JSON（{status}）",
  cryptopayMissingInvoice: "Crypto Pay：响应中没有 invoice_id 或支付 URL",

  // ── Heleket (extra) ────────────────────────────────────────────────
  heleketNotJson: "Heleket：非 JSON（{status}）",
  heleketMissingUuid: "Heleket：响应中没有 uuid 或 url",

  // ── Platega ───────────────────────────────────────────────────────
  plategaInvalidCredentials: "Platega：无效的 Merchant ID 或密钥",
  plategaNoPaymentUrl: "Platega 未返回支付链接",
  plategaPaymentDescription: "订单 {orderId} 的付款",

  // ── Sync service ──────────────────────────────────────────────────
  remnaApiNotConfiguredFull: "Remna API 未配置（REMNA_API_URL, REMNA_ADMIN_TOKEN）",
  remnaApiNotConfiguredShort: "Remna API 未配置",
};
