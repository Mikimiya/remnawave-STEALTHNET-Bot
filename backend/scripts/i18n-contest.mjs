import { readFileSync, writeFileSync } from "fs";
const file = "src/modules/contest/contest.admin.routes.ts";
let code = readFileSync(file, "utf8");
const original = code;

// Add import
if (!code.includes('from "../../i18n/index.js"')) {
  code = code.replace(
    /^(import .+\n)+/m,
    (m) => m + 'import { t } from "../../i18n/index.js";\n'
  );
}

// Add adminLang helper
if (!code.includes("function adminLang(")) {
  const idx = code.indexOf("\nexport ");
  if (idx > 0) {
    code = code.slice(0, idx) +
      '\nfunction adminLang(req: import("express").Request): string {\n  const h = req.headers["accept-language"];\n  return h ? h.slice(0, 2) : "en";\n}\n' +
      code.slice(idx);
  }
}

const replacements = [
  ['"Конкурс не найден"', 't(adminLang(req), "contestNotFound")'],
  ['"Неверные данные"', 't(adminLang(req), "invalidData")'],
  ['"Укажите status"', 't(adminLang(req), "specifyStatus")'],
  ['"Конкурс запущен, уведомление отправлено"', 't(adminLang(req), "contestLaunchedNotificationSent")'],
  ['"Розыгрыш проведён"', 't(adminLang(req), "drawCompleted")'],
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
