import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Calendar,
  ArrowRight,
  PlusCircle,
  RotateCcw,
  Copy,
  Check,
  Gift,
  Loader2,
  AlertCircle,
  ChevronRight,
  Megaphone,
  X,
  Link2,
  BarChart3,
  Users,
  TicketCheck,
} from "lucide-react";
import { useClientAuth } from "@/contexts/client-auth";
import { useCabinetConfig } from "@/contexts/cabinet-config";
import { useCabinetMiniapp } from "@/pages/cabinet/cabinet-layout";
import { api } from "@/lib/api";
import { formatDays } from "@/i18n";
import type { ClientPayment, ClientReferralStats, AnnouncementRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { formatMoney, translateBackendMessage } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Strip markdown syntax for plain-text preview */
function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

function getLocale(lang?: string): string {
  const l = (lang || "zh").slice(0, 2);
  if (l === "zh") return "zh-CN";
  if (l === "en") return "en-US";
  return "ru-RU";
}

function formatDate(s: string | null, lang?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(getLocale(lang), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function formatBytes(bytes: number, lang?: string) {
  const l = (lang || "zh").slice(0, 2);
  const gbLabel = l === "ru" ? "ГБ" : "GB";
  const mbLabel = l === "ru" ? "МБ" : "MB";
  const kbLabel = l === "ru" ? "КБ" : "KB";
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + " " + gbLabel;
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + " " + mbLabel;
  return (bytes / 1024).toFixed(0) + " " + kbLabel;
}


function getSubscriptionPayload(sub: unknown): Record<string, unknown> | null {
  if (!sub || typeof sub !== "object") return null;
  const raw = sub as Record<string, unknown>;
  if (raw.response && typeof raw.response === "object") return raw.response as Record<string, unknown>;
  if (raw.data && typeof raw.data === "object") {
    const d = raw.data as Record<string, unknown>;
    if (d.response && typeof d.response === "object") return d.response as Record<string, unknown>;
  }
  return raw;
}

function parseSubscription(sub: unknown): {
  status?: string;
  expireAt?: string;
  trafficUsed?: number;
  trafficLimitBytes?: number;
  hwidDeviceLimit?: number;
  subscriptionUrl?: string;
  productName?: string;
} {
  const o = getSubscriptionPayload(sub);
  if (!o) return {};
  const userTraffic = o.userTraffic && typeof o.userTraffic === "object" ? (o.userTraffic as Record<string, unknown>) : null;
  const usedBytes = userTraffic != null && typeof userTraffic.usedTrafficBytes === "number"
    ? userTraffic.usedTrafficBytes
    : typeof o.trafficUsed === "number"
      ? o.trafficUsed
      : undefined;
  const subUrl = typeof o.subscriptionUrl === "string" ? o.subscriptionUrl : undefined;
  const productName = typeof o.productName === "string" ? o.productName.trim() : undefined;
  const subscriptionProductName = typeof (o as Record<string, unknown>).subscriptionProductName === "string" ? (o as Record<string, unknown>).subscriptionProductName as string : undefined;
  return {
    status: typeof o.status === "string" ? o.status : undefined,
    expireAt: typeof o.expireAt === "string" ? o.expireAt : undefined,
    trafficUsed: usedBytes,
    trafficLimitBytes: typeof o.trafficLimitBytes === "number" ? o.trafficLimitBytes : undefined,
    hwidDeviceLimit: typeof o.hwidDeviceLimit === "number" ? o.hwidDeviceLimit : (o.hwidDeviceLimit != null ? Number(o.hwidDeviceLimit) : undefined),
    subscriptionUrl: subUrl?.trim() || undefined,
    productName: productName || subscriptionProductName || undefined,
  };
}

const RESET_STRATEGY_I18N: Record<string, string> = {
  NO_RESET: "tariffs.resetNoReset",
  DAY: "tariffs.resetDay",
  WEEK: "tariffs.resetWeek",
  MONTH: "tariffs.resetMonth",
  MONTH_ROLLING: "tariffs.resetMonthRolling",
};

export function ClientDashboardPage() {
  const { state, refreshProfile } = useClientAuth();
  const config = useCabinetConfig();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<unknown>(null);
  const [tariffDisplayName, setTariffDisplayName] = useState<string | null>(null);
  const [tariffCategoryName, setTariffCategoryName] = useState<string | null>(null);
  const [trafficResetStrategy, setTrafficResetStrategy] = useState<string | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const [usedDevicesCount, setUsedDevicesCount] = useState(0);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [_payments, setPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMessage, setPaymentMessage] = useState<"success_topup" | "success_tariff" | "success" | "failed" | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [_referralStats, setReferralStats] = useState<ClientReferralStats | null>(null);
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("dismissed_announcements") || "[]")); } catch { return new Set(); }
  });

  const token = state.token;
  const isMiniapp = useCabinetMiniapp();
  const client = state.client;
  const showTrial = config?.trialEnabled && !client?.trialUsed;
  const trialDays = config?.trialDays ?? 0;

  useEffect(() => {
    const payment = searchParams.get("payment");
    const yoomoneyForm = searchParams.get("yoomoney_form");
    const paymentKind = searchParams.get("payment_kind");
    if (payment === "success") {
      if (paymentKind === "topup") setPaymentMessage("success_topup");
      else if (paymentKind === "tariff") setPaymentMessage("success_tariff");
      else setPaymentMessage("success");
      setSearchParams({}, { replace: true });
      if (token) refreshProfile().catch(() => {});
    } else if (payment === "failed") {
      setPaymentMessage("failed");
      setSearchParams({}, { replace: true });
      if (token) refreshProfile().catch(() => {});
    } else if (yoomoneyForm === "success") {
      setSearchParams({}, { replace: true });
      if (token) refreshProfile().catch(() => {});
    } else if (searchParams.get("yookassa") === "success") {
      setSearchParams({}, { replace: true });
      if (token) refreshProfile().catch(() => {});
    } else if (searchParams.get("heleket") === "success") {
      setSearchParams({}, { replace: true });
      if (token) refreshProfile().catch(() => {});
    }
  }, [searchParams, setSearchParams, token, refreshProfile]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setSubscriptionError(null);
    Promise.all([
      api.clientSubscription(token),
      api.clientPayments(token),
    ])
      .then(([subRes, payRes]) => {
        if (cancelled) return;
        setSubscription(subRes.subscription ?? null);
        setTariffDisplayName(subRes.tariffDisplayName ?? null);
        setTariffCategoryName(subRes.tariffCategoryName ?? null);
        setTrafficResetStrategy(subRes.trafficResetStrategy ?? null);
        setIsTrial(subRes.isTrial ?? false);
        setUsedDevicesCount(subRes.usedDevicesCount ?? 0);
        if (subRes.message) setSubscriptionError(translateBackendMessage(subRes.message, t));
        setPayments(payRes.items ?? []);
      })
      .catch((e) => {
        if (!cancelled) setSubscriptionError(e instanceof Error ? translateBackendMessage(e.message, t) : t("dashboard.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  useEffect(() => {
    if (!token || !isMiniapp) return;
    api.getClientReferralStats(token).then(setReferralStats).catch(() => {});
  }, [token, isMiniapp]);

  useEffect(() => {
    api.getPublicAnnouncements()
      .then((items) => setPinnedAnnouncements(items.filter((a) => a.pinned)))
      .catch(() => {});
  }, []);

  const dismissAnnouncement = (id: string) => {
    setDismissedAnnouncements((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("dismissed_announcements", JSON.stringify([...next]));
      return next;
    });
  };

  const visiblePinned = pinnedAnnouncements.filter((a) => !dismissedAnnouncements.has(a.id));
  const [announcementModal, setAnnouncementModal] = useState<AnnouncementRecord | null>(null);

  async function activateTrial() {
    if (!token) return;
    setTrialError(null);
    setTrialLoading(true);
    try {
      await api.clientActivateTrial(token);
      await refreshProfile();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setTrialError(e instanceof Error ? translateBackendMessage(e.message, t) : t("dashboard.trialError"));
    } finally {
      setTrialLoading(false);
    }
  }

  if (!client) return null;

  const subParsed = parseSubscription(subscription);
  const hasActiveSubscription =
    subscription && typeof subscription === "object" && (subParsed.status === "ACTIVE" || subParsed.status === undefined);
  const vpnUrl = subParsed.subscriptionUrl || null;
  const [subUrlCopied, setSubUrlCopied] = useState(false);
  const copySubUrl = () => {
    if (vpnUrl) {
      navigator.clipboard.writeText(vpnUrl);
      setSubUrlCopied(true);
      setTimeout(() => setSubUrlCopied(false), 2000);
    }
  };
  const trafficPercent = subParsed.trafficLimitBytes != null && subParsed.trafficLimitBytes > 0 && subParsed.trafficUsed != null
    ? Math.min(100, Math.round((subParsed.trafficUsed / subParsed.trafficLimitBytes) * 100))
    : null;

  const expireDate = subParsed.expireAt ? (() => { try { const d = new Date(subParsed.expireAt); return Number.isNaN(d.getTime()) ? null : d; } catch { return null; } })() : null;
  const daysLeft = expireDate && expireDate > new Date()
    ? (() => {
        // 按自然日计算剩余天数：将到期日和当前时间都归零到当天 00:00，再算天数差
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const expireStart = new Date(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate());
        const diffDays = Math.round((expireStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
        // 如果到期日和今天是同一天但还没过期，显示 0 天（即"今天到期"）
        return Math.max(0, diffDays);
      })()
    : null;

  // Компонент-состояние отсутствия подписки
  const NoSubscriptionState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-8">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent flex items-center justify-center ring-1 ring-primary/20 ring-offset-4 ring-offset-background">
          <Package className="h-10 w-10 text-primary" />
        </div>
      </motion.div>
      <div className="space-y-3 max-w-md mx-auto">
        <h3 className="text-2xl font-black text-foreground tracking-tight">{t("dashboard.noSubscription")}</h3>
        <p className="text-base text-muted-foreground leading-relaxed">
          {t("dashboard.noSubscriptionDesc")}
        </p>
      </div>
      <Link to="/cabinet/tariffs" className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-primary px-10 text-base font-bold text-primary-foreground shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all duration-500 hover:shadow-[0_0_50px_rgba(var(--primary),0.5)] hover:scale-105 active:scale-95">
        <span>{t("dashboard.choosePlan")}</span>
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );

  if (isMiniapp) {
    return (
      <>
      <div className="w-full min-w-0 overflow-hidden space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Payment status toasts */}
        <AnimatePresence>
          {(paymentMessage === "success" || paymentMessage === "success_topup" || paymentMessage === "success_tariff") && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2.5"
            >
              <Check className="h-4 w-4 shrink-0" />
              {paymentMessage === "success_topup"
                ? t("dashboard.paymentSuccessTopup")
                : paymentMessage === "success_tariff"
                  ? t("dashboard.paymentSuccessTariff")
                  : t("dashboard.paymentSuccess")}
            </motion.div>
          )}
          {paymentMessage === "failed" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-[13px] font-medium text-destructive flex items-center gap-2.5"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t("dashboard.paymentFailed")}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pinned announcements */}
        <AnimatePresence>
          {visiblePinned.map((ann) => {
            const plain = stripMarkdown(ann.content);
            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="rounded-[1.75rem] border border-amber-500/20 bg-amber-500/5 backdrop-blur-2xl p-4 relative overflow-hidden"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); dismissAnnouncement(ann.id); }}
                  className="absolute top-3 right-3 text-muted-foreground/70 hover:text-foreground transition-colors z-10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div
                  className="flex items-start gap-3 pr-6 cursor-pointer"
                  onClick={() => setAnnouncementModal(ann)}
                >
                  <div className="h-8 w-8 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center mt-0.5">
                    <Megaphone className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[13px] font-bold text-foreground leading-tight">{ann.title}</p>
                    <p className="text-[12px] text-muted-foreground/50 leading-relaxed line-clamp-2">{plain.slice(0, 150)}{plain.length > 150 ? "�" : ""}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                      <span>{t("dashboard.readMore")}</span>
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading */}
        {loading ? (
          <div className="rounded-[1.75rem] border border-border/50 bg-muted/40 dark:bg-white/[0.06] dark:border-white/10 flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-primary/30" />
          </div>
        ) : subscriptionError || !hasActiveSubscription ? (
          /* ═══ No subscription ═══ */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-[1.75rem] border border-border/50 bg-muted/40 dark:bg-white/[0.06] dark:border-white/10 p-6 relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <NoSubscriptionState />
              {showTrial && (
                <div className="mt-6 space-y-3">
                  <p className="text-[13px] text-muted-foreground/70 text-center leading-relaxed">
                    {t("dashboard.trialDesc", { days: formatDays(trialDays, lang) })}
                  </p>
                  <Button className="w-full gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/15 h-12 rounded-2xl active:scale-[0.98] transition-all duration-300" onClick={activateTrial} disabled={trialLoading}>
                    {trialLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Gift className="h-4 w-4 shrink-0" />}
                    <span className="font-bold text-[14px]">{t("dashboard.activateTrial")}</span>
                  </Button>
                  {trialError && <p className="text-sm text-destructive text-center">{trialError}</p>}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ═══ Active subscription ═══ */
          <>
            {/* Hero subscription card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-[1.75rem] border border-border/50 bg-muted/40 dark:bg-white/[0.06] dark:border-white/10 relative overflow-hidden"
            >
              {/* Ambient glow */}
              <div className="absolute -top-20 -right-20 h-44 w-44 rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-primary/5 blur-[60px] pointer-events-none" />

              <div className="relative z-10 p-5 pb-0">
                {/* Plan name */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Package className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[17px] font-bold tracking-tight text-foreground truncate leading-tight">
                        {isTrial ? t("dashboard.trial") : ((tariffDisplayName ?? subParsed.productName?.trim() ?? "").trim()) || t("dashboard.trial")}
                      </p>
                      {isTrial ? (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 flex items-center gap-1">
                          <AlertCircle className="h-2.5 w-2.5" />
                          {t("dashboard.trialLimitedNodesShort")}
                        </p>
                      ) : tariffCategoryName ? (
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{tariffCategoryName}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Giant stat numbers */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {/* Days */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      {t("dashboard.validUntil")}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black tabular-nums tracking-tighter text-foreground leading-none">
                        {daysLeft != null ? daysLeft : "—"}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground/70">
                        {lang.startsWith("zh") ? "天" : lang.startsWith("ru") ? "дн" : "d"}
                      </span>
                    </div>
                  </div>
                  {/* Traffic */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      {t("dashboard.traffic")}
                    </p>
                    {subParsed.trafficLimitBytes != null && subParsed.trafficLimitBytes > 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tabular-nums tracking-tighter text-foreground leading-none">
                          {trafficPercent ?? 0}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground/70">%</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-black text-foreground tracking-tighter leading-none">∞</span>
                    )}
                  </div>
                  {/* Devices */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      {t("dashboard.devices")}
                    </p>
                    <span className="text-3xl font-black tabular-nums tracking-tighter text-foreground leading-none">
                      {usedDevicesCount}<span className="text-lg font-bold text-muted-foreground/50">/{subParsed.hwidDeviceLimit != null && subParsed.hwidDeviceLimit > 0 ? subParsed.hwidDeviceLimit : "∞"}</span>
                    </span>
                  </div>
                </div>

                {/* Traffic progress bar */}
                {trafficPercent != null && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 font-medium mb-1.5">
                      <span>{formatBytes(subParsed.trafficUsed ?? 0, lang)}</span>
                      <span>{formatBytes(subParsed.trafficLimitBytes!, lang)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/20 dark:bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${trafficPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-primary/60"
                      />
                    </div>
                  </div>
                )}

                {/* Expire date tag */}
                <div className="flex items-center gap-2 flex-wrap mb-5">
                  {subParsed.expireAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 dark:border-white/10 bg-muted/20 dark:bg-white/5 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(subParsed.expireAt, lang)}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom gradient divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border/40 dark:via-white/10 to-transparent" />
            </motion.div>

            {/* VPN / Connection card */}
            {vpnUrl ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className="rounded-[1.75rem] border border-border/50 bg-muted/40 dark:bg-white/[0.06] dark:border-white/10 p-5 relative overflow-hidden"
              >
                <div className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-primary/6 blur-[70px] pointer-events-none" />
                <div className="relative z-10 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-xl bg-muted/30 dark:bg-white/10 border border-border/40 dark:border-white/10 px-3 py-2.5 text-[11px] font-mono text-foreground/60" title={vpnUrl}>
                      {vpnUrl}
                    </code>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="shrink-0 h-10 w-10 rounded-xl border border-border/40 dark:border-white/10 bg-muted/30 dark:bg-white/10 hover:bg-muted/50 dark:hover:bg-white/15"
                      onClick={() => {
                        copySubUrl();
                        window.Telegram?.WebApp?.showPopup?.({ title: t("dashboard.copied"), message: t("subscribe.linkCopied") });
                      }}
                    >
                      {subUrlCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-foreground/60" />}
                    </Button>
                  </div>
                  <Link to="/cabinet/subscribe" className="group inline-flex w-full h-12 items-center justify-center gap-2.5 rounded-2xl bg-primary text-[13px] font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98]">
                    <Link2 className="h-4 w-4 shrink-0" />
                    <span>{t("dashboard.connectVPN")}</span>
                  </Link>
                </div>
              </motion.div>
            ) : showTrial ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className="rounded-[1.75rem] border border-border/50 bg-muted/40 dark:bg-white/[0.06] dark:border-white/10 p-5 relative overflow-hidden"
              >
                <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/8 blur-[60px] pointer-events-none" />
                <div className="relative z-10 space-y-3.5 text-center">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Gift className="h-5 w-5" />
                  </div>
                  <p className="text-[13px] text-muted-foreground/70 leading-relaxed">
                    {t("dashboard.trialDesc", { days: formatDays(trialDays, lang) })}
                  </p>
                  <Button className="w-full gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/15 h-12 rounded-2xl active:scale-[0.98] transition-all duration-300" onClick={activateTrial} disabled={trialLoading}>
                    {trialLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Gift className="h-4 w-4 shrink-0" />}
                    <span className="font-bold text-[14px]">{t("dashboard.activateTrial")}</span>
                  </Button>
                  {trialError && <p className="text-sm text-destructive">{trialError}</p>}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className="rounded-[1.75rem] border border-border/50 bg-muted/40 dark:bg-white/[0.06] dark:border-white/10 p-5 relative overflow-hidden"
              >
                <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-primary/6 blur-[60px] pointer-events-none" />
                <div className="relative z-10 space-y-3.5">
                  <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3.5 text-[13px] text-primary/70 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-primary/60" />
                    <p className="leading-relaxed">{t("dashboard.noLinkDesc")}</p>
                  </div>
                  <Link to="/cabinet/tariffs" className="group inline-flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-[13px] font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98]">
                    <span>{t("dashboard.choosePlan")}</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="rounded-[1.75rem] border border-border/50 bg-muted/40 dark:bg-white/[0.06] dark:border-white/10 p-5 relative overflow-hidden group"
        >
          <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-primary/6 blur-[80px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t("dashboard.myBalance")}</p>
              <p className="text-3xl font-black tracking-tighter text-foreground truncate leading-none">{formatMoney(client.balance, client.preferredCurrency)}</p>
            </div>
            <Link to="/cabinet/profile#topup" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[13px] font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98]">
              <PlusCircle className="h-4 w-4 shrink-0" />
              <span>{t("dashboard.topUp")}</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Announcement detail modal */}
      {announcementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAnnouncementModal(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">{announcementModal.title}</h2>
              <button onClick={() => setAnnouncementModal(null)} className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {announcementModal.publishedAt && (
                <p className="text-xs text-zinc-400 mb-3">{new Date(announcementModal.publishedAt).toLocaleDateString()}</p>
              )}
              <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{announcementModal.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  // DESKTOP LAYOUT
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {/* ═══ HERO SECTION ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-muted/40 dark:bg-white/[0.06] border border-border/50 dark:border-white/10 p-8 sm:p-10"
      >
        {/* Decorative ambient glow */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-primary/6 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1 space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-black tracking-tight sm:text-4xl text-foreground leading-[1.1]"
            >
              {t("dashboard.welcome")}{client.email ? `, ${client.email.split("@")[0]}` : client.telegramUsername ? `, @${client.telegramUsername}` : ""}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-[15px] text-muted-foreground max-w-lg leading-relaxed"
            >
              {hasActiveSubscription
                ? t("dashboard.activeSubscriptionDesc")
                : t("dashboard.noSubscriptionHeroDesc")}
            </motion.p>

            <AnimatePresence>
              {(paymentMessage === "success" || paymentMessage === "success_topup" || paymentMessage === "success_tariff") && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 px-5 py-2.5 rounded-xl text-emerald-700 dark:text-emerald-400 font-medium text-sm"
                >
                  <Check className="h-4 w-4" />
                  {paymentMessage === "success_topup" ? t("dashboard.balancePaid") : paymentMessage === "success_tariff" ? t("dashboard.planActivated") : t("dashboard.paymentSuccess")}
                </motion.div>
              )}
              {paymentMessage === "failed" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2.5 bg-destructive/10 border border-destructive/20 px-5 py-2.5 rounded-xl text-destructive font-medium text-sm"
                >
                  <AlertCircle className="h-4 w-4" />
                  {t("dashboard.paymentFailed")}
                </motion.div>
              )}
            </AnimatePresence>
            {trialError && <p className="text-sm text-destructive font-medium">{trialError}</p>}
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 min-w-[240px]"
          >
            {showTrial ? (
              <Button size="lg" className="w-full gap-2.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 active:scale-[0.98] transition-all duration-300" onClick={activateTrial} disabled={trialLoading}>
                {trialLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Gift className="h-4 w-4 shrink-0" />}
                <span className="text-sm font-bold">{t("dashboard.freeTrial")}</span>
              </Button>
            ) : vpnUrl ? (
              <Link to="/cabinet/subscribe" className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98]">
                <Link2 className="h-4 w-4 shrink-0" />
                <span className="text-sm font-bold">{t("dashboard.setupVPN")}</span>
              </Link>
            ) : (
              <Link to="/cabinet/tariffs" className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98]">
                <Package className="h-4 w-4 shrink-0" />
                <span className="text-sm font-bold">{t("dashboard.choosePlan")}</span>
              </Link>
            )}
            <Link to="/cabinet/profile#topup" className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-border/40 bg-background/15 backdrop-blur-sm transition-all duration-300 hover:bg-muted/30 dark:bg-white/10 active:scale-[0.98]">
              <PlusCircle className="h-4 w-4 shrink-0 text-foreground/50" />
              <span className="text-sm font-semibold">{t("dashboard.topUpBalance")}</span>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Pinned announcements */}
      <AnimatePresence>
        {visiblePinned.map((ann) => {
          const plain = stripMarkdown(ann.content);
          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="rounded-3xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-2xl p-6 relative overflow-hidden"
            >
              <button
                onClick={(e) => { e.stopPropagation(); dismissAnnouncement(ann.id); }}
                className="absolute top-4 right-5 text-muted-foreground/70 hover:text-foreground transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>
              <div
                className="flex items-start gap-4 pr-8 cursor-pointer"
                onClick={() => setAnnouncementModal(ann)}
              >
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-amber-500/10 flex items-center justify-center mt-0.5">
                  <Megaphone className="h-4 w-4 text-amber-500" />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[15px] font-bold text-foreground leading-tight">{ann.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{plain.slice(0, 250)}{plain.length > 250 ? "�" : ""}</p>
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                    <span>{t("dashboard.readMore")}</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* ��� CONTENT GRID ��� */}
      <div className="grid gap-6 lg:grid-cols-12">

        {loading ? (
          <div className="lg:col-span-12 flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : subscriptionError || !hasActiveSubscription ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="lg:col-span-12"
          >
            <div className="rounded-3xl border border-border/50 bg-muted/40 dark:bg-white/[0.06] dark:border-white/10 overflow-hidden p-8">
              <NoSubscriptionState />
            </div>
          </motion.div>
        ) : (
          <>
            {/* ═══ SUBSCRIPTION OVERVIEW — full width hero card ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.04 }}
              className="lg:col-span-12"
            >
              <div className="relative rounded-3xl border border-border/50 bg-muted/40 dark:bg-white/[0.06] dark:border-white/10 overflow-hidden">
                {/* Ambient decorations */}
                <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/6 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-primary/4 blur-[100px] pointer-events-none" />

                <div className="relative z-10 p-8 sm:p-10">
                  {/* Top row: Plan name */}
                  <div className="flex items-center gap-4 mb-10">
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight truncate leading-none" title={isTrial ? t("dashboard.trial") : ((tariffDisplayName ?? subParsed.productName?.trim() ?? "").trim()) || t("dashboard.trial")}>
                        {isTrial ? t("dashboard.trial") : ((tariffDisplayName ?? subParsed.productName?.trim() ?? "").trim()) || t("dashboard.trial")}
                      </p>
                      {tariffCategoryName && (
                        <p className="text-sm text-muted-foreground mt-1 font-medium">{tariffCategoryName}</p>
                      )}
                      {isTrial && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3" />
                          {t("dashboard.trialLimitedNodesShort")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metric row — 3 or 4 giant stat blocks */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {/* Days remaining */}
                    {daysLeft != null && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {t("dashboard.validUntil")}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl sm:text-6xl font-black text-foreground tabular-nums tracking-tighter leading-none">
                            {daysLeft}
                          </span>
                          <span className="text-lg font-bold text-muted-foreground/70">
                            {lang.startsWith("zh") ? "天" : lang.startsWith("ru") ? "дн" : "d"}
                          </span>
                        </div>
                        {subParsed.expireAt && (
                          <p className="text-[11px] text-muted-foreground/70 font-medium">
                            {formatDate(subParsed.expireAt, lang)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Traffic */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {t("dashboard.traffic")}
                      </p>
                      {subParsed.trafficLimitBytes != null && subParsed.trafficLimitBytes > 0 ? (
                        <>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl sm:text-6xl font-black text-foreground tabular-nums tracking-tighter leading-none">
                              {trafficPercent ?? 0}
                            </span>
                            <span className="text-lg font-bold text-muted-foreground/70">%</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground/70 font-medium">
                            {formatBytes(subParsed.trafficUsed ?? 0, lang)} / {formatBytes(subParsed.trafficLimitBytes, lang)}
                          </p>
                          <div className="mt-1 h-1 w-full max-w-[160px] rounded-full bg-muted/20 dark:bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${trafficPercent ?? 0}%` }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              className="h-full rounded-full bg-primary/60"
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-5xl sm:text-6xl font-black text-foreground tracking-tighter leading-none">∞</span>
                      )}
                    </div>

                    {/* Devices */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {t("dashboard.devices")}
                      </p>
                      <span className="text-5xl sm:text-6xl font-black text-foreground tabular-nums tracking-tighter leading-none">
                        {usedDevicesCount}<span className="text-2xl sm:text-3xl font-bold text-muted-foreground/50">/{subParsed.hwidDeviceLimit != null && subParsed.hwidDeviceLimit > 0
                          ? subParsed.hwidDeviceLimit
                          : "∞"}</span>
                      </span>
                    </div>

                    {/* Quick action */}
                    <div className="flex flex-col justify-center space-y-3">
                      {vpnUrl ? (
                        <Link to="/cabinet/subscribe" className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98]">
                          <Link2 className="h-4 w-4 shrink-0" />
                          <span>{t("dashboard.setupVPN")}</span>
                        </Link>
                      ) : (
                        <Link to="/cabinet/tariffs" className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98]">
                          <Package className="h-4 w-4 shrink-0" />
                          <span>{t("dashboard.choosePlan")}</span>
                        </Link>
                      )}
                      <Link to="/cabinet/tariffs" className="group/link inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/40 bg-muted/20 dark:bg-white/5 text-[13px] font-medium text-muted-foreground transition-all duration-300 hover:bg-background/15 hover:text-foreground/80">
                        <span>{t("dashboard.changePlan")}</span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/link:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Bottom divider line with subtle gradient */}
                <div className="h-px bg-gradient-to-r from-transparent via-border/40 dark:via-white/10 to-transparent" />
              </div>
            </motion.div>
          </>
        )}

        {/* ═══ ROW 2: Balance (left 7) + Referral/Connection (right 5) ═══ */}

        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="lg:col-span-7 order-2 lg:order-none"
        >
          <div className="h-full rounded-3xl bg-muted/40 dark:bg-white/[0.06] border border-border/50 dark:border-white/10 p-8 sm:p-10 transition-all duration-500 hover:bg-muted/60 dark:hover:bg-white/10 hover:border-border/50 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 h-52 w-52 rounded-full bg-primary/6 blur-[100px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t("dashboard.balance")}</p>
                <p className="text-5xl sm:text-6xl font-black tracking-tighter text-foreground leading-none">
                  {formatMoney(client.balance, client.preferredCurrency)}
                </p>
              </div>
              <Link to="/cabinet/profile#topup" className="inline-flex h-12 shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98]">
                <PlusCircle className="h-4 w-4 shrink-0" />
                <span>{t("dashboard.topUpBalance")}</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="lg:col-span-5 order-1 lg:order-none"
        >
          <div className="h-full rounded-3xl bg-muted/40 dark:bg-white/[0.06] border border-border/50 dark:border-white/10 p-8 sm:p-10 transition-all duration-500 hover:bg-muted/60 dark:hover:bg-white/10 hover:border-border/50 relative overflow-hidden group">
            <div className="absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-primary/6 blur-[90px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 flex flex-col justify-center h-full">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5">{t("dashboard.quickActions")}</p>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/cabinet/announcements" className="flex flex-col items-center gap-2.5 rounded-2xl border border-border/30 dark:border-white/10 bg-background/60 dark:bg-white/[0.04] p-5 text-center transition-all duration-200 hover:bg-background/80 dark:hover:bg-white/[0.08] hover:border-primary/30 hover:shadow-sm active:scale-[0.97]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 dark:bg-white/10 text-muted-foreground">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground/80">{t("dashboard.latestAnnouncements")}</span>
                </Link>
                <Link to="/cabinet/traffic" className="flex flex-col items-center gap-2.5 rounded-2xl border border-border/30 dark:border-white/10 bg-background/60 dark:bg-white/[0.04] p-5 text-center transition-all duration-200 hover:bg-background/80 dark:hover:bg-white/[0.08] hover:border-primary/30 hover:shadow-sm active:scale-[0.97]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 dark:bg-white/10 text-muted-foreground">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground/80">{t("nav.traffic")}</span>
                </Link>
                <Link to="/cabinet/referral" className="flex flex-col items-center gap-2.5 rounded-2xl border border-border/30 dark:border-white/10 bg-background/60 dark:bg-white/[0.04] p-5 text-center transition-all duration-200 hover:bg-background/80 dark:hover:bg-white/[0.08] hover:border-primary/30 hover:shadow-sm active:scale-[0.97]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 dark:bg-white/10 text-muted-foreground">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground/80">{t("dashboard.referrals")}</span>
                </Link>
                <Link to="/cabinet/tickets" className="flex flex-col items-center gap-2.5 rounded-2xl border border-border/30 dark:border-white/10 bg-background/60 dark:bg-white/[0.04] p-5 text-center transition-all duration-200 hover:bg-background/80 dark:hover:bg-white/[0.08] hover:border-primary/30 hover:shadow-sm active:scale-[0.97]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 dark:bg-white/10 text-muted-foreground">
                    <TicketCheck className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground/80">{t("dashboard.tickets")}</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Announcement detail modal */}
      {announcementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setAnnouncementModal(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">{announcementModal.title}</h2>
              <button onClick={() => setAnnouncementModal(null)} className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {announcementModal.publishedAt && (
                <p className="text-xs text-zinc-400 mb-3">{new Date(announcementModal.publishedAt).toLocaleDateString()}</p>
              )}
              <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{announcementModal.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
