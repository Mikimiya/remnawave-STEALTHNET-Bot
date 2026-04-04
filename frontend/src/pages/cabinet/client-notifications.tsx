import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Inbox, Loader2, ChevronDown, Circle } from "lucide-react";
import { useClientAuth } from "@/contexts/client-auth";
import { api } from "@/lib/api";
import type { ClientNotification } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function getLocale(lang?: string): string {
  const l = (lang || "zh").slice(0, 2);
  if (l === "zh") return "zh-CN";
  if (l === "en") return "en-US";
  return "ru-RU";
}

function relativeTime(dateStr: string, lang?: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 7) {
    return new Date(dateStr).toLocaleDateString(getLocale(lang), { month: "short", day: "numeric", year: "numeric" });
  }
  if (day > 0) return `${day}d`;
  if (hr > 0) return `${hr}h`;
  if (min > 0) return `${min}m`;
  return "now";
}

const TYPE_ICONS: Record<string, string> = {
  payment_success: "✅",
  trial_activated: "🎁",
  subscription_expiring: "⚠️",
  subscription_expired: "❌",
  broadcast: "📢",
  promo_activated: "🎉",
  balance_topup: "💰",
  system: "ℹ️",
};

export function ClientNotificationsPage() {
  const { state } = useClientAuth();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const token = state.token ?? null;

  const [items, setItems] = useState<ClientNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const initialLoad = useRef(false);

  const loadNotifications = useCallback(
    async (cursor?: string) => {
      if (!token) return;
      try {
        const res = await api.clientGetNotifications(token, { cursor, limit: 30 });
        if (cursor) {
          setItems((prev) => [...prev, ...res.items]);
        } else {
          setItems(res.items);
        }
        setNextCursor(res.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("notifications.loadError"));
      }
    },
    [token, t]
  );

  useEffect(() => {
    if (!token || initialLoad.current) return;
    initialLoad.current = true;
    setLoading(true);
    loadNotifications().finally(() => setLoading(false));
  }, [token, loadNotifications]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    await loadNotifications(nextCursor);
    setLoadingMore(false);
  };

  const handleMarkRead = async (ids: string[]) => {
    if (!token) return;
    try {
      await api.clientMarkNotificationsRead(token, { ids });
      setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
    } catch {
      /* silent */
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    setMarkingAll(true);
    try {
      await api.clientMarkNotificationsRead(token, { all: true });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* silent */
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t("notifications.title")}</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("notifications.unreadCount", { count: unreadCount })}
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 rounded-xl"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Inbox className="h-12 w-12 opacity-40" />
          <p className="text-sm">{t("notifications.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.isRead && handleMarkRead([n.id])}
              className={cn(
                "w-full text-left rounded-2xl border p-4 transition-all duration-200",
                n.isRead
                  ? "border-border/50 bg-card/30 opacity-70"
                  : "border-primary/20 bg-card/60 shadow-sm hover:shadow-md cursor-pointer"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? "📨"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{n.title}</span>
                    {!n.isRead && <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />}
                  </div>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{n.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5">{relativeTime(n.createdAt, lang)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Load more */}
      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-xl"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
            {t("notifications.loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
