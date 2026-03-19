/**
 * 手动创建一个客户端账号（绕过邮件验证）。
 * 用法：
 *   CLIENT_EMAIL=test@example.com CLIENT_PASSWORD=Test1234! tsx src/scripts/seed-client.ts
 * 或直接修改下方默认值后运行：
 *   tsx src/scripts/seed-client.ts
 */

import "dotenv/config";
import { prisma } from "../db.js";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const email    = process.env.CLIENT_EMAIL    ?? "client@coolgo.network";
const password = process.env.CLIENT_PASSWORD ?? "Client2026!";
const lang     = process.env.CLIENT_LANG     ?? "zh";

function genReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return Array.from(bytes).map((b) => alphabet[b % alphabet.length]).join("");
}

async function seed() {
  const existing = await prisma.client.findUnique({ where: { email } });
  if (existing) {
    console.log("✅ 账号已存在:", email);
    console.log("   ID:", existing.id);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const referralCode = genReferralCode();

  const client = await prisma.client.create({
    data: {
      email,
      passwordHash,
      referralCode,
      preferredLang: lang,
      preferredCurrency: "usd",
    },
  });

  console.log("✅ 客户端账号已创建！");
  console.log("   邮箱:  ", email);
  console.log("   密码:  ", password);
  console.log("   语言:  ", lang);
  console.log("   ID:    ", client.id);
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ 错误:", e);
  process.exit(1);
});
