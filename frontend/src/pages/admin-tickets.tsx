import { useEffect, useState, type ChangeEvent } from "react";
import { useAuth } from "@/contexts/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2, Send, ArrowLeft, Lock, Unlock, CircleDot, CircleCheck, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

type TicketListItem = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  client: { id: string; email: string | null; telegramUsername: string | null };
};
type TicketMessage = { id: string; authorType: string; content: string; createdAt: string; imageUrl?: string | null };

export function AdminTicketsPage() {
  const { state } = useAuth();
  const token = state.accessToken ?? "";
  const { t } = useTranslation();

  const [list, setList] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "closed" | "needs_reply">("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    id: string;
    subject: string;
    status: string;
    client: { id: string; email: string | null; telegramUsername: string | null };
    tariffInfo?: { tariffName: string | null; status: string | null; expiresAt: string | null } | null;
    messages: TicketMessage[];
    createdAt: string;
    updatedAt: string;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  const loadList = () => {
    if (!token) return;
    const status = filter === "all" ? undefined : filter;
    api
      .getAdminTickets(token, status)
      .then((r) => {
        setList(r.items);
        setLoading(false);
      })
      .catch(() => {
        setList([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    loadList();
    const intervalId = window.setInterval(loadList, 10000);
    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter]);

  useEffect(() => {
    if (!detailId || !token) {
      setDetail(null);
      return;
    }
    const loadDetail = () => {
      setDetailLoading(true);
      api
        .getAdminTicket(token, detailId)
        .then(setDetail)
        .catch(() => setDetail(null))
        .finally(() => setDetailLoading(false));
    };
    loadDetail();
    const intervalId = window.setInterval(loadDetail, 10000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [detailId, token]);

  const sendReply = () => {
    if (!token || !detailId || !replyText.trim()) return;
    setReplySending(true);
    api
      .postAdminTicketMessage(token, detailId, { content: replyText.trim() })
      .then((msg) => {
        setDetail((d) => (d ? { ...d, messages: [...d.messages, msg] } : d));
        setReplyText("");
      })
      .finally(() => setReplySending(false));
  };

  const toggleStatus = () => {
    if (!token || !detail) return;
    const next = detail.status === "open" ? "closed" : "open";
    api.patchAdminTicket(token, detail.id, { status: next }).then(() => {
      setDetail((d) => (d ? { ...d, status: next } : d));
      setList((prev) => prev.map((t) => (t.id === detail.id ? { ...t, status: next } : t)));
    });
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString(undefined, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return s;
    }
  };

  if (detailId && detail) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => { setDetailId(null); setDetail(null); }}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("admin.toList")}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleStatus}>
            {detail.status === "open" ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
            {detail.status === "open" ? t("admin.tickets.close") : t("admin.tickets.reopen")}
          </Button>
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 border-b bg-muted/20">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base mr-2">{detail.subject}</CardTitle>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  detail.status === "closed"
                    ? "bg-muted text-muted-foreground"
                    : detail.status === "needs_reply"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {detail.status === "closed" ? <CircleCheck className="h-3.5 w-3.5" /> : detail.status === "needs_reply" ? <Clock className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}
                {detail.status === "closed" ? t("admin.tickets.statusClosed") : detail.status === "needs_reply" ? t("admin.tickets.statusNeedsReply") : t("admin.tickets.statusOpen")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("admin.tickets.clientLabel")} {detail.client.email ?? detail.client.telegramUsername ?? detail.client.id} · {t("admin.tickets.updated")} {formatDate(detail.updatedAt)}
            </p>
            {detail.tariffInfo && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("admin.tickets.tariffLabel")} {detail.tariffInfo.tariffName ?? "—"}
                {detail.tariffInfo.status && (
                  <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${detail.tariffInfo.status === "active" ? "bg-emerald-500/15 text-emerald-600" : detail.tariffInfo.status === "expired" ? "bg-red-500/15 text-red-600" : "bg-muted text-muted-foreground"}`}>
                    {detail.tariffInfo.status === "active" ? t("admin.tickets.tariffActive") : detail.tariffInfo.status === "expired" ? t("admin.tickets.tariffExpired") : t("admin.tickets.tariffDisabled")}
                  </span>
                )}
                {detail.tariffInfo.expiresAt && <span className="ml-1">· {t("admin.tickets.tariffExpires")} {formatDate(detail.tariffInfo.expiresAt)}</span>}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[...detail.messages].reverse().map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-3 text-sm ${m.authorType === "support" ? "bg-primary/10 border border-primary/20" : "bg-muted/50"}`}
                >
                  <div className="flex justify-between gap-2 text-xs text-muted-foreground mb-1">
                    <span>{m.authorType === "support" ? t("admin.tickets.authorSupport") : t("admin.tickets.authorClient")}</span>
                    <span>{formatDate(m.createdAt)}</span>
                  </div>
                  {m.imageUrl && (
                    <a href={m.imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                      <img src={m.imageUrl} alt="" className="max-w-full max-h-60 rounded-lg border" loading="lazy" />
                    </a>
                  )}
                  {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                </div>
              ))}
            </div>
            {detail.status !== "closed" && (
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Label htmlFor="admin-reply">{t("admin.tickets.replyLabel")}</Label>
                <Textarea
                  id="admin-reply"
                  placeholder={t("admin.tickets.replyPlaceholder")}
                  value={replyText}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button onClick={sendReply} disabled={replySending || !replyText.trim()} size="sm">
                  {replySending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="ml-2">{t("admin.send")}</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (detailId && detailLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <Button variant="ghost" size="sm" onClick={() => setDetailId(null)}>{t("admin.toList")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("admin.tickets.title")}</h2>
        <div className="flex gap-2 flex-wrap">
          {(["all", "open", "needs_reply", "closed"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? t("admin.all") : f === "open" ? t("admin.tickets.filterOpen") : f === "needs_reply" ? t("admin.tickets.filterNeedsReply") : t("admin.tickets.filterClosed")}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("admin.tickets.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((ticket) => (
            <Card
              key={ticket.id}
              className={`cursor-pointer transition-all hover:shadow-md ${ticket.status === "needs_reply" ? "border-l-4 border-l-amber-500" : ticket.status === "open" ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-muted-foreground/30"}`}
              onClick={() => setDetailId(ticket.id)}
            >
              <CardContent className="py-3 flex flex-row items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{ticket.subject}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        ticket.status === "needs_reply"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : ticket.status === "open"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ticket.status === "needs_reply" ? <Clock className="h-3 w-3" /> : ticket.status === "open" ? <CircleDot className="h-3 w-3" /> : <CircleCheck className="h-3 w-3" />}
                      {ticket.status === "needs_reply" ? t("admin.tickets.statusNeedsReply") : ticket.status === "open" ? t("admin.tickets.statusOpen") : t("admin.tickets.statusClosed")}
                    </span>
                    <span className="text-xs text-muted-foreground">{ticket.client.email ?? ticket.client.telegramUsername ?? ticket.client.id}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(ticket.updatedAt)}</span>
                  </div>
                </div>
                <span className="text-muted-foreground shrink-0">→</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
