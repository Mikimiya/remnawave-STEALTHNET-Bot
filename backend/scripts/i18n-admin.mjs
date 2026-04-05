import { readFileSync, writeFileSync } from "fs";
const file = "src/modules/admin/admin.routes.ts";
let code = readFileSync(file, "utf8");
const original = code;

// Add import
if (!code.includes('from "../../i18n/index.js"')) {
  code = code.replace(
    /^(import .+\n)+/m,
    (m) => m + 'import { t } from "../../i18n/index.js";\n'
  );
}

// Add adminLang helper after imports
if (!code.includes("function adminLang(")) {
  const importEnd = code.lastIndexOf('import {');
  const lineEnd = code.indexOf('\n', code.indexOf('\n', importEnd) + 1);
  code = code.slice(0, lineEnd + 1) +
    '\nfunction adminLang(req: import("express").Request): string {\n  const h = req.headers["accept-language"];\n  return h ? h.slice(0, 2) : "en";\n}\n' +
    code.slice(lineEnd + 1);
}

const replacements = [
  ['"Таблицы тарифов не найдены. Выполните в папке backend: npx prisma db push"', 't(adminLang(req), "tariffTablesNotFound")'],
  ['"Ошибка загрузки категорий тарифов"', 't(adminLang(req), "errorLoadingTariffCategories")'],
  ['"Неверные данные"', 't(adminLang(req), "invalidData")'],
  ['"Категория не найдена"', 't(adminLang(req), "categoryNotFound")'],
  ['"Клиент не найден"', 't(adminLang(req), "clientNotFound")'],
  ['"Клиент не привязан к Remna"', 't(adminLang(req), "clientNotLinkedToRemna")'],
  ['"Ошибка загрузки клиентов. Выполните: cd backend && npx prisma db push"', 't(adminLang(req), "errorLoadingClients")'],
  ['"Пароль установлен"', 't(adminLang(req), "passwordSet")'],
  ['"Тикет не найден"', 't(adminLang(req), "ticketNotFound")'],
  ['"Промокод с таким кодом уже существует"', 't(adminLang(req), "promoCodeAlreadyExists")'],
];

let count = 0;
for (const [from, to] of replacements) {
  while (code.includes(from)) {
    code = code.replace(from, to);
    count++;
  }
}

if (code !== original) {
  writeFileSync(file, code, "utf8");
  console.log(`Done: ${count} replacements`);
} else {
  console.log("No changes");
}
