/**
 * Bulk i18n replacement script for template-literal messages in client.routes.ts
 * Run: node backend/scripts/i18n-replace-tpl.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const FILE = "backend/src/modules/client/client.routes.ts";
let src = readFileSync(FILE, "utf8");

// Template literal replacements
const tplReplacements = [
  // Days/devices limits (multiple occurrences)
  [
    /message: `Дни: 1–\$\{cfg\.maxDays\}, устройств: 1–\$\{cfg\.maxDevices\}`/g,
    'message: t(reqLang(req), "daysDevicesLimit", { maxDays: cfg.maxDays, maxDevices: cfg.maxDevices })',
  ],
  [
    /message: `Days: 1–\$\{cfg\.maxDays\}, devices: 1–\$\{cfg\.maxDevices\}`/g,
    'message: t(reqLang(req), "daysDevicesLimit", { maxDays: cfg.maxDays, maxDevices: cfg.maxDevices })',
  ],
  // Insufficient funds
  [
    /message: `Недостаточно средств\. Баланс: \$\{clientDb\.balance\.toFixed\(2\)\}, нужно: \$\{tariff\.price\.toFixed\(2\)\}`/g,
    'message: t(reqLang(req), "insufficientFunds", { balance: clientDb.balance.toFixed(2), needed: tariff.price.toFixed(2) })',
  ],
  [
    /message: `Недостаточно средств\. Баланс: \$\{clientDb\.balance\.toFixed\(2\)\}, нужно: \$\{finalPrice\.toFixed\(2\)\}`/g,
    'message: t(reqLang(req), "insufficientFunds", { balance: clientDb.balance.toFixed(2), needed: finalPrice.toFixed(2) })',
  ],
  [
    /message: `Недостаточно средств\. Баланс: \$\{clientDb\.balance\.toFixed\(2\)\}, нужно: \$\{price\.toFixed\(2\)\}`/g,
    'message: t(reqLang(req), "insufficientFunds", { balance: clientDb.balance.toFixed(2), needed: price.toFixed(2) })',
  ],
  [
    /message: `Недостаточно средств\. Баланс: \$\{clientDb\.balance\.toFixed\(2\)\}, нужно: \$\{finalPrice\.toFixed\(2\)\} \$\{cfg\.currency\.toUpperCase\(\)\}`/g,
    'message: t(reqLang(req), "insufficientFunds", { balance: clientDb.balance.toFixed(2), needed: `${finalPrice.toFixed(2)} ${cfg.currency.toUpperCase()}` })',
  ],
  // Proxy paid from balance
  [
    /message: `Прокси «\$\{tariff\.name\}» оплачены! Списано \$\{tariff\.price\.toFixed\(2\)\} \$\{tariff\.currency\.toUpperCase\(\)\} с баланса\.`/g,
    'message: t(reqLang(req), "proxyPaidFromBalance", { name: tariff.name, amount: tariff.price.toFixed(2), currency: tariff.currency.toUpperCase() })',
  ],
  // Singbox paid from balance
  [
    /message: `Доступы «\$\{tariff\.name\}» оплачены! Списано \$\{tariff\.price\.toFixed\(2\)\} \$\{tariff\.currency\.toUpperCase\(\)\} с баланса\.`/g,
    'message: t(reqLang(req), "singboxPaidFromBalance", { name: tariff.name, amount: tariff.price.toFixed(2), currency: tariff.currency.toUpperCase() })',
  ],
  // Tariff activated from balance
  [
    /message: `Тариф «\$\{tariff\.name\}» активирован! Списано \$\{finalPrice\.toFixed\(2\)\} \$\{tariff\.currency\.toUpperCase\(\)\} с баланса\.`/g,
    'message: t(reqLang(req), "tariffActivatedFromBalance", { name: tariff.name, amount: finalPrice.toFixed(2), currency: tariff.currency.toUpperCase() })',
  ],
  // Custom build activated
  [
    /message: `Подписка на \$\{days\} дн\., \$\{devices\} \$\{devices === 1 \? "устройство" : "устройства"\} активирована\. Списано \$\{finalPrice\.toFixed\(2\)\} \$\{cfg\.currency\.toUpperCase\(\)\}\.`/g,
    'message: t(reqLang(req), "customBuildActivated", { days, devices, amount: finalPrice.toFixed(2), currency: cfg.currency.toUpperCase() })',
  ],
  // Promo activated with days
  [
    /message: `Промокод активирован! Подписка на \$\{promo\.durationDays\} дн\. подключена\.`/g,
    'message: t(reqLang(req), "promoActivatedWithDays", { days: promo.durationDays })',
  ],
];

let count = 0;
for (const [regex, replacement] of tplReplacements) {
  const matches = src.match(regex);
  if (matches) {
    count += matches.length;
    console.log(`  ✓ [${matches.length}x] ${regex.source.slice(0, 60)}...`);
    src = src.replace(regex, replacement);
  }
}

console.log(`\nTotal template-literal replacements: ${count}`);
writeFileSync(FILE, src, "utf8");
console.log("✅ File updated successfully.");
