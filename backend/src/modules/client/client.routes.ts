import { randomBytes, createHmac } from "crypto";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { generateSecret, generateURI, verify } from "otplib";
import { env } from "../../config/index.js";
import { Router, Request } from "express";
import { z } from "zod";
import { prisma } from "../../db.js";
import {
  hashPassword,
  verifyPassword,
  signClientToken,
  signClient2FAPendingToken,
  verifyClient2FAPendingToken,
  generateReferralCode,
  getSystemConfig,
  getPublicConfig,
  type SellOptionTrafficProduct,
  type SellOptionDeviceProduct,
  type SellOptionServerProduct,
} from "./client.service.js";
import {
  notifyAdminsAboutClientTicketMessage,
  notifyAdminsAboutNewClient,
  notifyAdminsAboutNewTicket,
} from "../notification/telegram-notify.service.js";
import { requireClientAuth } from "./client.middleware.js";
import { remnaCreateUser, remnaUpdateUser, isRemnaConfigured, remnaGetUser, remnaGetUserByUsername, remnaGetUserByEmail, remnaGetUserByTelegramId, extractRemnaUuid, remnaUsernameFromClient, remnaGetUserHwidDevices, remnaDeleteUserHwidDevice } from "../remna/remna.client.js";
import { sendVerificationEmail, sendLinkEmailVerification, sendPasswordResetEmail, isSmtpConfigured } from "../mail/mail.service.js";
import { createPlategaTransaction, isPlategaConfigured } from "../platega/platega.service.js";
import { activateTariffForClient, activateTariffByPaymentId } from "../tariff/tariff-activation.service.js";
import { createProxySlotsByPaymentId } from "../proxy/proxy-slots-activation.service.js";
import { createSingboxSlotsByPaymentId } from "../singbox/singbox-slots-activation.service.js";
import { buildSingboxSlotSubscriptionLink } from "../singbox/singbox-link.js";
import { applyExtraOptionByPaymentId } from "../extra-options/extra-options.service.js";
import { getAuthUrl, exchangeCodeForToken, requestPayment, processPayment } from "../yoomoney/yoomoney.service.js";
import { createYookassaPayment } from "../yookassa/yookassa.service.js";
import { createCryptopayInvoice, isCryptopayConfigured } from "../cryptopay/cryptopay.service.js";
import { createHeleketInvoice, isHeleketConfigured } from "../heleket/heleket.service.js";
import { createEpayPayment, buildEpaySubmitUrl, isEpayConfigured } from "../epay/epay.service.js";
import { t } from "../../i18n/index.js";

/** Helper: resolve lang from authenticated client on req, or from Accept-Language / body. */
function reqLang(req: Request): string {
  const c = (req as Request & { client?: { preferredLang?: string } }).client;
  if (c?.preferredLang) return c.preferredLang;
  const bodyLang = (req.body as Record<string, unknown>)?.preferredLang;
  if (typeof bodyLang === "string" && bodyLang.trim()) return bodyLang.trim();
  const al = req.headers["accept-language"];
  if (typeof al === "string") {
    const code = al.split(",")[0]?.split("-")[0]?.trim().toLowerCase();
    if (code) return code;
  }
  return "en";
}

/** Извлекает текущий expireAt из ответа Remna. Возвращает Date если в будущем, иначе null. */
function extractCurrentExpireAt(data: unknown): Date | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const resp = (o.response ?? o.data ?? o) as Record<string, unknown>;
  const raw = resp?.expireAt;
  if (typeof raw !== "string") return null;
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.getTime() > Date.now() ? d : null;
  } catch {
    return null;
  }
}

/** Считает expireAt: если текущая подписка активна — добавляет дни к ней, иначе от now. */
function calculateExpireAt(currentExpireAt: Date | null, durationDays: number): string {
  const base = currentExpireAt ?? new Date();
  return new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
}

function isClientEmailUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P2002"
    && Array.isArray(error.meta?.target)
    && error.meta.target.includes("email");
}

export const clientAuthRouter = Router();

const utmSchema = {
  utm_source: z.string().max(255).optional(),
  utm_medium: z.string().max(255).optional(),
  utm_campaign: z.string().max(255).optional(),
  utm_content: z.string().max(255).optional(),
  utm_term: z.string().max(255).optional(),
};

const registerSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  telegramId: z.string().optional(),
  telegramUsername: z.string().optional(),
  preferredLang: z.string().max(5).default("ru"),
  preferredCurrency: z.string().max(5).default("usd"),
  referralCode: z.string().optional(),
  ...utmSchema,
});

clientAuthRouter.post("/register", async (req, res) => {
  const body = registerSchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  }

  const data = body.data;
  const hasEmail = data.email && data.password;
  const hasTelegram = data.telegramId;

  if (!hasEmail && !hasTelegram) {
    return res.status(400).json({ message: t(reqLang(req), "provideEmailOrTelegram") });
  }

  // Регистрация по email: создаём ожидание и отправляем письмо с ссылкой
  if (hasEmail) {
    const existing = await prisma.client.findUnique({ where: { email: data.email! } });
    if (existing) return res.status(400).json({ message: t(reqLang(req), "emailAlreadyRegistered") });

    const config = await getSystemConfig();

    // Режим без подтверждения почты — создаём клиента сразу
    if (config.skipEmailVerification) {
      const referralCode = generateReferralCode();
      let referrerId: string | null = null;
      if (data.referralCode) {
        const referrer = await prisma.client.findFirst({ where: { referralCode: data.referralCode } });
        if (referrer) referrerId = referrer.id;
      }
      const passwordHash = await hashPassword(data.password!);
      let client;
      try {
        client = await prisma.client.create({
          data: {
            email: data.email!,
            passwordHash,
            remnawaveUuid: null,
            referralCode,
            referrerId,
            preferredLang: data.preferredLang,
            preferredCurrency: data.preferredCurrency,
            telegramId: null,
            telegramUsername: null,
            utmSource: data.utm_source ?? null,
            utmMedium: data.utm_medium ?? null,
            utmCampaign: data.utm_campaign ?? null,
            utmContent: data.utm_content ?? null,
            utmTerm: data.utm_term ?? null,
          },
        });
      } catch (error) {
        if (!isClientEmailUniqueConflict(error)) throw error;
        return res.status(400).json({ message: t(reqLang(req), "emailAlreadyRegistered") });
      }
      notifyAdminsAboutNewClient(client.id).catch(() => {});
      const token = signClientToken(client.id);
      return res.status(201).json({ token, client: toClientShape(client) });
    }

    const smtpConfig = {
      host: config.smtpHost || "",
      port: config.smtpPort,
      secure: config.smtpSecure,
      user: config.smtpUser,
      password: config.smtpPassword,
      fromEmail: config.smtpFromEmail,
      fromName: config.smtpFromName,
    };
    if (!isSmtpConfigured(smtpConfig)) {
      return res.status(503).json({ message: t(reqLang(req), "emailRegistrationNotConfigured") });
    }

    const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
    if (!appUrl) {
      return res.status(503).json({ message: t(reqLang(req), "publicAppUrlNotSet") });
    }

    const verificationToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ч

    const referralCode = generateReferralCode();
    let referrerId: string | null = null;
    if (data.referralCode) {
      const referrer = await prisma.client.findFirst({ where: { referralCode: data.referralCode } });
      if (referrer) referrerId = referrer.id;
    }
    const passwordHash = await hashPassword(data.password!);

    await prisma.pendingEmailRegistration.create({
      data: {
        email: data.email!,
        passwordHash,
        preferredLang: data.preferredLang,
        preferredCurrency: data.preferredCurrency,
        referralCode: data.referralCode || null,
        utmSource: data.utm_source ?? null,
        utmMedium: data.utm_medium ?? null,
        utmCampaign: data.utm_campaign ?? null,
        utmContent: data.utm_content ?? null,
        utmTerm: data.utm_term ?? null,
        verificationToken,
        expiresAt,
      },
    });

    const verificationLink = `${appUrl}/cabinet/verify-email?token=${verificationToken}`;
    const sendResult = await sendVerificationEmail(
      smtpConfig,
      data.email!,
      verificationLink,
      config.serviceName,
      data.preferredLang,
    );
    console.log(`[register] Email send result to ${data.email}:`, sendResult);
    if (!sendResult.ok) {
      await prisma.pendingEmailRegistration.deleteMany({ where: { verificationToken } }).catch(() => {});
      return res.status(500).json({ message: t(reqLang(req), "failedToSendVerificationEmail") });
    }

    return res.status(201).json({ message: t(reqLang(req), "checkEmailToComplete"), requiresVerification: true });
  }

  // Регистрация / вход по Telegram (используется ботом). 2FA не требуем — только для входа на сайте.
  if (hasTelegram) {
    const existing = await prisma.client.findUnique({
      where: { telegramId: data.telegramId! },
      select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
    });
    if (existing) {
      if (existing.isBlocked) return res.status(403).json({ message: t(reqLang(req), "accountBlocked") });
      return res.json({ token: signClientToken(existing.id), client: toClientShape(existing) });
    }
  }

  // Не создаём пользователя в Remna при регистрации — клиент неактивен до триала или оплаты тарифа.
  const referralCode = generateReferralCode();
  let referrerId: string | null = null;
  if (data.referralCode) {
    const referrer = await prisma.client.findFirst({ where: { referralCode: data.referralCode } });
    if (referrer) referrerId = referrer.id;
  }

  const passwordHash = data.password ? await hashPassword(data.password) : null;
  const client = await prisma.client.create({
    data: {
      email: data.email ?? null,
      passwordHash,
      remnawaveUuid: null,
      referralCode,
      referrerId,
      preferredLang: data.preferredLang,
      preferredCurrency: data.preferredCurrency,
      telegramId: data.telegramId ?? null,
      telegramUsername: data.telegramUsername ?? null,
      utmSource: data.utm_source ?? null,
      utmMedium: data.utm_medium ?? null,
      utmCampaign: data.utm_campaign ?? null,
      utmContent: data.utm_content ?? null,
      utmTerm: data.utm_term ?? null,
    },
  });
  notifyAdminsAboutNewClient(client.id).catch(() => {});
  const token = signClientToken(client.id);
  return res.status(201).json({ token, client: toClientShape(client) });
});

const verifyLinkEmailSchema = z.object({ token: z.string().min(1) });
clientAuthRouter.post("/verify-link-email", async (req, res) => {
  const parse = verifyLinkEmailSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput") });
  const { token } = parse.data;
  const pending = await prisma.pendingEmailLink.findUnique({ where: { verificationToken: token } });
  if (!pending) return res.status(400).json({ message: t(reqLang(req), "invalidOrExpiredLink") });
  if (new Date() > pending.expiresAt) {
    await prisma.pendingEmailLink.deleteMany({ where: { id: pending.id } }).catch(() => {});
    return res.status(400).json({ message: t(reqLang(req), "emailLinkExpired") });
  }
  const existingByEmail = await prisma.client.findUnique({ where: { email: pending.email } });
  if (existingByEmail && existingByEmail.id !== pending.clientId) {
    await prisma.pendingEmailLink.deleteMany({ where: { id: pending.id } }).catch(() => {});
    return res.status(400).json({ message: t(reqLang(req), "emailAlreadyLinkedToAnother") });
  }
  const client = await prisma.client.update({
    where: { id: pending.clientId },
    data: { email: pending.email },
    select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
  });
  await prisma.pendingEmailLink.deleteMany({ where: { id: pending.id } }).catch(() => {});
  const auth = buildAuthResponse(client);
  return res.json(auth);
});

const verifyEmailSchema = z.object({ token: z.string().min(1) });
clientAuthRouter.post("/verify-email", async (req, res) => {
  const parse = verifyEmailSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput") });
  const { token } = parse.data;

  const pending = await prisma.pendingEmailRegistration.findUnique({
    where: { verificationToken: token },
  });
  if (!pending) return res.status(400).json({ message: t(reqLang(req), "invalidOrExpiredLink") });
  if (new Date() > pending.expiresAt) {
    await prisma.pendingEmailRegistration.delete({ where: { id: pending.id } }).catch(() => {});
    return res.status(400).json({ message: t(reqLang(req), "linkExpired") });
  }

  const existingClient = await prisma.client.findUnique({
    where: { email: pending.email },
    select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
  });
  if (existingClient) {
    await prisma.pendingEmailRegistration.delete({ where: { id: pending.id } }).catch(() => {});
    const auth = buildAuthResponse(existingClient);
    return res.json(auth);
  }

  // Не создаём пользователя в Remna при регистрации — клиент неактивен до триала или оплаты тарифа.
  const referralCode = generateReferralCode();
  let referrerId: string | null = null;
  if (pending.referralCode) {
    const referrer = await prisma.client.findFirst({ where: { referralCode: pending.referralCode } });
    if (referrer) referrerId = referrer.id;
  }

  let client;
  try {
    client = await prisma.client.create({
      data: {
        email: pending.email,
        passwordHash: pending.passwordHash,
        remnawaveUuid: null,
        referralCode,
        referrerId,
        preferredLang: pending.preferredLang,
        preferredCurrency: pending.preferredCurrency,
        telegramId: null,
        telegramUsername: null,
        utmSource: pending.utmSource,
        utmMedium: pending.utmMedium,
        utmCampaign: pending.utmCampaign,
        utmContent: pending.utmContent,
        utmTerm: pending.utmTerm,
      },
    });
  } catch (error) {
    if (!isClientEmailUniqueConflict(error)) throw error;
    const existingByEmail = await prisma.client.findUnique({
      where: { email: pending.email },
      select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
    });
    await prisma.pendingEmailRegistration.delete({ where: { id: pending.id } }).catch(() => {});
    if (!existingByEmail) {
      return res.status(400).json({ message: t(reqLang(req), "emailAlreadyRegistered") });
    }
    const auth = buildAuthResponse(existingByEmail);
    return res.json(auth);
  }

  await prisma.pendingEmailRegistration.delete({ where: { id: pending.id } }).catch(() => {});

  const signToken = signClientToken(client.id);
  return res.status(201).json({ token: signToken, client: toClientShape(client) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const verifyPasswordResetSchema = z.object({
  token: z.string().min(1),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

function getPasswordResetSuccessMessage(lang?: string | null): string {
  return t(lang, "passwordResetEmailSentIfExists");
}

function getPasswordResetValidationMessage(lang?: string | null): string {
  return t(lang, "passwordResetLinkValid");
}

function isMissingPasswordResetTokensTable(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P2010"
    && typeof error.meta?.message === "string"
    && error.meta.message.includes("password_reset_tokens")
    && error.meta.message.includes("does not exist");
}

type PasswordResetTokenRow = {
  id: string;
  clientId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  email: string | null;
  preferredLang: string;
  isBlocked: boolean;
};

async function deletePasswordResetTokensByClientId(clientId: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM password_reset_tokens
    WHERE client_id = ${clientId}
  `;
}

async function deletePasswordResetTokenById(id: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM password_reset_tokens
    WHERE id = ${id}
  `;
}

async function deletePasswordResetTokenByToken(token: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM password_reset_tokens
    WHERE token = ${token}
  `;
}

async function createPasswordResetTokenRecord(clientId: string, token: string, expiresAt: Date): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO password_reset_tokens (id, client_id, token, expires_at, created_at)
    VALUES (${randomUUID()}, ${clientId}, ${token}, ${expiresAt}, NOW())
  `;
}

async function findPasswordResetTokenRecord(token: string): Promise<PasswordResetTokenRow | null> {
  const rows = await prisma.$queryRaw<PasswordResetTokenRow[]>`
    SELECT
      prt.id,
      prt.client_id AS "clientId",
      prt.token,
      prt.expires_at AS "expiresAt",
      prt.created_at AS "createdAt",
      c.email,
      c.preferred_lang AS "preferredLang",
      c.is_blocked AS "isBlocked"
    FROM password_reset_tokens prt
    INNER JOIN clients c ON c.id = prt.client_id
    WHERE prt.token = ${token}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

clientAuthRouter.post("/forgot-password", async (req, res) => {
  const body = forgotPasswordSchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  }

  const client = await prisma.client.findUnique({
    where: { email: body.data.email },
    select: { id: true, email: true, preferredLang: true, isBlocked: true },
  });

  const successLang = client?.preferredLang ?? "zh";
  const successMessage = getPasswordResetSuccessMessage(successLang);

  if (!client?.email || client.isBlocked) {
    return res.json({ message: successMessage });
  }

  const config = await getSystemConfig();
  const smtpConfig = {
    host: config.smtpHost || "",
    port: config.smtpPort,
    secure: config.smtpSecure,
    user: config.smtpUser,
    password: config.smtpPassword,
    fromEmail: config.smtpFromEmail,
    fromName: config.smtpFromName,
  };

  if (!isSmtpConfigured(smtpConfig)) {
    return res.status(503).json({ message: t(reqLang(req), "passwordRecoveryNotConfigured") });
  }

  const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
  if (!appUrl) {
    return res.status(503).json({ message: t(reqLang(req), "publicAppUrlNotSet") });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  try {
    await deletePasswordResetTokensByClientId(client.id);
    await createPasswordResetTokenRecord(client.id, token, expiresAt);
  } catch (error) {
    if (!isMissingPasswordResetTokensTable(error)) throw error;
    return res.status(503).json({ message: t(reqLang(req), "passwordRecoveryUnavailable") });
  }

  const resetLink = `${appUrl}/cabinet/reset-password?token=${token}`;
  const sendResult = await sendPasswordResetEmail(
    smtpConfig,
    client.email,
    resetLink,
    config.serviceName,
    client.preferredLang,
  );

  if (!sendResult.ok) {
    await deletePasswordResetTokenByToken(token).catch(() => {});
    return res.status(500).json({ message: t(reqLang(req), "failedToSendResetEmail") });
  }

  return res.json({ message: successMessage });
});

clientAuthRouter.post("/verify-password-reset", async (req, res) => {
  const body = verifyPasswordResetSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput") });

  let resetToken;
  try {
    resetToken = await findPasswordResetTokenRecord(body.data.token);
  } catch (error) {
    if (!isMissingPasswordResetTokensTable(error)) throw error;
    return res.status(400).json({ message: t(reqLang(req), "invalidOrExpiredLink") });
  }

  if (!resetToken || resetToken.isBlocked) {
    return res.status(400).json({ message: t(reqLang(req), "invalidOrExpiredLink") });
  }

  if (new Date() > resetToken.expiresAt) {
    await deletePasswordResetTokenById(resetToken.id).catch(() => {});
    return res.status(400).json({ message: t(reqLang(req), "invalidOrExpiredLink") });
  }

  return res.json({
    message: getPasswordResetValidationMessage(resetToken.preferredLang),
    email: resetToken.email,
  });
});

clientAuthRouter.post("/login", async (req, res) => {
  const body = loginSchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: t(reqLang(req), "invalidInput") });
  }

  const client = await prisma.client.findUnique({ where: { email: body.data.email } });
  if (!client || !client.passwordHash || client.isBlocked) {
    return res.status(401).json({ message: t(reqLang(req), "invalidEmailOrPassword") });
  }

  const valid = await verifyPassword(body.data.password, client.passwordHash);
  if (!valid) return res.status(401).json({ message: t(reqLang(req), "invalidEmailOrPassword") });

  const full = await prisma.client.findUnique({
    where: { id: client.id },
    select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
  });
  if (!full) return res.status(401).json({ message: t(reqLang(req), "invalidEmailOrPassword") });
  const auth = buildAuthResponse(full);
  return res.json(auth);
});

/** Валидация initData из Telegram Web App (Mini App). https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app */
function validateTelegramInitData(initData: string, botToken: string): boolean {
  if (!initData?.trim() || !botToken?.trim()) return false;
  const params = new URLSearchParams(initData.trim());
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");
  const authDate = params.get("auth_date");
  if (!authDate) return false;
  const authTimestamp = parseInt(authDate, 10);
  if (!Number.isFinite(authTimestamp) || Date.now() / 1000 - authTimestamp > 3600) return false; // не старше 1 часа
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = sorted.map(([k, v]) => `${k}=${v}`).join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  return computedHash === hash;
}

/** Парсинг user из initData (JSON в параметре user) */
function parseTelegramUser(initData: string): { id: number; username?: string } | null {
  const params = new URLSearchParams(initData.trim());
  const userStr = params.get("user");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr) as Record<string, unknown>;
    const id = typeof user.id === "number" ? user.id : Number(user.id);
    if (!Number.isFinite(id)) return null;
    const username = typeof user.username === "string" ? user.username : undefined;
    return { id, username };
  } catch {
    return null;
  }
}

const telegramMiniappSchema = z.object({ initData: z.string().min(1) });

clientAuthRouter.post("/telegram-miniapp", async (req, res) => {
  const body = telegramMiniappSchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  }
  const config = await getSystemConfig();
  const botToken = config.telegramBotToken ?? "";
  if (!validateTelegramInitData(body.data.initData, botToken)) {
    return res.status(401).json({ message: t(reqLang(req), "invalidOrExpiredTelegramData") });
  }
  const tgUser = parseTelegramUser(body.data.initData);
  if (!tgUser) return res.status(400).json({ message: t(reqLang(req), "missingUserData") });

  const telegramId = String(tgUser.id);
  const telegramUsername = tgUser.username?.trim() ?? null;
  const existing = await prisma.client.findUnique({
    where: { telegramId },
    select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
  });
  if (existing) {
    if (existing.isBlocked) return res.status(403).json({ message: t(reqLang(req), "accountBlocked") });
    const auth = buildAuthResponse(existing);
    return res.json(auth);
  }

  const configForDefaults = await getSystemConfig();
  let remnawaveUuid: string | null = null;
  if (isRemnaConfigured()) {
    const username = remnaUsernameFromClient({
      telegramUsername: telegramUsername ?? undefined,
      telegramId,
    });
    // Без активной подписки — как при регистрации по email; доступ после триала или оплаты
    const remnaRes = await remnaCreateUser({
      username,
      trafficLimitBytes: 0,
      trafficLimitStrategy: "NO_RESET",
      expireAt: new Date(Date.now() - 1000).toISOString(),
      telegramId: tgUser.id,
    });
    remnawaveUuid = extractRemnaUuid(remnaRes.data);
    if (remnaRes.error || remnawaveUuid == null) {
      console.error("[Remna] create user (telegram initData) failed:", { error: remnaRes.error, status: remnaRes.status, data: remnaRes.data });
      return res.status(503).json({ message: t(reqLang(req), "serviceTemporarilyUnavailableVpnCreation") });
    }
  }
  const referralCode = generateReferralCode();
  const client = await prisma.client.create({
    data: {
      email: null,
      passwordHash: null,
      remnawaveUuid,
      referralCode,
      referrerId: null,
      preferredLang: configForDefaults.defaultLanguage ?? "zh",
      preferredCurrency: configForDefaults.defaultCurrency ?? "usd",
      telegramId,
      telegramUsername,
    },
  });
  const token = signClientToken(client.id);
  return res.status(201).json({ token, client: toClientShape(client) });
});

const twoFaLoginSchema = z.object({ tempToken: z.string().min(1), code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/) });
clientAuthRouter.post("/2fa-login", async (req, res) => {
  const body = twoFaLoginSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "enter6DigitCode"), errors: body.error.flatten() });
  const payload = verifyClient2FAPendingToken(body.data.tempToken);
  if (!payload) return res.status(401).json({ message: t(reqLang(req), "sessionExpiredLoginAgain") });
  const client = await prisma.client.findUnique({
    where: { id: payload.clientId },
    select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpSecret: true, totpEnabled: true, createdAt: true },
  });
  if (!client?.totpEnabled || !client.totpSecret) return res.status(401).json({ message: t(reqLang(req), "twoFANotEnabledLoginAgain") });
  const result = await verify({ secret: client.totpSecret, token: body.data.code });
  if (!result.valid) return res.status(401).json({ message: t(reqLang(req), "invalidCode") });
  const token = signClientToken(client.id);
  return res.json({ token, client: toClientShape(client) });
});

clientAuthRouter.get("/me", requireClientAuth, async (req, res) => {
  const client = (req as unknown as { client: { id: string } }).client;
  const full = await prisma.client.findUnique({
    where: { id: client.id },
    select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
  });
  if (!full) return res.status(401).json({ message: t(reqLang(req), "unauthorized") });
  return res.json(toClientShape(full));
});

function toClientShape(c: {
  id: string;
  email: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  preferredLang: string;
  preferredCurrency: string;
  balance: number;
  referralCode: string | null;
  referralPercent?: number | null;
  remnawaveUuid: string | null;
  trialUsed?: boolean;
  isBlocked?: boolean;
  yoomoneyAccessToken?: string | null;
  totpEnabled?: boolean;
  createdAt?: Date;
}) {
  return {
    id: c.id,
    email: c.email,
    telegramId: c.telegramId ?? null,
    telegramUsername: c.telegramUsername ?? null,
    preferredLang: c.preferredLang,
    preferredCurrency: c.preferredCurrency,
    balance: c.balance,
    referralCode: c.referralCode,
    referralPercent: c.referralPercent ?? null,
    remnawaveUuid: c.remnawaveUuid,
    trialUsed: c.trialUsed ?? false,
    isBlocked: c.isBlocked ?? false,
    yoomoneyConnected: Boolean(c.yoomoneyAccessToken),
    totpEnabled: c.totpEnabled ?? false,
    createdAt: c.createdAt ? c.createdAt.toISOString() : undefined,
  };
}

/** Если у клиента включена 2FA — возвращаем tempToken для шага ввода кода; иначе — обычные token и client. */
function buildAuthResponse(c: { id: string; totpEnabled?: boolean } & Parameters<typeof toClientShape>[0]) {
  if (c.totpEnabled) {
    return { requires2FA: true as const, tempToken: signClient2FAPendingToken(c.id) };
  }
  return { token: signClientToken(c.id), client: toClientShape(c) };
}

// ——— Google OAuth: фронтенд отправляет id_token, полученный через Sign In With Google ———
const googleAuthSchema = z.object({ idToken: z.string().min(1) });
clientAuthRouter.post("/google", async (req, res) => {
  const parse = googleAuthSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput") });
  const config = await getSystemConfig();
  if (!config.googleLoginEnabled || !config.googleClientId) {
    return res.status(403).json({ message: t(reqLang(req), "googleLoginNotEnabled") });
  }
  let payload: { sub?: string; email?: string; email_verified?: boolean } | undefined;
  try {
    const { OAuth2Client } = await import("google-auth-library");
    const gClient = new OAuth2Client(config.googleClientId);
    const ticket = await gClient.verifyIdToken({
      idToken: parse.data.idToken,
      audience: config.googleClientId,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error("[Google OAuth] verify error:", err);
    return res.status(401).json({ message: t(reqLang(req), "invalidGoogleToken") });
  }
  if (!payload?.sub) return res.status(401).json({ message: t(reqLang(req), "invalidGoogleToken") });
  const googleId = payload.sub;
  const googleEmail = payload.email ?? null;

  const existing = await prisma.client.findUnique({
    where: { googleId },
    select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
  });
  if (existing) {
    if (existing.isBlocked) return res.status(403).json({ message: t(reqLang(req), "accountBlocked") });
    const auth = buildAuthResponse(existing);
    return res.json(auth);
  }

  if (googleEmail) {
    const byEmail = await prisma.client.findUnique({
      where: { email: googleEmail },
      select: { id: true, email: true, googleId: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
    });
    if (byEmail) {
      if (byEmail.isBlocked) return res.status(403).json({ message: t(reqLang(req), "accountBlocked") });
      await prisma.client.update({ where: { id: byEmail.id }, data: { googleId } });
      const auth = buildAuthResponse(byEmail);
      return res.json(auth);
    }
  }

  const configForDefaults = await getSystemConfig();
  let remnawaveUuid: string | null = null;
  if (isRemnaConfigured()) {
    const username = remnaUsernameFromClient({ email: googleEmail });
    const remnaRes = await remnaCreateUser({
      username,
      trafficLimitBytes: 0,
      trafficLimitStrategy: "NO_RESET",
      expireAt: new Date(Date.now() - 1000).toISOString(),
    });
    remnawaveUuid = extractRemnaUuid(remnaRes.data);
    if (remnaRes.error || remnawaveUuid == null) {
      console.error("[Remna] create user (google) failed:", { error: remnaRes.error, data: remnaRes.data });
      return res.status(503).json({ message: t(reqLang(req), "serviceTemporarilyUnavailable") });
    }
  }
  const referralCode = generateReferralCode();
  const client = await prisma.client.create({
    data: {
      email: googleEmail,
      passwordHash: null,
      remnawaveUuid,
      referralCode,
      referrerId: null,
      preferredLang: configForDefaults.defaultLanguage ?? "zh",
      preferredCurrency: configForDefaults.defaultCurrency ?? "usd",
      telegramId: null,
      telegramUsername: null,
      googleId,
    },
  });
  const token = signClientToken(client.id);
  return res.status(201).json({ token, client: toClientShape(client) });
});

// ——— Apple Sign In: фронтенд отправляет id_token (JWT от Apple) ———
const appleAuthSchema = z.object({ idToken: z.string().min(1) });
clientAuthRouter.post("/apple", async (req, res) => {
  const parse = appleAuthSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput") });
  const config = await getSystemConfig();
  if (!config.appleLoginEnabled || !config.appleClientId) {
    return res.status(403).json({ message: t(reqLang(req), "appleLoginNotEnabled") });
  }

  let appleSub: string | null = null;
  let appleEmail: string | null = null;
  try {
    const { createRemoteJWKSet, jwtVerify } = await import("jose");
    const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
    const { payload: jwtPayload } = await jwtVerify(parse.data.idToken, APPLE_JWKS, {
      issuer: "https://appleid.apple.com",
      audience: config.appleClientId,
    });
    appleSub = (jwtPayload.sub as string) ?? null;
    appleEmail = (jwtPayload as { email?: string }).email ?? null;
  } catch (err) {
    console.error("[Apple OAuth] verify error:", err);
    return res.status(401).json({ message: t(reqLang(req), "invalidAppleToken") });
  }
  if (!appleSub) return res.status(401).json({ message: t(reqLang(req), "invalidAppleToken") });

  const existing = await prisma.client.findUnique({
    where: { appleId: appleSub },
    select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
  });
  if (existing) {
    if (existing.isBlocked) return res.status(403).json({ message: t(reqLang(req), "accountBlocked") });
    const auth = buildAuthResponse(existing);
    return res.json(auth);
  }

  if (appleEmail) {
    const byEmail = await prisma.client.findUnique({
      where: { email: appleEmail },
      select: { id: true, email: true, appleId: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, referralPercent: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, totpEnabled: true, createdAt: true },
    });
    if (byEmail) {
      if (byEmail.isBlocked) return res.status(403).json({ message: t(reqLang(req), "accountBlocked") });
      await prisma.client.update({ where: { id: byEmail.id }, data: { appleId: appleSub } });
      const auth = buildAuthResponse(byEmail);
      return res.json(auth);
    }
  }

  const configForDefaults = await getSystemConfig();
  let remnawaveUuid: string | null = null;
  if (isRemnaConfigured()) {
    const username = remnaUsernameFromClient({ email: appleEmail });
    const remnaRes = await remnaCreateUser({
      username,
      trafficLimitBytes: 0,
      trafficLimitStrategy: "NO_RESET",
      expireAt: new Date(Date.now() - 1000).toISOString(),
    });
    remnawaveUuid = extractRemnaUuid(remnaRes.data);
    if (remnaRes.error || remnawaveUuid == null) {
      console.error("[Remna] create user (apple) failed:", { error: remnaRes.error, data: remnaRes.data });
      return res.status(503).json({ message: t(reqLang(req), "serviceTemporarilyUnavailable") });
    }
  }
  const referralCode = generateReferralCode();
  const client = await prisma.client.create({
    data: {
      email: appleEmail,
      passwordHash: null,
      remnawaveUuid,
      referralCode,
      referrerId: null,
      preferredLang: configForDefaults.defaultLanguage ?? "zh",
      preferredCurrency: configForDefaults.defaultCurrency ?? "usd",
      telegramId: null,
      telegramUsername: null,
      appleId: appleSub,
    },
  });
  const token = signClientToken(client.id);
  return res.status(201).json({ token, client: toClientShape(client) });
});

// Единый роутер /api/client: /auth (логин, регистрация, me) + кабинет (подписка, платежи)
export const clientRouter = Router();
clientRouter.use("/auth", clientAuthRouter);

// ЮMoney OAuth callback — без авторизации клиента (редирект с ЮMoney)
function yoomoneyStateSign(clientId: string): string {
  const payload = JSON.stringify({ clientId });
  const sig = createHmac("sha256", env.JWT_SECRET).update(payload).digest("base64url");
  return Buffer.from(payload, "utf8").toString("base64url") + "." + sig;
}
function yoomoneyStateVerify(state: string): string | null {
  const dot = state.indexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as { clientId?: string };
    if (!payload?.clientId) return null;
    const expected = createHmac("sha256", env.JWT_SECRET).update(JSON.stringify({ clientId: payload.clientId })).digest("base64url");
    if (sig !== expected) return null;
    return payload.clientId;
  } catch {
    return null;
  }
}

clientRouter.get("/yoomoney/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  const config = await getSystemConfig();
  const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
  const redirectFail = appUrl ? `${appUrl}/cabinet?yoomoney=error` : "/";
  if (!code?.trim() || !state?.trim()) {
    return res.redirect(302, redirectFail);
  }
  const clientId = yoomoneyStateVerify(state);
  if (!clientId) {
    return res.redirect(302, redirectFail);
  }
  const redirectUri = appUrl ? `${appUrl}/api/client/yoomoney/callback` : "";
  if (!redirectUri) {
    return res.redirect(302, redirectFail);
  }
  const result = await exchangeCodeForToken({
    code: code.trim(),
    clientId: config.yoomoneyClientId || "",
    redirectUri,
    clientSecret: config.yoomoneyClientSecret,
  });
  if ("error" in result) {
    return res.redirect(302, appUrl ? `${appUrl}/cabinet?yoomoney=error&reason=${encodeURIComponent(result.error)}` : redirectFail);
  }
  await prisma.client.update({
    where: { id: clientId },
    data: { yoomoneyAccessToken: result.access_token },
  });
  const redirectOk = appUrl ? `${appUrl}/cabinet?yoomoney=connected` : redirectFail;
  return res.redirect(302, redirectOk);
});

clientRouter.use(requireClientAuth);

// ——— 2FA (TOTP) ———
const twoFaConfirmSchema = z.object({ code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/) });
clientRouter.post("/2fa/setup", async (req, res) => {
  const client = (req as unknown as { client: { id: string; email: string | null } }).client;
  const current = await prisma.client.findUnique({ where: { id: client.id }, select: { totpEnabled: true } });
  if (current?.totpEnabled) return res.status(400).json({ message: t(reqLang(req), "twoFAAlreadyEnabled") });
  const secret = generateSecret();
  const label = client.email?.trim() || `client-${client.id}`;
  const otpauthUrl = generateURI({ issuer: "STEALTHNET", label, secret });
  await prisma.client.update({
    where: { id: client.id },
    data: { totpSecret: secret, totpEnabled: false },
  });
  return res.json({ secret, otpauthUrl });
});
clientRouter.post("/2fa/confirm", async (req, res) => {
  const client = (req as unknown as { client: { id: string } }).client;
  const body = twoFaConfirmSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "enter6DigitCodeFromApp"), errors: body.error.flatten() });
  const row = await prisma.client.findUnique({ where: { id: client.id }, select: { totpSecret: true, totpEnabled: true } });
  if (!row?.totpSecret) return res.status(400).json({ message: t(reqLang(req), "startTwoFASetupFirst") });
  if (row.totpEnabled) return res.status(400).json({ message: t(reqLang(req), "twoFAAlreadyEnabled") });
  const result = await verify({ secret: row.totpSecret, token: body.data.code });
  if (!result.valid) return res.status(400).json({ message: t(reqLang(req), "invalidCodeCheckTime") });
  await prisma.client.update({
    where: { id: client.id },
    data: { totpEnabled: true },
  });
  return res.json({ message: t(reqLang(req), "twoFAEnabled") });
});
clientRouter.post("/2fa/disable", async (req, res) => {
  const client = (req as unknown as { client: { id: string } }).client;
  const body = twoFaConfirmSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "enter6DigitCodeFromApp"), errors: body.error.flatten() });
  const row = await prisma.client.findUnique({ where: { id: client.id }, select: { totpSecret: true, totpEnabled: true } });
  if (!row?.totpEnabled || !row.totpSecret) return res.status(400).json({ message: t(reqLang(req), "twoFANotEnabled") });
  const result = await verify({ secret: row.totpSecret, token: body.data.code });
  if (!result.valid) return res.status(400).json({ message: t(reqLang(req), "invalidCode") });
  await prisma.client.update({
    where: { id: client.id },
    data: { totpSecret: null, totpEnabled: false },
  });
  return res.json({ message: t(reqLang(req), "twoFADisabled") });
});

// ——— Change Password ———
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter current password"),
  newPassword: z.string().min(6, "Minimum 6 characters"),
});

clientRouter.post("/change-password", requireClientAuth, async (req, res) => {
  const client = (req as unknown as { client: { id: string; passwordHash: string | null } }).client;
  const body = changePasswordSchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  }

  // Получаем актуальный passwordHash из базы
  const clientData = await prisma.client.findUnique({
    where: { id: client.id },
    select: { passwordHash: true },
  });

  if (!clientData?.passwordHash) {
    return res.status(400).json({ message: t(reqLang(req), "noPasswordUseTelegramOrEmail") });
  }

  const valid = await verifyPassword(body.data.currentPassword, clientData.passwordHash);
  if (!valid) {
    return res.status(400).json({ message: t(reqLang(req), "incorrectCurrentPassword") });
  }

  const newPasswordHash = await hashPassword(body.data.newPassword);
  await prisma.client.update({
    where: { id: client.id },
    data: { passwordHash: newPasswordHash },
  });

  return res.json({ message: t(reqLang(req), "passwordChanged") });
});

const setPasswordSchema = z.object({
  newPassword: z.string().min(6, "Minimum 6 characters"),
});

clientRouter.post("/set-password", requireClientAuth, async (req, res) => {
  const client = (req as unknown as { client: { id: string; passwordHash: string | null } }).client;
  const body = setPasswordSchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  }

  const clientData = await prisma.client.findUnique({
    where: { id: client.id },
    select: { passwordHash: true },
  });

  if (clientData?.passwordHash) {
    return res.status(400).json({ message: t(reqLang(req), "passwordAlreadySet") });
  }

  const newPasswordHash = await hashPassword(body.data.newPassword);
  await prisma.client.update({
    where: { id: client.id },
    data: { passwordHash: newPasswordHash },
  });

  return res.json({ message: t(reqLang(req), "passwordSet") });
});

clientAuthRouter.post("/reset-password", async (req, res) => {
  const body = resetPasswordSchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  }

  let resetToken;
  try {
    resetToken = await findPasswordResetTokenRecord(body.data.token);
  } catch (error) {
    if (!isMissingPasswordResetTokensTable(error)) throw error;
    return res.status(400).json({ message: t(reqLang(req), "invalidOrExpiredLink") });
  }

  if (!resetToken || resetToken.isBlocked) {
    return res.status(400).json({ message: t(reqLang(req), "invalidOrExpiredLink") });
  }

  if (new Date() > resetToken.expiresAt) {
    await deletePasswordResetTokenById(resetToken.id).catch(() => {});
    return res.status(400).json({ message: t(reqLang(req), "invalidOrExpiredLink") });
  }

  const passwordHash = await hashPassword(body.data.newPassword);
  await prisma.client.update({
    where: { id: resetToken.clientId },
    data: { passwordHash },
  });
  await deletePasswordResetTokensByClientId(resetToken.clientId).catch(() => {});

  return res.json({ message: t(reqLang(req), "passwordResetSuccess") });
});

const updateProfileSchema = z.object({
  preferredLang: z.string().max(10).optional(),
  preferredCurrency: z.string().max(10).optional(),
});

clientRouter.patch("/profile", async (req, res) => {
  const client = (req as unknown as { client: { id: string } }).client;
  const body = updateProfileSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  const updates: { preferredLang?: string; preferredCurrency?: string } = {};
  if (body.data.preferredLang !== undefined) updates.preferredLang = body.data.preferredLang;
  if (body.data.preferredCurrency !== undefined) updates.preferredCurrency = body.data.preferredCurrency;
  if (Object.keys(updates).length === 0) {
    const current = await prisma.client.findUnique({ where: { id: client.id }, select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, createdAt: true } });
    return res.json(current ? toClientShape(current) : { message: t(reqLang(req), "notFound") });
  }
  const updated = await prisma.client.update({
    where: { id: client.id },
    data: updates,
    select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, createdAt: true },
  });
  return res.json(toClientShape(updated));
});

/** Запросить код для привязки Telegram через бота (аккаунт без Telegram, залогинен по почте) */
clientRouter.post("/link-telegram-request", async (req, res) => {
  const client = (req as unknown as { client: { id: string; telegramId: string | null } }).client;
  if (client.telegramId) return res.status(400).json({ message: t(reqLang(req), "telegramAlreadyLinked") });
  await prisma.pendingTelegramLink.deleteMany({ where: { clientId: client.id } });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.pendingTelegramLink.create({
    data: { clientId: client.id, code, expiresAt },
  });
  const config = await getSystemConfig();
  const botUsername = (config.telegramBotUsername ?? "").replace(/^@/, "") || null;
  return res.json({ code, expiresAt: expiresAt.toISOString(), botUsername });
});

/** Привязать Telegram из Mini App (initData от Telegram WebApp) */
const linkTelegramSchema = z.object({ initData: z.string().min(1) });
clientRouter.post("/link-telegram", async (req, res) => {
  const client = (req as unknown as { client: { id: string; telegramId: string | null } }).client;
  if (client.telegramId) return res.status(400).json({ message: t(reqLang(req), "telegramAlreadyLinked") });
  const body = linkTelegramSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  const config = await getSystemConfig();
  const botToken = config.telegramBotToken ?? "";
  if (!validateTelegramInitData(body.data.initData, botToken)) {
    return res.status(401).json({ message: t(reqLang(req), "invalidOrExpiredTelegramData") });
  }
  const tgUser = parseTelegramUser(body.data.initData);
  if (!tgUser) return res.status(400).json({ message: t(reqLang(req), "missingUserData") });
  const telegramId = String(tgUser.id);
  const telegramUsername = tgUser.username?.trim() ?? null;
  const other = await prisma.client.findUnique({ where: { telegramId } });
  if (other && other.id !== client.id) {
    // Перепривязка: снимаем Telegram с другого аккаунта (часто пустой аккаунт из бота) и привязываем к текущему (с подпиской/почтой)
    await prisma.client.update({
      where: { id: other.id },
      data: { telegramId: null, telegramUsername: null },
    });
  }
  const updated = await prisma.client.update({
    where: { id: client.id },
    data: { telegramId, telegramUsername },
    select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, yoomoneyAccessToken: true, createdAt: true },
  });
  return res.json({ client: toClientShape(updated) });
});

/** Запросить привязку email (отправить письмо со ссылкой) */
const linkEmailRequestSchema = z.object({ email: z.string().email() });
clientRouter.post("/link-email-request", async (req, res) => {
  const client = (req as unknown as { client: { id: string; email: string | null } }).client;
  if (client.email?.trim()) return res.status(400).json({ message: t(reqLang(req), "emailAlreadyLinked") });
  const body = linkEmailRequestSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "invalidEmail"), errors: body.error.flatten() });
  const email = body.data.email.trim().toLowerCase();
  const config = await getSystemConfig();
  const smtpConfig = {
    host: config.smtpHost || "",
    port: config.smtpPort ?? 587,
    secure: config.smtpSecure ?? false,
    user: config.smtpUser ?? null,
    password: config.smtpPassword ?? null,
    fromEmail: config.smtpFromEmail ?? null,
    fromName: config.smtpFromName ?? null,
  };
  if (!isSmtpConfigured(smtpConfig)) return res.status(503).json({ message: t(reqLang(req), "smtpNotConfigured") });
  const currentClient = await prisma.client.findUnique({
    where: { id: client.id },
    select: { preferredLang: true },
  });
  const existing = await prisma.client.findUnique({ where: { email } });
  if (existing && existing.id !== client.id) return res.status(400).json({ message: t(reqLang(req), "emailAlreadyUsedByAnother") });
  await prisma.pendingEmailLink.deleteMany({ where: { clientId: client.id } });
  const verificationToken = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.pendingEmailLink.create({
    data: { clientId: client.id, email, verificationToken, expiresAt },
  });
  const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
  const verificationLink = appUrl ? `${appUrl}/cabinet/verify-link-email?token=${verificationToken}` : "";
  if (!verificationLink) return res.status(500).json({ message: t(reqLang(req), "appUrlNotSetInSettings") });
  const sendResult = await sendLinkEmailVerification(
    smtpConfig,
    email,
    verificationLink,
    config.serviceName ?? "STEALTHNET",
    currentClient?.preferredLang,
  );
  if (!sendResult.ok) {
    await prisma.pendingEmailLink.deleteMany({ where: { verificationToken } }).catch(() => {});
    return res.status(500).json({ message: t(reqLang(req), "failedToSendEmail") });
  }
  return res.json({ message: t(reqLang(req), "verificationEmailSent") });
});

clientRouter.get("/referral-stats", async (req, res) => {
  const client = (req as unknown as { client: { id: string } }).client;
  const c = await prisma.client.findUnique({
    where: { id: client.id },
    select: {
      referralCode: true,
      referralPercent: true,
      _count: { select: { referrals: true } },
    },
  });
  if (!c) return res.status(404).json({ message: t(reqLang(req), "notFound") });
  const config = await getSystemConfig();
  let referralPercent: number = c.referralPercent ?? 0;
  if (referralPercent === 0) {
    referralPercent = config.defaultReferralPercent ?? 0;
  }
  const totalEarnings = await prisma.referralCredit.aggregate({
    where: { referrerId: client.id },
    _sum: { amount: true },
  });
  return res.json({
    referralCode: c.referralCode,
    referralPercent,
    referralPercentLevel2: config.referralPercentLevel2 ?? 0,
    referralPercentLevel3: config.referralPercentLevel3 ?? 0,
    referralCount: c._count.referrals,
    totalEarnings: totalEarnings._sum.amount ?? 0,
  });
});

clientRouter.post("/trial", async (req, res) => {
  const client = (req as unknown as { client: { id: string; remnawaveUuid: string | null; trialUsed: boolean; email: string | null; telegramId: string | null; telegramUsername?: string | null } }).client;
  if (client.trialUsed) {
    return res.status(400).json({ message: t(reqLang(req), "trialAlreadyUsed") });
  }
  const config = await getSystemConfig();
  const trialDays = config.trialDays ?? 0;
  const trialSquadUuid = config.trialSquadUuid?.trim() || null;
  if (trialDays <= 0 || !trialSquadUuid) {
    return res.status(503).json({ message: t(reqLang(req), "trialNotConfigured") });
  }
  if (!isRemnaConfigured()) {
    return res.status(503).json({ message: t(reqLang(req), "serviceTemporarilyUnavailable") });
  }

  const trafficLimitBytes = config.trialTrafficLimitBytes ?? 0;
  const hwidDeviceLimit = config.trialDeviceLimit ?? null;

  if (client.remnawaveUuid) {
    const userRes = await remnaGetUser(client.remnawaveUuid);
    const currentExpireAt = extractCurrentExpireAt(userRes.data);
    const expireAt = calculateExpireAt(currentExpireAt, trialDays);

    const updateRes = await remnaUpdateUser({
      uuid: client.remnawaveUuid,
      expireAt,
      trafficLimitBytes,
      hwidDeviceLimit,
      activeInternalSquads: [trialSquadUuid],
    });
    if (updateRes.error) {
      return res.status(updateRes.status >= 400 ? updateRes.status : 500).json({ message: updateRes.error });
    }
    // Не вызываем add-users: по api-1.yaml эндпоинт добавляет ВСЕХ пользователей в сквад; назначение уже сделано через remnaUpdateUser(activeInternalSquads).
  } else {
    // Сначала ищем существующего пользователя в Remna (по Telegram ID, email, username), чтобы не получать "username already exists"
    let existingUuid: string | null = null;
    let currentExpireAt: Date | null = null;
    if (client.telegramId?.trim()) {
      const byTgRes = await remnaGetUserByTelegramId(client.telegramId.trim());
      existingUuid = extractRemnaUuid(byTgRes.data);
      if (existingUuid) currentExpireAt = extractCurrentExpireAt(byTgRes.data);
    }
    if (!existingUuid && client.email?.trim()) {
      const byEmailRes = await remnaGetUserByEmail(client.email.trim());
      existingUuid = extractRemnaUuid(byEmailRes.data);
      if (existingUuid) currentExpireAt = extractCurrentExpireAt(byEmailRes.data);
    }
    const displayUsername = remnaUsernameFromClient({
      telegramUsername: client.telegramUsername,
      telegramId: client.telegramId,
      email: client.email,
      clientIdFallback: client.id,
    });
    if (!existingUuid) {
      const byUsernameRes = await remnaGetUserByUsername(displayUsername);
      existingUuid = extractRemnaUuid(byUsernameRes.data);
      if (existingUuid) currentExpireAt = extractCurrentExpireAt(byUsernameRes.data);
    }

    const expireAt = calculateExpireAt(currentExpireAt, trialDays);

    if (!existingUuid) {
      const createRes = await remnaCreateUser({
        username: displayUsername,
        trafficLimitBytes,
        trafficLimitStrategy: "NO_RESET",
        expireAt,
        hwidDeviceLimit: hwidDeviceLimit ?? undefined,
        activeInternalSquads: [trialSquadUuid],
        ...(client.telegramId?.trim() && { telegramId: parseInt(client.telegramId, 10) }),
        ...(client.email?.trim() && { email: client.email.trim() }),
      });
      existingUuid = extractRemnaUuid(createRes.data);
    }

    if (!existingUuid) {
      return res.status(502).json({ message: t(reqLang(req), "errorCreatingUser") });
    }

    await remnaUpdateUser({
      uuid: existingUuid,
      expireAt,
      trafficLimitBytes,
      hwidDeviceLimit,
      activeInternalSquads: [trialSquadUuid],
    });
    // Не вызываем add-users: по api-1.yaml эндпоинт добавляет ВСЕХ пользователей в сквад.
    await prisma.client.update({
      where: { id: client.id },
      data: { remnawaveUuid: existingUuid, trialUsed: true },
    });
    const updated = await prisma.client.findUnique({ where: { id: client.id }, select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, createdAt: true } });
    return res.json({ message: t(reqLang(req), "trialActivated"), client: updated ? toClientShape(updated) : null });
  }

  await prisma.client.update({
    where: { id: client.id },
    data: { trialUsed: true },
  });
  const updated = await prisma.client.findUnique({ where: { id: client.id }, select: { id: true, email: true, telegramId: true, telegramUsername: true, preferredLang: true, preferredCurrency: true, balance: true, referralCode: true, remnawaveUuid: true, trialUsed: true, isBlocked: true, createdAt: true } });
  const lang = reqLang(req);
  return res.json({ message: t(lang, "trialActivated"), client: updated ? toClientShape(updated) : null });
});

// ——— Активация промо-ссылки ———
clientRouter.post("/promo/activate", async (req, res) => {
  const client = (req as unknown as { client: { id: string; remnawaveUuid: string | null; email: string | null; telegramId: string | null; telegramUsername?: string | null } }).client;
  const { code } = req.body as { code?: string };
  if (!code?.trim()) return res.status(400).json({ message: t(reqLang(req), "promoCodeNotSpecified") });

  const group = await prisma.promoGroup.findUnique({ where: { code: code.trim() } });
  if (!group || !group.isActive) return res.status(404).json({ message: t(reqLang(req), "promoCodeNotFoundOrInactive") });

  // Проверяем, не активировал ли уже этот клиент эту промо-группу
  const existing = await prisma.promoActivation.findUnique({
    where: { promoGroupId_clientId: { promoGroupId: group.id, clientId: client.id } },
  });
  if (existing) return res.status(400).json({ message: t(reqLang(req), "promoCodeAlreadyActivated") });

  // Проверяем лимит активаций
  if (group.maxActivations > 0) {
    const count = await prisma.promoActivation.count({ where: { promoGroupId: group.id } });
    if (count >= group.maxActivations) return res.status(400).json({ message: t(reqLang(req), "promoCodeActivationLimitReached") });
  }

  if (!isRemnaConfigured()) return res.status(503).json({ message: t(reqLang(req), "serviceTemporarilyUnavailable") });

  const trafficLimitBytes = Number(group.trafficLimitBytes);
  const hwidDeviceLimit = group.deviceLimit ?? null;

  if (client.remnawaveUuid) {
    // Получаем текущий expireAt и добавляем дни
    const userRes = await remnaGetUser(client.remnawaveUuid);
    const currentExpireAt = extractCurrentExpireAt(userRes.data);
    const expireAt = calculateExpireAt(currentExpireAt, group.durationDays);

    const updateRes = await remnaUpdateUser({
      uuid: client.remnawaveUuid,
      expireAt,
      trafficLimitBytes,
      hwidDeviceLimit,
      activeInternalSquads: [group.squadUuid],
    });
    if (updateRes.error) {
      return res.status(updateRes.status >= 400 ? updateRes.status : 500).json({ message: updateRes.error });
    }
    // Не вызываем add-users: по api-1.yaml эндпоинт добавляет ВСЕХ пользователей в сквад.
  } else {
    // Ищем существующего пользователя или создаём нового
    let existingUuid: string | null = null;
    let currentExpireAt: Date | null = null;
    if (client.telegramId?.trim()) {
      const byTgRes = await remnaGetUserByTelegramId(client.telegramId.trim());
      existingUuid = extractRemnaUuid(byTgRes.data);
      if (existingUuid) currentExpireAt = extractCurrentExpireAt(byTgRes.data);
    }
    if (!existingUuid && client.email?.trim()) {
      const byEmailRes = await remnaGetUserByEmail(client.email.trim());
      existingUuid = extractRemnaUuid(byEmailRes.data);
      if (existingUuid) currentExpireAt = extractCurrentExpireAt(byEmailRes.data);
    }
    const displayUsername = remnaUsernameFromClient({
      telegramUsername: client.telegramUsername,
      telegramId: client.telegramId,
      email: client.email,
      clientIdFallback: client.id,
    });
    const expireAt = calculateExpireAt(currentExpireAt, group.durationDays);
    if (!existingUuid) {
      const createRes = await remnaCreateUser({
        username: displayUsername,
        trafficLimitBytes,
        trafficLimitStrategy: "NO_RESET",
        expireAt,
        hwidDeviceLimit: hwidDeviceLimit ?? undefined,
        activeInternalSquads: [group.squadUuid],
        ...(client.telegramId?.trim() && { telegramId: parseInt(client.telegramId, 10) }),
        ...(client.email?.trim() && { email: client.email.trim() }),
      });
      existingUuid = extractRemnaUuid(createRes.data);
    }
    if (!existingUuid) return res.status(502).json({ message: t(reqLang(req), "vpnUserCreationError") });

    await remnaUpdateUser({ uuid: existingUuid, expireAt, trafficLimitBytes, hwidDeviceLimit, activeInternalSquads: [group.squadUuid] });
    // Не вызываем add-users: по api-1.yaml эндпоинт добавляет ВСЕХ пользователей в сквад.

    await prisma.client.update({
      where: { id: client.id },
      data: { remnawaveUuid: existingUuid },
    });
  }

  // Записываем активацию
  await prisma.promoActivation.create({
    data: { promoGroupId: group.id, clientId: client.id },
  });

  return res.json({ message: t(reqLang(req), "promoCodeActivated") });
});

// ——— Промокоды (скидки / бесплатные дни) ———

/** Общая валидация промокода — возвращает объект PromoCode или ошибку */
type PromoCodeRow = NonNullable<Awaited<ReturnType<typeof prisma.promoCode.findUnique>>>;
type ValidateResult = { ok: true; promo: PromoCodeRow } | { ok: false; error: string; status: number };

async function validatePromoCode(code: string, clientId: string, lang: string, tariffContext?: { tariffId?: string; categoryId?: string; subGroupId?: string | null }): Promise<ValidateResult> {
  const promo = await prisma.promoCode.findUnique({ where: { code: code.trim() } });
  if (!promo || !promo.isActive) return { ok: false, error: t(lang, "promoNotFoundOrInactive"), status: 404 };
  if (promo.expiresAt && promo.expiresAt < new Date()) return { ok: false, error: t(lang, "promoExpired"), status: 400 };

  if (promo.maxUses > 0) {
    const totalUsages = await prisma.promoCodeUsage.count({ where: { promoCodeId: promo.id } });
    if (totalUsages >= promo.maxUses) return { ok: false, error: t(lang, "promoUsageLimitReached"), status: 400 };
  }

  const clientUsages = await prisma.promoCodeUsage.count({
    where: { promoCodeId: promo.id, clientId },
  });
  if (clientUsages >= promo.maxUsesPerClient) return { ok: false, error: t(lang, "promoAlreadyUsedByYou"), status: 400 };

  // Проверка ограничений по категории / подгруппе / тарифу
  if (tariffContext) {
    if (promo.allowedCategoryIds.length > 0 && tariffContext.categoryId) {
      if (!promo.allowedCategoryIds.includes(tariffContext.categoryId)) {
        return { ok: false, error: t(lang, "promoNotForThisCategory"), status: 400 };
      }
    }
    if (promo.allowedSubGroupIds.length > 0 && tariffContext.subGroupId) {
      if (!promo.allowedSubGroupIds.includes(tariffContext.subGroupId)) {
        return { ok: false, error: t(lang, "promoNotForThisSubGroup"), status: 400 };
      }
    }
    if (promo.allowedTariffIds.length > 0 && tariffContext.tariffId) {
      if (!promo.allowedTariffIds.includes(tariffContext.tariffId)) {
        return { ok: false, error: t(lang, "promoNotForThisTariff"), status: 400 };
      }
    }
  }

  return { ok: true, promo };
}

/** Проверить промокод (для скидки — возвращает данные скидки; для FREE_DAYS — информацию) */
clientRouter.post("/promo-code/check", async (req, res) => {
  const client = (req as unknown as { client: { id: string } }).client;
  const { code, tariffId } = req.body as { code?: string; tariffId?: string };
  if (!code?.trim()) return res.status(400).json({ message: t(reqLang(req), "promoCodeNotSpecified") });

  // Если передан tariffId, подтягиваем контекст категории/подгруппы
  let tariffContext: { tariffId?: string; categoryId?: string; subGroupId?: string | null } | undefined;
  if (tariffId) {
    const tariff = await prisma.tariff.findUnique({ where: { id: tariffId }, select: { id: true, categoryId: true, subGroupId: true } });
    if (tariff) {
      tariffContext = { tariffId: tariff.id, categoryId: tariff.categoryId, subGroupId: tariff.subGroupId };
    }
  }

  const result = await validatePromoCode(code, client.id, reqLang(req), tariffContext);
  if (!result.ok) return res.status(result.status).json({ message: result.error });

  const promo = result.promo;
  const restrictions = {
    allowedCategoryIds: promo.allowedCategoryIds,
    allowedSubGroupIds: promo.allowedSubGroupIds,
    allowedTariffIds: promo.allowedTariffIds,
  };
  if (promo.type === "DISCOUNT") {
    return res.json({
      type: "DISCOUNT",
      discountPercent: promo.discountPercent,
      discountFixed: promo.discountFixed,
      name: promo.name,
      restrictions,
    });
  }
  return res.json({
    type: "FREE_DAYS",
    durationDays: promo.durationDays,
    name: promo.name,
    restrictions,
  });
});

/** Применить промокод FREE_DAYS — активирует подписку */
clientRouter.post("/promo-code/activate", async (req, res) => {
  const client = (req as unknown as { client: { id: string; remnawaveUuid: string | null; email: string | null; telegramId: string | null; telegramUsername?: string | null } }).client;
  const { code } = req.body as { code?: string };
  if (!code?.trim()) return res.status(400).json({ message: t(reqLang(req), "promoCodeNotSpecified") });

  const result = await validatePromoCode(code, client.id, reqLang(req));
  if (!result.ok) return res.status(result.status).json({ message: result.error });

  const promo = result.promo;

  if (promo.type === "DISCOUNT") {
    return res.status(400).json({ message: t(reqLang(req), "discountPromoAppliedAtPayment") });
  }

  // FREE_DAYS
  if (!promo.squadUuid || !promo.durationDays) {
    return res.status(400).json({ message: t(reqLang(req), "promoCodeNotFullyConfigured") });
  }

  if (!isRemnaConfigured()) return res.status(503).json({ message: t(reqLang(req), "serviceTemporarilyUnavailable") });

  const trafficLimitBytes = Number(promo.trafficLimitBytes ?? 0);
  const hwidDeviceLimit = promo.deviceLimit ?? null;

  if (client.remnawaveUuid) {
    const userRes = await remnaGetUser(client.remnawaveUuid);
    const currentExpireAt = extractCurrentExpireAt(userRes.data);
    const expireAt = calculateExpireAt(currentExpireAt, promo.durationDays);

    const updateRes = await remnaUpdateUser({
      uuid: client.remnawaveUuid,
      expireAt,
      trafficLimitBytes,
      hwidDeviceLimit,
      activeInternalSquads: [promo.squadUuid],
    });
    if (updateRes.error) {
      return res.status(updateRes.status >= 400 ? updateRes.status : 500).json({ message: updateRes.error });
    }
    // Не вызываем add-users: по api-1.yaml эндпоинт добавляет ВСЕХ пользователей в сквад.
  } else {
    let existingUuid: string | null = null;
    let currentExpireAt: Date | null = null;
    if (client.telegramId?.trim()) {
      const byTgRes = await remnaGetUserByTelegramId(client.telegramId.trim());
      existingUuid = extractRemnaUuid(byTgRes.data);
      if (existingUuid) currentExpireAt = extractCurrentExpireAt(byTgRes.data);
    }
    if (!existingUuid && client.email) {
      const byEmailRes = await remnaGetUserByEmail(client.email.trim());
      existingUuid = extractRemnaUuid(byEmailRes.data);
      if (existingUuid) currentExpireAt = extractCurrentExpireAt(byEmailRes.data);
    }
    const displayUsername = remnaUsernameFromClient({
      telegramUsername: client.telegramUsername,
      telegramId: client.telegramId,
      email: client.email,
      clientIdFallback: client.id,
    });
    const expireAt = calculateExpireAt(currentExpireAt, promo.durationDays);
    if (!existingUuid) {
      const createRes = await remnaCreateUser({
        username: displayUsername,
        trafficLimitBytes,
        trafficLimitStrategy: "NO_RESET",
        expireAt,
        hwidDeviceLimit: hwidDeviceLimit ?? undefined,
        activeInternalSquads: [promo.squadUuid],
        ...(client.telegramId?.trim() && { telegramId: parseInt(client.telegramId, 10) }),
        ...(client.email?.trim() && { email: client.email.trim() }),
      });
      existingUuid = extractRemnaUuid(createRes.data);
    }
    if (!existingUuid) return res.status(502).json({ message: t(reqLang(req), "vpnUserCreationError") });

    await remnaUpdateUser({ uuid: existingUuid, expireAt, trafficLimitBytes, hwidDeviceLimit, activeInternalSquads: [promo.squadUuid] });
    // Не вызываем add-users: по api-1.yaml эндпоинт добавляет ВСЕХ пользователей в сквад.
    await prisma.client.update({ where: { id: client.id }, data: { remnawaveUuid: existingUuid } });
  }

  await prisma.promoCodeUsage.create({ data: { promoCodeId: promo.id, clientId: client.id } });
  return res.json({ message: t(reqLang(req), "promoActivatedWithDays", { days: promo.durationDays }) });
});

/** Определить отображаемое имя тарифа: Триал, название с сайта или «Тариф не выбран».
 *  Поддерживает activeInternalSquads как массив строк (uuid) или объектов { uuid }.
 *  Приоритет: сначала ищем совпадение с оплаченным тарифом, затем — триал. */
async function resolveTariffInfo(remnaUserData: unknown, lang: string): Promise<{ name: string; categoryName: string | null; trafficResetStrategy: string; isTrial: boolean }> {
  const raw = remnaUserData as { response?: { activeInternalSquads?: unknown[] }; activeInternalSquads?: unknown[] };
  const user = raw?.response ?? raw;
  const ais = user?.activeInternalSquads;
  const squadUuids: string[] = [];
  if (Array.isArray(ais)) {
    for (const s of ais) {
      const u = s != null && typeof s === "object" && "uuid" in s ? (s as { uuid: unknown }).uuid : s;
      if (typeof u === "string") squadUuids.push(u);
    }
  }
  if (squadUuids.length === 0) return { name: t(lang, "tariffNotSelected"), categoryName: null, trafficResetStrategy: "NO_RESET", isTrial: false };
  const config = await getSystemConfig();
  const trialUuid = config.trialSquadUuid?.trim() || null;
  const tariffs = await prisma.tariff.findMany({ select: { name: true, internalSquadUuids: true, trafficResetStrategy: true, category: { select: { name: true } } } });
  for (const squadUuid of squadUuids) {
    if (trialUuid === squadUuid) continue;
    const match = tariffs.find((t) => t.internalSquadUuids.includes(squadUuid));
    if (match?.name) return { name: match.name, categoryName: match.category?.name ?? null, trafficResetStrategy: (match as any).trafficResetStrategy ?? "NO_RESET", isTrial: false };
  }
  if (trialUuid && squadUuids.includes(trialUuid)) return { name: t(lang, "trialLabel"), categoryName: null, trafficResetStrategy: "NO_RESET", isTrial: true };
  return { name: t(lang, "tariffNotSelected"), categoryName: null, trafficResetStrategy: "NO_RESET", isTrial: false };
}

clientRouter.get("/proxy-slots", async (req, res) => {
  const client = (req as unknown as { client: { id: string } }).client;
  const now = new Date();
  const slots = await prisma.proxySlot.findMany({
    where: { clientId: client.id, status: "ACTIVE", expiresAt: { gt: now } },
    select: {
      id: true,
      login: true,
      password: true,
      expiresAt: true,
      trafficLimitBytes: true,
      trafficUsedBytes: true,
      connectionLimit: true,
      node: { select: { publicHost: true, socksPort: true, httpPort: true } },
    },
    orderBy: { expiresAt: "asc" },
  });
  return res.json({
    slots: slots.map((s) => ({
      id: s.id,
      login: s.login,
      password: s.password,
      expiresAt: s.expiresAt.toISOString(),
      trafficLimitBytes: s.trafficLimitBytes?.toString() ?? null,
      trafficUsedBytes: s.trafficUsedBytes.toString(),
      connectionLimit: s.connectionLimit,
      host: s.node.publicHost ?? "host",
      socksPort: s.node.socksPort,
      httpPort: s.node.httpPort,
    })),
  });
});

clientRouter.get("/singbox-slots", async (req, res) => {
  const client = (req as unknown as { client: { id: string } }).client;
  const now = new Date();
  const slots = await prisma.singboxSlot.findMany({
    where: { clientId: client.id, status: "ACTIVE", expiresAt: { gt: now } },
    select: {
      id: true,
      userIdentifier: true,
      secret: true,
      expiresAt: true,
      trafficLimitBytes: true,
      trafficUsedBytes: true,
      node: { select: { publicHost: true, port: true, protocol: true, tlsEnabled: true } },
    },
    orderBy: { expiresAt: "asc" },
  });
  return res.json({
    slots: slots.map((s) => {
      const link = buildSingboxSlotSubscriptionLink(
        {
          publicHost: s.node.publicHost ?? "",
          port: s.node.port ?? 443,
          protocol: s.node.protocol ?? "VLESS",
          tlsEnabled: s.node.tlsEnabled,
        },
        { userIdentifier: s.userIdentifier, secret: s.secret },
        `slot-${s.id.slice(-8)}`
      );
      return {
        id: s.id,
        subscriptionLink: link,
        expiresAt: s.expiresAt.toISOString(),
        trafficLimitBytes: s.trafficLimitBytes?.toString() ?? null,
        trafficUsedBytes: s.trafficUsedBytes.toString(),
        protocol: s.node.protocol ?? "VLESS",
      };
    }),
  });
});

clientRouter.get("/subscription", async (req, res) => {
  const client = (req as unknown as { client: { id: string; remnawaveUuid: string | null } }).client;
  if (!client.remnawaveUuid) {
    return res.json({ subscription: null, tariffDisplayName: null, tariffCategoryName: null, trafficResetStrategy: null, isTrial: false, usedDevicesCount: 0, message: t(reqLang(req), "subscriptionNotLinked") });
  }
  const [result, devicesResult] = await Promise.all([
    remnaGetUser(client.remnawaveUuid),
    remnaGetUserHwidDevices(client.remnawaveUuid).catch(() => ({ data: null, error: null, status: 200 })),
  ]);
  if (result.error) {
    return res.json({ subscription: null, tariffDisplayName: null, tariffCategoryName: null, trafficResetStrategy: null, isTrial: false, usedDevicesCount: 0, message: result.error });
  }

  const devData = devicesResult.data as { response?: { total?: number } } | undefined;
  const usedDevicesCount = devData?.response?.total ?? 0;

  // 先判断当前是否为试用（基于 internalSquads UUID 匹配）
  const tariffInfo = await resolveTariffInfo(result.data ?? null, reqLang(req));

  // 如果当前是试用用户，直接返回试用状态，不查付费记录
  if (tariffInfo.isTrial) {
    return res.json({
      subscription: result.data ?? null,
      tariffDisplayName: tariffInfo.name,
      tariffCategoryName: tariffInfo.categoryName,
      trafficResetStrategy: tariffInfo.trafficResetStrategy ?? "NO_RESET",
      isTrial: true,
      usedDevicesCount,
    });
  }

  // 1) 优先从最后一次已支付的套餐付款记录中获取（精确，不受 UUID 一对多影响）
  const lastPaidTariff = await prisma.payment.findFirst({
    where: { clientId: client.id, status: "PAID", tariffId: { not: null } },
    orderBy: { paidAt: "desc" },
    select: { tariff: { select: { name: true, trafficResetStrategy: true, category: { select: { name: true } } } } },
  });
  const paidName = lastPaidTariff?.tariff?.name?.trim();

  if (paidName) {
    // 有付费记录 → 直接使用
    return res.json({
      subscription: result.data ?? null,
      tariffDisplayName: paidName,
      tariffCategoryName: lastPaidTariff?.tariff?.category?.name ?? null,
      trafficResetStrategy: (lastPaidTariff?.tariff as any)?.trafficResetStrategy ?? "NO_RESET",
      isTrial: false,
      usedDevicesCount,
    });
  }

  // 2) 没有付费记录也不是试用 → 使用 UUID 匹配结果
  return res.json({
    subscription: result.data ?? null,
    tariffDisplayName: tariffInfo.name,
    tariffCategoryName: tariffInfo.categoryName,
    trafficResetStrategy: tariffInfo.trafficResetStrategy ?? "NO_RESET",
    isTrial: false,
    usedDevicesCount,
  });
});

/** GET /api/client/devices — список устройств (HWID) пользователя в Remna */
clientRouter.get("/devices", async (req, res) => {
  const client = (req as unknown as { client: { id: string; remnawaveUuid: string | null } }).client;
  if (!client.remnawaveUuid) {
    return res.status(400).json({ message: t(reqLang(req), "subscriptionNotLinked") });
  }
  const result = await remnaGetUserHwidDevices(client.remnawaveUuid);
  if (result.error) {
    return res.status(result.status >= 500 ? 503 : 400).json({ message: result.error });
  }
  const data = result.data as { response?: { total?: number; devices?: Array<{ hwid: string; platform?: string; deviceModel?: string; createdAt?: string }> } } | undefined;
  const resp = data?.response;
  const devices = Array.isArray(resp?.devices) ? resp.devices : [];
  const total = typeof resp?.total === "number" ? resp.total : devices.length;
  return res.json({ total, devices });
});

const deleteDeviceSchema = z.object({ hwid: z.string().min(1).max(500) });

/** POST /api/client/devices/delete — удалить устройство по HWID */
clientRouter.post("/devices/delete", async (req, res) => {
  const client = (req as unknown as { client: { id: string; remnawaveUuid: string | null } }).client;
  if (!client.remnawaveUuid) {
    return res.status(400).json({ message: t(reqLang(req), "subscriptionNotLinked") });
  }
  const body = deleteDeviceSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  const result = await remnaDeleteUserHwidDevice(client.remnawaveUuid, body.data.hwid);
  if (result.error) {
    return res.status(result.status >= 500 ? 503 : 400).json({ message: result.error });
  }
  return res.json({ ok: true, message: t(reqLang(req), "deviceRemoved") });
});

const createPlategaPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().min(1).max(10).optional(),
  paymentMethod: z.number().int().min(2).max(13),
  description: z.string().max(500).optional(),
  tariffId: z.string().min(1).optional(),
  proxyTariffId: z.string().min(1).optional(),
  singboxTariffId: z.string().min(1).optional(),
  promoCode: z.string().max(50).optional(),
  extraOption: z.object({ kind: z.enum(["traffic", "devices", "servers"]), productId: z.string().min(1) }).optional(),
  customBuild: z.object({ days: z.number().int().min(1).max(360), devices: z.number().int().min(1).max(20), trafficGb: z.number().min(0).nullable().optional() }).optional(),
});
clientRouter.post("/payments/platega", async (req, res) => {
  const clientId = (req as unknown as { clientId: string }).clientId;
  const parsed = createPlategaPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: parsed.error.flatten() });
  }
  const { amount: originalAmount, currency, paymentMethod, description, tariffId, proxyTariffId, singboxTariffId, promoCode: promoCodeStr, extraOption, customBuild: customBuildBody } = parsed.data;

  let tariffIdToStore: string | null = null;
  let proxyTariffIdToStore: string | null = null;
  let singboxTariffIdToStore: string | null = null;
  let finalAmount: number;
  let currencyToUse: string;
  let metadataExtra: Record<string, unknown> | null = null;

  if (customBuildBody) {
    const configForCb = await getSystemConfig();
    const cfg = getCustomBuildConfig(configForCb);
    if (!cfg) return res.status(400).json({ message: t(reqLang(req), "flexibleTariffDisabled") });
    let { days, devices, trafficGb } = customBuildBody;
    if (days > cfg.maxDays || devices > cfg.maxDevices) {
      return res.status(400).json({ message: t(reqLang(req), "daysDevicesLimit", { maxDays: cfg.maxDays, maxDevices: cfg.maxDevices }) });
    }
    const trafficLimitBytes =
      cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb >= 0
        ? Math.round(trafficGb * 1024 ** 3)
        : null;
    finalAmount = days * cfg.pricePerDay + devices * cfg.pricePerDevice;
    if (cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb > 0) finalAmount += trafficGb * cfg.pricePerGb;
    finalAmount = Math.round(finalAmount * 100) / 100;
    currencyToUse = cfg.currency.toUpperCase();
    metadataExtra = {
      customBuild: {
        durationDays: days,
        deviceLimit: devices,
        trafficLimitBytes,
        internalSquadUuids: [cfg.squadUuid],
      },
    };
  } else if (extraOption) {
    const config = await getSystemConfig();
    if (!(config as { sellOptionsEnabled?: boolean }).sellOptionsEnabled) {
      return res.status(400).json({ message: t(reqLang(req), "optionsSalesDisabled") });
    }
    const cfg = config as {
      sellOptionsTrafficEnabled?: boolean; sellOptionsTrafficProducts?: SellOptionTrafficProduct[];
      sellOptionsDevicesEnabled?: boolean; sellOptionsDevicesProducts?: SellOptionDeviceProduct[];
      sellOptionsServersEnabled?: boolean; sellOptionsServersProducts?: SellOptionServerProduct[];
    };
    if (extraOption.kind === "traffic") {
      const product = cfg.sellOptionsTrafficEnabled && cfg.sellOptionsTrafficProducts?.find((p) => p.id === extraOption.productId);
      if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
      finalAmount = product.price;
      currencyToUse = product.currency.toUpperCase();
      metadataExtra = { extraOption: { kind: "traffic", trafficBytes: Math.round(product.trafficGb * 1024 ** 3) } };
    } else if (extraOption.kind === "devices") {
      const product = cfg.sellOptionsDevicesEnabled && cfg.sellOptionsDevicesProducts?.find((p) => p.id === extraOption.productId);
      if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
      finalAmount = product.price;
      currencyToUse = product.currency.toUpperCase();
      metadataExtra = { extraOption: { kind: "devices", deviceCount: product.deviceCount } };
    } else {
      const product = cfg.sellOptionsServersEnabled && cfg.sellOptionsServersProducts?.find((p) => p.id === extraOption.productId);
      if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
      finalAmount = product.price;
      currencyToUse = product.currency.toUpperCase();
      metadataExtra = {
        extraOption: {
          kind: "servers",
          squadUuid: product.squadUuid,
          ...((product.trafficGb ?? 0) > 0 && { trafficBytes: Math.round((product.trafficGb ?? 0) * 1024 ** 3) }),
        },
      };
    }
  } else {
    if (originalAmount == null || !currency) return res.status(400).json({ message: t(reqLang(req), "specifyAmountAndCurrency") });
    finalAmount = originalAmount;
    currencyToUse = currency.toUpperCase();
    if (tariffId) {
      const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
      if (!tariff) return res.status(400).json({ message: t(reqLang(req), "tariffNotFound") });
      tariffIdToStore = tariffId;
    }
    if (proxyTariffId) {
      const proxyTariff = await prisma.proxyTariff.findUnique({ where: { id: proxyTariffId } });
      if (!proxyTariff || !proxyTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "proxyTariffNotFound") });
      proxyTariffIdToStore = proxyTariffId;
      if (originalAmount == null) { finalAmount = proxyTariff.price; currencyToUse = proxyTariff.currency.toUpperCase(); }
    }
    if (singboxTariffId) {
      const singboxTariff = await prisma.singboxTariff.findUnique({ where: { id: singboxTariffId } });
      if (!singboxTariff || !singboxTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "singboxTariffNotFound") });
      singboxTariffIdToStore = singboxTariffId;
      if (originalAmount == null) { finalAmount = singboxTariff.price; currencyToUse = singboxTariff.currency.toUpperCase(); }
    }
  }

  if (finalAmount < 1) {
    return res.status(400).json({ message: t(reqLang(req), "minimumPaymentAmount1") });
  }

  // Применяем промокод на скидку (не для опций по умолчанию, можно разрешить — тогда скидка с опции)
  let promoCodeRecord: { id: string } | null = null;
  if (promoCodeStr?.trim() && !extraOption) {
    // Подготавливаем контекст тарифа для проверки ограничений промокода
    let tariffCtx: { tariffId?: string; categoryId?: string; subGroupId?: string | null } | undefined;
    if (tariffIdToStore) {
      const tariffForCtx = await prisma.tariff.findUnique({ where: { id: tariffIdToStore }, select: { id: true, categoryId: true, subGroupId: true } });
      if (tariffForCtx) tariffCtx = { tariffId: tariffForCtx.id, categoryId: tariffForCtx.categoryId, subGroupId: tariffForCtx.subGroupId };
    }
    const result = await validatePromoCode(promoCodeStr.trim(), clientId, reqLang(req), tariffCtx);
    if (!result.ok) return res.status(result.status).json({ message: result.error });
    const promo = result.promo;
    if (promo.type !== "DISCOUNT") return res.status(400).json({ message: t(reqLang(req), "promoNotDiscount") });

    if (promo.discountPercent && promo.discountPercent > 0) {
      finalAmount = Math.max(0, finalAmount - finalAmount * promo.discountPercent / 100);
    }
    if (promo.discountFixed && promo.discountFixed > 0) {
      finalAmount = Math.max(0, finalAmount - promo.discountFixed);
    }
    finalAmount = Math.round(finalAmount * 100) / 100;
    if (finalAmount <= 0) return res.status(400).json({ message: t(reqLang(req), "finalAmountCannotBeZero") });
    promoCodeRecord = promo;
  }

  const config = await getSystemConfig();
  const plategaConfig = {
    merchantId: config.plategaMerchantId || "",
    secret: config.plategaSecret || "",
  };
  if (!isPlategaConfigured(plategaConfig)) {
    return res.status(503).json({ message: t(reqLang(req), "plategaNotConfigured") });
  }

  const methods = config.plategaMethods || [];
  const allowed = methods.find((m) => m.id === paymentMethod && m.enabled);
  if (!allowed) {
    return res.status(400).json({ message: t(reqLang(req), "paymentMethodNotAvailable") });
  }

  const serviceName = config.serviceName?.trim() || "STEALTHNET";
  const orderId = randomUUID();
  const paymentKind = tariffIdToStore ? "tariff" : proxyTariffIdToStore ? "proxy" : singboxTariffIdToStore ? "singbox" : metadataExtra ? "option" : "topup";
  const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
  const returnUrl = appUrl
    ? `${appUrl}/cabinet/dashboard?payment=success&payment_kind=${paymentKind}&oid=${orderId}`
    : "";
  const failedUrl = appUrl
    ? `${appUrl}/cabinet/dashboard?payment=failed&payment_kind=${paymentKind}&oid=${orderId}`
    : "";
  const _pdLang = reqLang(req);
  const _pdVars = { service: serviceName, orderId };
  const plategaDescription = tariffIdToStore
    ? t(_pdLang, "payDescTariff", _pdVars)
    : proxyTariffIdToStore
      ? t(_pdLang, "payDescProxy", _pdVars)
      : singboxTariffIdToStore
        ? t(_pdLang, "payDescAccess", _pdVars)
        : metadataExtra
      ? t(_pdLang, "payDescOption", _pdVars)
      : t(_pdLang, "balanceTopupDescription", _pdVars);

  const paymentMeta = metadataExtra
    ? { ...metadataExtra, ...(promoCodeRecord ? { promoCodeId: promoCodeRecord.id, originalAmount: finalAmount } : {}) }
    : (promoCodeRecord ? { promoCodeId: promoCodeRecord.id, originalAmount: originalAmount ?? finalAmount } : null);
  const payment = await prisma.payment.create({
    data: {
      clientId,
      orderId,
      amount: finalAmount,
      currency: currencyToUse,
      status: "PENDING",
      provider: "platega",
      tariffId: tariffIdToStore,
      proxyTariffId: proxyTariffIdToStore,
      singboxTariffId: singboxTariffIdToStore,
      metadata: paymentMeta ? JSON.stringify(paymentMeta) : null,
    },
  });

  const result = await createPlategaTransaction(plategaConfig, {
    amount: finalAmount,
    currency: currencyToUse,
    orderId,
    paymentMethod,
    returnUrl,
    failedUrl,
    description: plategaDescription,
  });

  if ("error" in result) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return res.status(502).json({ message: result.error });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { externalId: result.transactionId },
  });

  // Записываем использование промокода
  if (promoCodeRecord) {
    await prisma.promoCodeUsage.create({ data: { promoCodeId: promoCodeRecord.id, clientId } });
  }

  return res.status(201).json({
    paymentUrl: result.paymentUrl,
    orderId,
    paymentId: payment.id,
    discountApplied: promoCodeRecord ? true : false,
    finalAmount,
  });
});

// ——— Оплата тарифа или прокси-тарифа балансом ———

const payByBalanceSchema = z.object({
  tariffId: z.string().min(1).optional(),
  proxyTariffId: z.string().min(1).optional(),
  singboxTariffId: z.string().min(1).optional(),
  promoCode: z.string().max(50).optional(),
}).refine((d) => (d.tariffId ? 1 : 0) + (d.proxyTariffId ? 1 : 0) + (d.singboxTariffId ? 1 : 0) === 1, { message: "Specify tariffId, proxyTariffId, or singboxTariffId" });

clientRouter.post("/payments/balance", async (req, res) => {
  const clientRaw = (req as unknown as { client: { id: string; remnawaveUuid: string | null; email: string | null; telegramId: string | null } }).client;
  const parsed = payByBalanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: parsed.error.flatten() });

  const { tariffId, proxyTariffId, singboxTariffId, promoCode: promoCodeStr } = parsed.data;

  if (proxyTariffId) {
    const tariff = await prisma.proxyTariff.findUnique({ where: { id: proxyTariffId } });
    if (!tariff || !tariff.enabled) return res.status(400).json({ message: t(reqLang(req), "proxyTariffNotFound") });
    const clientDb = await prisma.client.findUnique({ where: { id: clientRaw.id } });
    if (!clientDb) return res.status(401).json({ message: t(reqLang(req), "unauthorized") });
    if (clientDb.balance < tariff.price) {
      return res.status(400).json({ message: t(reqLang(req), "insufficientFunds", { balance: clientDb.balance.toFixed(2), needed: tariff.price.toFixed(2) }) });
    }
    const payment = await prisma.payment.create({
      data: {
        clientId: clientRaw.id,
        orderId: randomUUID(),
        amount: tariff.price,
        currency: tariff.currency.toUpperCase(),
        status: "PAID",
        provider: "balance",
        proxyTariffId: tariff.id,
        paidAt: new Date(),
      },
    });
    const proxyResult = await createProxySlotsByPaymentId(payment.id);
    if (!proxyResult.ok) return res.status(proxyResult.status).json({ message: proxyResult.error });
    await prisma.client.update({
      where: { id: clientRaw.id },
      data: { balance: { decrement: tariff.price } },
    });
    const { distributeReferralRewards } = await import("../referral/referral.service.js");
    await distributeReferralRewards(payment.id).catch((e) => console.error("[referral] Error:", e));
    const { notifyProxySlotsCreated } = await import("../notification/telegram-notify.service.js");
    await notifyProxySlotsCreated(clientRaw.id, proxyResult.slotIds, tariff.name).catch(() => {});
    return res.json({
      message: t(reqLang(req), "proxyPaidFromBalance", { name: tariff.name, amount: tariff.price.toFixed(2), currency: tariff.currency.toUpperCase() }),
      newBalance: clientDb.balance - tariff.price,
    });
  }

  if (singboxTariffId) {
    const tariff = await prisma.singboxTariff.findUnique({ where: { id: singboxTariffId } });
    if (!tariff || !tariff.enabled) return res.status(400).json({ message: t(reqLang(req), "singboxTariffNotFound") });
    const clientDb = await prisma.client.findUnique({ where: { id: clientRaw.id } });
    if (!clientDb) return res.status(401).json({ message: t(reqLang(req), "unauthorized") });
    if (clientDb.balance < tariff.price) {
      return res.status(400).json({ message: t(reqLang(req), "insufficientFunds", { balance: clientDb.balance.toFixed(2), needed: tariff.price.toFixed(2) }) });
    }
    const payment = await prisma.payment.create({
      data: {
        clientId: clientRaw.id,
        orderId: randomUUID(),
        amount: tariff.price,
        currency: tariff.currency.toUpperCase(),
        status: "PAID",
        provider: "balance",
        singboxTariffId: tariff.id,
        paidAt: new Date(),
      },
    });
    const singboxResult = await createSingboxSlotsByPaymentId(payment.id);
    if (!singboxResult.ok) return res.status(singboxResult.status).json({ message: singboxResult.error });
    await prisma.client.update({
      where: { id: clientRaw.id },
      data: { balance: { decrement: tariff.price } },
    });
    const { distributeReferralRewards } = await import("../referral/referral.service.js");
    await distributeReferralRewards(payment.id).catch((e) => console.error("[referral] Error:", e));
    const { notifySingboxSlotsCreated } = await import("../notification/telegram-notify.service.js");
    await notifySingboxSlotsCreated(clientRaw.id, singboxResult.slotIds, tariff.name).catch(() => {});
    return res.json({
      message: t(reqLang(req), "singboxPaidFromBalance", { name: tariff.name, amount: tariff.price.toFixed(2), currency: tariff.currency.toUpperCase() }),
      newBalance: clientDb.balance - tariff.price,
    });
  }

  const tariff = await prisma.tariff.findUnique({ where: { id: tariffId! } });
  if (!tariff) return res.status(400).json({ message: t(reqLang(req), "tariffNotFound") });

  let finalPrice = tariff.price;

  // Промокод на скидку
  let promoCodeRecord: { id: string } | null = null;
  if (promoCodeStr?.trim()) {
    const result = await validatePromoCode(promoCodeStr.trim(), clientRaw.id, reqLang(req));
    if (!result.ok) return res.status(result.status).json({ message: result.error });
    const promo = result.promo;
    if (promo.type !== "DISCOUNT") return res.status(400).json({ message: t(reqLang(req), "promoNotDiscount") });

    if (promo.discountPercent && promo.discountPercent > 0) {
      finalPrice = Math.max(0, finalPrice - finalPrice * promo.discountPercent / 100);
    }
    if (promo.discountFixed && promo.discountFixed > 0) {
      finalPrice = Math.max(0, finalPrice - promo.discountFixed);
    }
    finalPrice = Math.round(finalPrice * 100) / 100;
    promoCodeRecord = promo;
  }

  // Проверяем баланс
  const clientDb = await prisma.client.findUnique({ where: { id: clientRaw.id } });
  if (!clientDb) return res.status(401).json({ message: t(reqLang(req), "unauthorized") });
  if (clientDb.balance < finalPrice) {
    return res.status(400).json({ message: t(reqLang(req), "insufficientFunds", { balance: clientDb.balance.toFixed(2), needed: finalPrice.toFixed(2) }) });
  }

  // Активируем тариф в Remnawave
  const activateResult = await activateTariffForClient(
    { id: clientRaw.id, remnawaveUuid: clientDb.remnawaveUuid, email: clientDb.email, telegramId: clientDb.telegramId },
    tariff,
  );
  if (!activateResult.ok) return res.status(activateResult.status).json({ message: activateResult.error });

  // Списываем баланс и помечаем триал использованным (чтобы не показывать кнопку «Бесплатный триал»)
  await prisma.client.update({
    where: { id: clientRaw.id },
    data: { balance: { decrement: finalPrice }, trialUsed: true },
  });

  // Создаём запись об оплате
  const orderId = randomUUID();
  const payment = await prisma.payment.create({
    data: {
      clientId: clientRaw.id,
      orderId,
      amount: finalPrice,
      currency: tariff.currency.toUpperCase(),
      status: "PAID",
      provider: "balance",
      tariffId,
      paidAt: new Date(),
      metadata: promoCodeRecord ? JSON.stringify({ promoCodeId: promoCodeRecord.id, originalPrice: tariff.price }) : null,
    },
  });

  // Записываем использование промокода
  if (promoCodeRecord) {
    await prisma.promoCodeUsage.create({ data: { promoCodeId: promoCodeRecord.id, clientId: clientRaw.id } });
  }

  // Реферальные начисления
  const { distributeReferralRewards } = await import("../referral/referral.service.js");
  await distributeReferralRewards(payment.id).catch(() => {});

  return res.json({
    message: t(reqLang(req), "tariffActivatedFromBalance", { name: tariff.name, amount: finalPrice.toFixed(2), currency: tariff.currency.toUpperCase() }),
    tariffName: tariff.name,
    amount: finalPrice,
    currency: tariff.currency.toUpperCase(),
    paymentId: payment.id,
    newBalance: clientDb.balance - finalPrice,
  });
});


// ——— Гибкий тариф (собери сам): расчёт и оплата балансом ———
function getCustomBuildConfig(config: Awaited<ReturnType<typeof getSystemConfig>>) {
  const c = config as {
    customBuildEnabled?: boolean;
    customBuildPricePerDay?: number;
    customBuildPricePerDevice?: number;
    customBuildTrafficMode?: string;
    customBuildPricePerGb?: number;
    customBuildSquadUuid?: string | null;
    customBuildCurrency?: string;
    customBuildMaxDays?: number;
    customBuildMaxDevices?: number;
  };
  if (!c.customBuildEnabled || !c.customBuildSquadUuid?.trim()) return null;
  return {
    pricePerDay: c.customBuildPricePerDay ?? 0,
    pricePerDevice: c.customBuildPricePerDevice ?? 0,
    trafficMode: c.customBuildTrafficMode === "per_gb" ? "per_gb" as const : "unlimited" as const,
    pricePerGb: c.customBuildPricePerGb ?? 0,
    squadUuid: c.customBuildSquadUuid.trim(),
    currency: (c.customBuildCurrency || "rub").toLowerCase(),
    maxDays: Math.min(360, Math.max(1, c.customBuildMaxDays ?? 360)),
    maxDevices: Math.min(20, Math.max(1, c.customBuildMaxDevices ?? 10)),
  };
}

const customBuildPayByBalanceSchema = z.object({
  days: z.number().int().min(1).max(360),
  devices: z.number().int().min(1).max(20),
  trafficGb: z.number().min(0).nullable().optional(),
  promoCode: z.string().max(50).optional(),
});

clientRouter.post("/custom-build/pay-balance", async (req, res) => {
  const clientRaw = (req as unknown as { client: { id: string } }).client;
  const parsed = customBuildPayByBalanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: t(reqLang(req), "invalidParams"), errors: parsed.error.flatten() });

  const config = await getSystemConfig();
  const cfg = getCustomBuildConfig(config);
  if (!cfg) return res.status(400).json({ message: t(reqLang(req), "flexibleTariffDisabled") });

  let { days, devices, trafficGb } = parsed.data;
  if (days > cfg.maxDays || devices > cfg.maxDevices) {
    return res.status(400).json({ message: t(reqLang(req), "daysDevicesLimit", { maxDays: cfg.maxDays, maxDevices: cfg.maxDevices }) });
  }
  const trafficLimitBytes =
    cfg.trafficMode === "per_gb"
      ? (trafficGb != null && trafficGb >= 0 ? BigInt(Math.round(trafficGb * 1024 ** 3)) : null)
      : null;

  let amount = days * cfg.pricePerDay + devices * cfg.pricePerDevice;
  if (cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb > 0) {
    amount += trafficGb * cfg.pricePerGb;
  }

  let finalPrice = amount;
  let promoCodeRecord: { id: string } | null = null;
  if (parsed.data.promoCode?.trim()) {
    const result = await validatePromoCode(parsed.data.promoCode.trim(), clientRaw.id, reqLang(req));
    if (!result.ok) return res.status(result.status).json({ message: result.error });
    const promo = result.promo;
    if (promo.type !== "DISCOUNT") return res.status(400).json({ message: t(reqLang(req), "promoNotDiscount") });
    if (promo.discountPercent && promo.discountPercent > 0) {
      finalPrice = Math.max(0, finalPrice - finalPrice * promo.discountPercent / 100);
    }
    if (promo.discountFixed && promo.discountFixed > 0) {
      finalPrice = Math.max(0, finalPrice - promo.discountFixed);
    }
    finalPrice = Math.round(finalPrice * 100) / 100;
    promoCodeRecord = promo;
  }

  const clientDb = await prisma.client.findUnique({ where: { id: clientRaw.id } });
  if (!clientDb) return res.status(401).json({ message: t(reqLang(req), "unauthorized") });
  if (clientDb.balance < finalPrice) {
    return res.status(400).json({
      message: t(reqLang(req), "insufficientFunds", { balance: clientDb.balance.toFixed(2), needed: `${finalPrice.toFixed(2)} ${cfg.currency.toUpperCase()}` }),
    });
  }

  const metadata = JSON.stringify({
    customBuild: {
      durationDays: days,
      deviceLimit: devices,
      trafficLimitBytes: trafficLimitBytes != null ? Number(trafficLimitBytes) : null,
      internalSquadUuids: [cfg.squadUuid],
    },
    ...(promoCodeRecord && { promoCodeId: promoCodeRecord.id, originalPrice: amount }),
  });

  const orderId = randomUUID();
  const payment = await prisma.payment.create({
    data: {
      clientId: clientRaw.id,
      orderId,
      amount: finalPrice,
      currency: cfg.currency.toUpperCase(),
      status: "PAID",
      provider: "balance",
      paidAt: new Date(),
      metadata,
    },
  });

  const activation = await activateTariffByPaymentId(payment.id);
  if (!activation.ok) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return res.status(activation.status).json({ message: activation.error });
  }

  await prisma.client.update({
    where: { id: clientRaw.id },
    data: { balance: { decrement: finalPrice }, trialUsed: true },
  });
  if (promoCodeRecord) {
    await prisma.promoCodeUsage.create({ data: { promoCodeId: promoCodeRecord.id, clientId: clientRaw.id } });
  }
  const { distributeReferralRewards } = await import("../referral/referral.service.js");
  await distributeReferralRewards(payment.id).catch((e) => console.error("[referral] Error:", e));

  return res.json({
    message: t(reqLang(req), "customBuildActivated", { days, devices, amount: finalPrice.toFixed(2), currency: cfg.currency.toUpperCase() }),
    paymentId: payment.id,
    newBalance: clientDb.balance - finalPrice,
  });
});

// ——— Оплата опции (доп. трафик/устройства/сервер) балансом ———
const payOptionByBalanceSchema = z.object({
  extraOption: z.object({ kind: z.enum(["traffic", "devices", "servers"]), productId: z.string().min(1) }),
});
clientRouter.post("/payments/balance/option", async (req, res) => {
  const clientRaw = (req as unknown as { clientId: string }).clientId;
  const parsed = payOptionByBalanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: parsed.error.flatten() });

  const config = await getSystemConfig();
  if (!(config as { sellOptionsEnabled?: boolean }).sellOptionsEnabled) {
    return res.status(400).json({ message: t(reqLang(req), "optionsSalesDisabled") });
  }

  const cfg = config as {
    sellOptionsTrafficEnabled?: boolean; sellOptionsTrafficProducts?: SellOptionTrafficProduct[];
    sellOptionsDevicesEnabled?: boolean; sellOptionsDevicesProducts?: SellOptionDeviceProduct[];
    sellOptionsServersEnabled?: boolean; sellOptionsServersProducts?: SellOptionServerProduct[];
  };
  const { kind, productId } = parsed.data.extraOption;
  let price: number;
  let currency: string;
  let metadataExtra: Record<string, unknown>;

  if (kind === "traffic") {
    const product = cfg.sellOptionsTrafficEnabled && cfg.sellOptionsTrafficProducts?.find((p) => p.id === productId);
    if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
    price = product.price;
    currency = product.currency;
    metadataExtra = { extraOption: { kind: "traffic", trafficBytes: Math.round(product.trafficGb * 1024 ** 3) } };
  } else if (kind === "devices") {
    const product = cfg.sellOptionsDevicesEnabled && cfg.sellOptionsDevicesProducts?.find((p) => p.id === productId);
    if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
    price = product.price;
    currency = product.currency;
    metadataExtra = { extraOption: { kind: "devices", deviceCount: product.deviceCount } };
  } else {
    const product = cfg.sellOptionsServersEnabled && cfg.sellOptionsServersProducts?.find((p) => p.id === productId);
    if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
    price = product.price;
    currency = product.currency;
    metadataExtra = {
        extraOption: {
          kind: "servers",
          squadUuid: product.squadUuid,
          ...((product.trafficGb ?? 0) > 0 && { trafficBytes: Math.round((product.trafficGb ?? 0) * 1024 ** 3) }),
        },
      };
  }

  const clientDb = await prisma.client.findUnique({ where: { id: clientRaw } });
  if (!clientDb) return res.status(401).json({ message: t(reqLang(req), "unauthorized") });
  if (clientDb.balance < price) {
    return res.status(400).json({ message: t(reqLang(req), "insufficientFunds", { balance: clientDb.balance.toFixed(2), needed: price.toFixed(2) }) });
  }

  const orderId = randomUUID();
  const payment = await prisma.payment.create({
    data: {
      clientId: clientDb.id,
      orderId,
      amount: price,
      currency: currency.toUpperCase(),
      status: "PAID",
      provider: "balance",
      paidAt: new Date(),
      metadata: JSON.stringify(metadataExtra),
    },
  });

  const applyResult = await applyExtraOptionByPaymentId(payment.id);
  if (!applyResult.ok) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return res.status(applyResult.status).json({ message: (applyResult as { error?: string }).error || t(reqLang(req), "optionApplyError") });
  }

  await prisma.client.update({
    where: { id: clientDb.id },
    data: { balance: { decrement: price } },
  });

  const { distributeReferralRewards } = await import("../referral/referral.service.js");
  await distributeReferralRewards(payment.id).catch(() => {});

  const newBalance = clientDb.balance - price;
  return res.json({
    message: t(reqLang(req), "optionAppliedFromBalance"),
    paymentId: payment.id,
    newBalance,
  });
});

// ——— ЮMoney: пополнение баланса ———

clientRouter.get("/yoomoney/auth-url", async (req, res) => {
  const clientId = (req as unknown as { clientId: string }).clientId;
  const config = await getSystemConfig();
  const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
  if (!config.yoomoneyClientId?.trim() || !appUrl) {
    return res.status(503).json({ message: t(reqLang(req), "yoomoneyNotConfiguredOrNoUrl") });
  }
  const redirectUri = `${appUrl}/api/client/yoomoney/callback`;
  const state = yoomoneyStateSign(clientId);
  const url = getAuthUrl({ clientId: config.yoomoneyClientId, redirectUri, state });
  return res.json({ url });
});

const yoomoneyRequestTopupSchema = z.object({ amount: z.number().positive().max(1e7) });
clientRouter.post("/yoomoney/request-topup", async (req, res) => {
  const client = (req as unknown as { client: { id: string; yoomoneyAccessToken?: string | null } }).client;
  const parsed = yoomoneyRequestTopupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: t(reqLang(req), "specifyAmount"), errors: parsed.error.flatten() });
  const { amount } = parsed.data;
  if (!client.yoomoneyAccessToken?.trim()) {
    return res.status(400).json({ message: t(reqLang(req), "connectYoomoneyFirst") });
  }
  const config = await getSystemConfig();
  const receiver = config.yoomoneyReceiverWallet?.trim();
  if (!receiver) return res.status(503).json({ message: t(reqLang(req), "yoomoneyNotConfigured") });

  const serviceName = config.serviceName?.trim() || "STEALTHNET";
  const amountRounded = Math.round(amount * 100) / 100;
  const orderId = randomUUID();
  const payment = await prisma.payment.create({
    data: {
      clientId: client.id,
      orderId,
      amount: amountRounded,
      currency: "RUB",
      status: "PENDING",
      provider: "yoomoney",
      metadata: JSON.stringify({ type: "balance_topup" }),
    },
  });

  const result = await requestPayment(client.yoomoneyAccessToken, {
    to: receiver,
    amount_due: amountRounded,
    label: payment.id,
    message: t(reqLang(req), "balanceTopupMessage", { service: serviceName, orderId }),
    comment: t(reqLang(req), "balanceTopupComment"),
  });

  if (result.status === "refused") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return res.status(400).json({ message: result.error_description ?? result.error });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { metadata: JSON.stringify({ type: "balance_topup", request_id: result.request_id }) },
  });

  return res.json({
    paymentId: payment.id,
    request_id: result.request_id,
    money_source: result.money_source,
    contract_amount: result.contract_amount,
  });
});

const yoomoneyProcessPaymentSchema = z.object({
  paymentId: z.string().min(1),
  request_id: z.string().min(1),
  money_source: z.string().optional(),
  csc: z.string().max(10).optional(),
});
clientRouter.post("/yoomoney/process-payment", async (req, res) => {
  const client = (req as unknown as { client: { id: string; yoomoneyAccessToken?: string | null } }).client;
  const parsed = yoomoneyProcessPaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: t(reqLang(req), "invalidParams"), errors: parsed.error.flatten() });
  const { paymentId, request_id, money_source, csc } = parsed.data;

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, clientId: client.id, status: "PENDING", provider: "yoomoney" },
  });
  if (!payment) return res.status(404).json({ message: t(reqLang(req), "paymentNotFoundOrProcessed") });
  if (!client.yoomoneyAccessToken?.trim()) return res.status(400).json({ message: t(reqLang(req), "yoomoneyWalletNotConnected") });

  const result = await processPayment(client.yoomoneyAccessToken, { request_id, money_source, csc });

  if (result.status === "in_progress") {
    return res.status(202).json({ status: "in_progress", message: t(reqLang(req), "paymentInProgress") });
  }
  if (result.status === "ext_auth_required") {
    return res.status(200).json({ status: "ext_auth_required", acs_uri: result.acs_uri, acs_params: result.acs_params });
  }
  if (result.status === "refused") {
    return res.status(400).json({ message: result.error });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", paidAt: new Date(), externalId: result.payment_id ?? undefined },
  });
  const updated = await prisma.client.update({
    where: { id: client.id },
    data: { balance: { increment: payment.amount } },
    select: { balance: true },
  });

  return res.json({ message: t(reqLang(req), "balanceToppedUp"), newBalance: updated.balance });
});

// ——— ЮMoney: форма перевода (оплата картой). Пополнение баланса, тариф или опция ———
const yoomoneyFormPaymentSchema = z.object({
  amount: z.number().positive().max(1e7).optional(),
  paymentType: z.enum(["PC", "AC"]), // PC = с кошелька, AC = с карты
  tariffId: z.string().min(1).optional(),
  proxyTariffId: z.string().min(1).optional(),
  singboxTariffId: z.string().min(1).optional(),
  promoCode: z.string().max(50).optional(),
  extraOption: z.object({ kind: z.enum(["traffic", "devices", "servers"]), productId: z.string().min(1) }).optional(),
  customBuild: z.object({ days: z.number().int().min(1).max(360), devices: z.number().int().min(1).max(20), trafficGb: z.number().min(0).nullable().optional() }).optional(),
});
clientRouter.post("/yoomoney/create-form-payment", async (req, res) => {
  const clientId = (req as unknown as { clientId: string }).clientId;
  const parsed = yoomoneyFormPaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: t(reqLang(req), "specifyAmountAndMethod"), errors: parsed.error.flatten() });
  const { amount: amountBody, paymentType, tariffId: tariffIdBody, proxyTariffId: proxyTariffIdBody, singboxTariffId: singboxTariffIdBody, promoCode: promoCodeStr, extraOption, customBuild: customBuildBody } = parsed.data;
  const config = await getSystemConfig();
  const receiver = config.yoomoneyReceiverWallet?.trim();
  if (!receiver) return res.status(503).json({ message: t(reqLang(req), "yoomoneyNotConfigured") });

  let tariffIdToStore: string | null = null;
  let proxyTariffIdToStore: string | null = null;
  let singboxTariffIdToStore: string | null = null;
  let amountRounded: number;
  let metadataObj: Record<string, unknown> = { paymentType };
  let yoomoneyPromoRecord: PromoCodeRow | null = null;
  let yoomoneyOriginalAmount: number | null = null;

  if (customBuildBody) {
    const cfg = getCustomBuildConfig(config);
    if (!cfg) return res.status(400).json({ message: t(reqLang(req), "flexibleTariffDisabled") });
    let { days, devices, trafficGb } = customBuildBody;
    if (days > cfg.maxDays || devices > cfg.maxDevices) {
      return res.status(400).json({ message: t(reqLang(req), "daysDevicesLimit", { maxDays: cfg.maxDays, maxDevices: cfg.maxDevices }) });
    }
    const trafficLimitBytes =
      cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb >= 0
        ? Math.round(trafficGb * 1024 ** 3)
        : null;
    amountRounded = days * cfg.pricePerDay + devices * cfg.pricePerDevice;
    if (cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb > 0) amountRounded += trafficGb * cfg.pricePerGb;
    amountRounded = Math.round(amountRounded * 100) / 100;
    metadataObj = {
      paymentType,
      customBuild: {
        durationDays: days,
        deviceLimit: devices,
        trafficLimitBytes,
        internalSquadUuids: [cfg.squadUuid],
      },
    };
  } else if (extraOption) {
    if (!(config as { sellOptionsEnabled?: boolean }).sellOptionsEnabled) {
      return res.status(400).json({ message: t(reqLang(req), "optionsSalesDisabled") });
    }
    const cfg = config as {
      sellOptionsTrafficEnabled?: boolean; sellOptionsTrafficProducts?: SellOptionTrafficProduct[];
      sellOptionsDevicesEnabled?: boolean; sellOptionsDevicesProducts?: SellOptionDeviceProduct[];
      sellOptionsServersEnabled?: boolean; sellOptionsServersProducts?: SellOptionServerProduct[];
    };
    if (extraOption.kind === "traffic") {
      const product = cfg.sellOptionsTrafficEnabled && cfg.sellOptionsTrafficProducts?.find((p) => p.id === extraOption.productId);
      if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
      amountRounded = Math.round(product.price * 100) / 100;
      metadataObj = { paymentType, extraOption: { kind: "traffic", trafficBytes: Math.round(product.trafficGb * 1024 ** 3) } };
    } else if (extraOption.kind === "devices") {
      const product = cfg.sellOptionsDevicesEnabled && cfg.sellOptionsDevicesProducts?.find((p) => p.id === extraOption.productId);
      if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
      amountRounded = Math.round(product.price * 100) / 100;
      metadataObj = { paymentType, extraOption: { kind: "devices", deviceCount: product.deviceCount } };
    } else {
      const product = cfg.sellOptionsServersEnabled && cfg.sellOptionsServersProducts?.find((p) => p.id === extraOption.productId);
      if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
      amountRounded = Math.round(product.price * 100) / 100;
      metadataObj = {
        paymentType,
        extraOption: {
          kind: "servers",
          squadUuid: product.squadUuid,
          ...((product.trafficGb ?? 0) > 0 && { trafficBytes: Math.round((product.trafficGb ?? 0) * 1024 ** 3) }),
        },
      };
    }
  } else {
    if (amountBody == null && !proxyTariffIdBody && !singboxTariffIdBody) return res.status(400).json({ message: t(reqLang(req), "specifyAmount") });
    if (tariffIdBody) {
      const tariff = await prisma.tariff.findUnique({ where: { id: tariffIdBody } });
      if (!tariff) return res.status(400).json({ message: t(reqLang(req), "tariffNotFound") });
      tariffIdToStore = tariffIdBody;
      amountRounded = Math.round((amountBody ?? tariff.price) * 100) / 100;
      if (promoCodeStr?.trim()) {
        const result = await validatePromoCode(promoCodeStr.trim(), clientId, reqLang(req));
        if (result.ok && result.promo.type === "DISCOUNT") {
          const promo = result.promo;
          yoomoneyOriginalAmount = amountRounded;
          yoomoneyPromoRecord = promo;
          if (promo.discountPercent && promo.discountPercent > 0) amountRounded = Math.max(0, amountRounded - amountRounded * promo.discountPercent / 100);
          if (promo.discountFixed && promo.discountFixed > 0) amountRounded = Math.max(0, amountRounded - promo.discountFixed);
          amountRounded = Math.round(amountRounded * 100) / 100;
        }
      }
    } else if (proxyTariffIdBody) {
      const proxyTariff = await prisma.proxyTariff.findUnique({ where: { id: proxyTariffIdBody } });
      if (!proxyTariff || !proxyTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "proxyTariffNotFound") });
      proxyTariffIdToStore = proxyTariffIdBody;
      amountRounded = Math.round((amountBody ?? proxyTariff.price) * 100) / 100;
    } else if (singboxTariffIdBody) {
      const singboxTariff = await prisma.singboxTariff.findUnique({ where: { id: singboxTariffIdBody } });
      if (!singboxTariff || !singboxTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "singboxTariffNotFound") });
      singboxTariffIdToStore = singboxTariffIdBody;
      amountRounded = Math.round((amountBody ?? singboxTariff.price) * 100) / 100;
    } else {
      amountRounded = Math.round((amountBody ?? 0) * 100) / 100;
    }
  }

  if (amountRounded < 1) {
    return res.status(400).json({ message: t(reqLang(req), "minimumPaymentAmount1") });
  }

  if (yoomoneyPromoRecord != null && yoomoneyOriginalAmount != null) {
    metadataObj = { ...metadataObj, promoCodeId: yoomoneyPromoRecord.id, originalAmount: yoomoneyOriginalAmount };
  }

  const orderId = randomUUID();
  const payment = await prisma.payment.create({
    data: {
      clientId,
      orderId,
      amount: amountRounded,
      currency: "RUB",
      status: "PENDING",
      provider: "yoomoney_form",
      tariffId: tariffIdToStore,
      proxyTariffId: proxyTariffIdToStore,
      singboxTariffId: singboxTariffIdToStore,
      metadata: JSON.stringify(metadataObj),
    },
  });

  if (yoomoneyPromoRecord) {
    await prisma.promoCodeUsage.create({ data: { promoCodeId: yoomoneyPromoRecord.id, clientId } });
  }

  const serviceName = config.serviceName?.trim() || "STEALTHNET";
  const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
  const successURL = appUrl ? `${appUrl}/cabinet?yoomoney_form=success` : "";
  const _ymfLang = reqLang(req);
  const _ymfVars = { service: serviceName, orderId };
  const targets = tariffIdToStore
    ? t(_ymfLang, "payDescTariff", _ymfVars)
    : proxyTariffIdToStore
      ? t(_ymfLang, "payDescProxy", _ymfVars)
      : singboxTariffIdToStore
        ? t(_ymfLang, "payDescAccess", _ymfVars)
        : customBuildBody
          ? t(_ymfLang, "payDescFlexTariff", _ymfVars)
          : extraOption
            ? t(_ymfLang, "payDescOption", _ymfVars)
            : t(_ymfLang, "balanceTopupDescription", _ymfVars);
  const params = new URLSearchParams({
    receiver,
    "quickpay-form": "shop",
    targets,
    sum: String(amountRounded),
    paymentType,
    label: payment.id.slice(0, 64),
    successURL,
  });
  const paymentUrl = `https://yoomoney.ru/quickpay/confirm.xml?${params.toString()}`;

  return res.status(201).json({
    paymentId: payment.id,
    paymentUrl,
    form: {
      receiver,
      sum: amountRounded,
      label: payment.id,
      paymentType,
      successURL,
    },
    successURL,
  });
});

clientRouter.get("/yoomoney/form-payment/:paymentId", async (req, res) => {
  const clientId = (req as unknown as { clientId: string }).clientId;
  const paymentId = typeof req.params.paymentId === "string" ? req.params.paymentId : "";
  if (!paymentId) return res.status(400).json({ message: t(reqLang(req), "paymentIdRequired") });

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, clientId, status: "PENDING", provider: "yoomoney_form" },
    select: { id: true, amount: true, metadata: true },
  });
  if (!payment) return res.status(404).json({ message: t(reqLang(req), "paymentNotFoundOrPaid") });

  const config = await getSystemConfig();
  const receiver = config.yoomoneyReceiverWallet?.trim();
  if (!receiver) return res.status(503).json({ message: t(reqLang(req), "yoomoneyNotConfigured") });

  let paymentType = "PC";
  try {
    const meta = payment.metadata ? JSON.parse(payment.metadata) as { paymentType?: string } : {};
    if (meta.paymentType === "AC" || meta.paymentType === "PC") paymentType = meta.paymentType;
  } catch { /* ignore */ }

  const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
  const successURL = appUrl ? `${appUrl}/cabinet?yoomoney_form=success` : "";

  return res.json({
    receiver,
    sum: payment.amount,
    label: payment.id,
    paymentType,
    successURL,
  });
});

// ——— ЮKassa API: создание платежа (тариф, пополнение или опция), редирект на confirmation_url ———
const yookassaCreatePaymentSchema = z.object({
  amount: z.number().positive().max(1e7).optional(),
  currency: z.string().min(1).max(10).optional(),
  tariffId: z.string().min(1).optional(),
  proxyTariffId: z.string().min(1).optional(),
  singboxTariffId: z.string().min(1).optional(),
  promoCode: z.string().optional(),
  extraOption: z.object({
    kind: z.enum(["traffic", "devices", "servers"]),
    productId: z.string().min(1),
  }).optional(),
  customBuild: z.object({
    days: z.number().int().min(1).max(360),
    devices: z.number().int().min(1).max(20),
    trafficGb: z.number().min(0).nullable().optional(),
  }).optional(),
});
clientRouter.post("/yookassa/create-payment", async (req, res) => {
  try {
    const clientId = (req as unknown as { clientId: string }).clientId;
    const parsed = yookassaCreatePaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: t(reqLang(req), "invalidParams"), errors: parsed.error.flatten() });
    const { amount: amountBody, currency: currencyBody, tariffId: tariffIdBody, proxyTariffId: proxyTariffIdBody, singboxTariffId: singboxTariffIdBody, promoCode, extraOption, customBuild: customBuildBody } = parsed.data;
    const config = await getSystemConfig();
    const shopId = config.yookassaShopId?.trim();
    const secretKey = config.yookassaSecretKey?.trim();
    if (!shopId || !secretKey) return res.status(503).json({ message: t(reqLang(req), "yookassaNotConfigured") });

    let amountRounded: number;
    let currencyUpper: string;
    let tariffIdToStore: string | null = null;
    let proxyTariffIdToStore: string | null = null;
    let singboxTariffIdToStore: string | null = null;
    let metadataObj: Record<string, unknown> = promoCode ? { promoCode } : {};

    if (customBuildBody) {
      const cfg = getCustomBuildConfig(config);
      if (!cfg) return res.status(400).json({ message: t(reqLang(req), "flexibleTariffDisabled") });
      let { days, devices, trafficGb } = customBuildBody;
      if (days > cfg.maxDays || devices > cfg.maxDevices) {
        return res.status(400).json({ message: t(reqLang(req), "daysDevicesLimit", { maxDays: cfg.maxDays, maxDevices: cfg.maxDevices }) });
      }
      const trafficLimitBytes =
        cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb >= 0
          ? Math.round(trafficGb * 1024 ** 3)
          : null;
      amountRounded = days * cfg.pricePerDay + devices * cfg.pricePerDevice;
      if (cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb > 0) amountRounded += trafficGb * cfg.pricePerGb;
      amountRounded = Math.round(amountRounded * 100) / 100;
      currencyUpper = cfg.currency.toUpperCase();
      metadataObj = {
        customBuild: {
          durationDays: days,
          deviceLimit: devices,
          trafficLimitBytes,
          internalSquadUuids: [cfg.squadUuid],
        },
      };
      if (currencyUpper !== "RUB") return res.status(400).json({ message: t(reqLang(req), "yookassaRubOnly") });
    } else if (extraOption) {
      if (!(config as { sellOptionsEnabled?: boolean }).sellOptionsEnabled) {
        return res.status(400).json({ message: t(reqLang(req), "optionsSalesDisabled") });
      }
      const cfg = config as {
        sellOptionsTrafficEnabled?: boolean;
        sellOptionsTrafficProducts?: SellOptionTrafficProduct[];
        sellOptionsDevicesEnabled?: boolean;
        sellOptionsDevicesProducts?: SellOptionDeviceProduct[];
        sellOptionsServersEnabled?: boolean;
        sellOptionsServersProducts?: SellOptionServerProduct[];
      };
      if (extraOption.kind === "traffic") {
        const product = cfg.sellOptionsTrafficEnabled && cfg.sellOptionsTrafficProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "traffic", trafficBytes: Math.round(product.trafficGb * 1024 ** 3) } };
      } else if (extraOption.kind === "devices") {
        const product = cfg.sellOptionsDevicesEnabled && cfg.sellOptionsDevicesProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "devices", deviceCount: product.deviceCount } };
      } else {
        const product = cfg.sellOptionsServersEnabled && cfg.sellOptionsServersProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = {
        extraOption: {
          kind: "servers",
          squadUuid: product.squadUuid,
          ...((product.trafficGb ?? 0) > 0 && { trafficBytes: Math.round((product.trafficGb ?? 0) * 1024 ** 3) }),
        },
      };
      }
      if (currencyUpper !== "RUB") return res.status(400).json({ message: t(reqLang(req), "yookassaRubOnly") });
    } else {
      currencyUpper = (currencyBody ?? "RUB").toUpperCase();
      if (currencyUpper !== "RUB") return res.status(400).json({ message: t(reqLang(req), "yookassaRubOnly") });
      if (tariffIdBody) {
        const tariff = await prisma.tariff.findUnique({ where: { id: tariffIdBody } });
        if (!tariff) return res.status(400).json({ message: t(reqLang(req), "tariffNotFound") });
        tariffIdToStore = tariffIdBody;
        amountRounded = Math.round((amountBody ?? tariff.price) * 100) / 100;
      } else if (proxyTariffIdBody) {
        const proxyTariff = await prisma.proxyTariff.findUnique({ where: { id: proxyTariffIdBody } });
        if (!proxyTariff || !proxyTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "proxyTariffNotFound") });
        proxyTariffIdToStore = proxyTariffIdBody;
        amountRounded = Math.round((amountBody ?? proxyTariff.price) * 100) / 100;
      } else if (singboxTariffIdBody) {
        const singboxTariff = await prisma.singboxTariff.findUnique({ where: { id: singboxTariffIdBody } });
        if (!singboxTariff || !singboxTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "singboxTariffNotFound") });
        singboxTariffIdToStore = singboxTariffIdBody;
        amountRounded = Math.round((amountBody ?? singboxTariff.price) * 100) / 100;
    } else {
      if (amountBody == null) return res.status(400).json({ message: t(reqLang(req), "specifyAmount") });
      amountRounded = Math.round(amountBody * 100) / 100;
    }
  }

    if (amountRounded < 1) {
      return res.status(400).json({ message: t(reqLang(req), "minimumPaymentAmount1") });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { email: true },
    });
    const customerEmail = client?.email?.trim() || null;

    const orderId = randomUUID();
    const payment = await prisma.payment.create({
      data: {
        clientId,
        orderId,
        amount: amountRounded,
        currency: currencyUpper,
        status: "PENDING",
        provider: "yookassa",
        tariffId: tariffIdToStore,
        proxyTariffId: proxyTariffIdToStore,
        singboxTariffId: singboxTariffIdToStore,
        metadata: Object.keys(metadataObj).length > 0 ? JSON.stringify(metadataObj) : null,
      },
    });

    const serviceName = config.serviceName?.trim() || "STEALTHNET";
    const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
    const returnUrl = appUrl ? `${appUrl}/cabinet?yookassa=success` : "";
    const _ykLang = reqLang(req);
    const _ykVars = { service: serviceName, orderId };
    const description = tariffIdToStore
      ? t(_ykLang, "payDescTariff", _ykVars)
      : proxyTariffIdToStore
        ? t(_ykLang, "payDescProxy", _ykVars)
        : singboxTariffIdToStore
          ? t(_ykLang, "payDescAccess", _ykVars)
        : extraOption
          ? t(_ykLang, "payDescOption", _ykVars)
          : t(_ykLang, "balanceTopupDescription", _ykVars);

    const result = await createYookassaPayment({
      shopId,
      secretKey,
      amount: amountRounded,
      currency: currencyUpper,
      returnUrl,
      description,
      metadata: { payment_id: payment.id },
      customerEmail,
    });

    if (!result.ok) {
      await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
      return res.status(500).json({ message: result.error });
    }

    return res.status(201).json({
      paymentId: payment.id,
      confirmationUrl: result.confirmationUrl,
      yookassaPaymentId: result.paymentId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[yookassa/create-payment]", message, err);
    return res.status(500).json({ message: message || t(reqLang(req), "paymentCreationError") });
  }
});

const cryptopayCreatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().min(1).max(10).optional(),
  tariffId: z.string().min(1).optional(),
  proxyTariffId: z.string().min(1).optional(),
  singboxTariffId: z.string().min(1).optional(),
  promoCode: z.string().max(50).optional(),
  extraOption: z.object({
    kind: z.enum(["traffic", "devices", "servers"]),
    productId: z.string().min(1),
  }).optional(),
  customBuild: z.object({ days: z.number().int().min(1).max(360), devices: z.number().int().min(1).max(20), trafficGb: z.number().min(0).nullable().optional() }).optional(),
});
clientRouter.post("/cryptopay/create-payment", async (req, res) => {
  try {
    const clientId = (req as unknown as { clientId: string }).clientId;
    const parsed = cryptopayCreatePaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: t(reqLang(req), "invalidParams"), errors: parsed.error.flatten() });
    const config = await getSystemConfig();
    const cryptopayConfig = {
      apiToken: (config as { cryptopayApiToken?: string | null }).cryptopayApiToken ?? "",
      testnet: (config as { cryptopayTestnet?: boolean }).cryptopayTestnet ?? false,
    };
    if (!isCryptopayConfigured(cryptopayConfig)) return res.status(503).json({ message: t(reqLang(req), "cryptopayNotConfigured") });

    const { amount: amountBody, currency: currencyBody, tariffId: tariffIdBody, proxyTariffId: proxyTariffIdBody, singboxTariffId: singboxTariffIdBody, promoCode: promoCodeStr, extraOption, customBuild: customBuildBody } = parsed.data;
    let amountRounded: number;
    let currencyUpper: string;
    let tariffIdToStore: string | null = null;
    let proxyTariffIdToStore: string | null = null;
    let singboxTariffIdToStore: string | null = null;
    let metadataObj: Record<string, unknown> = promoCodeStr ? { promoCode: promoCodeStr } : {};

    if (customBuildBody) {
      const cfg = getCustomBuildConfig(config);
      if (!cfg) return res.status(400).json({ message: t(reqLang(req), "flexibleTariffDisabled") });
      let { days, devices, trafficGb } = customBuildBody;
      if (days > cfg.maxDays || devices > cfg.maxDevices) {
        return res.status(400).json({ message: t(reqLang(req), "daysDevicesLimit", { maxDays: cfg.maxDays, maxDevices: cfg.maxDevices }) });
      }
      const trafficLimitBytes =
        cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb >= 0
          ? Math.round(trafficGb * 1024 ** 3)
          : null;
      amountRounded = days * cfg.pricePerDay + devices * cfg.pricePerDevice;
      if (cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb > 0) amountRounded += trafficGb * cfg.pricePerGb;
      amountRounded = Math.round(amountRounded * 100) / 100;
      currencyUpper = cfg.currency.toUpperCase();
      metadataObj = {
        customBuild: {
          durationDays: days,
          deviceLimit: devices,
          trafficLimitBytes,
          internalSquadUuids: [cfg.squadUuid],
        },
      };
    } else if (extraOption) {
      const cfg = config as { sellOptionsEnabled?: boolean; sellOptionsTrafficEnabled?: boolean; sellOptionsTrafficProducts?: SellOptionTrafficProduct[]; sellOptionsDevicesEnabled?: boolean; sellOptionsDevicesProducts?: SellOptionDeviceProduct[]; sellOptionsServersEnabled?: boolean; sellOptionsServersProducts?: SellOptionServerProduct[] };
      if (!cfg.sellOptionsEnabled) return res.status(400).json({ message: t(reqLang(req), "optionsSalesDisabled") });
      if (extraOption.kind === "traffic") {
        const product = cfg.sellOptionsTrafficEnabled && cfg.sellOptionsTrafficProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "traffic", trafficBytes: Math.round(product.trafficGb * 1024 ** 3) } };
      } else if (extraOption.kind === "devices") {
        const product = cfg.sellOptionsDevicesEnabled && cfg.sellOptionsDevicesProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "devices", deviceCount: product.deviceCount } };
      } else {
        const product = cfg.sellOptionsServersEnabled && cfg.sellOptionsServersProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "servers", squadUuid: product.squadUuid, ...((product.trafficGb ?? 0) > 0 && { trafficBytes: Math.round((product.trafficGb ?? 0) * 1024 ** 3) }) } };
      }
    } else {
      currencyUpper = (currencyBody ?? "USD").toUpperCase();
      if (tariffIdBody) {
        const tariff = await prisma.tariff.findUnique({ where: { id: tariffIdBody } });
        if (!tariff) return res.status(400).json({ message: t(reqLang(req), "tariffNotFound") });
        tariffIdToStore = tariffIdBody;
        amountRounded = Math.round((amountBody ?? tariff.price) * 100) / 100;
      } else if (proxyTariffIdBody) {
        const proxyTariff = await prisma.proxyTariff.findUnique({ where: { id: proxyTariffIdBody } });
        if (!proxyTariff || !proxyTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "proxyTariffNotFound") });
        proxyTariffIdToStore = proxyTariffIdBody;
        amountRounded = Math.round((amountBody ?? proxyTariff.price) * 100) / 100;
      } else if (singboxTariffIdBody) {
        const singboxTariff = await prisma.singboxTariff.findUnique({ where: { id: singboxTariffIdBody } });
        if (!singboxTariff || !singboxTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "singboxTariffNotFound") });
        singboxTariffIdToStore = singboxTariffIdBody;
        amountRounded = Math.round((amountBody ?? singboxTariff.price) * 100) / 100;
      } else {
        if (amountBody == null) return res.status(400).json({ message: t(reqLang(req), "specifyAmount") });
        amountRounded = Math.round(amountBody * 100) / 100;
      }
    }

    const fiatSupported = ["USD", "RUB", "EUR", "UAH", "KZT", "BYN", "UZS", "GEL", "TRY", "AMD", "THB", "INR", "CNY", "GBP", "BRL", "IDR", "AZN", "AED", "PLN", "ILS"];
    if (!fiatSupported.includes(currencyUpper)) return res.status(400).json({ message: t(reqLang(req), "cryptopayCurrencyNotSupported") });
    if (amountRounded < 0.5) return res.status(400).json({ message: t(reqLang(req), "minimumAmount05") });

    const orderId = randomUUID();
    const payment = await prisma.payment.create({
      data: {
        clientId,
        orderId,
        amount: amountRounded,
        currency: currencyUpper,
        status: "PENDING",
        provider: "cryptopay",
        tariffId: tariffIdToStore,
        proxyTariffId: proxyTariffIdToStore,
        singboxTariffId: singboxTariffIdToStore,
        metadata: Object.keys(metadataObj).length > 0 ? JSON.stringify(metadataObj) : null,
      },
    });

    const serviceName = config.serviceName?.trim() || "STEALTHNET";
    const _cpLang = reqLang(req);
    const _cpVars = { service: serviceName, orderId };
    const description = tariffIdToStore
      ? t(_cpLang, "payDescTariff", _cpVars)
      : proxyTariffIdToStore
        ? t(_cpLang, "payDescProxy", _cpVars)
        : singboxTariffIdToStore
          ? t(_cpLang, "payDescAccess", _cpVars)
          : customBuildBody
            ? t(_cpLang, "payDescFlexTariff", _cpVars)
            : extraOption
              ? t(_cpLang, "payDescOption", _cpVars)
              : t(_cpLang, "balanceTopupDescription", _cpVars);

    const result = await createCryptopayInvoice({
      config: cryptopayConfig,
      amount: String(amountRounded),
      currencyType: "fiat",
      fiat: currencyUpper,
      description: description.slice(0, 1024),
      payload: payment.id,
    });

    if (!result.ok) {
      await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
      return res.status(500).json({ message: result.error });
    }

    return res.status(201).json({
      paymentId: payment.id,
      payUrl: result.payUrl,
      miniAppPayUrl: result.miniAppPayUrl,
      webAppPayUrl: result.webAppPayUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cryptopay/create-payment]", message, err);
    return res.status(500).json({ message: message || t(reqLang(req), "paymentCreationError") });
  }
});

const heleketCreatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().min(1).max(10).optional(),
  tariffId: z.string().min(1).optional(),
  proxyTariffId: z.string().min(1).optional(),
  singboxTariffId: z.string().min(1).optional(),
  promoCode: z.string().max(50).optional(),
  extraOption: z.object({
    kind: z.enum(["traffic", "devices", "servers"]),
    productId: z.string().min(1),
  }).optional(),
  customBuild: z.object({ days: z.number().int().min(1).max(360), devices: z.number().int().min(1).max(20), trafficGb: z.number().min(0).nullable().optional() }).optional(),
});
clientRouter.post("/heleket/create-payment", async (req, res) => {
  try {
    const clientId = (req as unknown as { clientId: string }).clientId;
    const parsed = heleketCreatePaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: t(reqLang(req), "invalidParams"), errors: parsed.error.flatten() });
    const config = await getSystemConfig();
    const heleketConfig = {
      merchantId: (config as { heleketMerchantId?: string | null }).heleketMerchantId ?? "",
      apiKey: (config as { heleketApiKey?: string | null }).heleketApiKey ?? "",
    };
    if (!isHeleketConfigured(heleketConfig)) return res.status(503).json({ message: t(reqLang(req), "heleketNotConfigured") });

    const { amount: amountBody, currency: currencyBody, tariffId: tariffIdBody, proxyTariffId: proxyTariffIdBody, singboxTariffId: singboxTariffIdBody, promoCode: promoCodeStr, extraOption, customBuild: customBuildBody } = parsed.data;
    let amountRounded: number;
    let currencyUpper: string;
    let tariffIdToStore: string | null = null;
    let proxyTariffIdToStore: string | null = null;
    let singboxTariffIdToStore: string | null = null;
    let metadataObj: Record<string, unknown> = promoCodeStr ? { promoCode: promoCodeStr } : {};

    if (customBuildBody) {
      const cfg = getCustomBuildConfig(config);
      if (!cfg) return res.status(400).json({ message: t(reqLang(req), "flexibleTariffDisabled") });
      let { days, devices, trafficGb } = customBuildBody;
      if (days > cfg.maxDays || devices > cfg.maxDevices) {
        return res.status(400).json({ message: t(reqLang(req), "daysDevicesLimit", { maxDays: cfg.maxDays, maxDevices: cfg.maxDevices }) });
      }
      const trafficLimitBytes =
        cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb >= 0
          ? Math.round(trafficGb * 1024 ** 3)
          : null;
      amountRounded = days * cfg.pricePerDay + devices * cfg.pricePerDevice;
      if (cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb > 0) amountRounded += trafficGb * cfg.pricePerGb;
      amountRounded = Math.round(amountRounded * 100) / 100;
      currencyUpper = cfg.currency.toUpperCase();
      metadataObj = {
        customBuild: {
          durationDays: days,
          deviceLimit: devices,
          trafficLimitBytes,
          internalSquadUuids: [cfg.squadUuid],
        },
      };
    } else if (extraOption) {
      const cfg = config as { sellOptionsEnabled?: boolean; sellOptionsTrafficEnabled?: boolean; sellOptionsTrafficProducts?: SellOptionTrafficProduct[]; sellOptionsDevicesEnabled?: boolean; sellOptionsDevicesProducts?: SellOptionDeviceProduct[]; sellOptionsServersEnabled?: boolean; sellOptionsServersProducts?: SellOptionServerProduct[] };
      if (!cfg.sellOptionsEnabled) return res.status(400).json({ message: t(reqLang(req), "optionsSalesDisabled") });
      if (extraOption.kind === "traffic") {
        const product = cfg.sellOptionsTrafficEnabled && cfg.sellOptionsTrafficProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "traffic", trafficBytes: Math.round(product.trafficGb * 1024 ** 3) } };
      } else if (extraOption.kind === "devices") {
        const product = cfg.sellOptionsDevicesEnabled && cfg.sellOptionsDevicesProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "devices", deviceCount: product.deviceCount } };
      } else {
        const product = cfg.sellOptionsServersEnabled && cfg.sellOptionsServersProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "servers", squadUuid: product.squadUuid, ...((product.trafficGb ?? 0) > 0 && { trafficBytes: Math.round((product.trafficGb ?? 0) * 1024 ** 3) }) } };
      }
    } else {
      currencyUpper = (currencyBody ?? "USD").toUpperCase();
      if (tariffIdBody) {
        const tariff = await prisma.tariff.findUnique({ where: { id: tariffIdBody } });
        if (!tariff) return res.status(400).json({ message: t(reqLang(req), "tariffNotFound") });
        tariffIdToStore = tariffIdBody;
        amountRounded = Math.round((amountBody ?? tariff.price) * 100) / 100;
      } else if (proxyTariffIdBody) {
        const proxyTariff = await prisma.proxyTariff.findUnique({ where: { id: proxyTariffIdBody } });
        if (!proxyTariff || !proxyTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "proxyTariffNotFound") });
        proxyTariffIdToStore = proxyTariffIdBody;
        amountRounded = Math.round((amountBody ?? proxyTariff.price) * 100) / 100;
      } else if (singboxTariffIdBody) {
        const singboxTariff = await prisma.singboxTariff.findUnique({ where: { id: singboxTariffIdBody } });
        if (!singboxTariff || !singboxTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "singboxTariffNotFound") });
        singboxTariffIdToStore = singboxTariffIdBody;
        amountRounded = Math.round((amountBody ?? singboxTariff.price) * 100) / 100;
      } else {
        if (amountBody == null) return res.status(400).json({ message: t(reqLang(req), "specifyAmount") });
        amountRounded = Math.round(amountBody * 100) / 100;
      }
    }

    if (amountRounded < 1) return res.status(400).json({ message: t(reqLang(req), "minimumPaymentAmount1") });

    const orderId = randomUUID();
    const payment = await prisma.payment.create({
      data: {
        clientId,
        orderId,
        amount: amountRounded,
        currency: currencyUpper,
        status: "PENDING",
        provider: "heleket",
        tariffId: tariffIdToStore,
        proxyTariffId: proxyTariffIdToStore,
        singboxTariffId: singboxTariffIdToStore,
        metadata: Object.keys(metadataObj).length > 0 ? JSON.stringify(metadataObj) : null,
      },
    });

    const serviceName = config.serviceName?.trim() || "STEALTHNET";
    const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
    const urlCallback = appUrl ? `${appUrl}/api/webhooks/heleket` : undefined;
    const urlSuccess = appUrl ? `${appUrl}/cabinet?heleket=success` : undefined;
    const urlReturn = appUrl ? `${appUrl}/cabinet?heleket=return` : undefined;

    const result = await createHeleketInvoice({
      config: heleketConfig,
      amount: String(amountRounded),
      currency: currencyUpper,
      orderId,
      urlCallback,
      urlSuccess,
      urlReturn,
      additionalData: payment.id,
      lifetime: 3600,
      toCurrency: "usdt",
    });

    if (!result.ok) {
      await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
      return res.status(500).json({ message: result.error });
    }

    return res.status(201).json({
      paymentId: payment.id,
      payUrl: result.url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[heleket/create-payment]", message, err);
    return res.status(500).json({ message: message || t(reqLang(req), "paymentCreationError") });
  }
});

/* ==================== ePay (易支付) ==================== */
const epayCreatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().min(1).max(10).optional(),
  tariffId: z.string().min(1).optional(),
  proxyTariffId: z.string().min(1).optional(),
  singboxTariffId: z.string().min(1).optional(),
  promoCode: z.string().max(50).optional(),
  type: z.string().max(20).optional(),
  extraOption: z.object({
    kind: z.enum(["traffic", "devices", "servers"]),
    productId: z.string().min(1),
  }).optional(),
  customBuild: z.object({ days: z.number().int().min(1).max(360), devices: z.number().int().min(1).max(20), trafficGb: z.number().min(0).nullable().optional() }).optional(),
});
clientRouter.post("/epay/create-payment", async (req, res) => {
  try {
    const clientId = (req as unknown as { clientId: string }).clientId;
    const parsed = epayCreatePaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: t(reqLang(req), "invalidParams"), errors: parsed.error.flatten() });
    const config = await getSystemConfig();
    const epayConfig = {
      pid: (config as { epayPid?: string | null }).epayPid ?? "",
      key: (config as { epayKey?: string | null }).epayKey ?? "",
      apiUrl: (config as { epayApiUrl?: string | null }).epayApiUrl ?? "",
    };
    if (!isEpayConfigured(epayConfig)) return res.status(503).json({ message: t(reqLang(req), "epayNotConfigured") });

    const { amount: amountBody, currency: currencyBody, tariffId: tariffIdBody, proxyTariffId: proxyTariffIdBody, singboxTariffId: singboxTariffIdBody, promoCode: promoCodeStr, type: epayType, extraOption, customBuild: customBuildBody } = parsed.data;
    let amountRounded: number;
    let currencyUpper: string;
    let tariffIdToStore: string | null = null;
    let proxyTariffIdToStore: string | null = null;
    let singboxTariffIdToStore: string | null = null;
    let metadataObj: Record<string, unknown> = promoCodeStr ? { promoCode: promoCodeStr } : {};

    if (customBuildBody) {
      const cfg = getCustomBuildConfig(config);
      if (!cfg) return res.status(400).json({ message: t(reqLang(req), "flexibleTariffDisabled") });
      let { days, devices, trafficGb } = customBuildBody;
      if (days > cfg.maxDays || devices > cfg.maxDevices) {
        return res.status(400).json({ message: t(reqLang(req), "daysDevicesLimit", { maxDays: cfg.maxDays, maxDevices: cfg.maxDevices }) });
      }
      const trafficLimitBytes =
        cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb >= 0
          ? Math.round(trafficGb * 1024 ** 3)
          : null;
      amountRounded = days * cfg.pricePerDay + devices * cfg.pricePerDevice;
      if (cfg.trafficMode === "per_gb" && trafficGb != null && trafficGb > 0) amountRounded += trafficGb * cfg.pricePerGb;
      amountRounded = Math.round(amountRounded * 100) / 100;
      currencyUpper = cfg.currency.toUpperCase();
      metadataObj = {
        customBuild: {
          durationDays: days,
          deviceLimit: devices,
          trafficLimitBytes,
          internalSquadUuids: [cfg.squadUuid],
        },
      };
    } else if (extraOption) {
      const cfg = config as { sellOptionsEnabled?: boolean; sellOptionsTrafficEnabled?: boolean; sellOptionsTrafficProducts?: SellOptionTrafficProduct[]; sellOptionsDevicesEnabled?: boolean; sellOptionsDevicesProducts?: SellOptionDeviceProduct[]; sellOptionsServersEnabled?: boolean; sellOptionsServersProducts?: SellOptionServerProduct[] };
      if (!cfg.sellOptionsEnabled) return res.status(400).json({ message: t(reqLang(req), "optionsSalesDisabled") });
      if (extraOption.kind === "traffic") {
        const product = cfg.sellOptionsTrafficEnabled && cfg.sellOptionsTrafficProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "traffic", trafficBytes: Math.round(product.trafficGb * 1024 ** 3) } };
      } else if (extraOption.kind === "devices") {
        const product = cfg.sellOptionsDevicesEnabled && cfg.sellOptionsDevicesProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "devices", deviceCount: product.deviceCount } };
      } else {
        const product = cfg.sellOptionsServersEnabled && cfg.sellOptionsServersProducts?.find((p) => p.id === extraOption.productId);
        if (!product) return res.status(400).json({ message: t(reqLang(req), "optionNotFound") });
        amountRounded = Math.round(product.price * 100) / 100;
        currencyUpper = product.currency.toUpperCase();
        metadataObj = { extraOption: { kind: "servers", squadUuid: product.squadUuid, ...((product.trafficGb ?? 0) > 0 && { trafficBytes: Math.round((product.trafficGb ?? 0) * 1024 ** 3) }) } };
      }
    } else {
      currencyUpper = (currencyBody ?? "USD").toUpperCase();
      if (tariffIdBody) {
        const tariff = await prisma.tariff.findUnique({ where: { id: tariffIdBody } });
        if (!tariff) return res.status(400).json({ message: t(reqLang(req), "tariffNotFound") });
        tariffIdToStore = tariffIdBody;
        amountRounded = Math.round((amountBody ?? tariff.price) * 100) / 100;
      } else if (proxyTariffIdBody) {
        const proxyTariff = await prisma.proxyTariff.findUnique({ where: { id: proxyTariffIdBody } });
        if (!proxyTariff || !proxyTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "proxyTariffNotFound") });
        proxyTariffIdToStore = proxyTariffIdBody;
        amountRounded = Math.round((amountBody ?? proxyTariff.price) * 100) / 100;
      } else if (singboxTariffIdBody) {
        const singboxTariff = await prisma.singboxTariff.findUnique({ where: { id: singboxTariffIdBody } });
        if (!singboxTariff || !singboxTariff.enabled) return res.status(400).json({ message: t(reqLang(req), "singboxTariffNotFound") });
        singboxTariffIdToStore = singboxTariffIdBody;
        amountRounded = Math.round((amountBody ?? singboxTariff.price) * 100) / 100;
      } else {
        if (amountBody == null) return res.status(400).json({ message: t(reqLang(req), "specifyAmount") });
        amountRounded = Math.round(amountBody * 100) / 100;
      }
    }

    if (amountRounded < 0.01) return res.status(400).json({ message: t(reqLang(req), "minimumAmount001") });

    const orderId = randomUUID();
    const payment = await prisma.payment.create({
      data: {
        clientId,
        orderId,
        amount: amountRounded,
        currency: currencyUpper,
        status: "PENDING",
        provider: "epay",
        tariffId: tariffIdToStore,
        proxyTariffId: proxyTariffIdToStore,
        singboxTariffId: singboxTariffIdToStore,
        metadata: Object.keys(metadataObj).length > 0 ? JSON.stringify(metadataObj) : null,
      },
    });

    const serviceName = config.serviceName?.trim() || "STEALTHNET";
    const appUrl = (config.publicAppUrl || "").replace(/\/$/, "");
    if (!appUrl) {
      await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
      return res.status(503).json({ message: t(reqLang(req), "publicAppUrlNotSet") });
    }
    const notifyUrl = `${appUrl}/api/webhooks/epay`;
    const returnUrl = `${appUrl}/cabinet?epay=success`;

    console.log(`[epay/create-payment] orderId=${orderId} type=${epayType || "(收银台)"} money=${amountRounded.toFixed(2)}`);

    // 使用 submit.php 页面跳转方式（比 mapi.php 更可靠，尤其支付宝 H5 场景）
    // submit.php 不接受 clientip / device 参数，收银台自动适配设备
    const result = buildEpaySubmitUrl({
      config: epayConfig,
      outTradeNo: orderId,
      notifyUrl,
      returnUrl,
      name: serviceName,
      money: amountRounded.toFixed(2),
      type: epayType || undefined,
      param: payment.id,
    });

    if (!result.ok) {
      console.warn(`[epay/create-payment] FAILED orderId=${orderId}:`, result.error);
      await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
      return res.status(500).json({ message: result.error });
    }

    console.log(`[epay/create-payment] OK orderId=${orderId} payUrl=${result.payUrl}`);
    return res.status(201).json({
      paymentId: payment.id,
      payUrl: result.payUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[epay/create-payment]", message, err);
    return res.status(500).json({ message: message || t(reqLang(req), "paymentCreationError") });
  }
});

const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string()
  })).max(50),
});

clientRouter.post("/ai/chat", async (req, res) => {
  try {
    const client = (req as unknown as { client: { id: string; remnawaveUuid: string | null } }).client;

    const parsed = aiChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: t(reqLang(req), "invalidMessageFormat"), errors: parsed.error.flatten() });
    }

    const config = await getSystemConfig();
    const publicConfig = await getPublicConfig();
    if ((publicConfig as { aiChatEnabled?: boolean }).aiChatEnabled === false) {
      return res.status(403).json({ message: t(reqLang(req), "aiChatDisabled") });
    }

    const apiKey = (config as { groqApiKey?: string | null }).groqApiKey?.trim();
    if (!apiKey) {
      // Заглушка, если API ключ не настроен
      return res.json({
        reply: t(reqLang(req), "aiNotConfigured")
      });
    }

    const primaryModel = (config as { groqModel?: string | null }).groqModel?.trim() || "llama3-8b-8192";
    const fallback1 = (config as { groqFallback1?: string | null }).groqFallback1?.trim();
    const fallback2 = (config as { groqFallback2?: string | null }).groqFallback2?.trim();
    const fallback3 = (config as { groqFallback3?: string | null }).groqFallback3?.trim();
    
    const modelsToTry = [primaryModel];
    if (fallback1) modelsToTry.push(fallback1);
    if (fallback2) modelsToTry.push(fallback2);
    if (fallback3) modelsToTry.push(fallback3);

    const systemPromptText = (config as { aiSystemPrompt?: string | null }).aiSystemPrompt?.trim() || "你是一位优秀的VPN服务技术支持经理。你的目标是礼貌、快速、准确地帮助用户解决VPN设置、套餐和技术问题。请简洁明了地回复。";

    const vpnTariffs = await prisma.tariff.findMany({ orderBy: { price: 'asc' } });
    const proxyTariffs = await prisma.proxyTariff.findMany({ where: { enabled: true }, orderBy: { price: 'asc' } });
    const singboxTariffs = await prisma.singboxTariff.findMany({ where: { enabled: true }, orderBy: { price: 'asc' } });

    let tariffsContext = "\n\n当前套餐信息：\n当用户询问价格时，请务必只使用以下套餐信息回答。\n";
    if (vpnTariffs.length > 0) tariffsContext += "VPN 套餐：" + vpnTariffs.map(t => `${t.name}（${t.price} ${t.currency.toUpperCase()}/${t.durationDays}天）`).join("、") + "。\n";
    if (proxyTariffs.length > 0) tariffsContext += "代理套餐：" + proxyTariffs.map(t => `${t.name}（${t.price} ${t.currency.toUpperCase()}/${t.durationDays}天）`).join("、") + "。\n";
    if (singboxTariffs.length > 0) tariffsContext += "Sing-box 套餐：" + singboxTariffs.map(t => `${t.name}（${t.price} ${t.currency.toUpperCase()}/${t.durationDays}天）`).join("、") + "。\n";

    const paymentMethods = [];
    if (publicConfig.yookassaEnabled) paymentMethods.push("YooKassa（银行卡、SBP等）");
    if (publicConfig.yoomoneyEnabled) paymentMethods.push("YooMoney（钱包、银行卡）");
    if (publicConfig.cryptopayEnabled) paymentMethods.push("Crypto Pay（Telegram 加密货币）");
    if (publicConfig.heleketEnabled) paymentMethods.push("Heleket（加密货币）");
    if (publicConfig.plategaMethods && publicConfig.plategaMethods.length > 0) {
      paymentMethods.push("Platega（" + publicConfig.plategaMethods.map(m => m.label).join("、") + "）");
    }
    if ((publicConfig as any).epayEnabled) paymentMethods.push("ePay（支付宝、微信支付）");

    let paymentContext = "\n\n网站可用支付方式：\n";
    if (paymentMethods.length > 0) {
      paymentContext += "用户可通过以下方式付款：\n- " + paymentMethods.join("\n- ") + "\n当用户询问如何付款时，只列出以上方式。不要编造列表中没有的支付方式。\n";
    } else {
      paymentContext += "目前网站尚未配置自动支付方式。\n";
    }

    const instructionsContext = `\n\nVPN 连接教程：
当用户询问如何连接或设置 VPN 时，请严格按照以下步骤回答（不要自行编造其他方法）：
1. 在网站个人中心点击"设置 VPN"按钮。
2. 选择你的设备平台，下载推荐的应用程序。
3. 返回网站，点击"添加订阅"按钮（会自动将配置导入应用）或扫描二维码。

回答用户订阅与限额问题的规则：
当用户询问"我的套餐是什么"、"还剩多少天"、"流量限额是多少"、"能连几台设备"、"余额多少"等问题时，务必使用下方"当前用户信息"中的数据回答。绝对不要说找不到信息，直接读取数据并回复用户即可。\n`;

    let userInfoContext = "\n\n当前用户信息：\n当用户询问自己的订阅或限额时，请使用以下数据回答。如果显示没有某项服务，请直接告知用户。\n";
    try {
      const dbClient = await prisma.client.findUnique({
        where: { id: client.id },
        include: {
          proxySlots: { where: { status: 'ACTIVE' }, include: { proxyTariff: true } },
          singboxSlots: { where: { status: 'ACTIVE' }, include: { singboxTariff: true } }
        }
      });
      
      userInfoContext += `- 余额：${dbClient?.balance || 0} ${(dbClient?.preferredCurrency || 'usd').toUpperCase()}\n`;

      let vpnInfo = "用户当前没有有效的 VPN 订阅";
      if (client.remnawaveUuid) {
        const u = await remnaGetUser(client.remnawaveUuid);
        if (u && !u.error && u.data) {
          const exp = extractCurrentExpireAt(u.data);
          if (exp && exp > new Date()) {
             const resp = ((u.data as any).response ?? (u.data as any).data ?? u.data) as any;
             const tLimitRaw = resp?.trafficLimitBytes ?? resp?.trafficLimit;
             const tLimit = (tLimitRaw != null && tLimitRaw > 0) ? (Number(tLimitRaw) / 1024**3).toFixed(2) + " GB" : "无限制";
             const tUsedRaw = resp?.trafficUsedBytes ?? resp?.trafficUsed;
             const tUsed = tUsedRaw != null ? (Number(tUsedRaw) / 1024**3).toFixed(2) + " GB" : "0 GB";
             const dLimitRaw = resp?.hwidDeviceLimit ?? resp?.deviceLimit;
             const dLimit = (dLimitRaw != null && dLimitRaw > 0) ? dLimitRaw : "无限制";
             vpnInfo = `有效期至 ${exp.toISOString().split('T')[0]}，流量：${tUsed} / ${tLimit}，设备限制：${dLimit}`;
          }
        }
      }
      userInfoContext += `- VPN：${vpnInfo}\n`;
      
      if (dbClient?.proxySlots?.length) {
        userInfoContext += `- 代理：${dbClient.proxySlots.map((s: any) => `${s.proxyTariff?.name || '插槽'}（到期 ${s.expiresAt.toISOString().split('T')[0]}）`).join('、')}\n`;
      } else {
        userInfoContext += `- 代理：用户没有代理服务\n`;
      }
      
      if (dbClient?.singboxSlots?.length) {
        userInfoContext += `- Sing-box：${dbClient.singboxSlots.map((s: any) => `${s.singboxTariff?.name || '插槽'}（到期 ${s.expiresAt.toISOString().split('T')[0]}）`).join('、')}\n`;
      } else {
        userInfoContext += `- Sing-box：用户没有 Sing-box 订阅\n`;
      }
    } catch (e) {
      console.error("[ai/chat] Error fetching user info:", e);
    }

    const systemPrompt = systemPromptText + tariffsContext + paymentContext + instructionsContext + userInfoContext;

    const messages = [
      { role: "system", content: systemPrompt },
      ...parsed.data.messages
    ];

    let lastErrorDetails = "";
    let lastStatus = 500;

    for (const model of modelsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.5,
            max_tokens: 1024,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (groqRes.ok) {
          const data = await groqRes.json() as any;
          const reply = data.choices?.[0]?.message?.content || t(reqLang(req), "aiNoResponse");
          return res.json({ reply });
        }

        // Если ошибка (например, 429 Rate Limit), пробуем следующую модель
        const errText = await groqRes.text().catch(() => "");
        console.error(`[ai/chat] Groq error (model: ${model}):`, groqRes.status, errText);
        lastStatus = groqRes.status;
        lastErrorDetails = errText;
        
        // Если это не 429 Rate Limit или 5xx, возможно стоит прервать, но лучше попробовать следующую
      } catch (err) {
        console.error(`[ai/chat] Network/Abort error with model ${model}:`, err);
        lastErrorDetails = err instanceof Error ? err.message : String(err);
      }
    }

    // Если все модели не сработали
    return res.status(502).json({ message: t(reqLang(req), "aiServiceError"), details: lastErrorDetails });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ai/chat]", message, err);
    return res.status(500).json({ message: t(reqLang(req), "internalServerError") });
  }
});

clientRouter.get("/payments", async (req, res) => {
  const clientId = (req as unknown as { clientId: string }).clientId;
  const payments = await prisma.payment.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, orderId: true, amount: true, currency: true, status: true, createdAt: true, paidAt: true },
  });
  return res.json({
    items: payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      paidAt: p.paidAt?.toISOString() ?? null,
    })),
  });
});

// ——— Тикеты (доступны только при включённой тикет-системе в настройках)
async function ensureTicketsEnabled(req: import("express").Request, res: import("express").Response): Promise<boolean> {
  const config = await getPublicConfig();
  if (!config?.ticketsEnabled) {
    res.status(404).json({ message: t(reqLang(req), "ticketSystemDisabled") });
    return false;
  }
  return true;
}

const createTicketSchema = z.object({ subject: z.string().min(1).max(500), message: z.string().min(1).max(10000) });
clientRouter.post("/tickets", async (req, res) => {
  if (!(await ensureTicketsEnabled(req, res))) return;
  const clientId = (req as unknown as { client: { id: string } }).client.id;
  const body = createTicketSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  const ticket = await prisma.ticket.create({
    data: {
      clientId,
      subject: body.data.subject.trim(),
      status: "needs_reply",
      messages: {
        create: { authorType: "client", content: body.data.message.trim() },
      },
    },
    include: { messages: true },
  });
  notifyAdminsAboutNewTicket({
    ticketId: ticket.id,
    clientId,
    subject: ticket.subject,
    firstMessage: body.data.message.trim(),
  }).catch(() => {});
  return res.status(201).json({
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    messages: ticket.messages.map((m) => ({ id: m.id, authorType: m.authorType, content: m.content, imageUrl: m.imageUrl, createdAt: m.createdAt.toISOString() })),
  });
});

clientRouter.get("/tickets/unread-count", async (req, res) => {
  if (!(await ensureTicketsEnabled(req, res))) return;
  const clientId = (req as unknown as { client: { id: string } }).client.id;
  const count = await prisma.ticketMessage.count({
    where: {
      ticket: { clientId },
      authorType: "support",
      isRead: false,
    },
  });
  return res.json({ count });
});

clientRouter.get("/tickets", async (req, res) => {
  if (!(await ensureTicketsEnabled(req, res))) return;
  const clientId = (req as unknown as { client: { id: string } }).client.id;
  const list = await prisma.ticket.findMany({
    where: { clientId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, subject: true, status: true, createdAt: true, updatedAt: true },
  });
  return res.json({
    items: list.map((t) => ({ id: t.id, subject: t.subject, status: t.status, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })),
  });
});

clientRouter.get("/tickets/:id", async (req, res) => {
  if (!(await ensureTicketsEnabled(req, res))) return;
  const clientId = (req as unknown as { client: { id: string } }).client.id;
  const ticket = await prisma.ticket.findFirst({
    where: { id: req.params.id, clientId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) return res.status(404).json({ message: t(reqLang(req), "ticketNotFound") });

  // Mark support messages as read
  await prisma.ticketMessage.updateMany({
    where: { ticketId: ticket.id, authorType: "support", isRead: false },
    data: { isRead: true },
  });

  return res.json({
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    messages: ticket.messages.map((m) => ({ id: m.id, authorType: m.authorType, content: m.content, imageUrl: m.imageUrl, createdAt: m.createdAt.toISOString(), isRead: m.isRead })),
  });
});

const replyTicketSchema = z.object({ content: z.string().min(1).max(10000) });
clientRouter.post("/tickets/:id/messages", async (req, res) => {
  if (!(await ensureTicketsEnabled(req, res))) return;
  const clientId = (req as unknown as { client: { id: string } }).client.id;
  const body = replyTicketSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  const ticket = await prisma.ticket.findFirst({ where: { id: req.params.id, clientId } });
  if (!ticket) return res.status(404).json({ message: t(reqLang(req), "ticketNotFound") });
  const msg = await prisma.ticketMessage.create({
    data: { ticketId: ticket.id, authorType: "client", content: body.data.content.trim() },
  });
  // Mark ticket as needs_reply so admin sees it requires attention
  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "needs_reply", updatedAt: new Date() } });
  notifyAdminsAboutClientTicketMessage({
    ticketId: ticket.id,
    clientId,
    content: body.data.content.trim(),
  }).catch(() => {});
  return res.status(201).json({ id: msg.id, authorType: msg.authorType, content: msg.content, createdAt: msg.createdAt.toISOString() });
});

// ——— Ticket image upload ———
const TICKET_UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "tickets");
const ticketImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

clientRouter.post("/tickets/:id/upload-image", ticketImageUpload.single("image"), async (req, res) => {
  if (!(await ensureTicketsEnabled(req, res))) return;
  const clientId = (req as unknown as { client: { id: string } }).client.id;
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) return res.status(400).json({ message: "No image file provided" });
  const ticket = await prisma.ticket.findFirst({ where: { id: req.params.id, clientId } });
  if (!ticket) return res.status(404).json({ message: t(reqLang(req), "ticketNotFound") });

  // Save file to disk
  await mkdir(TICKET_UPLOADS_DIR, { recursive: true });
  const ext = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${ticket.id}_${Date.now()}_${randomBytes(4).toString("hex")}.${ext}`;
  const filePath = path.join(TICKET_UPLOADS_DIR, filename);
  await writeFile(filePath, file.buffer);

  const imageUrl = `/api/uploads/tickets/${filename}`;

  // Create a message with the image
  const msg = await prisma.ticketMessage.create({
    data: { ticketId: ticket.id, authorType: "client", content: "", imageUrl },
  });
  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "needs_reply", updatedAt: new Date() } });
  notifyAdminsAboutClientTicketMessage({
    ticketId: ticket.id,
    clientId,
    content: "[图片]",
  }).catch(() => {});
  return res.status(201).json({ id: msg.id, authorType: msg.authorType, content: msg.content, imageUrl: msg.imageUrl, createdAt: msg.createdAt.toISOString() });
});

// Публичный конфиг для бота, mini app, сайта (без паролей и секретов)
export const publicConfigRouter = Router();
publicConfigRouter.get("/config", async (_req, res) => {
  const config = await getPublicConfig();
  return res.json(config);
});

/**
 * Промежуточная страница для диплинков: открывается через Telegram.WebApp.openLink() в системном браузере,
 * который уже может обработать кастомную URL-схему (happ://, stash://, v2rayng:// и т.д.).
 * В Telegram Mini App WebView кастомные схемы заблокированы — это единственный рабочий обходной путь.
 */
publicConfigRouter.get("/deeplink", (req, res) => {
  const url = typeof req.query.url === "string" ? req.query.url : "";
  if (!url) return res.status(400).send("Missing url parameter");
  const langRaw = typeof req.query.lang === "string" ? req.query.lang.trim().toLowerCase() : "";
  const lang = langRaw === "en" || langRaw === "zh" ? langRaw : "ru";
  const skipAuto = req.query.skip_auto === "1" || req.query.skip_auto === "true";
  const safeUrl = url.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeUrlJs = url.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r");
  const dict = {
    ru: {
      title: "Открытие приложения…",
      opening: "Открываем приложение…",
      openButton: "Открыть приложение",
      description: "Если приложение не открылось — нажмите кнопку выше.<br>Ссылка подписки скопирована в буфер обмена.",
      androidHint: "На Android или в Telegram на ПК: если страница открылась внутри Telegram, зайдите в Настройки → Чаты → «Открывать ссылки во внешнем браузере» и нажмите кнопку ещё раз.",
    },
    en: {
      title: "Opening app…",
      opening: "Opening the app…",
      openButton: "Open app",
      description: "If the app didn’t open, tap the button above.<br>Your subscription link has been copied to the clipboard.",
      androidHint: "On Android or Telegram Desktop: if this page opened inside Telegram, go to Settings → Chat Settings → “Open links in external browser” and tap the button again.",
    },
    zh: {
      title: "正在打开应用…",
      opening: "正在打开应用…",
      openButton: "打开应用",
      description: "如果应用没有自动打开，请点击上方按钮。<br>订阅链接已经复制到剪贴板。",
      androidHint: "在 Android 或 Telegram 桌面版中：如果此页面仍在 Telegram 内打开，请前往 设置 → 聊天设置 →“在外部浏览器中打开链接”，然后再次点击按钮。",
    },
  } as const;
  const text = dict[lang];
  const autoRedirectScript = skipAuto
    ? "/* skip_auto: только кнопка, без авто-редиректа (из мини-аппа) */"
    : `setTimeout(function(){ try { window.location.href = "${safeUrlJs}"; } catch (e) {} }, 300);`;
  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${text.title}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0d1117;color:#e6edf3;padding:16px;box-sizing:border-box}
  .btn{display:inline-block;margin-top:24px;padding:14px 32px;background:#2ea043;color:#fff;border:none;border-radius:12px;font-size:17px;text-decoration:none;cursor:pointer}
  .btn:active{opacity:.85}
  .sub{margin-top:16px;font-size:13px;color:#8b949e;max-width:90%;text-align:center;word-break:break-all}
  .hint{margin-top:12px;font-size:12px;color:#8b949e;max-width:90%;text-align:center}
</style>
</head><body>
<p>${text.opening}</p>
<a class="btn" href="${safeUrl}" id="open">${text.openButton}</a>
<p class="sub">${text.description}</p>
<p class="hint" id="androidHint" style="display:none">${text.androidHint}</p>
<script>
  (function(){
    var ua = navigator.userAgent || "";
    if (/Android|Windows|tdesktop/i.test(ua)) document.getElementById("androidHint").style.display = "block";
    ${autoRedirectScript}
  })();
</script>
</body></html>`;
  res.type("html").send(html);
});

/** Привязка Telegram к аккаунту по коду (вызывается ботом после /link КОД) */
const linkTelegramFromBotSchema = z.object({
  code: z.string().min(1),
  telegramId: z.number(),
  telegramUsername: z.string().optional(),
});
publicConfigRouter.post("/link-telegram-from-bot", async (req, res) => {
  const config = await getSystemConfig();
  const botToken = (config.telegramBotToken ?? "").trim();
  const headerToken = typeof req.headers["x-telegram-bot-token"] === "string" ? req.headers["x-telegram-bot-token"].trim() : "";
  if (!botToken || headerToken !== botToken) return res.status(401).json({ message: t(reqLang(req), "unauthorized") });
  const body = linkTelegramFromBotSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: t(reqLang(req), "invalidInput"), errors: body.error.flatten() });
  const { code, telegramId, telegramUsername } = body.data;
  const tid = String(telegramId);
  const pending = await prisma.pendingTelegramLink.findUnique({ where: { code: code.trim() } });
  if (!pending) return res.status(400).json({ message: t(reqLang(req), "invalidOrExpiredCode") });
  if (new Date() > pending.expiresAt) {
    await prisma.pendingTelegramLink.deleteMany({ where: { id: pending.id } }).catch(() => {});
    return res.status(400).json({ message: t(reqLang(req), "codeExpiredRequestNew") });
  }
  const other = await prisma.client.findUnique({ where: { telegramId: tid } });
  if (other && other.id !== pending.clientId) {
    // Перепривязка: снимаем Telegram с другого аккаунта (часто пустой из бота), затем привязываем к аккаунту с кодом
    await prisma.client.update({
      where: { id: other.id },
      data: { telegramId: null, telegramUsername: null },
    });
  }
  await prisma.client.update({
    where: { id: pending.clientId },
    data: { telegramId: tid, telegramUsername: (telegramUsername ?? "").trim() || null },
  });
  await prisma.pendingTelegramLink.deleteMany({ where: { id: pending.id } }).catch(() => {});
  return res.json({ message: t(reqLang(req), "telegramLinked") });
});

/** Конфиг страницы подписки (приложения по платформам, тексты) — для кабинета /cabinet/subscribe */
publicConfigRouter.get("/subscription-page", async (_req, res) => {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: "subscription_page_config" },
    });
    if (!row?.value) return res.json(null);
    const parsed = JSON.parse(row.value) as unknown;
    return res.json(parsed);
  } catch {
    return res.json(null);
  }
});

function tariffToJson(t: { id: string; name: string; description: string | null; durationDays: number; internalSquadUuids: string[]; trafficLimitBytes: bigint | null; deviceLimit: number | null; price: number; currency: string; trafficResetStrategy?: string; subGroupId?: string | null }) {
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? null,
    durationDays: t.durationDays,
    trafficLimitBytes: t.trafficLimitBytes != null ? Number(t.trafficLimitBytes) : null,
    deviceLimit: t.deviceLimit,
    price: t.price,
    currency: t.currency,
    trafficResetStrategy: t.trafficResetStrategy ?? "NO_RESET",
    subGroupId: (t as Record<string, unknown>).subGroupId ?? null,
  };
}

publicConfigRouter.get("/tariffs", async (req, res) => {
  try {
    const config = await getSystemConfig();
    const categoryEmojis = config.categoryEmojis ?? { ordinary: "📦", premium: "⭐" };
    const list = await prisma.tariffCategory.findMany({
      where: { visible: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        tariffs: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        subGroups: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      },
    });
    return res.json({
      items: list.map((c) => {
        const emoji = (c.emojiKey && categoryEmojis[c.emojiKey]) ? categoryEmojis[c.emojiKey] : "";
        return {
          id: c.id,
          name: c.name,
          emojiKey: c.emojiKey ?? null,
          emoji,
          tariffs: c.tariffs.map(tariffToJson),
          subGroups: c.subGroups.map((sg) => ({
            id: sg.id,
            name: sg.name,
            sortOrder: sg.sortOrder,
          })),
        };
      }),
    });
  } catch (e) {
    console.error("GET /public/tariffs error:", e);
    return res.status(500).json({ message: t(reqLang(req), "errorLoadingTariffs") });
  }
});

// GET /api/public/proxy-tariffs — публичный список тарифов прокси (для бота и кабинета)
publicConfigRouter.get("/proxy-tariffs", async (req, res) => {
  try {
    const list = await prisma.proxyCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { tariffs: { where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });
    return res.json({
      items: list.map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sortOrder,
        tariffs: c.tariffs.map((t) => ({
          id: t.id,
          name: t.name,
          proxyCount: t.proxyCount,
          durationDays: t.durationDays,
          trafficLimitBytes: t.trafficLimitBytes?.toString() ?? null,
          connectionLimit: t.connectionLimit,
          price: t.price,
          currency: t.currency,
        })),
      })),
    });
  } catch (e) {
    console.error("GET /public/proxy-tariffs error:", e);
    return res.status(500).json({ message: t(reqLang(req), "errorLoadingProxyTariffs") });
  }
});

// GET /api/public/singbox-tariffs — публичный список тарифов Sing-box (для бота и кабинета)
publicConfigRouter.get("/singbox-tariffs", async (req, res) => {
  try {
    const list = await prisma.singboxCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { tariffs: { where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });
    return res.json({
      items: list.map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sortOrder,
        tariffs: c.tariffs.map((t) => ({
          id: t.id,
          name: t.name,
          slotCount: t.slotCount,
          durationDays: t.durationDays,
          trafficLimitBytes: t.trafficLimitBytes?.toString() ?? null,
          price: t.price,
          currency: t.currency,
        })),
      })),
    });
  } catch (e) {
    console.error("GET /public/singbox-tariffs error:", e);
    return res.status(500).json({ message: t(reqLang(req), "errorLoadingSingboxTariffs") });
  }
});

// ——————————————— Traffic usage (via Remnawave bandwidth-stats API) ———————————————

import { remnaGetUserBandwidthStats } from "../remna/remna.client.js";

/** GET /api/client/traffic-log?days=30 */
clientRouter.get("/traffic-log", async (req, res) => {
  const client = (req as any).client as { id: string; remnawaveUuid: string | null };
  if (!client.remnawaveUuid) {
    return res.json({ logs: [] });
  }

  const days = Math.min(parseInt(String(req.query.days ?? "7"), 10) || 7, 365);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  const result = await remnaGetUserBandwidthStats(client.remnawaveUuid, startStr, endStr);
  if (result.error || !result.data) {
    return res.json({ logs: [] });
  }

  const resp = (result.data as any)?.response ?? result.data;
  const categories: string[] = resp?.categories ?? [];
  const sparklineData: number[] = resp?.sparklineData ?? [];
  const topNodes: any[] = (resp?.topNodes ?? []).map((n: any) => ({
    uuid: n.uuid ?? "",
    name: n.name ?? "",
    countryCode: n.countryCode ?? "",
    total: Number(n.total ?? 0),
  }));
  const series: any[] = (resp?.series ?? []).map((s: any) => ({
    uuid: s.uuid ?? "",
    name: s.name ?? "",
    countryCode: s.countryCode ?? "",
    total: Number(s.total ?? 0),
    data: (s.data ?? []).map((v: any) => Number(v)),
  }));

  // Convert Remnawave format (categories + sparklineData) to per-day log entries
  const logs = categories.map((dateStr: string, i: number) => {
    const totalBytes = sparklineData[i] ?? 0;
    return {
      date: dateStr,
      usedBytes: String(totalBytes),
      uploadBytes: "0",
      downloadBytes: String(totalBytes),
      source: "vpn",
    };
  });

  return res.json({ logs, topNodes, series, categories });
});

/** GET /api/client/traffic-summary — 月度流量汇总 */
clientRouter.get("/traffic-summary", async (req, res) => {
  const client = (req as any).client as { id: string; remnawaveUuid: string | null };
  if (!client.remnawaveUuid) {
    const now = new Date();
    return res.json({
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      totalUsedBytes: "0",
      totalUploadBytes: "0",
      totalDownloadBytes: "0",
      bySource: {},
      daysLogged: 0,
    });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startStr = startOfMonth.toISOString().split("T")[0];
  const endStr = now.toISOString().split("T")[0];

  const result = await remnaGetUserBandwidthStats(client.remnawaveUuid, startStr, endStr);
  const resp = (result.data as any)?.response ?? result.data;
  const sparklineData: number[] = resp?.sparklineData ?? [];

  const totalUsed = sparklineData.reduce((s: number, v: number) => s + v, 0);

  return res.json({
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    totalUsedBytes: String(totalUsed),
    totalUploadBytes: "0",
    totalDownloadBytes: String(totalUsed),
    bySource: { vpn: { usedBytes: String(totalUsed), uploadBytes: "0", downloadBytes: String(totalUsed) } },
    daysLogged: sparklineData.filter((v: number) => v > 0).length,
  });
});

// ═══════════════════════════════════════════════════════════════
// ──── Публичные объявления и активности ──────────────────────
// ═══════════════════════════════════════════════════════════════

/** GET /api/public/announcements — опубликованные объявления */
publicConfigRouter.get("/announcements", async (_req, res) => {
  const items = await prisma.announcement.findMany({
    where: { published: true },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    select: { id: true, title: true, content: true, pinned: true, publishedAt: true, createdAt: true },
  });
  return res.json(items);
});

/** GET /api/public/announcements/:id */
publicConfigRouter.get("/announcements/:id", async (req, res) => {
  const item = await prisma.announcement.findFirst({
    where: { id: req.params.id, published: true },
    select: { id: true, title: true, content: true, pinned: true, publishedAt: true, createdAt: true },
  });
  if (!item) return res.status(404).json({ message: "Not found" });
  return res.json(item);
});
