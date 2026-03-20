import { useEffect, useMemo, useState } from "react";
import { Layers, CreditCard, Wallet, Loader2, Calendar, Smartphone, Wifi, Zap, Tag } from "lucide-react";
import { useClientAuth } from "@/contexts/client-auth";
import { api } from "@/lib/api";
import type { PublicConfig } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCabinetMiniapp } from "@/pages/cabinet/cabinet-layout";
import { openPaymentInBrowser } from "@/lib/open-payment-url";
import { cn, formatMoney, translateBackendMessage, translatePlategaLabel } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function ClientCustomBuildPage() {
  const { t } = useTranslation();
  const { state, refreshProfile } = useClientAuth();
  const token = state.token;
  const balance = state.client?.balance ?? 0;
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [devices, setDevices] = useState(1);
  const [trafficGb, setTrafficGb] = useState(10);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");

  const cb = config?.customBuildConfig;
  const maxDays = cb?.maxDays ?? 360;
  const maxDevices = cb?.maxDevices ?? 10;

  useEffect(() => {
    api.getPublicConfig().then((c) => {
      setConfig(c);
      if (c.customBuildConfig) {
        setDays(Math.min(30, c.customBuildConfig.maxDays));
        setDevices(Math.min(1, c.customBuildConfig.maxDevices));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const total = useMemo(() => {
    if (!cb) return 0;
    let sum = days * cb.pricePerDay + devices * cb.pricePerDevice;
    if (cb.trafficMode === "per_gb" && trafficGb > 0) {
      sum += trafficGb * cb.pricePerGb;
    }
    return Math.round(sum * 100) / 100;
  }, [cb, days, devices, trafficGb]);

  const canPayBalance = balance >= total && total > 0;
  const isMobileOrMiniapp = useCabinetMiniapp();

  async function payByBalance() {
    if (!token || !cb) return;
    setPayError(null);
    setPayLoading(true);
    try {
      await api.customBuildPayBalance(token, {
        days,
        devices,
        trafficGb: cb.trafficMode === "per_gb" ? trafficGb : undefined,
        promoCode: promoCode.trim() || undefined,
      });
      await refreshProfile();
      setPayModalOpen(false);
      setPromoCode("");
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientCustomBuild.errors.balancePaymentFailed"));
    } finally {
      setPayLoading(false);
    }
  }

  const customBuildPayload = useMemo(
    () => ({
      days,
      devices,
      trafficGb: cb?.trafficMode === "per_gb" ? trafficGb : undefined as number | undefined,
    }),
    [cb?.trafficMode, days, devices, trafficGb]
  );

  async function payByYookassa() {
    if (!token || !cb) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.yookassaCreatePayment(token, {
        customBuild: customBuildPayload,
        promoCode: promoCode.trim() || undefined,
      });
      setPayModalOpen(false);
      if (res.confirmationUrl) openPaymentInBrowser(res.confirmationUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientCustomBuild.errors.paymentCreateFailed"));
    } finally {
      setPayLoading(false);
    }
  }

  async function payByPlatega(methodId: number) {
    if (!token || !cb) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.clientCreatePlategaPayment(token, {
        paymentMethod: methodId,
        customBuild: customBuildPayload,
        promoCode: promoCode.trim() || undefined,
      });
      setPayModalOpen(false);
      if (res.paymentUrl) openPaymentInBrowser(res.paymentUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientCustomBuild.errors.paymentCreateFailed"));
    } finally {
      setPayLoading(false);
    }
  }

  async function payByYoomoney() {
    if (!token || !cb) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.yoomoneyCreateFormPayment(token, {
        paymentType: "AC",
        customBuild: customBuildPayload,
      });
      setPayModalOpen(false);
      if (res.paymentUrl) openPaymentInBrowser(res.paymentUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientCustomBuild.errors.paymentCreateFailed"));
    } finally {
      setPayLoading(false);
    }
  }

  async function payByCryptopay() {
    if (!token || !cb) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.cryptopayCreatePayment(token, {
        customBuild: customBuildPayload,
        currency: cb.currency,
        promoCode: promoCode.trim() || undefined,
      });
      setPayModalOpen(false);
      if (res.payUrl) openPaymentInBrowser(res.payUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientCustomBuild.errors.paymentCreateFailed"));
    } finally {
      setPayLoading(false);
    }
  }

  async function payByHeleket() {
    if (!token || !cb) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.heleketCreatePayment(token, {
        customBuild: customBuildPayload,
        currency: cb.currency,
        promoCode: promoCode.trim() || undefined,
      });
      setPayModalOpen(false);
      if (res.payUrl) openPaymentInBrowser(res.payUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientCustomBuild.errors.paymentCreateFailed"));
    } finally {
      setPayLoading(false);
    }
  }

  async function payByEpay(epayType: string) {
    if (!token || !cb) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.epayCreatePayment(token, {
        customBuild: customBuildPayload,
        currency: cb.currency,
        promoCode: promoCode.trim() || undefined,
        type: epayType,
      });
      setPayModalOpen(false);
      if (res.payUrl) openPaymentInBrowser(res.payUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientCustomBuild.errors.paymentCreateFailed"));
    } finally {
      setPayLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cb) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">{t("clientCustomBuild.empty")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Layers className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t("clientCustomBuild.page.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("clientCustomBuild.page.subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("clientCustomBuild.fields.days")}
              </Label>
              <span className="font-medium">{days}</span>
            </div>
            <input
              type="range"
              min={1}
              max={maxDays}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-full appearance-none bg-muted accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>{maxDays}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                {t("clientCustomBuild.fields.devices")}
              </Label>
              <span className="font-medium">{devices}</span>
            </div>
            <input
              type="range"
              min={1}
              max={maxDevices}
              value={devices}
              onChange={(e) => setDevices(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-full appearance-none bg-muted accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>{maxDevices}</span>
            </div>
          </div>

          {cb.trafficMode === "per_gb" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  {t("clientCustomBuild.fields.traffic")}
                </Label>
                <span className="font-medium">{trafficGb}</span>
              </div>
              <Input
                type="number"
                min={1}
                max={1000}
                value={trafficGb}
                onChange={(e) => setTrafficGb(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full"
              />
            </div>
          )}

          {cb.trafficMode === "unlimited" && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              {t("clientCustomBuild.unlimitedTraffic")}
            </p>
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{t("clientCustomBuild.summary.total")}</span>
              <span className="text-xl font-bold text-primary">{formatMoney(total, cb.currency)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("clientCustomBuild.summary.formula", {
                days,
                dayPrice: formatMoney(cb.pricePerDay, cb.currency, { maximumFractionDigits: 2 }),
                devices,
                devicePrice: formatMoney(cb.pricePerDevice, cb.currency, { maximumFractionDigits: 2 }),
                trafficPart: cb.trafficMode === "per_gb" && trafficGb > 0 ? ` + ${trafficGb} ${t("clientCustomBuild.units.gb")} × ${formatMoney(cb.pricePerGb, cb.currency, { maximumFractionDigits: 2 })}` : "",
              })}
            </p>
          </div>

          <Button
            className="w-full h-12 text-base font-semibold"
            size="lg"
            disabled={total <= 0}
            onClick={() => setPayModalOpen(true)}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            {t("clientCustomBuild.actions.pay")} {formatMoney(total, cb.currency)}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className={cn("sm:max-w-md", isMobileOrMiniapp && "max-w-[calc(100vw-2rem)] rounded-[2rem]")}>
          <DialogHeader>
            <DialogTitle>{t("clientCustomBuild.payment.title")}</DialogTitle>
            <DialogDescription className="text-base">
              {t("clientCustomBuild.summary.total")}: <span className="font-bold text-primary">{formatMoney(total, cb.currency)}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Промокод — как в тарифах */}
          <div className={cn("space-y-3", !isMobileOrMiniapp && "bg-background/40 border border-border/50 rounded-2xl p-4 focus-within:border-primary/50 focus-within:bg-background/60 hover:border-primary/30 transition-all duration-300 relative overflow-hidden group")}>
            {!isMobileOrMiniapp && <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
            <div className="flex items-center gap-2 text-sm font-bold text-foreground pl-1 relative z-10">
              {isMobileOrMiniapp ? <Tag className="h-4 w-4 text-primary" /> : <div className="p-1.5 bg-primary/10 rounded-lg"><Tag className="h-4 w-4 text-primary" /></div>}
              {t("tariffs.promoCode")}
            </div>
            <div className="relative z-10">
              <Input
                name="promo_code"
                autoComplete="off"
                inputMode="text"
                placeholder={t("tariffs.enterPromoCode")}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className={cn("font-mono font-medium focus-visible:ring-primary/50", isMobileOrMiniapp ? "text-base bg-card/40 border-white/5 h-14 rounded-2xl" : "text-sm bg-background border-border/50 h-12 rounded-xl shadow-sm")}
                disabled={payLoading}
              />
            </div>
          </div>

          {/* Способы оплаты — как в тарифах */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pt-2 pb-1">
              <Wallet className={cn("text-primary", isMobileOrMiniapp ? "h-5 w-5" : "h-4 w-4")} />
              <span className={cn("font-bold", isMobileOrMiniapp ? "text-lg" : "text-sm")}>{t("clientCustomBuild.payment.method")}</span>
            </div>

            {payError && (
              <div className={cn("p-4 bg-destructive/10 border border-destructive/20 text-destructive text-center font-bold", isMobileOrMiniapp ? "rounded-2xl text-sm" : "rounded-xl text-sm")}>
                {payError}
              </div>
            )}

            <div className="space-y-3">
              {canPayBalance && (
                <Button
                  size="lg"
                  onClick={payByBalance}
                  disabled={payLoading}
                  className={cn("w-full shadow-lg border-0 group relative overflow-hidden", isMobileOrMiniapp ? "justify-between px-6 h-16 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400" : "gap-2 h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300")}
                >
                  {!isMobileOrMiniapp && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />}
                  {isMobileOrMiniapp ? (
                    <>
                      <div className="flex items-center gap-3">
                        {payLoading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Wallet className="h-6 w-6 text-white" />}
                        <span className="text-base font-bold text-white">{t("clientCustomBuild.payment.payWithBalance")}</span>
                      </div>
                      <span className="text-white/80 font-mono font-medium bg-black/20 px-2 py-1 rounded-lg">
                        {formatMoney(balance, cb.currency)}
                      </span>
                    </>
                  ) : (
                    <>
                      {payLoading ? <Loader2 className="h-5 w-5 animate-spin relative z-10" /> : <Wallet className="h-5 w-5 relative z-10" />}
                      <span className="text-base font-semibold relative z-10">{t("clientCustomBuild.payment.payWithBalance")}</span>
                      <span className="opacity-90 font-medium ml-1 bg-black/10 px-2 py-0.5 rounded-md relative z-10">
                        ({formatMoney(balance, cb.currency)})
                      </span>
                    </>
                  )}
                </Button>
              )}

              {config?.cryptopayEnabled && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={payByCryptopay}
                  disabled={payLoading}
                  className={cn("w-full", isMobileOrMiniapp ? "justify-start gap-4 px-6 h-16 rounded-2xl border-white/5 bg-card/40 hover:bg-card/60" : "gap-3 hover:bg-background/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl h-14 border-border/50 group justify-center px-6 relative")}
                >
                  {isMobileOrMiniapp ? (
                    <>
                      <div className="p-2 rounded-xl bg-yellow-500/10">
                        {payLoading ? <Loader2 className="h-6 w-6 animate-spin text-yellow-500" /> : <Zap className="h-6 w-6 text-yellow-500" />}
                      </div>
                      <span className="text-base font-bold">{t("common.cryptoBot")}</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute left-6 p-1.5 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                        {payLoading ? <Loader2 className="h-5 w-5 animate-spin text-yellow-500" /> : <Zap className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <span className="text-base font-medium">{t("clientCustomBuild.payment.cryptoBot")}</span>
                    </>
                  )}
                </Button>
              )}

              {config?.heleketEnabled && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={payByHeleket}
                  disabled={payLoading}
                  className={cn("w-full", isMobileOrMiniapp ? "justify-start gap-4 px-6 h-16 rounded-2xl border-white/5 bg-card/40 hover:bg-card/60" : "gap-3 hover:bg-background/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl h-14 border-border/50 group justify-center px-6 relative")}
                >
                  {isMobileOrMiniapp ? (
                    <>
                      <div className="p-2 rounded-xl bg-orange-500/10">
                        {payLoading ? <Loader2 className="h-6 w-6 animate-spin text-orange-500" /> : <Zap className="h-6 w-6 text-orange-500" />}
                      </div>
                      <span className="text-base font-bold">Heleket</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute left-6 p-1.5 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                        {payLoading ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" /> : <Zap className="h-5 w-5 text-orange-500" />}
                      </div>
                      <span className="text-base font-medium">{t("clientCustomBuild.payment.heleket")}</span>
                    </>
                  )}
                </Button>
              )}

              {(config?.epayMethods ?? []).map((m) => (
                <Button
                  key={m.type}
                  size="lg"
                  variant="outline"
                  onClick={() => payByEpay(m.type)}
                  disabled={payLoading}
                  className={cn("w-full", isMobileOrMiniapp ? "justify-start gap-4 px-6 h-16 rounded-2xl border-white/5 bg-card/40 hover:bg-card/60" : "gap-3 hover:bg-background/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl h-14 border-border/50 group justify-center px-6 relative")}
                >
                  {isMobileOrMiniapp ? (
                    <>
                      <div className="p-2 rounded-xl bg-blue-500/10">
                        {payLoading ? <Loader2 className="h-6 w-6 animate-spin text-blue-500" /> : <CreditCard className="h-6 w-6 text-blue-500" />}
                      </div>
                      <span className="text-base font-bold">{m.label}</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute left-6 p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                        {payLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> : <CreditCard className="h-5 w-5 text-blue-500" />}
                      </div>
                      <span className="text-base font-medium">💳 {m.label}</span>
                    </>
                  )}
                </Button>
              ))}

              {config?.yookassaEnabled && cb.currency.toUpperCase() === "RUB" && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={payByYookassa}
                  disabled={payLoading}
                  className={cn("w-full", isMobileOrMiniapp ? "justify-start gap-4 px-6 h-16 rounded-2xl border-white/5 bg-card/40 hover:bg-card/60" : "gap-3 hover:bg-background/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl h-14 border-border/50 group justify-center px-6 relative")}
                >
                  {isMobileOrMiniapp ? (
                    <>
                      <div className="p-2 rounded-xl bg-green-500/10">
                        {payLoading ? <Loader2 className="h-6 w-6 animate-spin text-green-500" /> : <CreditCard className="h-6 w-6 text-green-500" />}
                      </div>
                      <span className="text-base font-bold">{t("clientCustomBuild.payment.sbpCards")}</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute left-6 p-1.5 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                        {payLoading ? <Loader2 className="h-5 w-5 animate-spin text-green-500" /> : <CreditCard className="h-5 w-5 text-green-500" />}
                      </div>
                      <span className="text-base font-medium">{t("clientCustomBuild.payment.sbp")}</span>
                    </>
                  )}
                </Button>
              )}

              {config?.yoomoneyEnabled && cb.currency.toUpperCase() === "RUB" && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={payByYoomoney}
                  disabled={payLoading}
                  className={cn("w-full", isMobileOrMiniapp ? "justify-start gap-4 px-6 h-16 rounded-2xl border-white/5 bg-card/40 hover:bg-card/60" : "gap-3 hover:bg-background/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl h-14 border-border/50 group justify-center px-6 relative")}
                >
                  {isMobileOrMiniapp ? (
                    <>
                      <div className="p-2 rounded-xl bg-green-500/10">
                        {payLoading ? <Loader2 className="h-6 w-6 animate-spin text-green-500" /> : <CreditCard className="h-6 w-6 text-green-500" />}
                      </div>
                      <span className="text-base font-bold">{t("clientCustomBuild.payment.yoomoneyCards")}</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute left-6 p-1.5 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                        {payLoading ? <Loader2 className="h-5 w-5 animate-spin text-green-500" /> : <CreditCard className="h-5 w-5 text-green-500" />}
                      </div>
                      <span className="text-base font-medium">{t("clientCustomBuild.payment.cards")}</span>
                    </>
                  )}
                </Button>
              )}

              {(config?.plategaMethods?.length ?? 0) > 0 && config!.plategaMethods!.map((m) => (
                <Button
                  key={m.id}
                  size="lg"
                  variant="outline"
                  onClick={() => payByPlatega(m.id)}
                  disabled={payLoading}
                  className={cn("w-full", isMobileOrMiniapp ? "justify-start gap-4 px-6 h-16 rounded-2xl border-white/5 bg-card/40 hover:bg-card/60" : "gap-3 hover:bg-background/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl h-14 border-border/50 group justify-center px-6 relative")}
                >
                  {isMobileOrMiniapp ? (
                    <>
                      <div className="p-2 rounded-xl bg-green-500/10">
                        {payLoading ? <Loader2 className="h-6 w-6 animate-spin text-green-500" /> : <CreditCard className="h-6 w-6 text-green-500" />}
                      </div>
                      <span className="text-base font-bold">{translatePlategaLabel(m, t)}</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute left-6 p-1.5 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                        {payLoading ? <Loader2 className="h-5 w-5 animate-spin text-green-500" /> : <CreditCard className="h-5 w-5 text-green-500" />}
                      </div>
                      <span className="text-base font-medium">💳 {translatePlategaLabel(m, t)}</span>
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
