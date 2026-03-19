import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth";
import { api, type BroadcastResult } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Paperclip, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const MAX_ATTACHMENT_MB = 20;

export function BroadcastPage() {
  const { state } = useAuth();
  const token = state.accessToken ?? "";
  const { t } = useTranslation();
  const [broadcastRecipients, setBroadcastRecipients] = useState<{ withTelegram: number; withEmail: number } | null>(null);
  const [broadcastChannel, setBroadcastChannel] = useState<"telegram" | "email" | "both">("telegram");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAttachment, setBroadcastAttachment] = useState<File | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      api.broadcastRecipientsCount(token).then(setBroadcastRecipients).catch(() => setBroadcastRecipients(null));
    }
  }, [token]);

  async function handleBroadcastSend(e: React.FormEvent) {
    e.preventDefault();
    const text = broadcastMessage.trim();
    if (!text) return;
    if (broadcastAttachment && broadcastAttachment.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      setBroadcastResult({
        ok: false,
        sentTelegram: 0,
        sentEmail: 0,
        failedTelegram: 0,
        failedEmail: 0,
        errors: [t("admin.broadcast.fileSizeError", { max: MAX_ATTACHMENT_MB })],
      });
      return;
    }
    setBroadcastLoading(true);
    setBroadcastResult(null);
    try {
      const r: BroadcastResult = await api.broadcast(
        token,
        {
          channel: broadcastChannel,
          subject: broadcastSubject.trim() || undefined,
          message: text,
        },
        broadcastAttachment ?? undefined
      );
      setBroadcastResult(r);
      if (r.ok) {
        setBroadcastMessage("");
        setBroadcastSubject("");
        setBroadcastAttachment(null);
        api.broadcastRecipientsCount(token).then(setBroadcastRecipients).catch(() => {});
      }
    } catch (err) {
      setBroadcastResult({
        ok: false,
        sentTelegram: 0,
        sentEmail: 0,
        failedTelegram: 0,
        failedEmail: 0,
        errors: [err instanceof Error ? err.message : t("admin.broadcast.sendError")],
      });
    } finally {
      setBroadcastLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.broadcast.title")}</h1>
        <p className="text-muted-foreground">{t("admin.broadcast.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t("admin.broadcast.cardTitle")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("admin.broadcast.cardDesc")}
          </p>
          {broadcastRecipients && (
            <p className="text-xs text-muted-foreground">
              {t("admin.broadcast.recipientsTg")}: {broadcastRecipients.withTelegram} · {t("admin.broadcast.recipientsEmail")}: {broadcastRecipients.withEmail}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBroadcastSend} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.broadcast.channelLabel")}</Label>
              <select
                className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={broadcastChannel}
                onChange={(e) => setBroadcastChannel(e.target.value as "telegram" | "email" | "both")}
              >
                <option value="telegram">{t("admin.broadcast.channelTg")}</option>
                <option value="email">{t("admin.broadcast.channelEmail")}</option>
                <option value="both">{t("admin.broadcast.channelBoth")}</option>
              </select>
            </div>
            {(broadcastChannel === "email" || broadcastChannel === "both") && (
              <div className="space-y-2">
                <Label>{t("admin.broadcast.subjectLabel")}</Label>
                <Input
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder={t("admin.broadcast.subjectPlaceholder")}
                  maxLength={500}
                  className="max-w-md"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("admin.broadcast.messageLabel")}</Label>
              <textarea
                className="flex min-h-[120px] w-full max-w-2xl rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={t("admin.broadcast.messagePlaceholder")}
                maxLength={4096}
                required
              />
              <p className="text-xs text-muted-foreground">{broadcastMessage.length} / 4096</p>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.broadcast.attachLabel", { max: MAX_ATTACHMENT_MB })}</Label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => setBroadcastAttachment(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {t("admin.broadcast.attachBtn")}
                </Button>
                {broadcastAttachment && (
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    {broadcastAttachment.name}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setBroadcastAttachment(null)}
                      aria-label={t("admin.broadcast.removeAttach")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.broadcast.attachNote")}
              </p>
            </div>
            <Button type="submit" disabled={broadcastLoading || !broadcastMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {broadcastLoading ? t("admin.broadcast.sending") : t("admin.broadcast.sendBtn")}
            </Button>
            {broadcastResult && (
              <div className={`rounded-lg border p-3 text-sm ${broadcastResult.ok ? "border-green-500/50 bg-green-500/10" : "border-amber-500/50 bg-amber-500/10"}`}>
                {broadcastResult.ok ? (
                  <p>{t("admin.broadcast.resultOk", { tg: broadcastResult.sentTelegram, email: broadcastResult.sentEmail })}</p>
                ) : (
                  <>
                    <p>{t("admin.broadcast.resultFail", { tg: broadcastResult.sentTelegram, tgFail: broadcastResult.failedTelegram, email: broadcastResult.sentEmail, emailFail: broadcastResult.failedEmail })}</p>
                    {broadcastResult.errors.length > 0 && (
                      <ul className="mt-2 list-disc pl-4 text-muted-foreground">
                        {broadcastResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {broadcastResult.errors.length > 5 && <li>{t("admin.broadcast.moreErrors", { count: broadcastResult.errors.length - 5 })}</li>}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
