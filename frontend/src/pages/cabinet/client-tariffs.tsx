import { useEffect, useState, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Calendar,
  Wifi,
  Smartphone,
  CreditCard,
  Loader2,
  Gift,
  Tag,
  Check,
  Wallet,
  Shield,
  Zap,
  ArrowLeft,
  Flame,
  RotateCcw,
  Info,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { useClientAuth } from "@/contexts/client-auth";
import { api } from "@/lib/api";
import type { PublicTariffCategory } from "@/lib/api";
import { formatDays } from "@/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCabinetMiniapp } from "@/pages/cabinet/cabinet-layout";
import { useCabinetConfig } from "@/contexts/cabinet-config";
import { openPaymentInBrowser } from "@/lib/open-payment-url";
import { cn, formatMoney, translateBackendMessage, translatePlategaLabel } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { AiFillAlipaySquare, AiFillWechat } from "react-icons/ai";

function formatPricePerGB(price: number, trafficLimitBytes: number | null, currency: string, durationDays?: number, trafficResetStrategy?: string) {
  if (!trafficLimitBytes || trafficLimitBytes <= 0) return null;
  const gb = trafficLimitBytes / 1024 / 1024 / 1024;
  if (gb <= 0) return null;
  let resetPeriods = 1;
  if (durationDays && durationDays > 0 && trafficResetStrategy) {
    if (trafficResetStrategy === "MONTH" || trafficResetStrategy === "MONTH_ROLLING") resetPeriods = Math.max(1, Math.floor(durationDays / 30));
    else if (trafficResetStrategy === "WEEK") resetPeriods = Math.max(1, Math.floor(durationDays / 7));
    else if (trafficResetStrategy === "DAY") resetPeriods = Math.max(1, durationDays);
  }
  const effectiveGB = gb * resetPeriods;
  return formatMoney(price / effectiveGB, currency, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const RESET_STRATEGY_I18N: Record<string, string> = {
  NO_RESET: "tariffs.resetNoReset",
  DAY: "tariffs.resetDay",
  WEEK: "tariffs.resetWeek",
  MONTH: "tariffs.resetMonth",
  MONTH_ROLLING: "tariffs.resetMonthRolling",
};

function getEpayMethodPresentation(methodType: string) {
  const key = methodType.trim().toLowerCase();

  if (key === "alipay") {
    return {
      icon: <AiFillAlipaySquare className="h-5 w-5 text-[#1677FF]" />,
      iconBg: "bg-blue-500/15",
    };
  }

  if (key === "wxpay" || key === "wechat" || key === "wechatpay") {
    return {
      icon: <AiFillWechat className="h-5 w-5 text-[#07C160]" />,
      iconBg: "bg-green-500/15",
    };
  }

  return {
    icon: <CreditCard className="h-5 w-5 text-blue-500" />,
    iconBg: "bg-blue-500/15",
  };
}

type TariffForPay = {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string | null;
  durationDays?: number;
  trafficLimitBytes?: number | null;
  deviceLimit?: number | null;
};

/* ── Isolated promo input to avoid re-rendering entire page on keystroke ── */
const PromoCodeInput = memo(function PromoCodeInput({
  onApply,
  onCancel,
  checking,
  disabled,
  isMobile,
  result,
  error,
  t,
}: {
  onApply: (code: string) => void;
  onCancel: () => void;
  checking: boolean;
  disabled: boolean;
  isMobile: boolean;
  result: { name: string; discountPercent?: number | null; discountFixed?: number | null } | null;
  error: string | null;
  t: (k: string) => string;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 py-1">
        <Tag className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">{t("tariffs.promoCode")}</span>
      </div>

      {result ? (
        /* ── Applied state: show result + cancel button ── */
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
            <Check className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {result.name}: -{result.discountPercent ? `${result.discountPercent}%` : ""}
              {result.discountFixed ? ` ${result.discountFixed}` : ""}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => { setInput(""); onCancel(); }}
            className={cn(
              "shrink-0 font-bold text-destructive hover:text-destructive",
              isMobile
                ? "h-12 px-4 rounded-2xl text-sm"
                : "h-11 px-4 rounded-xl text-sm"
            )}
          >
            {t("common.cancel")}
          </Button>
        </div>
      ) : (
        /* ── Input state: show input + apply button ── */
        <>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              name="promo_code"
              autoComplete="off"
              inputMode="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("tariffs.enterPromoCode")}
              className={cn(
                "font-mono font-medium focus-visible:ring-primary/50",
                isMobile
                  ? "text-base bg-muted/40 dark:bg-white/[0.06] border-white/5 h-12 rounded-2xl"
                  : "text-sm bg-background border-border/50 dark:border-white/10 h-11 rounded-xl"
              )}
              disabled={disabled || checking}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  onApply(input.trim());
                }
              }}
            />
            <Button
              onClick={() => onApply(input.trim())}
              disabled={!input.trim() || disabled || checking}
              className={cn(
                "shrink-0 font-bold",
                isMobile
                  ? "h-12 px-5 rounded-2xl text-sm"
                  : "h-11 px-4 rounded-xl text-sm"
              )}
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("tariffs.apply")
              )}
            </Button>
          </div>
          {error && (
            <p className="text-sm font-medium text-destructive px-1">{error}</p>
          )}
        </>
      )}
    </div>
  );
});

export function ClientTariffsPage() {
  const { state, refreshProfile } = useClientAuth();
  const token = state.token;
  const client = state.client;
  const config = useCabinetConfig();
  const [tariffs, setTariffs] = useState<PublicTariffCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<{ tariff: TariffForPay } | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const { t, i18n } = useTranslation();

  // Derive payment methods from shared config
  const plategaMethods = config?.plategaMethods ?? [];
  const yoomoneyEnabled = Boolean(config?.yoomoneyEnabled);
  const yookassaEnabled = Boolean(config?.yookassaEnabled);
  const cryptopayEnabled = Boolean(config?.cryptopayEnabled);
  const heleketEnabled = Boolean(config?.heleketEnabled);
  const epayMethods = config?.epayMethods ?? [];
  const trialConfig = { trialEnabled: !!config?.trialEnabled, trialDays: config?.trialDays ?? 0 };

  // Promo code
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{
    type: string;
    discountPercent?: number | null;
    discountFixed?: number | null;
    name: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Mobile: selected category index
  const [selectedCatIndex, setSelectedCatIndex] = useState(0);
  // Selected sub-group index per category (by category id)
  const [selectedSubGroupIndex, setSelectedSubGroupIndex] = useState<Record<string, number>>({});
  const [showPlanInfo, setShowPlanInfo] = useState(false);

  const showTrial = trialConfig.trialEnabled && !client?.trialUsed;
  const isMobileOrMiniapp = useCabinetMiniapp();

  useEffect(() => {
    api
      .getPublicTariffs()
      .then((r) => {
        setTariffs(r.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // 获取当前订阅状态（判断是否为试用）
    if (token) {
      api.clientSubscription(token).then((r) => setIsTrial(r.isTrial ?? false)).catch(() => {});
    }
  }, [token]);

  async function activateTrial() {
    if (!token) return;
    setTrialError(null);
    setTrialLoading(true);
    try {
      await api.clientActivateTrial(token);
      await refreshProfile();
    } catch (e) {
      setTrialError(e instanceof Error ? translateBackendMessage(e.message, t) : t("tariffs.trialError"));
    } finally {
      setTrialLoading(false);
    }
  }

  const checkPromo = useCallback(async (code: string) => {
    if (!token || !code) return;
    setPromoChecking(true);
    setPromoError(null);
    setPromoResult(null);
    try {
      const tariffId = payModal?.tariff?.id;
      const res = await api.clientCheckPromoCode(token, code, tariffId);
      if (res.type === "DISCOUNT") {
        setPromoResult(res);
        setPromoCode(code);
      } else {
        const activateRes = await api.clientActivatePromoCode(token, code);
        setPromoError(null);
        setPromoResult(null);
        setPayModal(null);
        alert(translateBackendMessage(activateRes.message, t));
        await refreshProfile();
        return;
      }
    } catch (e) {
      setPromoError(e instanceof Error ? translateBackendMessage(e.message, t) : t("common.error"));
      setPromoResult(null);
    } finally {
      setPromoChecking(false);
    }
  }, [token, payModal?.tariff?.id, t, refreshProfile]);

  function getDiscountedPrice(price: number): number {
    if (!promoResult) return price;
    let final = price;
    if (promoResult.discountPercent && promoResult.discountPercent > 0) {
      final -= (final * promoResult.discountPercent) / 100;
    }
    if (promoResult.discountFixed && promoResult.discountFixed > 0) {
      final -= promoResult.discountFixed;
    }
    return Math.max(0, Math.round(final * 100) / 100);
  }

  async function startPayment(tariff: TariffForPay, methodId: number) {
    if (!token) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.clientCreatePlategaPayment(token, {
        amount: tariff.price,
        currency: tariff.currency,
        paymentMethod: methodId,
        description: tariff.name,
        tariffId: tariff.id,
        promoCode: promoResult ? promoCode : undefined,
      });
      setPayModal(null);
      setPromoResult(null);
      openPaymentInBrowser(res.paymentUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("tariffs.paymentError"));
    } finally {
      setPayLoading(false);
    }
  }

  async function payByBalance(tariff: TariffForPay) {
    if (!token) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.clientPayByBalance(token, {
        tariffId: tariff.id,
        promoCode: promoResult ? promoCode : undefined,
      });
      setPayModal(null);
      setPromoResult(null);
      const msg = res.tariffName && res.amount != null && res.currency
        ? t("tariffs.balancePaySuccess", { name: res.tariffName, amount: res.amount.toFixed(2), currency: res.currency })
        : translateBackendMessage(res.message, t);
      alert(msg);
      await refreshProfile();
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("tariffs.paymentError"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startYoomoneyPayment(tariff: TariffForPay) {
    if (!token) return;
    if (tariff.currency.toUpperCase() !== "RUB") {
      setPayError(t("tariffs.yoomoneyRubOnly"));
      return;
    }
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.yoomoneyCreateFormPayment(token, {
        amount: tariff.price,
        paymentType: "AC",
        tariffId: tariff.id,
        promoCode: promoResult ? promoCode : undefined,
      });
      setPayModal(null);
      setPromoResult(null);
      if (res.paymentUrl) openPaymentInBrowser(res.paymentUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("tariffs.paymentError"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startYookassaPayment(tariff: TariffForPay) {
    if (!token) return;
    if (tariff.currency.toUpperCase() !== "RUB") {
      setPayError(t("tariffs.yookassaRubOnly"));
      return;
    }
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.yookassaCreatePayment(token, {
        amount: tariff.price,
        currency: "RUB",
        tariffId: tariff.id,
        promoCode: promoResult ? promoCode : undefined,
      });
      setPayModal(null);
      setPromoResult(null);
      if (res.confirmationUrl) openPaymentInBrowser(res.confirmationUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("tariffs.paymentError"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startCryptopayPayment(tariff: TariffForPay) {
    if (!token) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.cryptopayCreatePayment(token, {
        amount: tariff.price,
        currency: tariff.currency,
        tariffId: tariff.id,
        promoCode: promoResult ? promoCode : undefined,
      });
      setPayModal(null);
      setPromoResult(null);
      if (res.payUrl) openPaymentInBrowser(res.payUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("tariffs.paymentError"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startHeleketPayment(tariff: TariffForPay) {
    if (!token) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.heleketCreatePayment(token, {
        amount: tariff.price,
        currency: tariff.currency,
        tariffId: tariff.id,
        promoCode: promoResult ? promoCode : undefined,
      });
      setPayModal(null);
      setPromoResult(null);
      if (res.payUrl) openPaymentInBrowser(res.payUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("tariffs.paymentError"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startEpayPayment(tariff: TariffForPay, epayType: string) {
    if (!token) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.epayCreatePayment(token, {
        amount: tariff.price,
        currency: tariff.currency,
        tariffId: tariff.id,
        promoCode: promoResult ? promoCode : undefined,
        type: epayType,
      });
      setPayModal(null);
      setPromoResult(null);
      if (res.payUrl) openPaymentInBrowser(res.payUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("tariffs.paymentError"));
    } finally {
      setPayLoading(false);
    }
  }

  const closePayment = () => {
    setPayModal(null);
    setPromoResult(null);
    setPromoCode("");
    setPromoError(null);
    setPayError(null);
  };

  // ── Payment content (shared for mobile page + desktop dialog) ──────────
  const PaymentContent = () => {
    if (!payModal) return null;
    const tariff = payModal.tariff;
    const price = promoResult ? getDiscountedPrice(tariff.price) : tariff.price;
    const hasBalance = client ? client.balance >= price : false;

    return (
      <div className="space-y-5">
        {/* Tariff summary */}
        <div
          className={cn(
            "rounded-2xl relative overflow-hidden",
            isMobileOrMiniapp
              ? "bg-muted/40 dark:bg-white/[0.06] border border-white/5 p-5"
              : "bg-muted/40 dark:bg-white/10 border border-border/50 dark:border-white/10 p-4"
          )}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">
                {isMobileOrMiniapp ? t("tariffs.totalToPay") : t("tariffs.tariffLabel")}
              </p>
              {!isMobileOrMiniapp && (
                <p className="font-bold text-foreground">{tariff.name}</p>
              )}
              {isMobileOrMiniapp && (
                <div className="flex items-baseline gap-2 mt-1">
                  {promoResult ? (
                    <>
                      <span className="text-3xl font-black text-primary">
                        {formatMoney(price, tariff.currency)}
                      </span>
                      <span className="text-lg line-through text-muted-foreground decoration-2">
                        {formatMoney(tariff.price, tariff.currency)}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-black text-primary">
                      {formatMoney(tariff.price, tariff.currency)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {!isMobileOrMiniapp && (
              <div className="text-right">
                {promoResult ? (
                  <div className="flex flex-col items-end">
                    <span className="line-through text-muted-foreground/70 text-sm decoration-2">
                      {formatMoney(tariff.price, tariff.currency)}
                    </span>
                    <span className="font-bold text-xl text-primary">
                      {formatMoney(price, tariff.currency)}
                    </span>
                  </div>
                ) : (
                  <span className="font-bold text-xl text-primary">
                    {formatMoney(tariff.price, tariff.currency)}
                  </span>
                )}
              </div>
            )}
          </div>

          {isMobileOrMiniapp && (
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
              <div className="bg-background/40 rounded-2xl p-3 border border-white/5">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
                  {t("tariffs.duration")}
                </p>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  {tariff.durationDays} {t("tariffs.days")}
                </div>
              </div>
              <div className="bg-background/40 rounded-2xl p-3 border border-white/5">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
                  {t("tariffs.traffic")}
                </p>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <Wifi className="h-4 w-4 text-primary" />
                  {tariff.trafficLimitBytes != null && tariff.trafficLimitBytes > 0
                    ? `${(tariff.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(1)} GB`
                    : "∞"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Override warning — 试用套餐不提示覆盖 */}
        {client?.remnawaveUuid && !isTrial && (
          <div className={cn(
            "flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5",
          )}>
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-[13px] leading-relaxed text-amber-800 dark:text-amber-200 font-medium">
              {t("tariffs.overrideWarning")}
            </p>
          </div>
        )}

        {/* Promo code */}
        <PromoCodeInput
          onApply={checkPromo}
          onCancel={() => { setPromoCode(""); setPromoResult(null); setPromoError(null); }}
          checking={promoChecking}
          disabled={payLoading}
          isMobile={isMobileOrMiniapp}
          result={promoResult}
          error={promoError}
          t={t}
        />

        {/* Payment methods */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{t("tariffs.paymentMethod")}</span>
          </div>

          {payError && (
            <div
              className={cn(
                "p-3 bg-destructive/10 border border-destructive/20 text-destructive text-center font-bold text-sm",
                isMobileOrMiniapp ? "rounded-2xl" : "rounded-xl"
              )}
            >
              {payError}
            </div>
          )}

          {/* Payment grid (2 cols on mobile, list on desktop) */}
          <div
            className={cn(
              isMobileOrMiniapp
                ? "grid grid-cols-2 gap-2.5"
                : "flex flex-col gap-2.5"
            )}
          >
            {/* Balance */}
            {client && (
              <button
                type="button"
                onClick={() => payByBalance(tariff)}
                disabled={payLoading || !hasBalance}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
                  isMobileOrMiniapp
                    ? "flex-col items-center justify-center p-4 border-white/5 bg-muted/40 dark:bg-white/[0.06] hover:bg-muted/60 dark:hover:bg-white/10 hover:border-primary/30 active:scale-95 col-span-2"
                    : "px-4 py-3.5 bg-gradient-to-r from-primary to-primary/80 border-transparent text-primary-foreground hover:shadow-lg hover:-translate-y-0.5"
                )}
              >
                {isMobileOrMiniapp ? (
                  <>
                    <div className="p-2.5 rounded-xl bg-primary/15">
                      {payLoading ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : (
                        <Wallet className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground leading-tight">
                        {t("tariffs.payFromBalance")}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatMoney(client.balance, tariff.currency)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {payLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                    ) : (
                      <Wallet className="h-5 w-5 shrink-0" />
                    )}
                    <span className="font-semibold text-sm flex-1 text-left">
                      {t("tariffs.payFromBalance")}
                    </span>
                    <span className="font-mono text-sm opacity-80 bg-black/10 px-2 py-0.5 rounded-lg">
                      {formatMoney(client.balance, tariff.currency)}
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Crypto */}
            {cryptopayEnabled && (
              <PayMethodButton
                isMobile={isMobileOrMiniapp}
                icon={<Zap className="h-5 w-5 text-yellow-500" />}
                iconBg="bg-yellow-500/15"
                label={t("common.cryptoBot")}
                onClick={() => startCryptopayPayment(tariff)}
                disabled={payLoading}
              />
            )}

            {/* Heleket */}
            {heleketEnabled && (
              <PayMethodButton
                isMobile={isMobileOrMiniapp}
                icon={<Zap className="h-5 w-5 text-orange-500" />}
                iconBg="bg-orange-500/15"
                label="Heleket"
                onClick={() => startHeleketPayment(tariff)}
                disabled={payLoading}
              />
            )}

            {/* ePay methods */}
            {epayMethods.map((m) => {
              const presentation = getEpayMethodPresentation(m.type);

              return (
                <PayMethodButton
                  key={m.type}
                  isMobile={isMobileOrMiniapp}
                  icon={presentation.icon}
                  iconBg={presentation.iconBg}
                  label={m.label}
                  onClick={() => startEpayPayment(tariff, m.type)}
                  disabled={payLoading}
                />
              );
            })}

            {/* YooKassa */}
            {yookassaEnabled && tariff.currency.toUpperCase() === "RUB" && (
              <PayMethodButton
                isMobile={isMobileOrMiniapp}
                icon={<CreditCard className="h-5 w-5 text-green-500" />}
                iconBg="bg-green-500/15"
                label={t("tariffs.sbp")}
                onClick={() => startYookassaPayment(tariff)}
                disabled={payLoading}
              />
            )}

            {/* YooMoney */}
            {yoomoneyEnabled && tariff.currency.toUpperCase() === "RUB" && (
              <PayMethodButton
                isMobile={isMobileOrMiniapp}
                icon={<CreditCard className="h-5 w-5 text-green-500" />}
                iconBg="bg-green-500/15"
                label={t("tariffs.yoomoney")}
                onClick={() => startYoomoneyPayment(tariff)}
                disabled={payLoading}
              />
            )}

            {/* Platega methods */}
            {plategaMethods.map((m) => (
              <PayMethodButton
                key={m.id}
                isMobile={isMobileOrMiniapp}
                icon={<CreditCard className="h-5 w-5 text-green-500" />}
                iconBg="bg-green-500/15"
                label={translatePlategaLabel(m, t)}
                onClick={() => startPayment(tariff, m.id)}
                disabled={payLoading}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <>
      <AnimatePresence mode="wait">
        {/* MOBILE: payment page */}
        {isMobileOrMiniapp && payModal ? (
          <motion.div
            key="payment-view"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col w-full rounded-[2rem] border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/[0.06] relative"
          >
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50 dark:border-white/10 bg-background/30 backdrop-blur-md rounded-t-[2rem]">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9 rounded-full bg-muted/40 dark:bg-white/10 hover:bg-background/80"
                onClick={closePayment}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold truncate text-foreground">
                  {t("tariffs.payTitle")}
                </h2>
                <p className="text-[11px] font-medium text-muted-foreground truncate">
                  {payModal.tariff.name}
                </p>
              </div>
            </div>
            <div className="p-4 pb-8">
              <PaymentContent />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="tariffs-list"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 max-w-6xl mx-auto"
          >
            {/* Header */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {t("tariffs.title")}
                </h1>
                <button
                  type="button"
                  onClick={() => setShowPlanInfo((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 border shrink-0",
                    showPlanInfo
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-muted/40 dark:bg-white/10 text-muted-foreground border-border/50 dark:border-white/10 hover:bg-background/80 hover:text-foreground"
                  )}
                >
                  <Info className="h-3.5 w-3.5" />
                  {t("tariffs.planInfoBtn")}
                </button>
              </div>
              <p className="text-muted-foreground text-[15px] font-medium max-w-2xl">
                {t("tariffs.subtitle")}
              </p>
            </div>

            {/* Plan info panel */}
            <AnimatePresence>
              {showPlanInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl px-4 py-3 space-y-1">
                    {/* <p className="text-[12px] text-muted-foreground leading-relaxed">{t("tariffs.planInfoStandard")}</p> */}
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{t("tariffs.planInfoPremium")}</p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{t("tariffs.planInfoNoReset")}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trial banner */}
            {showTrial && (
              <Card className="rounded-[2rem] border border-green-500/30 bg-green-500/5 backdrop-blur-xl">
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/20 text-green-500 shrink-0">
                      <Gift className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-foreground">{t("tariffs.trialTitle")}</p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {trialConfig.trialDays > 0
                          ? `${formatDays(trialConfig.trialDays, i18n.language)} ${t("tariffs.trialDesc")}`
                          : t("tariffs.trialDescNodays")}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg h-12 rounded-xl gap-2 shrink-0"
                    onClick={activateTrial}
                    disabled={trialLoading}
                  >
                    {trialLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Gift className="h-5 w-5" />
                    )}
                    {t("tariffs.activateTrial")}
                  </Button>
                </CardContent>
                {trialError && (
                  <p className="text-sm text-destructive px-6 pb-4 font-medium">{trialError}</p>
                )}
              </Card>
            )}

            {/* Tariffs */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              </div>
            ) : tariffs.length === 0 ? (
              <Card className="rounded-[2rem] border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/[0.06]">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
                  <Package className="h-12 w-12 opacity-20" />
                  <p className="text-base font-medium">{t("tariffs.noTariffs")}</p>
                </CardContent>
              </Card>
            ) : isMobileOrMiniapp ? (
              // ── MOBILE: full-width vertical stacked cards ─────────────
              <div className="space-y-4">
                {tariffs.length > 1 && (
                  <div className="overflow-hidden">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pr-1">
                    {tariffs.map((cat, idx) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCatIndex(idx)}
                        className={cn(
                          "shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200",
                          selectedCatIndex === idx
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/30 dark:bg-white/[0.06] border-border/50 dark:border-white/10 text-muted-foreground"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                    </div>
                  </div>
                )}

                {tariffs[selectedCatIndex] && (() => {
                  const currentCat = tariffs[selectedCatIndex];
                  const subGroups = [...(currentCat.subGroups ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
                  const hasSubGroups = subGroups.length > 0;
                  const selectedSgIdx = selectedSubGroupIndex[currentCat.id] ?? 0;

                  // Determine which tariffs to display
                  let displayTariffs: typeof currentCat.tariffs;
                  if (hasSubGroups) {
                    const selectedSg = subGroups[selectedSgIdx];
                    displayTariffs = selectedSg
                      ? currentCat.tariffs.filter((tr) => tr.subGroupId === selectedSg.id)
                      : currentCat.tariffs;
                  } else {
                    displayTariffs = currentCat.tariffs;
                  }

                  return (
                    <div className="space-y-3">
                      {/* Sub-group selector */}
                      {hasSubGroups && (
                        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
                          <div className="inline-flex gap-2 pb-1">
                            {subGroups.map((sg, sgIdx) => (
                              <button
                                key={sg.id}
                                type="button"
                                onClick={() => setSelectedSubGroupIndex((prev) => ({ ...prev, [currentCat.id]: sgIdx }))}
                                className={cn(
                                  "shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold border transition-all duration-200 whitespace-nowrap",
                                  selectedSgIdx === sgIdx
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-muted/30 dark:bg-white/[0.06] border-border/50 dark:border-white/10 text-muted-foreground"
                                )}
                              >
                                {sg.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {displayTariffs.map((tariffItem, tidx) => {
                      const catLength = displayTariffs.length;
                      const isPopular = catLength >= 2 && tidx === 1;
                      const pricePerGB = formatPricePerGB(tariffItem.price, tariffItem.trafficLimitBytes, tariffItem.currency, tariffItem.durationDays, tariffItem.trafficResetStrategy);
                      const trafficLabel =
                        tariffItem.trafficLimitBytes != null && tariffItem.trafficLimitBytes > 0
                          ? `${(tariffItem.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(1)} GB`
                          : "∞";

                      return (
                        <motion.div
                          key={tariffItem.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: tidx * 0.06 }}
                          className={cn(
                            "relative rounded-[2rem] overflow-hidden flex flex-col",
                            isPopular
                              ? "shadow-lg ring-1 ring-primary/40"
                              : "border border-border/50 dark:border-white/10 shadow-sm bg-muted/40 dark:bg-white/[0.06]"
                          )}
                        >
                          {isPopular && (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 pointer-events-none" />
                          )}

                          <div className="relative flex flex-col p-4 gap-3">
                            {/* Header row */}
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn(
                                "text-[14px] font-bold truncate",
                                isPopular ? "text-primary-foreground/75" : "text-muted-foreground"
                              )}>
                                {tariffItem.name}
                              </p>
                              {isPopular && (
                                <span className="shrink-0 flex items-center gap-1 bg-primary-foreground/20 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary-foreground">
                                  <Flame className="h-2.5 w-2.5" />
                                  {t("tariffs.popular")}
                                </span>
                              )}
                            </div>

                            {/* Price + specs row — horizontal layout for mobile */}
                            <div className="flex items-end justify-between gap-3">
                              <div className="min-w-0">
                                {promoResult ? (
                                  <div className="flex items-baseline gap-2">
                                    <p className={cn(
                                      "font-black tabular-nums leading-none",
                                      isPopular ? "text-primary-foreground" : "text-foreground"
                                    )} style={{ fontSize: 32 }}>
                                      {formatMoney(getDiscountedPrice(tariffItem.price), tariffItem.currency)}
                                    </p>
                                    <p className={cn(
                                      "text-sm font-bold tabular-nums line-through decoration-2",
                                      isPopular ? "text-primary-foreground/40" : "text-muted-foreground/60"
                                    )}>
                                      {formatMoney(tariffItem.price, tariffItem.currency)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className={cn(
                                    "font-black tabular-nums leading-none",
                                    isPopular ? "text-primary-foreground" : "text-foreground"
                                  )} style={{ fontSize: 32 }}>
                                    {formatMoney(tariffItem.price, tariffItem.currency)}
                                  </p>
                                )}
                                {pricePerGB && (
                                  <p className={cn(
                                    "text-[11px] font-medium mt-1",
                                    isPopular ? "text-primary-foreground/55" : "text-muted-foreground"
                                  )}>
                                    {pricePerGB} / GB
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Spec chips — compact grid */}
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { icon: <Calendar className="h-3 w-3" />, label: `${tariffItem.durationDays} ${t("tariffs.daysShort")}` },
                                { icon: <Wifi className="h-3 w-3" />, label: trafficLabel },
                                ...(tariffItem.deviceLimit != null && tariffItem.deviceLimit > 0
                                  ? [{ icon: <Smartphone className="h-3 w-3" />, label: String(tariffItem.deviceLimit) }]
                                  : []),
                                ...(tariffItem.trafficResetStrategy && RESET_STRATEGY_I18N[tariffItem.trafficResetStrategy]
                                  ? [{ icon: <RotateCcw className="h-3 w-3" />, label: t(RESET_STRATEGY_I18N[tariffItem.trafficResetStrategy]) }]
                                  : []),
                              ].map((chip, ci) => (
                                <span key={ci} className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                  isPopular
                                    ? "bg-primary-foreground/15 text-primary-foreground"
                                    : "bg-muted/40 dark:bg-white/10 border border-border/50 dark:border-white/10 text-foreground"
                                )}>
                                  {chip.icon}{chip.label}
                                </span>
                              ))}
                            </div>

                            {tariffItem.description?.trim() && (
                              <p className={cn(
                                "text-[11px] leading-relaxed line-clamp-2",
                                isPopular ? "text-primary-foreground/55" : "text-muted-foreground"
                              )}>
                                {tariffItem.description}
                              </p>
                            )}

                            {/* CTA */}
                            {token ? (
                              <Button
                                className={cn(
                                  "w-full h-12 rounded-2xl font-bold text-[14px]",
                                  isPopular
                                    ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg"
                                    : "shadow-md"
                                )}
                                onClick={() => setPayModal({ tariff: { ...tariffItem } })}
                              >
                                {t("tariffs.pay")}
                              </Button>
                            ) : (
                              <div className={cn(
                                "w-full h-12 rounded-2xl flex items-center justify-center",
                                isPopular ? "bg-primary-foreground/10" : "bg-muted/40 border border-border/50 dark:border-white/10"
                              )}>
                                <span className={cn(
                                  "text-[11px] font-bold uppercase tracking-wider",
                                  isPopular ? "text-primary-foreground/60" : "text-muted-foreground"
                                )}>
                                  {t("tariffs.inBot")}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              // ── DESKTOP: category sections + card grid ───────────────
              <div className="space-y-10">
                {tariffs.map((cat, catIndex) => {
                  const subGroups = [...(cat.subGroups ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
                  const hasSubGroups = subGroups.length > 0;
                  const selectedSgIdx = selectedSubGroupIndex[cat.id] ?? 0;

                  let displayTariffs: typeof cat.tariffs;
                  if (hasSubGroups) {
                    const selectedSg = subGroups[selectedSgIdx];
                    displayTariffs = selectedSg
                      ? cat.tariffs.filter((tr) => tr.subGroupId === selectedSg.id)
                      : cat.tariffs;
                  } else {
                    displayTariffs = cat.tariffs;
                  }

                  return (
                  <motion.section
                    key={cat.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: catIndex * 0.05 }}
                  >
                    {tariffs.length > 1 && (
                      <h2 className="text-xl font-bold mb-4 text-foreground">{cat.name}</h2>
                    )}

                    {/* Sub-group tabs */}
                    {hasSubGroups && (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground shrink-0">
                          <Layers className="h-4 w-4 text-primary" />
                          <span>{t("tariffs.subGroup")}</span>
                        </div>
                        <div className="rounded-xl border border-border/50 dark:border-white/10 bg-muted/30 dark:bg-white/[0.06] backdrop-blur-sm p-1 flex gap-1 flex-wrap">
                          {subGroups.map((sg, sgIdx) => (
                            <button
                              key={sg.id}
                              type="button"
                              onClick={() => setSelectedSubGroupIndex((prev) => ({ ...prev, [cat.id]: sgIdx }))}
                              className={cn(
                                "px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200",
                                selectedSgIdx === sgIdx
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 dark:bg-white/10"
                              )}
                            >
                              {sg.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
                      {displayTariffs.map((tariffItem, tidx) => {
                        const catLength = displayTariffs.length;
                        const isPopular = catLength >= 2 && tidx === 1;
                        const pricePerGB = formatPricePerGB(tariffItem.price, tariffItem.trafficLimitBytes, tariffItem.currency, tariffItem.durationDays, tariffItem.trafficResetStrategy);
                        const trafficLabel =
                          tariffItem.trafficLimitBytes != null && tariffItem.trafficLimitBytes > 0
                            ? `${(tariffItem.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(1)} GB`
                            : t("tariffs.unlimitedTraffic");

                        return (
                          <div
                            key={tariffItem.id}
                            className={cn(
                              "relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1",
                              isPopular
                                ? "shadow-lg ring-1 ring-primary/40 hover:-translate-y-1.5"
                                : "border border-border/50 dark:border-white/10 shadow-sm hover:shadow-md bg-muted/40 dark:bg-white/[0.06]"
                            )}
                          >
                            {isPopular && (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 pointer-events-none" />
                            )}

                            <div className="relative flex flex-col flex-1 p-5 gap-4">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2 min-h-[2rem]">
                                <p className={cn(
                                  "text-[15px] font-bold",
                                  isPopular ? "text-primary-foreground/75" : "text-muted-foreground"
                                )}>
                                  {tariffItem.name}
                                </p>
                                {isPopular && (
                                  <span className="shrink-0 flex items-center gap-1 bg-primary-foreground/20 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                                    <Flame className="h-3 w-3" />
                                    {t("tariffs.popular")}
                                  </span>
                                )}
                              </div>

                              {/* Price — HERO */}
                              <div>
                                {promoResult ? (
                                  <div className="flex items-baseline gap-2.5">
                                    <p className={cn(
                                      "font-black tabular-nums leading-none",
                                      isPopular ? "text-primary-foreground" : "text-foreground"
                                    )} style={{ fontSize: 36 }}>
                                      {formatMoney(getDiscountedPrice(tariffItem.price), tariffItem.currency)}
                                    </p>
                                    <p className={cn(
                                      "text-base font-bold tabular-nums line-through decoration-2",
                                      isPopular ? "text-primary-foreground/40" : "text-muted-foreground/60"
                                    )}>
                                      {formatMoney(tariffItem.price, tariffItem.currency)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className={cn(
                                    "font-black tabular-nums leading-none",
                                    isPopular ? "text-primary-foreground" : "text-foreground"
                                  )} style={{ fontSize: 36 }}>
                                    {formatMoney(tariffItem.price, tariffItem.currency)}
                                  </p>
                                )}
                                {pricePerGB && (
                                  <p className={cn(
                                    "text-[13px] font-medium mt-1.5",
                                    isPopular ? "text-primary-foreground/55" : "text-muted-foreground"
                                  )}>
                                    {pricePerGB} / GB
                                  </p>
                                )}
                              </div>

                              {/* Spec chips */}
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { icon: <Calendar className="h-3.5 w-3.5" />, label: `${tariffItem.durationDays} ${t("tariffs.daysShort")}` },
                                  { icon: <Wifi className="h-3.5 w-3.5" />, label: trafficLabel },
                                  ...(tariffItem.deviceLimit != null && tariffItem.deviceLimit > 0
                                    ? [{ icon: <Smartphone className="h-3.5 w-3.5" />, label: `${tariffItem.deviceLimit}` }]
                                    : []),
                                  ...(tariffItem.trafficResetStrategy && RESET_STRATEGY_I18N[tariffItem.trafficResetStrategy]
                                    ? [{ icon: <RotateCcw className="h-3.5 w-3.5" />, label: t(RESET_STRATEGY_I18N[tariffItem.trafficResetStrategy]) }]
                                    : []),
                                ].map((chip, ci) => (
                                  <span key={ci} className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
                                    isPopular
                                      ? "bg-primary-foreground/15 text-primary-foreground"
                                      : "bg-muted/40 dark:bg-white/10 border border-border/50 dark:border-white/10 text-foreground"
                                  )}>
                                    {chip.icon}{chip.label}
                                  </span>
                                ))}
                              </div>

                              {tariffItem.description?.trim() && (
                                <p className={cn(
                                  "text-[13px] leading-relaxed line-clamp-2",
                                  isPopular ? "text-primary-foreground/55" : "text-muted-foreground"
                                )}>
                                  {tariffItem.description}
                                </p>
                              )}

                              {/* CTA */}
                              <div className="mt-auto pt-2">
                                {token ? (
                                  <Button
                                    size="lg"
                                    className={cn(
                                      "w-full h-12 rounded-xl font-bold text-[15px]",
                                      isPopular
                                        ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl"
                                        : "shadow-md"
                                    )}
                                    onClick={() => setPayModal({ tariff: { ...tariffItem } })}
                                  >
                                    {t("tariffs.pay")}
                                  </Button>
                                ) : (
                                  <div className={cn(
                                    "w-full h-12 rounded-xl flex items-center justify-center",
                                    isPopular ? "bg-primary-foreground/10" : "bg-muted/50 border border-border/50 dark:border-white/10"
                                  )}>
                                    <span className={cn(
                                      "text-sm font-bold uppercase tracking-wider",
                                      isPopular ? "text-primary-foreground/60" : "text-muted-foreground"
                                    )}>
                                      {t("tariffs.inBot")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.section>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop payment dialog */}
      {!isMobileOrMiniapp && (
        <Dialog
          open={!!payModal}
          onOpenChange={(open) => {
            if (!open && !payLoading) closePayment();
          }}
        >
          <DialogContent
            className="w-full max-w-md mx-auto sm:rounded-2xl p-5 sm:p-6 border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/[0.06]"
            showCloseButton={!payLoading}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader className="mb-4 text-center sm:text-left">
              <DialogTitle className="text-2xl font-bold flex items-center justify-center sm:justify-start gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                {t("tariffs.payTitle")}
              </DialogTitle>
              <DialogDescription className="hidden" />
            </DialogHeader>

            <PaymentContent />

            <DialogFooter className="mt-4 sm:justify-center border-t border-border/50 dark:border-white/10 pt-4">
              <Button
                variant="ghost"
                onClick={closePayment}
                disabled={payLoading}
                className="rounded-xl hover:bg-muted/40 dark:bg-white/10 hover:text-foreground text-muted-foreground"
              >
                {t("common.cancel")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ── Reusable payment method button ─────────────────────────────────────────
function PayMethodButton({
  isMobile,
  icon,
  iconBg,
  label,
  onClick,
  disabled,
}: {
  isMobile: boolean;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 rounded-2xl border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
        isMobile
          ? "flex-col items-center justify-center p-4 border-white/5 bg-muted/40 dark:bg-white/[0.06] hover:bg-muted/60 dark:hover:bg-white/10 hover:border-primary/30 active:scale-95"
          : "px-4 py-3.5 border-border/50 dark:border-white/10 bg-background/40 hover:bg-background/70 hover:border-primary/30 hover:-translate-y-0.5"
      )}
    >
      {isMobile ? (
        <>
          <div className={cn("p-2.5 rounded-xl", iconBg)}>{icon}</div>
          <p className="text-sm font-bold text-foreground text-center leading-tight">{label}</p>
        </>
      ) : (
        <>
          <div className={cn("p-1.5 rounded-lg shrink-0", iconBg)}>{icon}</div>
          <span className="font-semibold text-sm text-foreground flex-1 text-left">{label}</span>
        </>
      )}
    </button>
  );
}
