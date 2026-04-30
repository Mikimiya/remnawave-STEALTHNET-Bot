import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { KeyRound, Calendar, CreditCard, Loader2, Copy, Check, ChevronDown, Wallet, Shield, Zap, ArrowLeft, Wifi } from "lucide-react";
import { useClientAuth } from "@/contexts/client-auth";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCabinetMiniapp } from "@/pages/cabinet/cabinet-layout";
import { useCabinetConfig } from "@/contexts/cabinet-config";
import { openPaymentInBrowser } from "@/lib/open-payment-url";
import { cn, formatMoney, translateBackendMessage, translatePlategaLabel } from "@/lib/utils";
import { AiFillAlipaySquare, AiFillWechat } from "react-icons/ai";

type SingboxTariff = { id: string; name: string; description?: string; slotCount: number; durationDays: number; trafficLimitBytes: string | null; price: number; currency: string };
type SingboxCategory = { id: string; name: string; sortOrder: number; tariffs: SingboxTariff[] };
type SingboxSlot = {
  id: string;
  subscriptionLink: string;
  expiresAt: string;
  trafficLimitBytes: string | null;
  trafficUsedBytes: string;
  protocol: string;
};

function formatBytes(bytes: string | null): string {
  if (!bytes) return "—";
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

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

export function ClientSingboxPage() {
  const { t } = useTranslation();
  const { state, refreshProfile } = useClientAuth();
  const token = state.token;
  const client = state.client;
  const config = useCabinetConfig();
  const [categories, setCategories] = useState<SingboxCategory[]>([]);
  const [slots, setSlots] = useState<SingboxSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const plategaMethods = config?.plategaMethods ?? [];
  const yoomoneyEnabled = Boolean(config?.yoomoneyEnabled);
  const yookassaEnabled = Boolean(config?.yookassaEnabled);
  const cryptopayEnabled = Boolean(config?.cryptopayEnabled);
  const heleketEnabled = Boolean(config?.heleketEnabled);
  const epayMethods = config?.epayMethods ?? [];
  const [payModal, setPayModal] = useState<SingboxTariff | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tariffs");

  const isMobileOrMiniapp = useCabinetMiniapp();
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    api.getPublicSingboxTariffs().then((r) => {
      setCategories(r.items ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!token) {
      setSlotsLoading(false);
      return;
    }
    setSlotsLoading(true);
    api.getSingboxSlots(token).then((r) => {
      setSlots(r.slots ?? []);
    }).catch(() => setSlots([])).finally(() => setSlotsLoading(false));
  }, [token]);

  useEffect(() => {
    if (isMobileOrMiniapp && categories.length > 0) {
      setExpandedCategoryId((prev) => (prev === null ? categories[0]!.id : prev));
    }
  }, [isMobileOrMiniapp, categories]);

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function payByBalance(tariff: SingboxTariff) {
    if (!token) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.clientPayByBalance(token, { singboxTariffId: tariff.id });
      setPayModal(null);
      alert(translateBackendMessage(res.message, t));
      await refreshProfile();
      const r = await api.getSingboxSlots(token);
      setSlots(r.slots ?? []);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientSingbox.errors.paymentFailed"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startYoomoneyPayment(tariff: SingboxTariff) {
    if (!token || tariff.currency.toUpperCase() !== "RUB") return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.yoomoneyCreateFormPayment(token, {
        amount: tariff.price,
        paymentType: "AC",
        singboxTariffId: tariff.id,
      });
      setPayModal(null);
      if (res.paymentUrl) openPaymentInBrowser(res.paymentUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientSingbox.errors.generic"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startYookassaPayment(tariff: SingboxTariff) {
    if (!token || tariff.currency.toUpperCase() !== "RUB") return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.yookassaCreatePayment(token, {
        amount: tariff.price,
        currency: "RUB",
        singboxTariffId: tariff.id,
      });
      setPayModal(null);
      if (res.confirmationUrl) openPaymentInBrowser(res.confirmationUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientSingbox.errors.generic"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startCryptopayPayment(tariff: SingboxTariff) {
    if (!token) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.cryptopayCreatePayment(token, {
        amount: tariff.price,
        currency: tariff.currency,
        singboxTariffId: tariff.id,
      });
      setPayModal(null);
      if (res.payUrl) openPaymentInBrowser(res.payUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientSingbox.errors.generic"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startHeleketPayment(tariff: SingboxTariff) {
    if (!token) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.heleketCreatePayment(token, {
        amount: tariff.price,
        currency: tariff.currency,
        singboxTariffId: tariff.id,
      });
      setPayModal(null);
      if (res.payUrl) openPaymentInBrowser(res.payUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientSingbox.errors.generic"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startEpayPayment(tariff: SingboxTariff, epayType: string) {
    if (!token) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.epayCreatePayment(token, {
        amount: tariff.price,
        currency: tariff.currency,
        singboxTariffId: tariff.id,
        type: epayType,
      });
      setPayModal(null);
      if (res.payUrl) openPaymentInBrowser(res.payUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientSingbox.errors.generic"));
    } finally {
      setPayLoading(false);
    }
  }

  async function startPlategaPayment(tariff: SingboxTariff, methodId: number) {
    if (!token) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await api.clientCreatePlategaPayment(token, {
        amount: tariff.price,
        currency: tariff.currency,
        paymentMethod: methodId,
        description: tariff.name,
        singboxTariffId: tariff.id,
      });
      setPayModal(null);
      openPaymentInBrowser(res.paymentUrl);
    } catch (e) {
      setPayError(e instanceof Error ? translateBackendMessage(e.message, t) : t("clientSingbox.errors.generic"));
    } finally {
      setPayLoading(false);
    }
  }

  const closePayment = () => {
    setPayModal(null);
    setPayError(null);
  };

  const PaymentContent = () => {
    if (!payModal) return null;
    const hasBalance = client ? client.balance >= payModal.price : false;

    return (
      <div className="space-y-6">
        <div className={cn("rounded-2xl relative overflow-hidden", isMobileOrMiniapp ? "bg-card/40 border border-white/5 p-5" : "bg-background/50 border border-border/50 p-4")}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start gap-4 relative z-10">
            <div className="space-y-1.5">
              <p className={cn("font-medium", isMobileOrMiniapp ? "text-sm text-muted-foreground" : "text-muted-foreground")}>
                {isMobileOrMiniapp ? t("clientSingbox.payment.totalToPay") : t("clientSingbox.payment.tariffLabel")}
              </p>
              {!isMobileOrMiniapp && <p className="font-bold text-foreground">{payModal.name}</p>}
              {isMobileOrMiniapp && (
                <span className="text-3xl font-black text-primary">{formatMoney(payModal.price, payModal.currency)}</span>
              )}
            </div>
            {!isMobileOrMiniapp && (
              <div className="text-right">
                <span className="font-bold text-xl text-primary">{formatMoney(payModal.price, payModal.currency)}</span>
              </div>
            )}
          </div>
          
          {isMobileOrMiniapp && (
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-background/40 rounded-2xl p-3 border border-white/5">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{t("clientSingbox.payment.slots")}</p>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <KeyRound className="h-4 w-4 text-primary" />
                  {payModal.slotCount} {t("clientSingbox.units.piecesShort")}
                </div>
              </div>
              <div className="bg-background/40 rounded-2xl p-3 border border-white/5">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{t("clientSingbox.payment.period")}</p>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  {payModal.durationDays} {t("clientSingbox.units.daysShort")}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={cn("space-y-3", isMobileOrMiniapp ? "pb-6" : "")}>
          <div className="flex items-center gap-2 pt-2 pb-1">
            <Wallet className={cn("text-primary", isMobileOrMiniapp ? "h-5 w-5" : "h-4 w-4")} />
            <span className={cn("font-bold", isMobileOrMiniapp ? "text-lg" : "text-sm")}>{t("clientSingbox.payment.method")}</span>
          </div>

          {payError && (
            <div className={cn("p-4 bg-destructive/10 border border-destructive/20 text-destructive text-center font-bold", isMobileOrMiniapp ? "rounded-2xl text-sm" : "rounded-xl text-sm mb-4")}>
              {payError}
            </div>
          )}

          <div className="space-y-3">
            {client && (
              <Button
                size="lg"
                onClick={() => payByBalance(payModal)}
                disabled={payLoading || !hasBalance}
                className={cn("w-full shadow-lg border-0 group relative overflow-hidden", isMobileOrMiniapp ? "justify-between px-6 h-16 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400" : "gap-2 h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300")}
              >
                {!isMobileOrMiniapp && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />}
                
                {isMobileOrMiniapp ? (
                  <>
                    <div className="flex items-center gap-3">
                      {payLoading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Wallet className="h-6 w-6 text-white" />}
                      <span className="text-base font-bold text-white">{t("clientSingbox.payment.payWithBalance")}</span>
                    </div>
                    <span className="text-white/80 font-mono font-medium bg-black/20 px-2 py-1 rounded-lg">
                      {formatMoney(client.balance, payModal.currency)}
                    </span>
                  </>
                ) : (
                  <>
                    {payLoading ? <Loader2 className="h-5 w-5 animate-spin relative z-10" /> : <Wallet className="h-5 w-5 relative z-10" />}
                    <span className="text-base font-semibold relative z-10">{t("clientSingbox.payment.payWithBalance")}</span>
                    <span className="opacity-90 font-medium ml-1 bg-black/10 px-2 py-0.5 rounded-md relative z-10">
                      ({formatMoney(client.balance, payModal.currency)})
                    </span>
                  </>
                )}
              </Button>
            )}

            {cryptopayEnabled && (
              <PayMethodButton
                isMobile={isMobileOrMiniapp}
                icon={<Zap className="h-5 w-5 text-yellow-500" />}
                iconBg="bg-yellow-500/15"
                label={t("common.cryptoBot")}
                onClick={() => startCryptopayPayment(payModal)}
                disabled={payLoading}
              />
            )}

            {heleketEnabled && (
              <PayMethodButton
                isMobile={isMobileOrMiniapp}
                icon={<Zap className="h-5 w-5 text-orange-500" />}
                iconBg="bg-orange-500/15"
                label="Heleket"
                onClick={() => startHeleketPayment(payModal)}
                disabled={payLoading}
              />
            )}

            {epayMethods.map((m) => {
              const presentation = getEpayMethodPresentation(m.type);

              return (
                <PayMethodButton
                  key={m.type}
                  isMobile={isMobileOrMiniapp}
                  icon={presentation.icon}
                  iconBg={presentation.iconBg}
                  label={m.label}
                  onClick={() => startEpayPayment(payModal, m.type)}
                  disabled={payLoading}
                />
              );
            })}

            {yookassaEnabled && payModal.currency.toUpperCase() === "RUB" && (
              <PayMethodButton
                isMobile={isMobileOrMiniapp}
                icon={<CreditCard className="h-5 w-5 text-green-500" />}
                iconBg="bg-green-500/15"
                label={t("tariffs.sbp")}
                onClick={() => startYookassaPayment(payModal)}
                disabled={payLoading}
              />
            )}

            {yoomoneyEnabled && payModal.currency.toUpperCase() === "RUB" && (
              <PayMethodButton
                isMobile={isMobileOrMiniapp}
                icon={<CreditCard className="h-5 w-5 text-green-500" />}
                iconBg="bg-green-500/15"
                label={t("tariffs.yoomoney")}
                onClick={() => startYoomoneyPayment(payModal)}
                disabled={payLoading}
              />
            )}

            {plategaMethods.map((m) => (
              <PayMethodButton
                key={m.id}
                isMobile={isMobileOrMiniapp}
                icon={<CreditCard className="h-5 w-5 text-green-500" />}
                iconBg="bg-green-500/15"
                label={translatePlategaLabel(m, t)}
                onClick={() => startPlategaPayment(payModal, m.id)}
                disabled={payLoading}
              />
            ))}
          </div>
          {isMobileOrMiniapp && <div className="h-8" />}
        </div>
      </div>
    );
  };

  const flatTariffs = categories.flatMap((c) => c.tariffs.map((t) => ({ ...t, categoryName: c.name })));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {isMobileOrMiniapp && payModal ? (
          <motion.div
            key="payment-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col w-full rounded-[2.5rem] border border-white/10 dark:border-white/5 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-[32px] shadow-2xl relative"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50 bg-background/30 backdrop-blur-md z-10 transition-colors rounded-t-[2.5rem]">
              <div className="flex items-center gap-3 min-w-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 h-9 w-9 rounded-full bg-background/50 hover:bg-background/80 transition-transform hover:scale-105" 
                  onClick={closePayment}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-bold truncate text-foreground">{t("clientSingbox.payment.title")}</h2>
                  <p className="text-[11px] font-medium text-muted-foreground truncate">{payModal.name}</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 pb-8">
               <PaymentContent />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="hidden md:block relative overflow-hidden rounded-3xl bg-muted/40 dark:bg-white/[0.06] backdrop-blur-2xl border border-border/50 dark:border-white/10 p-8 sm:p-10">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground flex items-center gap-3">
                    <KeyRound className="h-8 w-8 text-primary" />
                    {t("clientSingbox.page.title")}
                  </h1>
                  <p className="mt-3 text-[16px] text-muted-foreground max-w-xl leading-relaxed">
                    {t("clientSingbox.page.subtitle")}
                  </p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl p-1 bg-muted/50 backdrop-blur-md">
                <TabsTrigger value="tariffs" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <KeyRound className="h-4 w-4" /> {t("clientSingbox.tabs.buy")}
                </TabsTrigger>
                <TabsTrigger value="my" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  {t("clientSingbox.tabs.myAccess")}
                  {slots.length > 0 && (
                    <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-xs font-medium">
                      {slots.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tariffs" className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : flatTariffs.length === 0 ? (
                  <Card className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
                      <KeyRound className="h-12 w-12 opacity-20" />
                      <p>{t("clientSingbox.empty.tariffs")}</p>
                    </CardContent>
                  </Card>
                ) : isMobileOrMiniapp ? (
                  <div className="space-y-3">
                    {categories.filter((c) => c.tariffs.length > 0).map((cat, catIndex) => (
                      <Collapsible
                        key={cat.id}
                        open={expandedCategoryId === cat.id}
                        onOpenChange={(open) => setExpandedCategoryId(open ? cat.id : null)}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: catIndex * 0.03 }}
                          className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md shadow-sm overflow-hidden"
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/50 active:bg-muted transition-colors"
                            >
                              <span className="flex items-center gap-2 font-semibold">
                                <KeyRound className="h-4 w-4 text-primary shrink-0" />
                                {cat.name}
                              </span>
                              <ChevronDown
                                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${expandedCategoryId === cat.id ? "rotate-180" : ""}`}
                              />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-3 pb-3 pt-1 flex flex-col gap-3">
                              {cat.tariffs.map((tariff) => (
                                <Card key={tariff.id} className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300">
                                  <CardContent className="flex flex-row items-center gap-4 py-4 px-4 min-h-0 min-w-0">
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                      <p className="text-[15px] font-bold leading-tight truncate text-foreground">{tariff.name}</p>
                                      {tariff.description?.trim() ? (
                                        <p className="text-xs text-muted-foreground font-medium line-clamp-2">{tariff.description}</p>
                                      ) : null}
                                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                                          <Calendar className="h-3 w-3 text-primary" />
                                          {tariff.durationDays} {t("clientSingbox.units.daysShort")}
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                                          <Wifi className="h-3 w-3 text-primary" />
                                          {tariff.trafficLimitBytes != null && Number(tariff.trafficLimitBytes) > 0 ? `${(Number(tariff.trafficLimitBytes) / 1024 / 1024 / 1024).toFixed(1)} ${t("clientSingbox.units.gb")}` : t("clientSingbox.units.infinity")}
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                                          <KeyRound className="h-3 w-3 text-primary" />
                                          {tariff.slotCount} {t("clientSingbox.units.piecesShort")}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-2.5 shrink-0 min-w-[90px]">
                                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground" title={formatMoney(tariff.price, tariff.currency)}>
                                        {formatMoney(tariff.price, tariff.currency)}
                                      </span>
                                      {token ? (
                                        <Button
                                          size="sm"
                                          className="w-full h-9 rounded-xl shadow-md text-xs font-semibold gap-1.5 hover:scale-105 transition-transform"
                                          onClick={() => setPayModal(tariff)}
                                        >
                                          <CreditCard className="h-3.5 w-3.5 shrink-0" />
                                          {t("clientSingbox.actions.pay")}
                                        </Button>
                                      ) : null}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </motion.div>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-10">
                    {categories.filter((c) => c.tariffs.length > 0).map((cat, catIndex) => (
                      <motion.section
                        key={cat.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: catIndex * 0.05 }}
                      >
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <KeyRound className="h-5 w-5 text-primary shrink-0" />
                          {cat.name}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {cat.tariffs.map((tariff) => (
                            <Card key={tariff.id} className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1">
                              <CardContent className="flex-1 flex flex-col p-5 min-h-0 min-w-0">
                                <div className="mb-4">
                                  <p className="text-lg font-bold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">{tariff.name}</p>
                                  {tariff.description?.trim() ? (
                                    <p className="text-sm text-muted-foreground font-medium mt-1.5 line-clamp-2">{tariff.description}</p>
                                  ) : null}
                                </div>

                                <div className="flex flex-col gap-2.5 mt-auto mb-5 text-sm font-semibold text-muted-foreground">
                                  <div className="flex items-center gap-3 bg-background/50 px-3 py-2 rounded-xl border border-border/50">
                                    <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                                      <Calendar className="h-4 w-4 shrink-0" />
                                    </div>
                                    <span>{tariff.durationDays} {t("clientSingbox.units.days")}</span>
                                  </div>
                                  <div className="flex items-center gap-3 bg-background/50 px-3 py-2 rounded-xl border border-border/50">
                                    <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                                      <Wifi className="h-4 w-4 shrink-0" />
                                    </div>
                                    <span>
                                      {tariff.trafficLimitBytes != null && Number(tariff.trafficLimitBytes) > 0
                                        ? `${(Number(tariff.trafficLimitBytes) / 1024 / 1024 / 1024).toFixed(1)} ${t("clientSingbox.units.gb")}`
                                        : t("clientSingbox.unlimitedTraffic")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 bg-background/50 px-3 py-2 rounded-xl border border-border/50">
                                    <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                                      <KeyRound className="h-4 w-4 shrink-0" />
                                    </div>
                                    <span>{tariff.slotCount} {t("clientSingbox.units.slots")}</span>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-border/50 mt-auto flex flex-col gap-3 min-w-0">
                                  <span className="text-2xl font-black tabular-nums truncate min-w-0 text-foreground text-center" title={formatMoney(tariff.price, tariff.currency)}>
                                    {formatMoney(tariff.price, tariff.currency)}
                                  </span>
                                  {token ? (
                                    <Button
                                      size="lg"
                                      className="w-full h-12 rounded-xl shadow-md text-[15px] font-bold gap-2 hover:scale-[1.02] transition-transform"
                                      onClick={() => setPayModal(tariff)}
                                    >
                                      <CreditCard className="h-5 w-5 shrink-0" />
                                      {t("clientSingbox.actions.pay")}
                                    </Button>
                                  ) : null}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </motion.section>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my" className="mt-4">
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : slots.length === 0 ? (
                  <Card className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
                      <KeyRound className="h-12 w-12 opacity-20" />
                      <p>{t("clientSingbox.empty.slots")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {slots.map((slot) => (
                      <Card key={slot.id} className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/20 rounded-xl text-primary group-hover:scale-110 transition-transform">
                                <KeyRound className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{slot.protocol} · {slot.id.slice(-8)}</h3>
                                {slot.trafficLimitBytes && Number(slot.trafficLimitBytes) > 0 ? (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {t("clientSingbox.slot.traffic")}: {formatBytes(slot.trafficUsedBytes)} / {formatBytes(slot.trafficLimitBytes)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-col items-end text-sm shrink-0">
                              <span className="text-xs text-muted-foreground">{t("clientSingbox.slot.activeUntil")}</span>
                              <span className="font-medium text-foreground">{formatDate(slot.expiresAt)}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 min-w-0 bg-background/50 p-2 rounded-2xl border border-border/50">
                              <div className="pl-2 font-semibold text-xs text-muted-foreground shrink-0">URL</div>
                              <code className="flex-1 truncate text-xs font-mono select-all text-foreground">
                                {slot.subscriptionLink}
                              </code>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="shrink-0 h-8 w-8 rounded-xl bg-background hover:bg-muted shadow-sm hover:scale-105 transition-transform"
                                onClick={() => copyToClipboard(slot.subscriptionLink, slot.id)}
                              >
                                {copied === slot.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground px-1">
                              {t("clientSingbox.slot.copyHint")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {!isMobileOrMiniapp && (
        <Dialog open={!!payModal} onOpenChange={(open) => { if (!open && !payLoading) closePayment(); }}>
          <DialogContent className="w-full max-w-md mx-auto sm:rounded-3xl p-5 sm:p-6 border border-border/50 bg-card/60 backdrop-blur-3xl shadow-2xl" showCloseButton={!payLoading} onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="mb-4 text-center sm:text-left">
              <DialogTitle className="text-2xl font-bold flex items-center justify-center sm:justify-start gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                {t("clientSingbox.payment.title")}
              </DialogTitle>
              <DialogDescription className="hidden" />
            </DialogHeader>

            <PaymentContent />

            <DialogFooter className="mt-4 sm:justify-center border-t border-border/50 pt-4">
              <Button variant="ghost" onClick={closePayment} disabled={payLoading} className="rounded-xl hover:bg-background/50 hover:text-foreground text-muted-foreground transition-colors">
                {t("clientSingbox.actions.cancel")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

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
          ? "flex-col items-center justify-center p-4 border-white/5 bg-card/50 hover:bg-card/70 hover:border-primary/30 active:scale-95"
          : "px-4 py-3.5 border-border/50 bg-background/40 hover:bg-background/70 hover:border-primary/30 hover:-translate-y-0.5"
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
