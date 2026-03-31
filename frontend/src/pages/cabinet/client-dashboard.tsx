import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  
  Package,
  Wallet,
  Wifi,
  Calendar,
  Monitor,
  Timer,
  Link2,
  ArrowRight,
  PlusCircle,
  RotateCcw,
  Copy,
  Check,
  Gift,
  Loader2,
  Users,
  
  AlertCircle,
} from "lucide-react";
import { useClientAuth } from "@/contexts/client-auth";
import { useCabinetConfig } from "@/contexts/cabinet-config";
import { useCabinetMiniapp } from "@/pages/cabinet/cabinet-layout";
import { api } from "@/lib/api";
import { formatDays } from "@/i18n";
import type { ClientPayment, ClientReferralStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { formatMoney, translateBackendMessage } from "@/lib/utils";

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
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [_payments, setPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMessage, setPaymentMessage] = useState<"success_topup" | "success_tariff" | "success" | "failed" | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [_referralStats, setReferralStats] = useState<ClientReferralStats | null>(null);

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
  const [referralCopied, setReferralCopied] = useState<"site" | "bot" | null>(null);
  const siteOrigin = config?.publicAppUrl?.replace(/\/$/, "") || (typeof window !== "undefined" ? window.location.origin : "");
  const referralLinkSite =
    client.referralCode && siteOrigin
      ? `${siteOrigin}/cabinet/register?ref=${encodeURIComponent(client.referralCode)}`
      : "";
  const referralLinkBot =
    client.referralCode && config?.telegramBotUsername
      ? `https://t.me/${config.telegramBotUsername.replace(/^@/, "")}?start=ref_${client.referralCode}`
      : "";
  const hasReferralLinks = Boolean(referralLinkSite || referralLinkBot);
  const copyReferral = (which: "site" | "bot") => {
    const url = which === "site" ? referralLinkSite : referralLinkBot;
    if (url) {
      navigator.clipboard.writeText(url);
      setReferralCopied(which);
      setTimeout(() => setReferralCopied(null), 2000);
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
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Package className="h-8 w-8 text-primary/70" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t("dashboard.noSubscription")}</h3>
        <p className="text-[14px] text-muted-foreground max-w-xs mt-2 mx-auto leading-relaxed">
          {t("dashboard.noSubscriptionDesc")}
        </p>
      </div>
      <Link to="/cabinet/tariffs" className="inline-flex h-11 mt-2 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-transform duration-300 hover:scale-105 hover:bg-primary/90">
        <span className="inline-flex items-center leading-none">{t("dashboard.choosePlan")}</span>
      </Link>
    </div>
  );

  if (isMiniapp) {
    return (
      <div className="w-full min-w-0 overflow-hidden space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {(paymentMessage === "success" || paymentMessage === "success_topup" || paymentMessage === "success_tariff") && (
          <div className="rounded-xl bg-green-500/15 backdrop-blur-md border border-green-500/30 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-400 shadow-sm">
            {paymentMessage === "success_topup"
              ? t("dashboard.paymentSuccessTopup")
              : paymentMessage === "success_tariff"
                ? t("dashboard.paymentSuccessTariff")
                : t("dashboard.paymentSuccess")}
          </div>
        )}
        {paymentMessage === "failed" && (
          <div className="rounded-xl bg-destructive/15 backdrop-blur-md border border-destructive/30 px-4 py-3 text-sm font-medium text-destructive shadow-sm">
            {t("dashboard.paymentFailed")}
          </div>
        )}

        {/* 1. Mobile subscription status hero */}
        {loading ? (
          <section className="rounded-[2rem] border border-border/50 bg-card/45 px-4 py-10 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          </section>
        ) : subscriptionError || !hasActiveSubscription ? (
          <section className="rounded-[2rem] border border-border/50 bg-card/45 p-4 shadow-sm backdrop-blur-xl">
            <NoSubscriptionState />
          </section>
        ) : (
          <section className="min-w-0 space-y-3">
            <div className="rounded-[1.85rem] border border-border/50 bg-card/45 p-5 shadow-sm backdrop-blur-xl relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-primary/15 blur-[50px] pointer-events-none" />

              <div className="relative z-10">
                {/* Header: icon + name + active badge */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[18px] font-bold tracking-tight text-foreground leading-snug truncate"
                      title={isTrial ? t("dashboard.trial") : ((tariffDisplayName ?? subParsed.productName?.trim() ?? "").trim()) || t("dashboard.trial")}
                    >
                      {isTrial ? t("dashboard.trial") : ((tariffDisplayName ?? subParsed.productName?.trim() ?? "").trim()) || t("dashboard.trial")}
                    </p>
                    {isTrial ? (
                      <div className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span className="truncate">{t("dashboard.trialLimitedNodesShort")}</span>
                      </div>
                    ) : tariffCategoryName ? (
                      <p className="text-[12px] text-muted-foreground truncate mt-0.5">{tariffCategoryName}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {t("dashboard.active")}
                  </span>
                </div>

                {/* Info grid: 2x2 compact layout */}
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {daysLeft != null && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-background/40 px-3 py-2.5">
                      <Timer className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-[12px] font-semibold text-foreground truncate">
                        {t("dashboard.daysLeft_many", { count: daysLeft })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 rounded-xl bg-background/40 px-3 py-2.5">
                    <Monitor className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-[12px] font-semibold text-foreground">
                      {subParsed.hwidDeviceLimit != null && subParsed.hwidDeviceLimit > 0 ? subParsed.hwidDeviceLimit : "∞"} {t("dashboard.devices")}
                    </span>
                  </div>
                  {subParsed.expireAt && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-background/40 px-3 py-2.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-[12px] font-semibold text-foreground truncate">
                        {formatDate(subParsed.expireAt, lang)}
                      </span>
                    </div>
                  )}
                  {trafficResetStrategy && RESET_STRATEGY_I18N[trafficResetStrategy] && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-background/40 px-3 py-2.5">
                      <RotateCcw className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-[12px] font-semibold text-foreground truncate">
                        {t(RESET_STRATEGY_I18N[trafficResetStrategy])}
                      </span>
                    </div>
                  )}
                </div>

                {/* Traffic section */}
                <div className="mt-4 rounded-[1.2rem] bg-background/35 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Wifi className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground leading-none">
                          {t("dashboard.traffic")}
                        </p>
                        <p className="mt-1 text-[14px] font-bold text-foreground truncate">
                          {subParsed.trafficLimitBytes != null && subParsed.trafficLimitBytes > 0
                            ? `${formatBytes(subParsed.trafficUsed ?? 0, lang)} / ${formatBytes(subParsed.trafficLimitBytes, lang)}`
                            : t("dashboard.unlimited")}
                        </p>
                      </div>
                    </div>

                    {trafficPercent != null && (
                      <span className="shrink-0 text-xl font-bold text-primary tabular-nums">
                        {trafficPercent}%
                      </span>
                    )}
                  </div>

                  {trafficPercent != null && (
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${trafficPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription URL — separate card */}
            {vpnUrl && (
              <div className="rounded-[1.85rem] border border-border/50 bg-card/45 p-5 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-2.5 mb-3">
                  <Link2 className="h-4 w-4 shrink-0 text-primary" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground leading-none">
                    {t("dashboard.subscriptionAddress")}
                  </p>
                </div>
                <code className="block w-full truncate rounded-xl bg-background/50 border border-border/50 px-3.5 py-3 text-[12px] font-mono text-foreground/80" title={vpnUrl}>
                  {vpnUrl}
                </code>
                <div className="flex items-center gap-2.5 mt-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl bg-background/50 hover:bg-background/80 transition-transform hover:scale-[1.02] gap-2 text-[13px] font-medium"
                    onClick={() => {
                      copySubUrl();
                      window.Telegram?.WebApp?.showPopup?.({ title: t("dashboard.copied"), message: t("subscribe.linkCopied") });
                    }}
                  >
                    {subUrlCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    <span>{subUrlCopied ? t("dashboard.copied") : t("dashboard.copySubAddress")}</span>
                  </Button>
                  <Link to="/cabinet/subscribe" className="inline-flex flex-1 h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90">
                    <Link2 className="h-4 w-4 shrink-0" />
                    <span>{t("dashboard.connectVPN")}</span>
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 2. Как подключиться — ссылка и кнопка (только если нет подписки) */}
        {!vpnUrl && (
        <section className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-4 shadow-sm overflow-hidden transition-all duration-300">
          <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-3">
             <div className="p-1.5 bg-primary/20 rounded-lg">
              <Wifi className="h-3.5 w-3.5 shrink-0 text-primary" />
            </div>
            {t("dashboard.connection")}
          </h2>
          {showTrial ? (
            <div className="space-y-3 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600 mb-1">
                 <Gift className="h-5 w-5" />
              </div>
              <p className="text-[13px] text-muted-foreground">
                {t("dashboard.trialDesc", { days: formatDays(trialDays, lang) })}
              </p>
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm h-11 rounded-xl hover:scale-[1.02] transition-transform duration-300" onClick={activateTrial} disabled={trialLoading}>
                {trialLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Gift className="h-4 w-4 shrink-0" />}
                <span className="font-medium text-[14px]">{t("dashboard.activateTrial")}</span>
              </Button>
              {trialError && <p className="text-sm text-destructive break-words text-center">{trialError}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-[13px] text-primary flex gap-2.5 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{t("dashboard.noLinkDesc")}</p>
              </div>
              <Link to="/cabinet/tariffs" className="inline-flex w-full h-10 items-center justify-center rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90">
                <span className="inline-flex items-center leading-none">{t("dashboard.choosePlan")}</span>
              </Link>
            </div>
          )}
        </section>
        )}

        {/* 3. Баланс */}
        <section className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl px-4 py-4 shadow-sm overflow-hidden flex items-center justify-between gap-3 transition-all duration-300">
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-0.5">{t("dashboard.myBalance")}</h2>
            <p className="text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(client.balance, client.preferredCurrency)}</p>
          </div>
          <Link to="/cabinet/profile#topup" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90">
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span className="inline-flex items-center leading-none">{t("dashboard.topUp")}</span>
          </Link>
        </section>
      </div>
    );
  }

  // DESKTOP LAYOUT
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {/* Hero + CTA */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-card/40 backdrop-blur-2xl border border-border/50 p-8 sm:p-10 shadow-sm"
      >
        {/* Декоративное свечение */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              {t("dashboard.welcome")}{client.email ? `, ${client.email.split("@")[0]}` : client.telegramUsername ? `, @${client.telegramUsername}` : ""}
            </h1>
            <p className="mt-3 text-[16px] text-muted-foreground max-w-xl leading-relaxed">
              {hasActiveSubscription
                ? t("dashboard.activeSubscriptionDesc")
                : t("dashboard.noSubscriptionHeroDesc")}
            </p>
            
            {(paymentMessage === "success" || paymentMessage === "success_topup" || paymentMessage === "success_tariff") && (
              <div className="mt-4 inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 px-4 py-2 rounded-xl text-green-700 dark:text-green-400 font-medium text-sm">
                <Check className="h-4 w-4" />
                {paymentMessage === "success_topup" ? t("dashboard.balancePaid") : paymentMessage === "success_tariff" ? t("dashboard.planActivated") : t("dashboard.paymentSuccess")}
              </div>
            )}
            {paymentMessage === "failed" && (
              <div className="mt-4 inline-flex items-center gap-2 bg-destructive/15 border border-destructive/30 px-4 py-2 rounded-xl text-destructive font-medium text-sm">
                <AlertCircle className="h-4 w-4" />
                {t("dashboard.paymentFailed")}
              </div>
            )}
            {trialError && <p className="mt-3 text-sm text-destructive font-medium">{trialError}</p>}
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 min-w-[240px]">
            {showTrial ? (
              <Button size="lg" className="w-full gap-2 shadow-sm bg-green-600 hover:bg-green-700 text-white rounded-xl h-14 hover:scale-105 transition-transform [&_svg]:self-center [&_span]:leading-none" onClick={activateTrial} disabled={trialLoading}>
                {trialLoading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <Gift className="h-5 w-5 shrink-0" />}
                <span className="inline-flex items-center text-base font-medium leading-none">{t("dashboard.freeTrial")}</span>
              </Button>
            ) : vpnUrl ? (
              <Link to="/cabinet/subscribe" className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 hover:bg-primary/90 [&_svg]:self-center [&_span]:leading-none">
                <Link2 className="h-5 w-5 shrink-0" />
                <span className="inline-flex items-center text-base font-medium leading-none">{t("dashboard.setupVPN")}</span>
              </Link>
            ) : (
              <Link to="/cabinet/tariffs" className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 hover:bg-primary/90 [&_svg]:self-center [&_span]:leading-none">
                <Package className="h-5 w-5 shrink-0" />
                <span className="inline-flex items-center text-base font-medium leading-none">{t("dashboard.choosePlan")}</span>
              </Link>
            )}
            <Link to="/cabinet/profile#topup" className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/50 transition-transform hover:scale-105 hover:bg-background/80 [&_svg]:self-center [&_span]:leading-none">
              <PlusCircle className="h-5 w-5 shrink-0 text-foreground/70" />
              <span className="inline-flex items-center text-base font-medium leading-none">{t("dashboard.topUpBalance")}</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Bento grid — 12-col, 3 rows */}
      <div className="grid gap-5 lg:grid-cols-12 auto-rows-auto">

        {/* ═══ ROW 1: Subscription status hero — full width ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="lg:col-span-12"
        >
          <Card className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-primary/15 blur-[90px] pointer-events-none group-hover:bg-primary/25 transition-colors duration-700" />
            <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-[70px] pointer-events-none" />

            <CardContent className="relative z-10 p-6 sm:p-8">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>
              ) : subscriptionError || !hasActiveSubscription ? (
                <NoSubscriptionState />
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Top row: title + active badge */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/20 rounded-xl shadow-inner border border-primary/10">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">{t("dashboard.mySubscription")}</h2>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/20 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                      {t("dashboard.active")}
                    </span>
                  </div>

                  {/* Main metrics row: 4 items in a row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                    {/* Plan — hero metric */}
                    {((tariffDisplayName ?? subParsed.productName) || client?.trialUsed) && (
                      <div className="relative rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5 overflow-hidden flex flex-col">
                        <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-primary/20 blur-[40px] pointer-events-none" />
                        <div className="relative flex items-center gap-2 mb-auto">
                          <Package className="h-4 w-4 text-primary" />
                          <p className="text-[11px] font-bold uppercase tracking-wider text-primary/80 truncate">
                            {tariffCategoryName || t("dashboard.plan")}
                          </p>
                        </div>
                        <div className="relative mt-3">
                          <p className="text-xl font-bold truncate text-foreground" title={isTrial ? t("dashboard.trial") : ((tariffDisplayName ?? subParsed.productName?.trim() ?? "").trim()) || t("dashboard.trial")}>
                            {isTrial ? t("dashboard.trial") : ((tariffDisplayName ?? subParsed.productName?.trim() ?? "").trim()) || t("dashboard.trial")}
                          </p>
                          {isTrial && (
                            <div className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span className="truncate">{t("dashboard.trialLimitedNodesShort")}</span>
                            </div>
                          )}
                          {trafficResetStrategy && RESET_STRATEGY_I18N[trafficResetStrategy] && (
                            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              <RotateCcw className="h-3 w-3 shrink-0" />
                              <span className="truncate">{t(RESET_STRATEGY_I18N[trafficResetStrategy])}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Days left */}
                    {daysLeft != null && (
                      <div className="rounded-2xl bg-background/40 border border-border/50 p-5 transition-colors hover:bg-background/60 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-auto">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("dashboard.validUntil")}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-lg font-bold text-foreground">
                            {t("dashboard.daysLeft_many", { count: daysLeft })}
                          </p>
                          {subParsed.expireAt && (
                            <p className="text-[12px] text-muted-foreground mt-1 font-medium">
                              {formatDate(subParsed.expireAt, lang)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Traffic */}
                    <div className="rounded-2xl bg-background/40 border border-border/50 p-5 transition-colors hover:bg-background/60 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-auto">
                        <Wifi className="h-4 w-4 text-primary" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("dashboard.traffic")}</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-lg font-bold text-foreground">
                          {subParsed.trafficLimitBytes != null && subParsed.trafficLimitBytes > 0
                            ? `${formatBytes(subParsed.trafficUsed ?? 0, lang)} / ${formatBytes(subParsed.trafficLimitBytes, lang)}`
                            : t("dashboard.unlimited")}
                        </p>
                        {trafficPercent != null && (
                          <div className="mt-2 h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${trafficPercent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Devices */}
                    <div className="rounded-2xl bg-background/40 border border-border/50 p-5 transition-colors hover:bg-background/60 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-auto">
                        <Monitor className="h-4 w-4 text-primary" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("dashboard.devices")}</p>
                      </div>
                      <p className="text-lg font-bold text-foreground mt-3">
                        {subParsed.hwidDeviceLimit != null && subParsed.hwidDeviceLimit > 0
                          ? subParsed.hwidDeviceLimit
                          : "∞"}
                      </p>
                    </div>
                  </div>

                  {/* Subscription URL */}
                  {vpnUrl && (
                    <div className="rounded-2xl bg-background/40 border border-border/50 p-4 transition-colors hover:bg-background/60 shadow-sm">
                      <div className="flex items-center gap-2 mb-2.5">
                        <Link2 className="h-4 w-4 text-primary" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("dashboard.subscriptionAddress")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 min-w-0 truncate rounded-xl bg-background/50 border border-border/50 px-3 py-2.5 text-[13px] font-mono text-foreground/80" title={vpnUrl}>
                          {vpnUrl}
                        </code>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <Button variant="outline" onClick={copySubUrl} className="flex-1 h-10 rounded-xl hover:scale-[1.02] transition-transform border border-border/50 bg-background/50 gap-2 text-[13px] font-medium">
                          {subUrlCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-foreground/70" />}
                          <span>{subUrlCopied ? t("dashboard.copied") : t("dashboard.copySubAddress")}</span>
                        </Button>
                        <Link to="/cabinet/subscribe" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] hover:bg-primary/90">
                          <Link2 className="h-4 w-4 shrink-0" />
                          <span>{t("dashboard.connectVPN")}</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ ROW 2: Balance (left 7) + Referral (right 5) ═══ */}

        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="lg:col-span-7"
        >
          <Card className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm transition-all duration-300 h-full relative overflow-hidden group">
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-[70px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />

            <CardContent className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-primary/20 rounded-xl shadow-inner border border-primary/10">
                    <Wallet className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("dashboard.balance")}</p>
                    <p className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm leading-none">
                      {formatMoney(client.balance, client.preferredCurrency)}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1">{t("dashboard.onAccount")}</p>
                  </div>
                </div>
                <Link to="/cabinet/profile#topup" className="inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-[15px] font-medium text-primary-foreground shadow-sm transition-transform hover:scale-105 hover:bg-primary/90 [&_svg]:self-center [&_span]:leading-none">
                  <PlusCircle className="h-5 w-5 shrink-0" />
                  <span className="inline-flex items-center leading-none">{t("dashboard.topUpBalance")}</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral / Connection */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-5"
        >
          <Card className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm transition-all duration-300 h-full relative overflow-hidden group">
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-primary/10 blur-[60px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />

            <CardContent className="relative z-10 p-6 sm:p-8 flex flex-col justify-center h-full">
              {hasReferralLinks ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 bg-primary/20 rounded-xl shadow-inner border border-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{t("dashboard.referrals")}</h3>
                  </div>
                  <p className="text-[14px] text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: t("dashboard.referralShareDesc") }}
                  />
                  {referralLinkSite && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("dashboard.site")}</p>
                      <div className="flex items-center gap-2">
                        <code className="rounded-xl bg-background/50 border border-border/50 px-3 py-2.5 text-[13px] font-mono flex-1 truncate block text-foreground/80" title={referralLinkSite}>
                          {referralLinkSite}
                        </code>
                        <Button variant="secondary" size="icon" onClick={() => copyReferral("site")} className="shrink-0 h-10 w-10 rounded-xl hover:scale-105 transition-transform border border-border/50 bg-background/50" title={t("common.copy")}>
                          {referralCopied === "site" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-foreground/70" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  <Link to="/cabinet/referral" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/30 text-[14px] transition-colors hover:bg-background/60 [&_svg]:self-center [&_span]:leading-none">
                    <span className="inline-flex items-center leading-none">{t("dashboard.referralStats")}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                </div>
              ) : vpnUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 bg-primary/20 rounded-xl shadow-inner border border-primary/10">
                      <Wifi className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{t("dashboard.connection")}</h3>
                  </div>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">{t("dashboard.vpnReadyDesc")}</p>
                  <Link to="/cabinet/subscribe" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] text-primary-foreground shadow-sm transition-transform hover:scale-105 hover:bg-primary/90 [&_svg]:self-center [&_span]:leading-none">
                    <Link2 className="h-5 w-5 shrink-0" />
                    <span className="inline-flex items-center leading-none">{t("dashboard.setupVPN")}</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 bg-background/50 rounded-xl shadow-inner border border-border/50">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{t("dashboard.connection")}</h3>
                  </div>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">{t("dashboard.payToGetLink")}</p>
                  <Link to="/cabinet/tariffs" className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border/50 bg-background/30 text-[15px] transition-colors hover:bg-background/60 [&_span]:leading-none">
                    <span className="inline-flex items-center leading-none">{t("dashboard.choosePlan")}</span>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
