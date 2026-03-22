/**
 * Отправка писем через SMTP (подтверждение регистрации по email)
 */

import nodemailer from "nodemailer";

export type MailLocale = "ru" | "en" | "zh";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  password: string | null;
  fromEmail: string | null;
  fromName: string | null;
};

export function isSmtpConfigured(config: SmtpConfig): boolean {
  return Boolean(
    config.host &&
    config.port &&
    config.fromEmail
  );
}

function resolveMailLocale(lang?: string | null): MailLocale {
  const normalized = (lang ?? "").trim().toLowerCase();
  if (normalized === "en") return "en";
  if (normalized === "zh") return "zh";
  return "ru";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmailHtml(lines: string[]): string {
  return lines.map((line) => `<p>${line}</p>`).join("\n");
}

function getVerificationEmailContent(serviceName: string, verificationLink: string, lang?: string | null): { subject: string; html: string } {
  const locale = resolveMailLocale(lang);
  const safeServiceName = escapeHtml(serviceName);
  const safeLink = escapeHtml(verificationLink);

  if (locale === "zh") {
    return {
      subject: `注册确认 - ${serviceName}`,
      html: renderEmailHtml([
        "您好！",
        `请点击下方链接完成 ${safeServiceName} 的注册：`,
        `<a href="${safeLink}">${safeLink}</a>`,
        "该链接将在 24 小时后失效。",
        "如果这不是您的操作，请直接忽略这封邮件。",
      ]),
    };
  }

  if (locale === "en") {
    return {
      subject: `Confirm your registration - ${serviceName}`,
      html: renderEmailHtml([
        "Hello!",
        `To finish registering for ${safeServiceName}, please open the link below:`,
        `<a href="${safeLink}">${safeLink}</a>`,
        "This link is valid for 24 hours.",
        "If you did not request this, you can safely ignore this email.",
      ]),
    };
  }

  return {
    subject: `Подтверждение регистрации — ${serviceName}`,
    html: renderEmailHtml([
      "Здравствуйте!",
      `Для завершения регистрации в ${safeServiceName} перейдите по ссылке:`,
      `<a href="${safeLink}">${safeLink}</a>`,
      "Ссылка действительна 24 часа.",
      "Если вы не регистрировались, проигнорируйте это письмо.",
    ]),
  };
}

function getLinkEmailVerificationContent(serviceName: string, verificationLink: string, lang?: string | null): { subject: string; html: string } {
  const locale = resolveMailLocale(lang);
  const safeServiceName = escapeHtml(serviceName);
  const safeLink = escapeHtml(verificationLink);

  if (locale === "zh") {
    return {
      subject: `邮箱绑定确认 - ${serviceName}`,
      html: renderEmailHtml([
        "您好！",
        `请点击下方链接，将此邮箱绑定到您在 ${safeServiceName} 的账号：`,
        `<a href="${safeLink}">${safeLink}</a>`,
        "该链接将在 24 小时后失效。",
        "如果这不是您发起的请求，请直接忽略这封邮件。",
      ]),
    };
  }

  if (locale === "en") {
    return {
      subject: `Confirm email linking - ${serviceName}`,
      html: renderEmailHtml([
        "Hello!",
        `To link this email to your ${safeServiceName} account, please open the link below:`,
        `<a href="${safeLink}">${safeLink}</a>`,
        "This link is valid for 24 hours.",
        "If you did not request this, you can safely ignore this email.",
      ]),
    };
  }

  return {
    subject: `Привязка почты к аккаунту — ${serviceName}`,
    html: renderEmailHtml([
      "Здравствуйте!",
      `Для привязки этой почты к вашему аккаунту в ${safeServiceName} перейдите по ссылке:`,
      `<a href="${safeLink}">${safeLink}</a>`,
      "Ссылка действительна 24 часа.",
      "Если вы не запрашивали привязку, проигнорируйте это письмо.",
    ]),
  };
}

function getPasswordResetEmailContent(serviceName: string, resetLink: string, lang?: string | null): { subject: string; html: string } {
  const locale = resolveMailLocale(lang);
  const safeServiceName = escapeHtml(serviceName);
  const safeLink = escapeHtml(resetLink);

  if (locale === "zh") {
    return {
      subject: `重置密码 - ${serviceName}`,
      html: renderEmailHtml([
        "您好！",
        `我们收到了一个为 ${safeServiceName} 账号重置密码的请求。请点击下方链接继续：`,
        `<a href="${safeLink}">${safeLink}</a>`,
        "该链接将在 1 小时后失效，并且只能使用一次。",
        "如果这不是您发起的请求，请直接忽略这封邮件，您的密码不会被修改。",
      ]),
    };
  }

  if (locale === "en") {
    return {
      subject: `Reset your password - ${serviceName}`,
      html: renderEmailHtml([
        "Hello!",
        `We received a request to reset the password for your ${safeServiceName} account. Open the link below to continue:`,
        `<a href="${safeLink}">${safeLink}</a>`,
        "This link is valid for 1 hour and can only be used once.",
        "If you did not request this, you can safely ignore this email and your password will stay unchanged.",
      ]),
    };
  }

  return {
    subject: `Сброс пароля — ${serviceName}`,
    html: renderEmailHtml([
      "Здравствуйте!",
      `Мы получили запрос на сброс пароля для аккаунта ${safeServiceName}. Перейдите по ссылке ниже, чтобы продолжить:`,
      `<a href="${safeLink}">${safeLink}</a>`,
      "Ссылка действует 1 час и может быть использована только один раз.",
      "Если это были не вы, просто проигнорируйте письмо — пароль не изменится.",
    ]),
  };
}

/**
 * Отправить письмо с ссылкой для подтверждения регистрации
 */
export async function sendVerificationEmail(
  config: SmtpConfig,
  to: string,
  verificationLink: string,
  serviceName: string,
  lang?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpConfigured(config)) {
    return { ok: false, error: "SMTP not configured" };
  }

  const auth = config.user && config.password ? { user: config.user, pass: config.password } : undefined;
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const from = config.fromName
    ? `"${config.fromName}" <${config.fromEmail}>`
    : config.fromEmail!;

  const { subject, html } = getVerificationEmailContent(serviceName, verificationLink, lang);

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/**
 * Письмо для привязки email к существующему аккаунту (клиент уже залогинен по Telegram)
 */
export async function sendLinkEmailVerification(
  config: SmtpConfig,
  to: string,
  verificationLink: string,
  serviceName: string,
  lang?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpConfigured(config)) {
    return { ok: false, error: "SMTP not configured" };
  }

  const auth = config.user && config.password ? { user: config.user, pass: config.password } : undefined;
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const from = config.fromName
    ? `"${config.fromName}" <${config.fromEmail}>`
    : config.fromEmail!;

  const { subject, html } = getLinkEmailVerificationContent(serviceName, verificationLink, lang);

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function sendPasswordResetEmail(
  config: SmtpConfig,
  to: string,
  resetLink: string,
  serviceName: string,
  lang?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpConfigured(config)) {
    return { ok: false, error: "SMTP not configured" };
  }

  const auth = config.user && config.password ? { user: config.user, pass: config.password } : undefined;
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const from = config.fromName
    ? `"${config.fromName}" <${config.fromEmail}>`
    : config.fromEmail!;

  const { subject, html } = getPasswordResetEmailContent(serviceName, resetLink, lang);

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export type EmailAttachment = { filename: string; content: Buffer };

/**
 * Отправить произвольное письмо (для рассылки). Опционально — вложения.
 */
export async function sendEmail(
  config: SmtpConfig,
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpConfigured(config)) {
    return { ok: false, error: "SMTP not configured" };
  }

  const auth = config.user && config.password ? { user: config.user, pass: config.password } : undefined;
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const from = config.fromName
    ? `"${config.fromName}" <${config.fromEmail}>`
    : config.fromEmail!;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      ...(attachments?.length ? { attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })) } : {}),
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
