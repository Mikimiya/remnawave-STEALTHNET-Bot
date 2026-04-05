/**
 * Роуты бэкапа: создание (сохранение на диск + скачивание), список, скачивание, восстановление
 */

import { Request, Response } from "express";
import multer from "multer";
import { t } from "../../i18n/index.js";
import {
  parseDatabaseUrl,
  runPgRestore,
  saveBackupToFile,
  listBackups,
  createBackupReadStream,
  readBackupFile,
} from "./backup.service.js";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

function adminLang(req: Request): string {
  return req.headers["accept-language"]?.slice(0, 2) ?? "en";
}

export function registerBackupRoutes(
  router: import("express").Router,
  asyncRoute: (fn: (req: Request, res: Response) => Promise<void | Response>) => (req: Request, res: Response, next: () => void) => void
) {
  /** GET /api/admin/backup/create — создаёт бэкап на диск (по дням) и отдаёт файл на скачивание */
  router.get("/backup/create", asyncRoute(async (req, res) => {
    const url = process.env.DATABASE_URL;
    if (!url) return res.status(503).json({ message: t(adminLang(req), "databaseUrlNotSet") });
    const db = parseDatabaseUrl(url);
    if (!db) return res.status(503).json({ message: t(adminLang(req), "invalidDatabaseUrl") });
    try {
      const { relativePath, filename, fullPath } = await saveBackupToFile(db);
      const st = await stat(fullPath);
      res.setHeader("Content-Type", "application/sql");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", String(st.size));
      createReadStream(fullPath).pipe(res);
    } catch (e) {
      console.error("Backup create error:", e);
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ message: t(adminLang(req), "backupCreationError"), error: msg });
    }
  }));

  /** GET /api/admin/backup/list — список сохранённых бэкапов */
  router.get("/backup/list", asyncRoute(async (req, res) => {
    try {
      const items = await listBackups();
      return res.json({ items });
    } catch (e) {
      console.error("Backup list error:", e);
      return res.status(500).json({ message: t(adminLang(req), "backupListError") });
    }
  }));

  /** GET /api/admin/backup/download?path=YYYY/MM/DD/filename.sql — скачать бэкап с сервера */
  router.get("/backup/download", asyncRoute(async (req, res) => {
    const pathParam = req.query.path as string | undefined;
    if (!pathParam || typeof pathParam !== "string") {
      return res.status(400).json({ message: t(adminLang(req), "specifyBackupPath") });
    }
    const stream = createBackupReadStream(pathParam);
    if (!stream) return res.status(404).json({ message: t(adminLang(req), "backupNotFound") });
    const filename = pathParam.split("/").pop() || "backup.sql";
    res.setHeader("Content-Type", "application/sql");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    stream.pipe(res);
  }));

  /**
   * POST /api/admin/backup/restore
   * Вариант 1: multipart с полем "file" и "confirm" = "RESTORE"
   * Вариант 2: JSON body { confirm: "RESTORE", path: "YYYY/MM/DD/filename.sql" } — восстановить с сервера
   */
  router.post("/backup/restore", upload.single("file"), asyncRoute(async (req, res) => {
    const url = process.env.DATABASE_URL;
    if (!url) return res.status(503).json({ message: t(adminLang(req), "databaseUrlNotSet") });
    const db = parseDatabaseUrl(url);
    if (!db) return res.status(503).json({ message: t(adminLang(req), "invalidDatabaseUrl") });
    if (req.body?.confirm !== "RESTORE") {
      return res.status(400).json({ message: t(adminLang(req), "confirmRestore") });
    }

    let sqlBuffer: Buffer;
    const serverPath = req.body?.path as string | undefined;
    if (serverPath && typeof serverPath === "string") {
      const buf = await readBackupFile(serverPath);
      if (!buf || buf.length === 0) return res.status(404).json({ message: t(adminLang(req), "backupNotFoundOnServer") });
      sqlBuffer = buf;
    } else {
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file || !file.buffer || file.buffer.length === 0) {
        return res.status(400).json({ message: t(adminLang(req), "selectBackupFile") });
      }
      sqlBuffer = file.buffer;
    }

    try {
      await runPgRestore(db, sqlBuffer);
      return res.json({ message: t(adminLang(req), "databaseRestoredFromBackup") });
    } catch (e) {
      console.error("Backup restore error:", e);
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ message: msg, error: msg });
    }
  }));
}
