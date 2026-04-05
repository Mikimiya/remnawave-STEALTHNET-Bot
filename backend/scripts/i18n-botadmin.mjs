import { readFileSync, writeFileSync } from "fs";
const file = "src/modules/bot-admin/bot-admin.routes.ts";
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
  // Find the first export or const after imports
  const idx = code.indexOf("\nexport ");
  if (idx > 0) {
    code = code.slice(0, idx) +
      '\nfunction adminLang(req: import("express").Request): string {\n  const h = req.headers["accept-language"];\n  return h ? h.slice(0, 2) : "en";\n}\n' +
      code.slice(idx);
  }
}

const replacements = [
  ['"Клиент не найден"', 't(adminLang(req), "clientNotFound")'],
  ['"Клиент не привязан к Remna"', 't(adminLang(req), "clientNotLinkedToRemna")'],
  ['"Укажите текст сообщения или приложите фото."', 't(adminLang(req), "specifyMessageOrPhoto")'],
  ['"Токен бота не настроен."', 't(adminLang(req), "botTokenNotConfigured")'],
  ['"Не удалось скачать фото из Telegram."', 't(adminLang(req), "failedToDownloadPhoto")'],
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
