import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth";
import { api, type AdminSettings, type SyncResult, type SyncToRemnaResult, type SyncCreateRemnaForMissingResult, type SubscriptionPageConfig } from "@/lib/api";
import { SubscriptionPageEditor } from "@/components/subscription-page-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Download, Upload, Link2, Settings2, Gift, Users, ArrowLeftRight, Mail, MessageCircle, CreditCard, ChevronDown, Copy, Check, Bot, FileJson, Palette, Wallet, Package, Plus, Trash2, KeyRound, Loader2, Sparkles, Layers, Globe } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ACCENT_PALETTES } from "@/contexts/theme";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslation } from "react-i18next";
import { translatePlategaLabel } from "@/lib/utils";

const ALLOWED_LANGS = ["ru", "en", "zh"];
const ALLOWED_CURRENCIES = ["usd", "rub", "cny"];

type BotButtonItem = { id: string; visible: boolean; label: string; order: number; style?: string; emojiKey?: string; onePerRow?: boolean };

const BOT_EMOJI_KEYS = ["HEADER", "MAIN_MENU", "STATUS", "BALANCE", "TARIFFS", "PACKAGE", "PROFILE", "CARD", "TRIAL", "LINK", "SERVERS", "BACK", "PUZZLE", "DATE", "TIME", "TRAFFIC", "ACTIVE_GREEN", "ACTIVE_YELLOW", "INACTIVE", "CONNECT", "NOTE", "STAR", "CROWN", "DURATION", "DEVICES", "LOCATION", "CUSTOM_1", "CUSTOM_2", "CUSTOM_3", "CUSTOM_4", "CUSTOM_5"] as const;

const DEFAULT_BOT_TARIFF_FIELDS: Record<string, boolean> = {
  name: true,
  durationDays: false,
  price: true,
  currency: true,
  trafficLimit: false,
  deviceLimit: false,
};

const DEFAULT_BOT_MENU_LINE_VISIBILITY: Record<string, boolean> = {
  welcomeTitlePrefix: true,
  welcomeGreeting: true,
  balancePrefix: true,
  tariffPrefix: true,
  subscriptionPrefix: true,
  expirePrefix: true,
  daysLeftPrefix: true,
  devicesLabel: true,
  trafficPrefix: true,
  linkLabel: true,
  chooseAction: true,
};

/** Все ключи стилей внутренних кнопок и их дефолты — при изменении одного не терять остальные */
const DEFAULT_BOT_INNER_STYLES: Record<string, string> = {
  tariffPay: "success",
  topup: "primary",
  back: "danger",
  profile: "primary",
  trialConfirm: "success",
  lang: "primary",
  currency: "primary",
};

export function SettingsPage() {
  const { state, updateAdmin } = useAuth();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [twoFaEnableOpen, setTwoFaEnableOpen] = useState(false);
  const [twoFaDisableOpen, setTwoFaDisableOpen] = useState(false);
  const [twoFaSetupData, setTwoFaSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [twoFaStep, setTwoFaStep] = useState<1 | 2>(1);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [syncLoading, setSyncLoading] = useState<"from" | "to" | "missing" | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [squads, setSquads] = useState<{ uuid: string; name?: string }[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [plategaCallbackCopied, setPlategaCallbackCopied] = useState(false);
  const [yoomoneyWebhookCopied, setYoomoneyWebhookCopied] = useState(false);
  const [yookassaWebhookCopied, setYookassaWebhookCopied] = useState(false);
  const [cryptopayWebhookCopied, setCryptopayWebhookCopied] = useState(false);
  const [heleketWebhookCopied, setHeleketWebhookCopied] = useState(false);
  const [defaultSubpageConfig, setDefaultSubpageConfig] = useState<SubscriptionPageConfig | null>(null);
  const defaultPlategaMethods: { id: number; enabled: boolean; label: string }[] = [
    { id: 2, enabled: true, label: t("admin.settings.defaults.platega.spb") },
    { id: 11, enabled: false, label: t("admin.settings.defaults.platega.cards") },
    { id: 12, enabled: false, label: t("admin.settings.defaults.platega.international") },
    { id: 13, enabled: false, label: t("admin.settings.defaults.platega.crypto") },
  ];
  const defaultEpayMethods: { type: string; enabled: boolean; label: string }[] = [
    { type: "alipay", enabled: true, label: t("admin.settings.defaults.epay.alipay") },
    { type: "wxpay", enabled: true, label: t("admin.settings.defaults.epay.wxpay") },
    { type: "usdt", enabled: false, label: t("admin.settings.defaults.epay.usdt") },
  ];
  const defaultBotButtons: BotButtonItem[] = [
    { id: "tariffs", visible: true, label: t("admin.settings.defaults.botButtons.tariffs"), order: 0, style: "success", emojiKey: "PACKAGE" },
    { id: "proxy", visible: true, label: t("admin.settings.defaults.botButtons.proxy"), order: 0.5, style: "primary", emojiKey: "SERVERS" },
    { id: "my_proxy", visible: true, label: t("admin.settings.defaults.botButtons.myProxy"), order: 0.6, style: "primary", emojiKey: "SERVERS" },
    { id: "singbox", visible: true, label: t("admin.settings.defaults.botButtons.singbox"), order: 0.55, style: "primary", emojiKey: "SERVERS" },
    { id: "my_singbox", visible: true, label: t("admin.settings.defaults.botButtons.mySingbox"), order: 0.65, style: "primary", emojiKey: "SERVERS" },
    { id: "profile", visible: true, label: t("admin.settings.defaults.botButtons.profile"), order: 1, style: "", emojiKey: "PUZZLE" },
    { id: "devices", visible: true, label: t("admin.settings.defaults.botButtons.devices"), order: 1.5, style: "primary", emojiKey: "DEVICES" },
    { id: "topup", visible: true, label: t("admin.settings.defaults.botButtons.topup"), order: 2, style: "success", emojiKey: "CARD" },
    { id: "referral", visible: true, label: t("admin.settings.defaults.botButtons.referral"), order: 3, style: "primary", emojiKey: "LINK" },
    { id: "trial", visible: true, label: t("admin.settings.defaults.botButtons.trial"), order: 4, style: "success", emojiKey: "TRIAL" },
    { id: "vpn", visible: true, label: t("admin.settings.defaults.botButtons.vpn"), order: 5, style: "danger", emojiKey: "SERVERS", onePerRow: true },
    { id: "cabinet", visible: true, label: t("admin.settings.defaults.botButtons.cabinet"), order: 6, style: "primary", emojiKey: "SERVERS" },
    { id: "tickets", visible: true, label: t("admin.settings.defaults.botButtons.tickets"), order: 6.5, style: "primary", emojiKey: "NOTE" },
    { id: "support", visible: true, label: t("admin.settings.defaults.botButtons.support"), order: 7, style: "primary", emojiKey: "NOTE" },
    { id: "promocode", visible: true, label: t("admin.settings.defaults.botButtons.promocode"), order: 8, style: "primary", emojiKey: "STAR" },
    { id: "extra_options", visible: true, label: t("admin.settings.defaults.botButtons.extraOptions"), order: 9, style: "primary", emojiKey: "PACKAGE" },
  ];
  const defaultBotMenuTexts: Record<string, string> = {
    welcomeTitlePrefix: t("admin.settings.defaults.botMenuTexts.welcomeTitlePrefix"),
    welcomeGreeting: t("admin.settings.defaults.botMenuTexts.welcomeGreeting"),
    balancePrefix: t("admin.settings.defaults.botMenuTexts.balancePrefix"),
    tariffPrefix: t("admin.settings.defaults.botMenuTexts.tariffPrefix"),
    subscriptionPrefix: t("admin.settings.defaults.botMenuTexts.subscriptionPrefix"),
    statusInactive: t("admin.settings.defaults.botMenuTexts.statusInactive"),
    statusActive: t("admin.settings.defaults.botMenuTexts.statusActive"),
    statusExpired: t("admin.settings.defaults.botMenuTexts.statusExpired"),
    statusLimited: t("admin.settings.defaults.botMenuTexts.statusLimited"),
    statusDisabled: t("admin.settings.defaults.botMenuTexts.statusDisabled"),
    expirePrefix: t("admin.settings.defaults.botMenuTexts.expirePrefix"),
    daysLeftPrefix: t("admin.settings.defaults.botMenuTexts.daysLeftPrefix"),
    devicesLabel: t("admin.settings.defaults.botMenuTexts.devicesLabel"),
    devicesAvailable: t("admin.settings.defaults.botMenuTexts.devicesAvailable"),
    trafficPrefix: t("admin.settings.defaults.botMenuTexts.trafficPrefix"),
    linkLabel: t("admin.settings.defaults.botMenuTexts.linkLabel"),
    chooseAction: t("admin.settings.defaults.botMenuTexts.chooseAction"),
  };
  const defaultBotTariffsText = t("admin.settings.defaults.botTariffsText");
  const defaultBotPaymentText = t("admin.settings.defaults.botPaymentText");
  const botTariffFieldLabels: Record<string, string> = {
    name: t("admin.settings.bot.tariffFieldLabels.name"),
    durationDays: t("admin.settings.bot.tariffFieldLabels.durationDays"),
    price: t("admin.settings.bot.tariffFieldLabels.price"),
    currency: t("admin.settings.bot.tariffFieldLabels.currency"),
    trafficLimit: t("admin.settings.bot.tariffFieldLabels.trafficLimit"),
    deviceLimit: t("admin.settings.bot.tariffFieldLabels.deviceLimit"),
  };
  const botMenuLineLabels: Record<string, string> = {
    welcomeTitlePrefix: t("admin.settings.bot.menuLineLabels.welcomeTitlePrefix"),
    welcomeGreeting: t("admin.settings.bot.menuLineLabels.welcomeGreeting"),
    balancePrefix: t("admin.settings.bot.menuLineLabels.balancePrefix"),
    tariffPrefix: t("admin.settings.bot.menuLineLabels.tariffPrefix"),
    subscriptionPrefix: t("admin.settings.bot.menuLineLabels.subscriptionPrefix"),
    expirePrefix: t("admin.settings.bot.menuLineLabels.expirePrefix"),
    daysLeftPrefix: t("admin.settings.bot.menuLineLabels.daysLeftPrefix"),
    devicesLabel: t("admin.settings.bot.menuLineLabels.devicesLabel"),
    trafficPrefix: t("admin.settings.bot.menuLineLabels.trafficPrefix"),
    linkLabel: t("admin.settings.bot.menuLineLabels.linkLabel"),
    chooseAction: t("admin.settings.bot.menuLineLabels.chooseAction"),
  };
  const botMenuTextLabels: Record<string, string> = {
    welcomeTitlePrefix: t("admin.settings.bot.menuTextLabels.welcomeTitlePrefix"),
    welcomeGreeting: t("admin.settings.bot.menuTextLabels.welcomeGreeting"),
    balancePrefix: t("admin.settings.bot.menuTextLabels.balancePrefix"),
    tariffPrefix: t("admin.settings.bot.menuTextLabels.tariffPrefix"),
    subscriptionPrefix: t("admin.settings.bot.menuTextLabels.subscriptionPrefix"),
    statusInactive: t("admin.settings.bot.menuTextLabels.statusInactive"),
    statusActive: t("admin.settings.bot.menuTextLabels.statusActive"),
    statusExpired: t("admin.settings.bot.menuTextLabels.statusExpired"),
    statusLimited: t("admin.settings.bot.menuTextLabels.statusLimited"),
    statusDisabled: t("admin.settings.bot.menuTextLabels.statusDisabled"),
    expirePrefix: t("admin.settings.bot.menuTextLabels.expirePrefix"),
    daysLeftPrefix: t("admin.settings.bot.menuTextLabels.daysLeftPrefix"),
    devicesLabel: t("admin.settings.bot.menuTextLabels.devicesLabel"),
    devicesAvailable: t("admin.settings.bot.menuTextLabels.devicesAvailable"),
    trafficPrefix: t("admin.settings.bot.menuTextLabels.trafficPrefix"),
    linkLabel: t("admin.settings.bot.menuTextLabels.linkLabel"),
    chooseAction: t("admin.settings.bot.menuTextLabels.chooseAction"),
  };
  const defaultJourneySteps = [
    { title: t("admin.settings.defaults.landingJourney.step1.title"), desc: t("admin.settings.defaults.landingJourney.step1.desc") },
    { title: t("admin.settings.defaults.landingJourney.step2.title"), desc: t("admin.settings.defaults.landingJourney.step2.desc") },
    { title: t("admin.settings.defaults.landingJourney.step3.title"), desc: t("admin.settings.defaults.landingJourney.step3.desc") },
  ];
  const defaultSignalCards = [
    { eyebrow: t("admin.settings.defaults.landingSignalCards.card1.eyebrow"), title: t("admin.settings.defaults.landingSignalCards.card1.title"), desc: t("admin.settings.defaults.landingSignalCards.card1.desc") },
    { eyebrow: t("admin.settings.defaults.landingSignalCards.card2.eyebrow"), title: t("admin.settings.defaults.landingSignalCards.card2.title"), desc: t("admin.settings.defaults.landingSignalCards.card2.desc") },
    { eyebrow: t("admin.settings.defaults.landingSignalCards.card3.eyebrow"), title: t("admin.settings.defaults.landingSignalCards.card3.title"), desc: t("admin.settings.defaults.landingSignalCards.card3.desc") },
  ];
  const defaultTrustPoints = [
    t("admin.settings.defaults.landingTrustPoints.point1"),
    t("admin.settings.defaults.landingTrustPoints.point2"),
    t("admin.settings.defaults.landingTrustPoints.point3"),
  ];
  const defaultExperiencePanels = [
    { title: t("admin.settings.defaults.landingExperiencePanels.panel1.title"), desc: t("admin.settings.defaults.landingExperiencePanels.panel1.desc") },
    { title: t("admin.settings.defaults.landingExperiencePanels.panel2.title"), desc: t("admin.settings.defaults.landingExperiencePanels.panel2.desc") },
    { title: t("admin.settings.defaults.landingExperiencePanels.panel3.title"), desc: t("admin.settings.defaults.landingExperiencePanels.panel3.desc") },
  ];
  const defaultDevicesList = [
    t("admin.settings.defaults.landingDevicesList.item1"),
    t("admin.settings.defaults.landingDevicesList.item2"),
    t("admin.settings.defaults.landingDevicesList.item3"),
    t("admin.settings.defaults.landingDevicesList.item4"),
    t("admin.settings.defaults.landingDevicesList.item5"),
  ];
  const defaultQuickStartList = [
    t("admin.settings.defaults.landingQuickStartList.item1"),
    t("admin.settings.defaults.landingQuickStartList.item2"),
    t("admin.settings.defaults.landingQuickStartList.item3"),
  ];
  const langLabels: Record<string, string> = {
    ru: t("admin.settings.general.languages.ruShort"),
    en: t("admin.settings.general.languages.enShort"),
    zh: t("admin.settings.general.languages.zhShort"),
  };
  const langOptionLabels: Record<string, string> = {
    ru: t("admin.settings.general.languages.ruLong"),
    en: t("admin.settings.general.languages.enLong"),
    zh: t("admin.settings.general.languages.zhLong"),
  };
  const [landingJourneySteps, setLandingJourneySteps] = useState<{ title: string; desc: string }[]>(defaultJourneySteps);
  const [landingSignalCards, setLandingSignalCards] = useState<{ eyebrow: string; title: string; desc: string }[]>(defaultSignalCards);
  const [landingTrustPoints, setLandingTrustPoints] = useState<string[]>(defaultTrustPoints);
  const [landingExperiencePanels, setLandingExperiencePanels] = useState<{ title: string; desc: string }[]>(defaultExperiencePanels);
  const [landingDevicesList, setLandingDevicesList] = useState<string[]>(defaultDevicesList);
  const [landingQuickStartList, setLandingQuickStartList] = useState<string[]>(defaultQuickStartList);
  const token = state.accessToken!;

  useEffect(() => {
    api.getSettings(token).then((data) => {
      setSettings({
        ...data,
        activeLanguages: (data.activeLanguages || []).filter((l: string) => ALLOWED_LANGS.includes(l)),
        activeCurrencies: (data.activeCurrencies || []).filter((c: string) => ALLOWED_CURRENCIES.includes(c)),
        defaultReferralPercent: data.defaultReferralPercent ?? 30,
        referralPercentLevel2: (data as AdminSettings).referralPercentLevel2 ?? 10,
        referralPercentLevel3: (data as AdminSettings).referralPercentLevel3 ?? 10,
        plategaMethods: ((data as AdminSettings).plategaMethods ?? defaultPlategaMethods).map((m) => ({
          ...m,
          label: translatePlategaLabel(m, t),
        })),
        epayMethods: ((data as AdminSettings).epayMethods ?? defaultEpayMethods).map((m) => ({
          ...m,
        })),
        botButtons: (() => {
          const raw = (data as AdminSettings).botButtons;
          const loaded = Array.isArray(raw) ? raw : [];
          return defaultBotButtons.map((def) => {
            const fromApi = loaded.find((b: { id: string }) => b.id === def.id);
            return fromApi ? { ...def, ...fromApi } : def;
          }) as BotButtonItem[];
        })(),
        botButtonsPerRow: (data as AdminSettings).botButtonsPerRow ?? 1,
        botEmojis: (data as AdminSettings).botEmojis ?? {},
        botBackLabel: (data as AdminSettings).botBackLabel ?? t("admin.settings.defaults.botBackLabel"),
  botMenuTexts: { ...defaultBotMenuTexts, ...((data as AdminSettings).botMenuTexts ?? {}) },
        botMenuLineVisibility: { ...DEFAULT_BOT_MENU_LINE_VISIBILITY, ...((data as AdminSettings).botMenuLineVisibility ?? {}) },
  botTariffsText: (data as AdminSettings).botTariffsText ?? defaultBotTariffsText,
        botTariffsFields: { ...DEFAULT_BOT_TARIFF_FIELDS, ...((data as AdminSettings).botTariffsFields ?? {}) },
  botPaymentText: (data as AdminSettings).botPaymentText ?? defaultBotPaymentText,
        botInnerButtonStyles: (() => {
          const raw = (data as AdminSettings).botInnerButtonStyles;
          const loaded =
            raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, string>) : {};
          return { ...DEFAULT_BOT_INNER_STYLES, ...loaded };
        })(),
        subscriptionPageConfig: (data as AdminSettings).subscriptionPageConfig ?? null,
        supportLink: (data as AdminSettings).supportLink ?? "",
        agreementLink: (data as AdminSettings).agreementLink ?? "",
        offerLink: (data as AdminSettings).offerLink ?? "",
        instructionsLink: (data as AdminSettings).instructionsLink ?? "",
        ticketsEnabled: (data as AdminSettings).ticketsEnabled ?? false,
        aiChatEnabled: (data as AdminSettings).aiChatEnabled !== false,
        sellOptionsEnabled: (data as AdminSettings).sellOptionsEnabled ?? false,
        sellOptionsTrafficEnabled: (data as AdminSettings).sellOptionsTrafficEnabled ?? false,
        sellOptionsTrafficProducts: (data as AdminSettings).sellOptionsTrafficProducts ?? [],
        sellOptionsDevicesEnabled: (data as AdminSettings).sellOptionsDevicesEnabled ?? false,
        sellOptionsDevicesProducts: (data as AdminSettings).sellOptionsDevicesProducts ?? [],
        sellOptionsServersEnabled: (data as AdminSettings).sellOptionsServersEnabled ?? false,
        sellOptionsServersProducts: (data as AdminSettings).sellOptionsServersProducts ?? [],
      });
    }).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!settings) return;
    try {
      const raw = (settings as { landingJourneyStepsJson?: string | null }).landingJourneyStepsJson;
      if (raw?.trim()) {
        const a = JSON.parse(raw) as unknown;
        if (Array.isArray(a) && a.length >= 1) {
          setLandingJourneySteps(a.slice(0, 3).map((x: unknown) => ({
            title: typeof (x as { title?: string }).title === "string" ? (x as { title: string }).title : "",
            desc: typeof (x as { desc?: string }).desc === "string" ? (x as { desc: string }).desc : "",
          })));
        }
      }
    } catch { /* keep default */ }
    try {
      const raw = (settings as { landingSignalCardsJson?: string | null }).landingSignalCardsJson;
      if (raw?.trim()) {
        const a = JSON.parse(raw) as unknown;
        if (Array.isArray(a) && a.length >= 1) {
          setLandingSignalCards(a.slice(0, 3).map((x: unknown) => ({
            eyebrow: typeof (x as { eyebrow?: string }).eyebrow === "string" ? (x as { eyebrow: string }).eyebrow : "",
            title: typeof (x as { title?: string }).title === "string" ? (x as { title: string }).title : "",
            desc: typeof (x as { desc?: string }).desc === "string" ? (x as { desc: string }).desc : "",
          })));
        }
      }
    } catch { /* keep default */ }
    try {
      const raw = (settings as { landingTrustPointsJson?: string | null }).landingTrustPointsJson;
      if (raw?.trim()) {
        const a = JSON.parse(raw) as unknown;
        if (Array.isArray(a)) setLandingTrustPoints(a.slice(0, 5).map((x) => String(x)));
      }
    } catch { /* keep default */ }
    try {
      const raw = (settings as { landingExperiencePanelsJson?: string | null }).landingExperiencePanelsJson;
      if (raw?.trim()) {
        const a = JSON.parse(raw) as unknown;
        if (Array.isArray(a) && a.length >= 1) {
          setLandingExperiencePanels(a.slice(0, 3).map((x: unknown) => ({
            title: typeof (x as { title?: string }).title === "string" ? (x as { title: string }).title : "",
            desc: typeof (x as { desc?: string }).desc === "string" ? (x as { desc: string }).desc : "",
          })));
        }
      }
    } catch { /* keep default */ }
    try {
      const raw = (settings as { landingDevicesListJson?: string | null }).landingDevicesListJson;
      if (raw?.trim()) {
        const a = JSON.parse(raw) as unknown;
        if (Array.isArray(a)) setLandingDevicesList(a.slice(0, 8).map((x: unknown) => (typeof (x as { name?: string }).name === "string" ? (x as { name: string }).name : String(x))));
      }
    } catch { /* keep default */ }
    try {
      const raw = (settings as { landingQuickStartJson?: string | null }).landingQuickStartJson;
      if (raw?.trim()) {
        const a = JSON.parse(raw) as unknown;
        if (Array.isArray(a)) setLandingQuickStartList(a.slice(0, 5).map((x) => String(x)));
      }
    } catch { /* keep default */ }
  }, [settings?.landingJourneyStepsJson, settings?.landingSignalCardsJson, settings?.landingTrustPointsJson, settings?.landingExperiencePanelsJson, settings?.landingDevicesListJson, settings?.landingQuickStartJson]);

  useEffect(() => {
    if (activeTab === "subpage") {
      api.getDefaultSubscriptionPageConfig(token).then((c) => setDefaultSubpageConfig(c ?? null)).catch(() => setDefaultSubpageConfig(null));
    }
  }, [token, activeTab]);

  useEffect(() => {
    api.getRemnaSquadsInternal(token).then((raw: unknown) => {
      const res = raw as { response?: { internalSquads?: { uuid: string; name?: string }[] } };
      const items = res?.response?.internalSquads ?? (Array.isArray(res) ? res : []);
      setSquads(Array.isArray(items) ? items : []);
    }).catch(() => setSquads([]));
  }, [token]);

  async function handleSyncFromRemna() {
    setSyncLoading("from");
    setSyncMessage(null);
    try {
      const r: SyncResult = await api.syncFromRemna(token);
      setSyncMessage(
        r.ok
          ? t("admin.settings.sync.fromSuccess", { created: r.created, updated: r.updated, skipped: r.skipped })
          : t("admin.settings.sync.errors", { errors: r.errors.join("; ") })
      );
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : t("admin.settings.sync.error"));
    } finally {
      setSyncLoading(null);
    }
  }

  async function handleSyncToRemna() {
    setSyncLoading("to");
    setSyncMessage(null);
    try {
      const r: SyncToRemnaResult = await api.syncToRemna(token);
      const parts: string[] = [];
      if (r.updated > 0) parts.push(t("admin.settings.sync.updated", { count: r.updated }));
      if (r.unlinked > 0) parts.push(t("admin.settings.sync.unlinkedDetailed", { count: r.unlinked }));
      const successMsg = parts.length > 0 ? parts.join(". ") : t("admin.settings.sync.noChanges");
      const msg = r.ok ? successMsg : (r.errors.length > 0 ? t("admin.settings.sync.errors", { errors: r.errors.join("; ") }) : "") + (r.unlinked > 0 ? (r.errors.length ? ". " : "") + t("admin.settings.sync.unlinkedShort", { count: r.unlinked }) : "");
      setSyncMessage(msg || successMsg);
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : t("admin.settings.sync.error"));
    } finally {
      setSyncLoading(null);
    }
  }

  async function handleSyncCreateRemnaForMissing() {
    setSyncLoading("missing");
    setSyncMessage(null);
    try {
      const r: SyncCreateRemnaForMissingResult = await api.syncCreateRemnaForMissing(token);
      setSyncMessage(
        r.ok
          ? t("admin.settings.sync.missingSuccess", { created: r.created, linked: r.linked })
          : t("admin.settings.sync.errors", { errors: r.errors.join("; ") })
      );
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : t("admin.error"));
    } finally {
      setSyncLoading(null);
    }
  }

  async function openTwoFaEnable() {
    setTwoFaError(null);
    setTwoFaSetupData(null);
    setTwoFaStep(1);
    setTwoFaCode("");
    setTwoFaEnableOpen(true);
    setTwoFaLoading(true);
    try {
      const data = await api.admin2FASetup(token);
      setTwoFaSetupData(data);
    } catch (e) {
  setTwoFaError(e instanceof Error ? e.message : t("admin.settings.twoFa.setupError"));
    } finally {
      setTwoFaLoading(false);
    }
  }
  function closeTwoFaEnable() {
    setTwoFaEnableOpen(false);
    setTwoFaSetupData(null);
    setTwoFaStep(1);
    setTwoFaCode("");
    setTwoFaError(null);
  }
  async function confirmTwoFaEnable() {
    if (!twoFaCode.trim() || twoFaCode.length !== 6) {
  setTwoFaError(t("admin.settings.twoFa.codeRequired"));
      return;
    }
    setTwoFaError(null);
    setTwoFaLoading(true);
    try {
      await api.admin2FAConfirm(token, twoFaCode.trim());
      const admin = await api.getMe(token);
      updateAdmin(admin);
      closeTwoFaEnable();
    } catch (e) {
  setTwoFaError(e instanceof Error ? e.message : t("admin.settings.twoFa.invalidCode"));
    } finally {
      setTwoFaLoading(false);
    }
  }
  async function openTwoFaDisable() {
    setTwoFaDisableOpen(true);
    setTwoFaCode("");
    setTwoFaError(null);
  }
  async function confirmTwoFaDisable() {
    if (!twoFaCode.trim() || twoFaCode.length !== 6) {
  setTwoFaError(t("admin.settings.twoFa.codeRequired"));
      return;
    }
    setTwoFaError(null);
    setTwoFaLoading(true);
    try {
      await api.admin2FADisable(token, twoFaCode.trim());
      const admin = await api.getMe(token);
      updateAdmin(admin);
      setTwoFaDisableOpen(false);
      setTwoFaCode("");
    } catch (e) {
  setTwoFaError(e instanceof Error ? e.message : t("admin.settings.twoFa.invalidCode"));
    } finally {
      setTwoFaLoading(false);
    }
  }

  async function saveOptionsOnly() {
    if (!settings) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        sellOptionsEnabled: settings.sellOptionsEnabled ?? false,
        sellOptionsTrafficEnabled: settings.sellOptionsTrafficEnabled ?? false,
        sellOptionsTrafficProducts: (settings.sellOptionsTrafficProducts?.length ? JSON.stringify(settings.sellOptionsTrafficProducts) : "") as string | null,
        sellOptionsDevicesEnabled: settings.sellOptionsDevicesEnabled ?? false,
        sellOptionsDevicesProducts: (settings.sellOptionsDevicesProducts?.length ? JSON.stringify(settings.sellOptionsDevicesProducts) : "") as string | null,
        sellOptionsServersEnabled: settings.sellOptionsServersEnabled ?? false,
        sellOptionsServersProducts: (settings.sellOptionsServersProducts?.length ? JSON.stringify(settings.sellOptionsServersProducts) : "") as string | null,
      };
      const updated = await api.updateSettings(token, payload);
      const u = updated as AdminSettings;
      setSettings((prev) => (prev ? { ...prev, ...u } : prev));
      setMessage(t("admin.settings.options.saved"));
    } catch {
      setMessage(t("admin.settings.errorSave"));
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    const langs = Array.isArray(settings.activeLanguages) ? settings.activeLanguages.filter((l) => ALLOWED_LANGS.includes(l)) : ALLOWED_LANGS;
    const currs = Array.isArray(settings.activeCurrencies) ? settings.activeCurrencies.filter((c) => ALLOWED_CURRENCIES.includes(c)) : ALLOWED_CURRENCIES;
    const defaultLang = (settings.defaultLanguage && ALLOWED_LANGS.includes(settings.defaultLanguage) ? settings.defaultLanguage : langs[0]) ?? "ru";
    const defaultCurr = (settings.defaultCurrency && ALLOWED_CURRENCIES.includes(settings.defaultCurrency) ? settings.defaultCurrency : currs[0]) ?? "usd";
    api
      .updateSettings(token, {
        activeLanguages: langs.length ? langs.join(",") : ALLOWED_LANGS.join(","),
        activeCurrencies: currs.length ? currs.join(",") : ALLOWED_CURRENCIES.join(","),
        defaultLanguage: defaultLang,
        defaultCurrency: defaultCurr,
        defaultReferralPercent: settings.defaultReferralPercent,
        referralPercentLevel2: settings.referralPercentLevel2 ?? 10,
        referralPercentLevel3: settings.referralPercentLevel3 ?? 10,
        trialDays: settings.trialDays,
        trialSquadUuid: settings.trialSquadUuid ?? null,
        trialDeviceLimit: settings.trialDeviceLimit ?? null,
        trialTrafficLimitBytes: settings.trialTrafficLimitBytes ?? null,
        serviceName: settings.serviceName,
        logo: settings.logo ?? null,
        logoBot: settings.logoBot ?? null,
        favicon: settings.favicon ?? null,
        remnaClientUrl: settings.remnaClientUrl ?? null,
        smtpHost: settings.smtpHost ?? null,
        smtpPort: settings.smtpPort ?? undefined,
        smtpSecure: settings.smtpSecure ?? undefined,
        smtpUser: settings.smtpUser ?? null,
        smtpPassword: settings.smtpPassword && settings.smtpPassword !== "********" ? settings.smtpPassword : undefined,
        smtpFromEmail: settings.smtpFromEmail ?? null,
        smtpFromName: settings.smtpFromName ?? null,
        skipEmailVerification: settings.skipEmailVerification ?? false,
        useRemnaSubscriptionPage: settings.useRemnaSubscriptionPage ?? false,
        publicAppUrl: settings.publicAppUrl ?? null,
        telegramBotToken: settings.telegramBotToken ?? null,
        telegramBotUsername: settings.telegramBotUsername ?? null,
        botAdminTelegramIds: settings.botAdminTelegramIds ?? null,
        notificationTelegramGroupId: settings.notificationTelegramGroupId ?? null,
        plategaMerchantId: settings.plategaMerchantId ?? null,
        plategaSecret: settings.plategaSecret && settings.plategaSecret !== "********" ? settings.plategaSecret : undefined,
        plategaMethods: settings.plategaMethods != null ? JSON.stringify(settings.plategaMethods) : undefined,
        yoomoneyClientId: settings.yoomoneyClientId ?? null,
        yoomoneyClientSecret: settings.yoomoneyClientSecret && settings.yoomoneyClientSecret !== "********" ? settings.yoomoneyClientSecret : undefined,
        yoomoneyReceiverWallet: settings.yoomoneyReceiverWallet ?? null,
        yoomoneyNotificationSecret: settings.yoomoneyNotificationSecret && settings.yoomoneyNotificationSecret !== "********" ? settings.yoomoneyNotificationSecret : undefined,
        yookassaShopId: settings.yookassaShopId ?? null,
        yookassaSecretKey: settings.yookassaSecretKey && settings.yookassaSecretKey !== "********" ? settings.yookassaSecretKey : undefined,
        cryptopayApiToken: settings.cryptopayApiToken ?? null,
        cryptopayTestnet: settings.cryptopayTestnet ?? false,
        heleketMerchantId: settings.heleketMerchantId ?? null,
        heleketApiKey: settings.heleketApiKey && settings.heleketApiKey !== "********" ? settings.heleketApiKey : undefined,
        epayPid: settings.epayPid ?? null,
        epayKey: settings.epayKey && settings.epayKey !== "********" ? settings.epayKey : undefined,
        epayApiUrl: settings.epayApiUrl ?? null,
        epayMethods: settings.epayMethods != null ? JSON.stringify(settings.epayMethods) : undefined,
        groqApiKey: settings.groqApiKey && settings.groqApiKey !== "********" ? settings.groqApiKey : undefined,
        groqModel: settings.groqModel ?? undefined,
        groqFallback1: settings.groqFallback1 ?? undefined,
        groqFallback2: settings.groqFallback2 ?? undefined,
        groqFallback3: settings.groqFallback3 ?? undefined,
        aiSystemPrompt: settings.aiSystemPrompt ?? undefined,
        botButtons: settings.botButtons != null ? JSON.stringify(settings.botButtons) : undefined,
        botButtonsPerRow: settings.botButtonsPerRow ?? 1,
        botEmojis: settings.botEmojis != null ? settings.botEmojis : undefined,
        botBackLabel: settings.botBackLabel ?? null,
        botMenuTexts: settings.botMenuTexts != null ? JSON.stringify(settings.botMenuTexts) : undefined,
        botMenuLineVisibility: settings.botMenuLineVisibility != null ? JSON.stringify(settings.botMenuLineVisibility) : undefined,
        botTariffsText: settings.botTariffsText ?? undefined,
        botTariffsFields: settings.botTariffsFields != null ? JSON.stringify(settings.botTariffsFields) : undefined,
        botPaymentText: settings.botPaymentText ?? undefined,
        botInnerButtonStyles: JSON.stringify({
          ...DEFAULT_BOT_INNER_STYLES,
          ...(settings.botInnerButtonStyles ?? {}),
        }),
        subscriptionPageConfig: settings.subscriptionPageConfig ?? undefined,
        supportLink: settings.supportLink ?? undefined,
        agreementLink: settings.agreementLink ?? undefined,
        offerLink: settings.offerLink ?? undefined,
        instructionsLink: settings.instructionsLink ?? undefined,
        ticketsEnabled: settings.ticketsEnabled ?? false,
        adminFrontNotificationsEnabled: settings.adminFrontNotificationsEnabled ?? true,
        aiChatEnabled: settings.aiChatEnabled !== false,
        themeAccent: settings.themeAccent ?? "default",
        forceSubscribeEnabled: settings.forceSubscribeEnabled ?? false,
        forceSubscribeChannelId: settings.forceSubscribeChannelId ?? null,
        forceSubscribeMessage: settings.forceSubscribeMessage ?? null,
        allowUserThemeChange: (settings as any).allowUserThemeChange ?? true,
        sellOptionsEnabled: settings.sellOptionsEnabled ?? false,
        sellOptionsTrafficEnabled: settings.sellOptionsTrafficEnabled ?? false,
        sellOptionsTrafficProducts: settings.sellOptionsTrafficProducts?.length ? JSON.stringify(settings.sellOptionsTrafficProducts) : null,
        sellOptionsDevicesEnabled: settings.sellOptionsDevicesEnabled ?? false,
        sellOptionsDevicesProducts: settings.sellOptionsDevicesProducts?.length ? JSON.stringify(settings.sellOptionsDevicesProducts) : null,
        sellOptionsServersEnabled: settings.sellOptionsServersEnabled ?? false,
        sellOptionsServersProducts: settings.sellOptionsServersProducts?.length ? JSON.stringify(settings.sellOptionsServersProducts) : null,
        customBuildEnabled: settings.customBuildEnabled ?? false,
        customBuildPricePerDay: settings.customBuildPricePerDay ?? 0,
        customBuildPricePerDevice: settings.customBuildPricePerDevice ?? 0,
        customBuildTrafficMode: settings.customBuildTrafficMode ?? "unlimited",
        customBuildPricePerGb: settings.customBuildPricePerGb ?? 0,
        customBuildSquadUuid: settings.customBuildSquadUuid ?? null,
        customBuildCurrency: settings.customBuildCurrency ?? "rub",
        customBuildMaxDays: settings.customBuildMaxDays ?? 360,
        customBuildMaxDevices: settings.customBuildMaxDevices ?? 10,
        googleLoginEnabled: settings.googleLoginEnabled ?? false,
        googleClientId: settings.googleClientId ?? null,
        googleClientSecret: settings.googleClientSecret && settings.googleClientSecret !== "********" ? settings.googleClientSecret : undefined,
        appleLoginEnabled: settings.appleLoginEnabled ?? false,
        appleClientId: settings.appleClientId ?? null,
        appleTeamId: settings.appleTeamId ?? null,
        appleKeyId: settings.appleKeyId ?? null,
        applePrivateKey: settings.applePrivateKey && settings.applePrivateKey !== "********" ? settings.applePrivateKey : undefined,
        landingEnabled: settings.landingEnabled ?? false,
        landingHeroTitle: settings.landingHeroTitle ?? null,
        landingHeroSubtitle: settings.landingHeroSubtitle ?? null,
        landingHeroCtaText: settings.landingHeroCtaText ?? null,
        landingShowTariffs: settings.landingShowTariffs !== false,
        landingContacts: settings.landingContacts ?? null,
        landingOfferLink: settings.landingOfferLink ?? null,
        landingPrivacyLink: settings.landingPrivacyLink ?? null,
        landingFooterText: settings.landingFooterText ?? null,
        landingHeroBadge: settings.landingHeroBadge ?? null,
        landingHeroHint: settings.landingHeroHint ?? null,
        landingFeature1Label: settings.landingFeature1Label ?? null,
        landingFeature1Sub: settings.landingFeature1Sub ?? null,
        landingFeature2Label: settings.landingFeature2Label ?? null,
        landingFeature2Sub: settings.landingFeature2Sub ?? null,
        landingFeature3Label: settings.landingFeature3Label ?? null,
        landingFeature3Sub: settings.landingFeature3Sub ?? null,
        landingFeature4Label: settings.landingFeature4Label ?? null,
        landingFeature4Sub: settings.landingFeature4Sub ?? null,
        landingFeature5Label: settings.landingFeature5Label ?? null,
        landingFeature5Sub: settings.landingFeature5Sub ?? null,
        landingBenefitsTitle: settings.landingBenefitsTitle ?? null,
        landingBenefitsSubtitle: settings.landingBenefitsSubtitle ?? null,
        landingBenefit1Title: settings.landingBenefit1Title ?? null,
        landingBenefit1Desc: settings.landingBenefit1Desc ?? null,
        landingBenefit2Title: settings.landingBenefit2Title ?? null,
        landingBenefit2Desc: settings.landingBenefit2Desc ?? null,
        landingBenefit3Title: settings.landingBenefit3Title ?? null,
        landingBenefit3Desc: settings.landingBenefit3Desc ?? null,
        landingBenefit4Title: settings.landingBenefit4Title ?? null,
        landingBenefit4Desc: settings.landingBenefit4Desc ?? null,
        landingBenefit5Title: settings.landingBenefit5Title ?? null,
        landingBenefit5Desc: settings.landingBenefit5Desc ?? null,
        landingBenefit6Title: settings.landingBenefit6Title ?? null,
        landingBenefit6Desc: settings.landingBenefit6Desc ?? null,
        landingTariffsTitle: settings.landingTariffsTitle ?? null,
        landingTariffsSubtitle: settings.landingTariffsSubtitle ?? null,
        landingDevicesTitle: settings.landingDevicesTitle ?? null,
        landingDevicesSubtitle: settings.landingDevicesSubtitle ?? null,
        landingFaqTitle: settings.landingFaqTitle ?? null,
        landingFaqJson: settings.landingFaqJson ?? null,
        landingHeroHeadline1: settings.landingHeroHeadline1 ?? null,
        landingHeroHeadline2: settings.landingHeroHeadline2 ?? null,
        landingHeaderBadge: settings.landingHeaderBadge ?? null,
        landingButtonLogin: settings.landingButtonLogin ?? null,
        landingButtonLoginCabinet: settings.landingButtonLoginCabinet ?? null,
        landingNavBenefits: settings.landingNavBenefits ?? null,
        landingNavTariffs: settings.landingNavTariffs ?? null,
        landingNavDevices: settings.landingNavDevices ?? null,
        landingNavFaq: settings.landingNavFaq ?? null,
        landingBenefitsBadge: settings.landingBenefitsBadge ?? null,
        landingDefaultPaymentText: settings.landingDefaultPaymentText ?? null,
        landingButtonChooseTariff: settings.landingButtonChooseTariff ?? null,
        landingNoTariffsMessage: settings.landingNoTariffsMessage ?? null,
        landingButtonWatchTariffs: settings.landingButtonWatchTariffs ?? null,
        landingButtonStart: settings.landingButtonStart ?? null,
        landingButtonOpenCabinet: settings.landingButtonOpenCabinet ?? null,
        landingJourneyStepsJson: landingJourneySteps.length ? JSON.stringify(landingJourneySteps) : null,
        landingSignalCardsJson: landingSignalCards.length ? JSON.stringify(landingSignalCards) : null,
        landingTrustPointsJson: landingTrustPoints.some(Boolean) ? JSON.stringify(landingTrustPoints) : null,
        landingExperiencePanelsJson: landingExperiencePanels.length ? JSON.stringify(landingExperiencePanels) : null,
        landingDevicesListJson: landingDevicesList.filter(Boolean).length ? JSON.stringify(landingDevicesList.filter(Boolean).map((name) => ({ name }))) : null,
        landingQuickStartJson: landingQuickStartList.some(Boolean) ? JSON.stringify(landingQuickStartList) : null,
        landingInfraTitle: settings.landingInfraTitle ?? null,
        landingNetworkCockpitText: settings.landingNetworkCockpitText ?? null,
        landingPulseTitle: settings.landingPulseTitle ?? null,
        landingComfortTitle: settings.landingComfortTitle ?? null,
        landingComfortBadge: settings.landingComfortBadge ?? null,
        landingPrinciplesTitle: settings.landingPrinciplesTitle ?? null,
        landingTechTitle: settings.landingTechTitle ?? null,
        landingTechDesc: settings.landingTechDesc ?? null,
        landingCategorySubtitle: settings.landingCategorySubtitle ?? null,
        landingTariffDefaultDesc: settings.landingTariffDefaultDesc ?? null,
        landingTariffBullet1: settings.landingTariffBullet1 ?? null,
        landingTariffBullet2: settings.landingTariffBullet2 ?? null,
        landingTariffBullet3: settings.landingTariffBullet3 ?? null,
        landingLowestTariffDesc: settings.landingLowestTariffDesc ?? null,
        landingDevicesCockpitText: settings.landingDevicesCockpitText ?? null,
        landingUniversalityTitle: settings.landingUniversalityTitle ?? null,
        landingUniversalityDesc: settings.landingUniversalityDesc ?? null,
        landingQuickSetupTitle: settings.landingQuickSetupTitle ?? null,
        landingQuickSetupDesc: settings.landingQuickSetupDesc ?? null,
        landingPremiumServiceTitle: settings.landingPremiumServiceTitle ?? null,
        landingPremiumServicePara1: settings.landingPremiumServicePara1 ?? null,
        landingPremiumServicePara2: settings.landingPremiumServicePara2 ?? null,
        landingHowItWorksTitle: settings.landingHowItWorksTitle ?? null,
        landingHowItWorksDesc: settings.landingHowItWorksDesc ?? null,
        landingStatsPlatforms: settings.landingStatsPlatforms ?? null,
        landingStatsTariffsLabel: settings.landingStatsTariffsLabel ?? null,
        landingStatsAccessLabel: settings.landingStatsAccessLabel ?? null,
        landingStatsPaymentMethods: settings.landingStatsPaymentMethods ?? null,
        landingReadyToConnectEyebrow: settings.landingReadyToConnectEyebrow ?? null,
        landingReadyToConnectTitle: settings.landingReadyToConnectTitle ?? null,
        landingReadyToConnectDesc: settings.landingReadyToConnectDesc ?? null,
      })
      .then((updated) => {
        const u = updated as AdminSettings;
        setSettings({
          ...u,
          botInnerButtonStyles: {
            ...DEFAULT_BOT_INNER_STYLES,
            ...(settings.botInnerButtonStyles ?? {}),
          },
        });
        setMessage(t("admin.settings.saved"));
      })
      .catch(() => setMessage(t("admin.error")))
      .finally(() => setSaving(false));
  }

  if (loading) return <div className="text-muted-foreground">{t("admin.loading")}</div>;
  if (!settings) return <div className="text-destructive">{t("admin.settings.loadError")}</div>;

  return (
    <div className="space-y-6">
      <div>
  <h1 className="text-3xl font-bold tracking-tight">{t("admin.settings.title")}</h1>
  <p className="text-muted-foreground">{t("admin.settings.subtitle")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-10 gap-2 p-2 h-auto bg-muted/50 rounded-2xl border shadow-sm">
          <TabsTrigger value="general" className="gap-2 py-3 px-4 rounded-xl">
            <Settings2 className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.general")}
          </TabsTrigger>
          <TabsTrigger value="trial" className="gap-2 py-3 px-4 rounded-xl">
            <Gift className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.trial")}
          </TabsTrigger>
          <TabsTrigger value="referral" className="gap-2 py-3 px-4 rounded-xl">
            <Users className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.referral")}
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 py-3 px-4 rounded-xl">
            <CreditCard className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.payments")}
          </TabsTrigger>
          <TabsTrigger value="bot" className="gap-2 py-3 px-4 rounded-xl">
            <Bot className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.bot")}
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 py-3 px-4 rounded-xl">
            <Sparkles className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.ai")}
          </TabsTrigger>
          <TabsTrigger value="mail-telegram" className="gap-2 py-3 px-4 rounded-xl">
            <Mail className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.mailTelegram")}
          </TabsTrigger>
          <TabsTrigger value="subpage" className="gap-2 py-3 px-4 rounded-xl">
            <FileJson className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.subpage")}
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-2 py-3 px-4 rounded-xl">
            <Palette className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.theme")}
          </TabsTrigger>
          <TabsTrigger value="options" className="gap-2 py-3 px-4 rounded-xl">
            <Package className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.options")}
          </TabsTrigger>
          <TabsTrigger value="custom-build" className="gap-2 py-3 px-4 rounded-xl">
            <Layers className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.customBuild")}
          </TabsTrigger>
          <TabsTrigger value="oauth" className="gap-2 py-3 px-4 rounded-xl">
            <KeyRound className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.oauth")}
          </TabsTrigger>
          <TabsTrigger value="landing" className="gap-2 py-3 px-4 rounded-xl">
            <Globe className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.landing")}
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2 py-3 px-4 rounded-xl">
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            {t("admin.settings.tabs.sync")}
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.settings.general.title")}</CardTitle>
                <p className="text-sm text-muted-foreground">{t("admin.settings.general.subtitle")}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="tickets-enabled-general"
                      checked={!!settings.ticketsEnabled}
                      onCheckedChange={(checked: boolean) =>
                        setSettings((s) => (s ? { ...s, ticketsEnabled: checked === true } : s))
                      }
                    />
                    <div>
                      <Label htmlFor="tickets-enabled-general" className="text-base font-medium cursor-pointer">{t("admin.settings.general.tickets.title")}</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("admin.settings.general.tickets.description")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="admin-front-notifications"
                      checked={settings.adminFrontNotificationsEnabled ?? true}
                      onCheckedChange={(checked: boolean) =>
                        setSettings((s) =>
                          s ? { ...s, adminFrontNotificationsEnabled: checked === true } : s
                        )
                      }
                    />
                    <div>
                      <Label htmlFor="admin-front-notifications" className="text-base font-medium cursor-pointer">
                        {t("admin.settings.general.adminFrontNotifications.title")}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("admin.settings.general.adminFrontNotifications.description")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="ai-chat-enabled"
                      checked={settings.aiChatEnabled !== false}
                      onCheckedChange={(checked: boolean) =>
                        setSettings((s) => (s ? { ...s, aiChatEnabled: checked === true } : s))
                      }
                    />
                    <div>
                      <Label htmlFor="ai-chat-enabled" className="text-base font-medium cursor-pointer">{t("admin.settings.general.aiChat.title")}</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("admin.settings.general.aiChat.description")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border p-4 bg-muted/20">
                  <Label>{t("admin.settings.general.notificationGroup.label")}</Label>
                  <Input
                    value={settings.notificationTelegramGroupId ?? ""}
                    onChange={(e) => setSettings((s) => (s ? { ...s, notificationTelegramGroupId: e.target.value.trim() || null } : s))}
                    placeholder="-1001234567890"
                  />
                  <p className="text-xs text-muted-foreground">{t("admin.settings.general.notificationGroup.description")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.general.serviceName.label")}</Label>
                  <Input
                    value={settings.serviceName}
                    onChange={(e) => setSettings((s) => (s ? { ...s, serviceName: e.target.value } : s))}
                  />
                  <p className="text-xs text-muted-foreground">{t("admin.settings.general.serviceName.description")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.general.logo.label")}</Label>
                  {settings.logo ? (
                    <div className="flex items-center gap-3">
                      <img src={settings.logo} alt={t("admin.settings.general.logo.alt")} className="h-12 object-contain rounded border" />
                      <div className="flex gap-2">
                        <Label className="cursor-pointer">
                          <span className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4">{t("admin.settings.general.actions.uploadAnother")}</span>
                          <input
                            type="file"
                            accept="image/*"
                            placeholder={t("admin.settings.bot.support.supportPlaceholder")}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const r = new FileReader();
                              r.onload = () => setSettings((s) => (s ? { ...s, logo: r.result as string } : s));
                              r.readAsDataURL(f);
                            }}
                          />
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => setSettings((s) => (s ? { ...s, logo: null } : s))}>
                          {t("admin.delete")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="cursor-pointer">
                        <span className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background h-9 px-4 hover:bg-accent">{t("admin.settings.general.logo.upload")}</span>
                        <input
                          type="file"
                          accept="image/*"
                          placeholder={t("admin.settings.bot.forceSubscribe.channelPlaceholder")}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const r = new FileReader();
                            r.onload = () => setSettings((s) => (s ? { ...s, logo: r.result as string } : s));
                            r.readAsDataURL(f);
                          }}
                        />
                      </Label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{t("admin.settings.general.logo.description")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.general.botLogo.label")}</Label>
                  {settings.logoBot ? (
                    <div className="flex items-center gap-3">
                      <img src={settings.logoBot} alt={t("admin.settings.general.botLogo.alt")} className="h-12 object-contain rounded border" />
                      <div className="flex gap-2">
                        <Label className="cursor-pointer">
                          <span className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4">{t("admin.settings.general.actions.uploadAnother")}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const r = new FileReader();
                              r.onload = () => setSettings((s) => (s ? { ...s, logoBot: r.result as string } : s));
                              r.readAsDataURL(f);
                            }}
                          />
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => setSettings((s) => (s ? { ...s, logoBot: null } : s))}>
                          {t("admin.delete")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="cursor-pointer">
                        <span className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background h-9 px-4 hover:bg-accent">{t("admin.settings.general.botLogo.upload")}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const r = new FileReader();
                            r.onload = () => setSettings((s) => (s ? { ...s, logoBot: r.result as string } : s));
                            r.readAsDataURL(f);
                          }}
                        />
                      </Label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{t("admin.settings.general.botLogo.description")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.general.favicon.label")}</Label>
                  {settings.favicon ? (
                    <div className="flex items-center gap-3">
                      <img src={settings.favicon} alt={t("admin.settings.general.favicon.alt")} className="h-8 w-8 object-contain rounded border" />
                      <div className="flex gap-2">
                        <Label className="cursor-pointer">
                          <span className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4">{t("admin.settings.general.actions.uploadAnother")}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const r = new FileReader();
                              r.onload = () => setSettings((s) => (s ? { ...s, favicon: r.result as string } : s));
                              r.readAsDataURL(f);
                            }}
                          />
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => setSettings((s) => (s ? { ...s, favicon: null } : s))}>
                          {t("admin.delete")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="cursor-pointer">
                        <span className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background h-9 px-4 hover:bg-accent">{t("admin.settings.general.favicon.upload")}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const r = new FileReader();
                            r.onload = () => setSettings((s) => (s ? { ...s, favicon: r.result as string } : s));
                            r.readAsDataURL(f);
                          }}
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">{t("admin.settings.general.favicon.description")}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.general.publicAppUrl.label")}</Label>
                  <Input
                    value={settings.publicAppUrl ?? ""}
                    onChange={(e) => setSettings((s) => (s ? { ...s, publicAppUrl: e.target.value || null } : s))}
                    placeholder="https://example.com"
                  />
                  <p className="text-xs text-muted-foreground">{t("admin.settings.general.publicAppUrl.description")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.general.languages.label")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const preset = ["ru", "en", "zh"];
                      const defaultLang = (settings.defaultLanguage && preset.includes(settings.defaultLanguage) ? settings.defaultLanguage : preset[0]) ?? "";
                      return preset.map((lang) => {
                        const isActive = settings.activeLanguages.includes(lang);
                        const isDefault = lang === defaultLang;
                        return (
                          <Button
                            key={lang}
                            type="button"
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              setSettings((s) => {
                                if (!s) return s;
                                const next = isActive
                                  ? s.activeLanguages.filter((x) => x !== lang)
                                  : [...s.activeLanguages, lang].filter((x) => preset.includes(x)).sort();
                                const defaultLang = (s.defaultLanguage && next.includes(s.defaultLanguage) ? s.defaultLanguage : next[0]) ?? "";
                                return { ...s, activeLanguages: next, defaultLanguage: defaultLang };
                              })
                            }
                          >
                            {langLabels[lang] ?? lang.toUpperCase()}
                            {isActive && isDefault && " ★"}
                          </Button>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-xs text-muted-foreground">{t("admin.settings.general.languages.defaultLabel")}</Label>
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={(settings.defaultLanguage && ALLOWED_LANGS.includes(settings.defaultLanguage) ? settings.defaultLanguage : ALLOWED_LANGS[0]) ?? ""}
                      onChange={(e) => setSettings((s) => s ? { ...s, defaultLanguage: e.target.value } : s)}
                    >
                      {ALLOWED_LANGS.map((l) => {
                        return <option key={l} value={l}>{langOptionLabels[l] ?? l.toUpperCase()}</option>;
                      })}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.general.currencies.label")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const preset = ALLOWED_CURRENCIES;
                      const defaultCurr = (settings.defaultCurrency && preset.includes(settings.defaultCurrency) ? settings.defaultCurrency : preset[0]) ?? "";
                      return preset.map((curr) => {
                        const isActive = settings.activeCurrencies.includes(curr);
                        const isDefault = curr === defaultCurr;
                        return (
                          <Button
                            key={curr}
                            type="button"
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              setSettings((s) => {
                                if (!s) return s;
                                const next = isActive
                                  ? s.activeCurrencies.filter((x) => x !== curr)
                                  : [...s.activeCurrencies, curr].filter((x) => preset.includes(x)).sort();
                                const defaultCurr = (s.defaultCurrency && next.includes(s.defaultCurrency) ? s.defaultCurrency : next[0]) ?? "";
                                return { ...s, activeCurrencies: next, defaultCurrency: defaultCurr };
                              })
                            }
                          >
                            {curr.toUpperCase()}
                            {isActive && isDefault && " ★"}
                          </Button>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-xs text-muted-foreground">{t("admin.settings.general.currencies.defaultLabel")}</Label>
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={(settings.defaultCurrency && ALLOWED_CURRENCIES.includes(settings.defaultCurrency) ? settings.defaultCurrency : ALLOWED_CURRENCIES[0]) ?? ""}
                      onChange={(e) => setSettings((s) => s ? { ...s, defaultCurrency: e.target.value } : s)}
                    >
                      {ALLOWED_CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="h-4 w-4 text-primary shrink-0" />
                    <Label className="text-base font-medium">{t("admin.settings.general.security.title")}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{t("admin.settings.general.security.description")}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center shrink-0 rounded-xl bg-primary/10 text-primary">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">2FA</p>
                        <p className="font-medium text-sm truncate">{t("admin.settings.general.security.cardTitle")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {state.admin?.totpEnabled ? (
                        <>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-400">{t("admin.settings.general.security.enabled")}</span>
                          <Button type="button" variant="outline" size="sm" className="border-red-500/50 text-red-600 hover:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/20" onClick={openTwoFaDisable}>{t("admin.settings.general.security.disable")}</Button>
                        </>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={openTwoFaEnable}>{t("admin.settings.general.security.enable")}</Button>
                      )}
                    </div>
                  </div>
                </div>
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
                <Button type="submit" disabled={saving}>
                  {saving ? t("admin.saving") : t("admin.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bot">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.settings.bot.title")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("admin.settings.bot.subtitle")}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t("admin.settings.bot.backButton.label")}</Label>
                  <Input
                    value={settings.botBackLabel ?? t("admin.settings.defaults.botBackLabel")}
                    onChange={(e) => setSettings((s) => (s ? { ...s, botBackLabel: e.target.value || t("admin.settings.defaults.botBackLabel") } : s))}
                    placeholder={t("admin.settings.defaults.botBackLabel")}
                  />
                  <p className="text-xs text-muted-foreground">{t("admin.settings.bot.backButton.description")}</p>
                </div>
                <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <Label className="text-base font-medium">{t("admin.settings.bot.support.title")}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.settings.bot.support.description")}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-1">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("admin.settings.bot.support.supportLink")}</Label>
                      <Input
                        value={settings.supportLink ?? ""}
                        onChange={(e) => setSettings((s) => (s ? { ...s, supportLink: e.target.value || undefined } : s))}
                        placeholder={t("admin.settings.bot.support.supportPlaceholder")}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("admin.settings.bot.support.agreementLink")}</Label>
                      <Input
                        value={settings.agreementLink ?? ""}
                        onChange={(e) => setSettings((s) => (s ? { ...s, agreementLink: e.target.value || undefined } : s))}
                        placeholder="https://telegra.ph/..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("admin.settings.bot.support.offerLink")}</Label>
                      <Input
                        value={settings.offerLink ?? ""}
                        onChange={(e) => setSettings((s) => (s ? { ...s, offerLink: e.target.value || undefined } : s))}
                        placeholder="https://telegra.ph/..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("admin.settings.bot.support.instructionsLink")}</Label>
                      <Input
                        value={settings.instructionsLink ?? ""}
                        onChange={(e) => setSettings((s) => (s ? { ...s, instructionsLink: e.target.value || undefined } : s))}
                        placeholder="https://telegra.ph/..."
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.bot.emojis.label")}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("admin.settings.bot.emojis.description")}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 rounded-md bg-amber-50 dark:bg-amber-950/40 p-2 border border-amber-200 dark:border-amber-800">
                    {t("admin.settings.bot.emojis.premiumHint")}
                  </p>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left py-2 px-3 font-medium">{t("admin.settings.bot.emojis.columns.key")}</th>
                          <th className="text-left py-2 px-3 font-medium w-24">{t("admin.settings.bot.emojis.columns.unicode")}</th>
                          <th className="text-left py-2 px-3 font-medium">{t("admin.settings.bot.emojis.columns.tgId")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {BOT_EMOJI_KEYS.map((key) => {
                          const raw = (settings.botEmojis ?? {})[key];
                          const entry = typeof raw === "object" && raw !== null ? raw : { unicode: typeof raw === "string" ? raw : undefined, tgEmojiId: undefined };
                          return (
                            <tr key={key} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="py-1.5 px-3 font-medium">{key}</td>
                              <td className="py-1.5 px-2">
                                <Input
                                  className="h-8 w-20 p-1 text-center text-base"
                                  value={entry.unicode ?? ""}
                                  onChange={(e) =>
                                    setSettings((s) => {
                                      if (!s) return s;
                                      const prev = (s.botEmojis ?? {})[key];
                                      const prevObj = typeof prev === "object" && prev !== null ? prev : { unicode: typeof prev === "string" ? prev : undefined, tgEmojiId: undefined };
                                      return {
                                        ...s,
                                        botEmojis: {
                                          ...(s.botEmojis ?? {}),
                                          [key]: { ...prevObj, unicode: e.target.value || undefined },
                                        },
                                      };
                                    })
                                  }
                                  placeholder="📦"
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <Input
                                  className="h-8 min-w-0 text-xs"
                                  value={entry.tgEmojiId ?? ""}
                                  onChange={(e) =>
                                    setSettings((s) => {
                                      if (!s) return s;
                                      const prev = (s.botEmojis ?? {})[key];
                                      const prevObj = typeof prev === "object" && prev !== null ? prev : { unicode: typeof prev === "string" ? prev : undefined, tgEmojiId: undefined };
                                      return {
                                        ...s,
                                        botEmojis: {
                                          ...(s.botEmojis ?? {}),
                                          [key]: { ...prevObj, tgEmojiId: e.target.value || undefined },
                                        },
                                      };
                                    })
                                  }
                                  placeholder="5289722755871162900"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.bot.mainButtons.label")}</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t("admin.settings.bot.mainButtons.description")}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="bot-buttons-per-row" className="text-sm whitespace-nowrap">{t("admin.settings.bot.mainButtons.perRowLabel")}</Label>
                      <select
                        id="bot-buttons-per-row"
                        className="flex h-9 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
                        value={settings.botButtonsPerRow ?? 1}
                        onChange={(e) =>
                          setSettings((s) =>
                            s ? { ...s, botButtonsPerRow: e.target.value === "2" ? 2 : 1 } : s
                          )
                        }
                      >
                        <option value={1}>{t("admin.settings.bot.mainButtons.onePerRowOption")}</option>
                        <option value={2}>{t("admin.settings.bot.mainButtons.twoPerRowOption")}</option>
                      </select>
                    </div>
                    <span className="text-xs text-muted-foreground">{t("admin.settings.bot.mainButtons.perRowDescription")}</span>
                  </div>
                  <div className="space-y-3">
                    {[...(settings.botButtons ?? defaultBotButtons)]
                      .sort((a, b) => a.order - b.order)
                      .map((btn, idx) => (
                        <div key={btn.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <Switch
                            checked={btn.visible}
                            onCheckedChange={(checked: boolean) =>
                              setSettings((s) => {
                                if (!s?.botButtons) return s;
                                return {
                                  ...s,
                                  botButtons: s.botButtons.map((b) =>
                                    b.id === btn.id ? { ...b, visible: checked === true } : b
                                  ),
                                };
                              })
                            }
                          />
                          <Input
                            className="w-32 flex-shrink-0"
                            type="number"
                            min={0}
                            step="any"
                            value={btn.order}
                            onChange={(e) =>
                              setSettings((s) => {
                                if (!s?.botButtons) return s;
                                const v = parseFloat(e.target.value.replace(",", "."));
                                if (!Number.isFinite(v) || v < 0) return s;
                                return {
                                  ...s,
                                  botButtons: s.botButtons.map((b) =>
                                    b.id === btn.id ? { ...b, order: v } : b
                                  ),
                                };
                              })
                            }
                          />
                          <span className="text-xs text-muted-foreground w-8">{idx + 1}</span>
                          <Input
                            className="flex-1 min-w-[140px]"
                            value={btn.label}
                            onChange={(e) =>
                              setSettings((s) => {
                                if (!s?.botButtons) return s;
                                return {
                                  ...s,
                                  botButtons: s.botButtons.map((b) =>
                                    b.id === btn.id ? { ...b, label: e.target.value } : b
                                  ),
                                };
                              })
                            }
                            placeholder={t("admin.settings.bot.mainButtons.buttonPlaceholder")}
                          />
                          <select
                            className="flex h-9 w-28 rounded-md border border-input bg-background px-2 py-1 text-sm"
                            value={btn.emojiKey ?? ""}
                            onChange={(e) =>
                              setSettings((s) => {
                                if (!s?.botButtons) return s;
                                return {
                                  ...s,
                                  botButtons: s.botButtons.map((b) =>
                                    b.id === btn.id ? { ...b, emojiKey: e.target.value } : b
                                  ),
                                };
                              })
                            }
                          >
                            <option value="">{t("admin.settings.bot.mainButtons.noEmoji")}</option>
                            {BOT_EMOJI_KEYS.map((k) => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                          <select
                            className="flex h-9 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
                            value={btn.style ?? ""}
                            onChange={(e) =>
                              setSettings((s) => {
                                if (!s?.botButtons) return s;
                                return {
                                  ...s,
                                  botButtons: s.botButtons.map((b) =>
                                    b.id === btn.id ? { ...b, style: e.target.value } : b
                                  ),
                                };
                              })
                            }
                          >
                            <option value="">—</option>
                            <option value="primary">primary</option>
                            <option value="success">success</option>
                            <option value="danger">danger</option>
                          </select>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id={`onePerRow-${btn.id}`}
                              checked={btn.onePerRow === true}
                              onCheckedChange={(checked: boolean) =>
                                setSettings((s) => {
                                  if (!s?.botButtons) return s;
                                  return {
                                    ...s,
                                    botButtons: s.botButtons.map((b) =>
                                      b.id === btn.id ? { ...b, onePerRow: checked === true } : b
                                    ),
                                  };
                                })
                              }
                            />
                            <Label htmlFor={`onePerRow-${btn.id}`} className="text-xs cursor-pointer whitespace-nowrap">{t("admin.settings.bot.mainButtons.onePerRowToggle")}</Label>
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">{btn.id}</span>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("admin.settings.bot.mainButtons.onePerRowHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.bot.innerButtons.label")}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("admin.settings.bot.innerButtons.description")}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: "tariffPay", label: t("admin.settings.bot.innerButtons.fields.tariffPay") },
                      { key: "topup", label: t("admin.settings.bot.innerButtons.fields.topup") },
                      { key: "back", label: t("admin.settings.bot.innerButtons.fields.back") },
                      { key: "profile", label: t("admin.settings.bot.innerButtons.fields.profile") },
                      { key: "trialConfirm", label: t("admin.settings.bot.innerButtons.fields.trialConfirm") },
                      { key: "lang", label: t("admin.settings.bot.innerButtons.fields.lang") },
                      { key: "currency", label: t("admin.settings.bot.innerButtons.fields.currency") },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-sm w-48 shrink-0">{label}</span>
                        <select
                          className="flex h-9 flex-1 max-w-[120px] rounded-md border border-input bg-background px-2 py-1 text-sm"
                          value={(settings.botInnerButtonStyles ?? {})[key] ?? ""}
                          onChange={(e) =>
                            setSettings((s) => {
                              if (!s) return s;
                              const next = { ...DEFAULT_BOT_INNER_STYLES, ...(s.botInnerButtonStyles ?? {}), [key]: e.target.value };
                              return { ...s, botInnerButtonStyles: next };
                            })
                          }
                        >
                            <option value="">—</option>
                          <option value="primary">primary</option>
                          <option value="success">success</option>
                          <option value="danger">danger</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between">
                      {t("admin.settings.bot.menuTexts.toggle")}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pt-3 space-y-3 border-t mt-3">
                      <p className="text-xs text-muted-foreground">
                        {t("admin.settings.bot.menuTexts.description")}
                      </p>
                      <div className="space-y-2 rounded-lg border p-3 bg-background/60">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-sm">{t("admin.settings.bot.menuTexts.visibilityLabel")}</Label>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setSettings((s) => (s ? { ...s, botMenuLineVisibility: { ...DEFAULT_BOT_MENU_LINE_VISIBILITY } } : s))}
                          >
                            {t("admin.settings.bot.menuTexts.resetVisibility")}
                          </Button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {Object.keys(DEFAULT_BOT_MENU_LINE_VISIBILITY).map((key) => (
                            <div key={key} className="flex items-center gap-2">
                              <Switch
                                checked={(settings.botMenuLineVisibility ?? DEFAULT_BOT_MENU_LINE_VISIBILITY)[key] !== false}
                                onCheckedChange={(checked: boolean) =>
                                  setSettings((s) =>
                                    s
                                      ? {
                                          ...s,
                                          botMenuLineVisibility: {
                                            ...(s.botMenuLineVisibility ?? DEFAULT_BOT_MENU_LINE_VISIBILITY),
                                            [key]: checked === true,
                                          },
                                        }
                                      : s
                                  )
                                }
                              />
                              <Label className="text-xs">{botMenuLineLabels[key] ?? key}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSettings((s) => (s ? { ...s, botMenuTexts: { ...defaultBotMenuTexts } } : s))}
                      >
                        {t("admin.settings.bot.menuTexts.resetTexts")}
                      </Button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {Object.keys(defaultBotMenuTexts).map((key) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs">{botMenuTextLabels[key] ?? key}</Label>
                            <Input
                              value={settings.botMenuTexts?.[key] ?? defaultBotMenuTexts[key] ?? ""}
                              onChange={(e) =>
                                setSettings((s) =>
                                  s
                                    ? {
                                        ...s,
                                        botMenuTexts: {
                                          ...(s.botMenuTexts ?? defaultBotMenuTexts),
                                          [key]: e.target.value,
                                        },
                                      }
                                    : s
                                )
                              }
                              placeholder={defaultBotMenuTexts[key]}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <Label className="text-base font-medium">{t("admin.settings.bot.tariffsScreen.title")}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.settings.bot.tariffsScreen.description")}
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("admin.settings.bot.tariffsScreen.messageLabel")}</Label>
                    <Textarea
                      rows={6}
                      value={settings.botTariffsText ?? defaultBotTariffsText}
                      onChange={(e) => setSettings((s) => (s ? { ...s, botTariffsText: e.target.value } : s))}
                      placeholder={defaultBotTariffsText}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">{t("admin.settings.bot.tariffsScreen.fieldsLabel")}</Label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setSettings((s) => (s ? { ...s, botTariffsFields: { ...DEFAULT_BOT_TARIFF_FIELDS } } : s))}
                    >
                      {t("admin.settings.bot.tariffsScreen.resetFields")}
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.keys(DEFAULT_BOT_TARIFF_FIELDS).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <Switch
                          checked={(settings.botTariffsFields ?? DEFAULT_BOT_TARIFF_FIELDS)[key] !== false}
                          onCheckedChange={(checked: boolean) =>
                            setSettings((s) =>
                              s
                                ? {
                                    ...s,
                                    botTariffsFields: {
                                      ...(s.botTariffsFields ?? DEFAULT_BOT_TARIFF_FIELDS),
                                      [key]: checked === true,
                                    },
                                  }
                                : s
                            )
                          }
                        />
                        <Label className="text-xs">{botTariffFieldLabels[key] ?? key}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <Label className="text-base font-medium">{t("admin.settings.bot.paymentWindow.title")}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.settings.bot.paymentWindow.description")}
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("admin.settings.bot.paymentWindow.messageLabel")}</Label>
                    <Textarea
                      rows={5}
                      value={settings.botPaymentText ?? defaultBotPaymentText}
                      onChange={(e) => setSettings((s) => (s ? { ...s, botPaymentText: e.target.value } : s))}
                      placeholder={defaultBotPaymentText}
                    />
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <Label className="text-base font-medium">{t("admin.settings.bot.forceSubscribe.title")}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.settings.bot.forceSubscribe.description")}
                  </p>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!!settings.forceSubscribeEnabled}
                      onCheckedChange={(checked: boolean) =>
                        setSettings((s) => (s ? { ...s, forceSubscribeEnabled: checked === true } : s))
                      }
                    />
                    <Label className="text-sm">{t("admin.settings.bot.forceSubscribe.enable")}</Label>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("admin.settings.bot.forceSubscribe.channelLabel")}</Label>
                    <Input
                      value={settings.forceSubscribeChannelId ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, forceSubscribeChannelId: e.target.value || null } : s))}
                      placeholder={t("admin.settings.bot.forceSubscribe.channelPlaceholder")}
                    />
                    <p className="text-xs text-muted-foreground">{t("admin.settings.bot.forceSubscribe.channelHint")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("admin.settings.bot.forceSubscribe.messageLabel")}</Label>
                    <Input
                      value={settings.forceSubscribeMessage ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, forceSubscribeMessage: e.target.value || null } : s))}
                      placeholder={t("admin.settings.bot.forceSubscribe.messagePlaceholder")}
                    />
                    <p className="text-xs text-muted-foreground">{t("admin.settings.bot.forceSubscribe.messageHint")}</p>
                  </div>
                </div>
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
                <Button type="submit" disabled={saving}>
                  {saving ? t("admin.saving") : t("admin.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trial">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.settings.trial.title")}</CardTitle>
                <p className="text-sm text-muted-foreground">{t("admin.settings.trial.subtitle")}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("admin.settings.trial.days")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.trialDays}
                    onChange={(e) =>
                      setSettings((s) => (s ? { ...s, trialDays: parseInt(e.target.value, 10) || 0 } : s))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.trial.squad")}</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={settings.trialSquadUuid ?? ""}
                    onChange={(e) => setSettings((s) => s ? { ...s, trialSquadUuid: e.target.value || null } : s)}
                  >
                    <option value="">{t("admin.settings.common.notSelected")}</option>
                    {squads.map((s) => (
                      <option key={s.uuid} value={s.uuid}>{s.name || s.uuid}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.trial.deviceLimit")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.trialDeviceLimit ?? ""}
                    onChange={(e) =>
                      setSettings((s) => (s ? { ...s, trialDeviceLimit: e.target.value === "" ? null : parseInt(e.target.value, 10) || 0 } : s))
                    }
                    placeholder={t("admin.settings.common.unlimitedPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.trial.trafficLimit")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={settings.trialTrafficLimitBytes != null ? (settings.trialTrafficLimitBytes / (1024 ** 3)).toFixed(1) : ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (v === "") {
                        setSettings((s) => (s ? { ...s, trialTrafficLimitBytes: null } : s));
                        return;
                      }
                      const n = parseFloat(v);
                      if (Number.isNaN(n)) return;
                      setSettings((s) => (s ? { ...s, trialTrafficLimitBytes: Math.round(n * 1024 ** 3) } : s));
                    }}
                    placeholder={t("admin.settings.common.unlimitedPlaceholder")}
                  />
                  <p className="text-xs text-muted-foreground">{t("admin.settings.trial.trafficHint")}</p>
                </div>
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
                <Button type="submit" disabled={saving}>
                  {saving ? t("admin.saving") : t("admin.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subpage">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.settings.subpage.title")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("admin.settings.subpage.subtitle")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border bg-muted/40 mb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useRemnaSubscriptionPage"
                      checked={settings.useRemnaSubscriptionPage ?? false}
                      onChange={(e) => setSettings((s) => (s ? { ...s, useRemnaSubscriptionPage: e.target.checked } : s))}
                      className="rounded border"
                    />
                    <Label htmlFor="useRemnaSubscriptionPage" className="cursor-pointer">
                      {t("admin.settings.subpage.useRemna")}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.settings.subpage.useRemnaHint")}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);
                        setMessage("");
                        try {
                          await api.updateSettings(token, { useRemnaSubscriptionPage: settings.useRemnaSubscriptionPage ?? false });
                          setMessage(t("admin.settings.saved"));
                        } catch {
                          setMessage(t("admin.settings.errorSave"));
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {saving ? t("admin.saving") : t("admin.save")}
                    </Button>
                    {message && <span className="text-sm text-muted-foreground">{message}</span>}
                  </div>
                </div>
                <SubscriptionPageEditor
                  currentConfigJson={settings?.subscriptionPageConfig ?? null}
                  defaultConfig={defaultSubpageConfig}
                  onFetchDefault={async () => {
                    const c = await api.getDefaultSubscriptionPageConfig(token);
                    setDefaultSubpageConfig(c ?? null);
                    return c ?? null;
                  }}
                  saving={saving}
                  onSave={async (configJson) => {
                    setSettings((s) => (s ? { ...s, subscriptionPageConfig: configJson } : s));
                    setSaving(true);
                    setMessage("");
                    try {
                      await api.updateSettings(token, { subscriptionPageConfig: configJson });
                      setMessage(t("admin.settings.saved"));
                    } catch {
                      setMessage(t("admin.settings.errorSave"));
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
                {message && <p className="text-sm text-muted-foreground mt-4">{message}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referral">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.settings.referral.title")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("admin.settings.referral.subtitle")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("admin.settings.referral.level1")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.defaultReferralPercent ?? 30}
                    onChange={(e) =>
                      setSettings((s) => (s ? { ...s, defaultReferralPercent: Number(e.target.value) || 0 } : s))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.referral.level2")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.referralPercentLevel2 ?? 10}
                    onChange={(e) =>
                      setSettings((s) => (s ? { ...s, referralPercentLevel2: Number(e.target.value) || 0 } : s))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.referral.level3")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.referralPercentLevel3 ?? 10}
                    onChange={(e) =>
                      setSettings((s) => (s ? { ...s, referralPercentLevel3: Number(e.target.value) || 0 } : s))
                    }
                  />
                </div>
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
                <Button type="submit" disabled={saving}>
                  {saving ? t("admin.saving") : t("admin.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <Collapsible defaultOpen={false} className="group">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-t-lg text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <CardHeader className="pointer-events-none [&_.chevron]:transition-transform [&_.chevron]:duration-200 group-data-[state=open]:[&_.chevron]:rotate-180">
                      <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <CardTitle>{t("admin.settings.payments.platega.title")}</CardTitle>
                          <span className="text-xs font-normal text-muted-foreground">{t("admin.settings.payments.platega.expand")}</span>
                        </div>
                        <ChevronDown className="chevron h-5 w-5 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("admin.settings.payments.platega.callbackHint")}
                      </p>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>{t("admin.settings.payments.platega.callbackLabel")}</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={(settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/platega` : t("admin.settings.payments.common.setAppUrl")}
                          className="font-mono text-sm bg-muted/50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={async () => {
                            const url = (settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/platega` : "";
                            if (url && navigator.clipboard) {
                              await navigator.clipboard.writeText(url);
                              setPlategaCallbackCopied(true);
                              setTimeout(() => setPlategaCallbackCopied(false), 2000);
                            }
                          }}
                          disabled={!(settings.publicAppUrl ?? "").trim()}
                          title={t("admin.copy")}
                        >
                          {plategaCallbackCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("admin.settings.payments.platega.callbackDescription")}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("admin.settings.payments.platega.merchantId")}</Label>
                        <Input
                          value={settings.plategaMerchantId ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, plategaMerchantId: e.target.value || null } : s))}
                          placeholder={t("admin.settings.payments.platega.merchantPlaceholder")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("admin.settings.payments.platega.secret")}</Label>
                        <Input
                          type="password"
                          value={settings.plategaSecret ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, plategaSecret: e.target.value || null } : s))}
                          placeholder={t("admin.settings.payments.platega.secretPlaceholder")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.settings.payments.platega.methods")}</Label>
                      <p className="text-xs text-muted-foreground">{t("admin.settings.payments.platega.methodsHint")}</p>
                      <div className="rounded-md border divide-y">
                        {(settings.plategaMethods ?? defaultPlategaMethods).map((m) => (
                          <div key={m.id} className="flex items-center gap-4 p-3">
                            <Switch
                              id={`platega-method-${m.id}`}
                              checked={m.enabled}
                              onCheckedChange={(checked: boolean) =>
                                setSettings((s) =>
                                  s
                                    ? {
                                        ...s,
                                        plategaMethods: (s.plategaMethods ?? defaultPlategaMethods).map((x) =>
                                          x.id === m.id ? { ...x, enabled: checked === true } : x
                                        ),
                                      }
                                    : s
                                )
                              }
                            />
                            <Label htmlFor={`platega-method-${m.id}`} className="shrink-0 w-8 cursor-pointer">
                              {m.id}
                            </Label>
                            <Input
                              className="flex-1"
                              value={m.label}
                              onChange={(e) =>
                                setSettings((s) =>
                                  s
                                    ? {
                                        ...s,
                                        plategaMethods: (s.plategaMethods ?? defaultPlategaMethods).map((x) =>
                                          x.id === m.id ? { ...x, label: e.target.value } : x
                                        ),
                                      }
                                    : s
                                )
                              }
                              placeholder={t("admin.settings.payments.platega.methodLabelPlaceholder")}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {message && <p className="text-sm text-muted-foreground">{message}</p>}
                    <Button type="submit" disabled={saving}>
                      {saving ? t("admin.saving") : t("admin.save")}
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen={false} className="group mt-4">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-t-lg text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <CardHeader className="pointer-events-none [&_.chevron]:transition-transform [&_.chevron]:duration-200 group-data-[state=open]:[&_.chevron]:rotate-180">
                      <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-primary" />
                          <CardTitle>{t("admin.settings.payments.yoomoney.title")}</CardTitle>
                          <span className="text-xs font-normal text-muted-foreground">{t("admin.settings.payments.yoomoney.expand")}</span>
                        </div>
                        <ChevronDown className="chevron h-5 w-5 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("admin.settings.payments.yoomoney.registerHint")} <a href="https://yoomoney.ru/myservices/new" target="_blank" rel="noreferrer" className="text-primary underline">yoomoney.ru/myservices/new</a>. {t("admin.settings.payments.common.webhookCopiedBelow")}
                      </p>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>{t("admin.settings.payments.yoomoney.webhookLabel")}</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={(settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/yoomoney` : t("admin.settings.payments.common.setAppUrl")}
                          className="font-mono text-sm bg-muted/50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={async () => {
                            const url = (settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/yoomoney` : "";
                            if (url && navigator.clipboard) {
                              await navigator.clipboard.writeText(url);
                              setYoomoneyWebhookCopied(true);
                              setTimeout(() => setYoomoneyWebhookCopied(false), 2000);
                            }
                          }}
                          disabled={!(settings.publicAppUrl ?? "").trim()}
                          title={t("admin.copy")}
                        >
                          {yoomoneyWebhookCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("admin.settings.payments.yoomoney.webhookHint")} <a href="https://yoomoney.ru/transfer/myservices/http-notification" target="_blank" rel="noreferrer" className="text-primary underline">{t("admin.settings.payments.yoomoney.httpSettingsLink")}</a>.</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("admin.settings.payments.yoomoney.description")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>{t("admin.settings.payments.yoomoney.wallet")}</Label>
                        <Input
                          value={settings.yoomoneyReceiverWallet ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, yoomoneyReceiverWallet: e.target.value || null } : s))}
                          placeholder="41001123456789"
                        />
                        <p className="text-xs text-muted-foreground">{t("admin.settings.payments.yoomoney.walletHint")}</p>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>{t("admin.settings.payments.yoomoney.secret")}</Label>
                        <Input
                          type="password"
                          value={settings.yoomoneyNotificationSecret ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, yoomoneyNotificationSecret: e.target.value || null } : s))}
                          placeholder={t("admin.settings.payments.yoomoney.secretPlaceholder")}
                        />
                        <p className="text-xs text-muted-foreground">{t("admin.settings.payments.yoomoney.secretHint")} <a href="https://yoomoney.ru/transfer/myservices/http-notification" target="_blank" rel="noreferrer" className="text-primary underline">{t("admin.settings.payments.yoomoney.httpSettingsLink")}</a>.</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Button type="submit" disabled={saving} className="min-w-[140px]">
                        {saving ? t("admin.saving") : t("admin.save")}
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen={false} className="group mt-4">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-t-lg text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <CardHeader className="pointer-events-none [&_.chevron]:transition-transform [&_.chevron]:duration-200 group-data-[state=open]:[&_.chevron]:rotate-180">
                      <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-primary" />
                          <CardTitle>{t("admin.settings.payments.yookassa.title")}</CardTitle>
                          <span className="text-xs font-normal text-muted-foreground">{t("admin.settings.payments.yookassa.expand")}</span>
                        </div>
                        <ChevronDown className="chevron h-5 w-5 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("admin.settings.payments.yookassa.registerHint")} <a href="https://yookassa.ru/joinups" target="_blank" rel="noreferrer" className="text-primary underline">yookassa.ru</a>. {t("admin.settings.payments.common.webhookCopiedBelow")}
                      </p>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>{t("admin.settings.payments.yookassa.webhookLabel")}</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={(settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/yookassa` : t("admin.settings.payments.common.setAppUrl")}
                          className="font-mono text-sm bg-muted/50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={async () => {
                            const url = (settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/yookassa` : "";
                            if (url && navigator.clipboard) {
                              await navigator.clipboard.writeText(url);
                              setYookassaWebhookCopied(true);
                              setTimeout(() => setYookassaWebhookCopied(false), 2000);
                            }
                          }}
                          disabled={!(settings.publicAppUrl ?? "").trim()}
                          title={t("admin.copy")}
                        >
                          {yookassaWebhookCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("admin.settings.payments.yookassa.webhookHint")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("admin.settings.payments.yookassa.description")} <a href="https://yookassa.ru/my/merchant/integration/api-keys" target="_blank" rel="noreferrer" className="text-primary underline">{t("admin.settings.payments.yookassa.apiSettingsLink")}</a>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("admin.settings.payments.yookassa.shopId")}</Label>
                        <Input
                          value={settings.yookassaShopId ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, yookassaShopId: e.target.value || null } : s))}
                          placeholder="123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("admin.settings.payments.yookassa.secret")}</Label>
                        <Input
                          type="password"
                          value={settings.yookassaSecretKey ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, yookassaSecretKey: e.target.value || null } : s))}
                          placeholder="live_..."
                        />
                        <p className="text-xs text-muted-foreground">{t("admin.settings.payments.yookassa.secretHint")}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Button type="submit" disabled={saving} className="min-w-[140px]">
                        {saving ? t("admin.saving") : t("admin.save")}
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen={false} className="group mt-4">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-t-lg text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <CardHeader className="pointer-events-none [&_.chevron]:transition-transform [&_.chevron]:duration-200 group-data-[state=open]:[&_.chevron]:rotate-180">
                      <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-primary" />
                          <CardTitle>{t("admin.settings.payments.cryptopay.title")}</CardTitle>
                          <span className="text-xs font-normal text-muted-foreground">{t("admin.settings.payments.cryptopay.expand")}</span>
                        </div>
                        <ChevronDown className="chevron h-5 w-5 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("admin.settings.payments.cryptopay.createHint")} <a href="https://t.me/CryptoBot" target="_blank" rel="noreferrer" className="text-primary underline">@CryptoBot</a> → Crypto Pay → Create App {t("admin.settings.payments.cryptopay.createHintTail")}
                      </p>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>{t("admin.settings.payments.cryptopay.webhookLabel")}</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={(settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/cryptopay` : t("admin.settings.payments.common.setAppUrl")}
                          className="font-mono text-sm bg-muted/50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={async () => {
                            const url = (settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/cryptopay` : "";
                            if (url && navigator.clipboard) {
                              await navigator.clipboard.writeText(url);
                              setCryptopayWebhookCopied(true);
                              setTimeout(() => setCryptopayWebhookCopied(false), 2000);
                            }
                          }}
                          disabled={!(settings.publicAppUrl ?? "").trim()}
                          title={t("admin.copy")}
                        >
                          {cryptopayWebhookCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("admin.settings.payments.cryptopay.webhookHint")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("admin.settings.payments.cryptopay.description")} <a href="https://help.send.tg/en/articles/10279948-crypto-pay-api" target="_blank" rel="noreferrer" className="text-primary underline">Crypto Pay API</a>. {t("admin.settings.payments.cryptopay.descriptionTail")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("admin.settings.payments.cryptopay.apiToken")}</Label>
                        <Input
                          type="password"
                          value={settings.cryptopayApiToken ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, cryptopayApiToken: e.target.value || null } : s))}
                          placeholder="123456789:AAzQc..."
                        />
                        <p className="text-xs text-muted-foreground">{t("admin.settings.payments.cryptopay.apiTokenHint")}</p>
                      </div>
                      <div className="space-y-2 flex flex-col justify-end">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="cryptopayTestnet"
                            checked={settings.cryptopayTestnet ?? false}
                            onChange={(e) => setSettings((s) => (s ? { ...s, cryptopayTestnet: e.target.checked } : s))}
                            className="rounded border"
                          />
                          <Label htmlFor="cryptopayTestnet">{t("admin.settings.payments.cryptopay.testnet")}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("admin.settings.payments.cryptopay.testnetHint")}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Button type="submit" disabled={saving} className="min-w-[140px]">
                        {saving ? t("admin.saving") : t("admin.save")}
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen={false} className="group mt-4">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-t-lg text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <CardHeader className="pointer-events-none [&_.chevron]:transition-transform [&_.chevron]:duration-200 group-data-[state=open]:[&_.chevron]:rotate-180">
                      <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-primary" />
                          <CardTitle>{t("admin.settings.payments.heleket.title")}</CardTitle>
                          <span className="text-xs font-normal text-muted-foreground">{t("admin.settings.payments.heleket.expand")}</span>
                        </div>
                        <ChevronDown className="chevron h-5 w-5 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("admin.settings.payments.heleket.hintPrefix")} <a href="https://doc.heleket.com/uk/methods/payments/creating-invoice" target="_blank" rel="noreferrer" className="text-primary underline">{t("admin.settings.payments.heleket.dashboardLink")}</a> {t("admin.settings.payments.heleket.hintSuffix")}
                      </p>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>{t("admin.settings.payments.heleket.webhookLabel")}</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={(settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/heleket` : t("admin.settings.payments.common.setAppUrl")}
                          className="font-mono text-sm bg-muted/50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={async () => {
                            const url = (settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/heleket` : "";
                            if (url && navigator.clipboard) {
                              await navigator.clipboard.writeText(url);
                              setHeleketWebhookCopied(true);
                              setTimeout(() => setHeleketWebhookCopied(false), 2000);
                            }
                          }}
                          disabled={!(settings.publicAppUrl ?? "").trim()}
                          title={t("admin.copy")}
                        >
                          {heleketWebhookCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("admin.settings.payments.heleket.webhookHint")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("admin.settings.payments.heleket.description")} <a href="https://doc.heleket.com/uk/methods/payments/creating-invoice" target="_blank" rel="noreferrer" className="text-primary underline">Heleket API</a>. {t("admin.settings.payments.heleket.descriptionTail")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("admin.settings.payments.heleket.merchantId")}</Label>
                        <Input
                          value={settings.heleketMerchantId ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, heleketMerchantId: e.target.value || null } : s))}
                          placeholder="8b03432e-385b-4670-8d06-064591096795"
                        />
                        <p className="text-xs text-muted-foreground">{t("admin.settings.payments.heleket.merchantHint")}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("admin.settings.payments.heleket.apiKey")}</Label>
                        <Input
                          type="password"
                          value={settings.heleketApiKey ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, heleketApiKey: e.target.value || null } : s))}
                          placeholder={t("admin.settings.payments.heleket.apiKeyPlaceholder")}
                        />
                        <p className="text-xs text-muted-foreground">{t("admin.settings.payments.heleket.apiKeyHint")}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Button type="submit" disabled={saving} className="min-w-[140px]">
                        {saving ? t("admin.saving") : t("admin.save")}
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* ePay (易支付) */}
            <Card>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button type="button" className="group flex w-full text-left">
                    <CardHeader className="pointer-events-none [&_.chevron]:transition-transform [&_.chevron]:duration-200 group-data-[state=open]:[&_.chevron]:rotate-180">
                      <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <CardTitle>{t("admin.settings.payments.epay.title")}</CardTitle>
                          <span className="text-xs font-normal text-muted-foreground">{t("admin.settings.payments.epay.expand")}</span>
                        </div>
                        <ChevronDown className="chevron h-5 w-5 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("admin.settings.payments.epay.hint")}
                      </p>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>{t("admin.settings.payments.epay.webhookLabel")}</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={(settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/epay` : t("admin.settings.payments.common.setAppUrl")}
                          className="font-mono text-sm bg-muted/50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={async () => {
                            const url = (settings.publicAppUrl ?? "").replace(/\/$/, "") ? `${(settings.publicAppUrl ?? "").replace(/\/$/, "")}/api/webhooks/epay` : "";
                            if (url && navigator.clipboard) {
                              await navigator.clipboard.writeText(url);
                            }
                          }}
                          disabled={!(settings.publicAppUrl ?? "").trim()}
                          title={t("admin.copy")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("admin.settings.payments.epay.webhookHint")}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t("admin.settings.payments.epay.pid")}</Label>
                        <Input
                          value={settings.epayPid ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, epayPid: e.target.value || null } : s))}
                          placeholder="1001"
                        />
                        <p className="text-xs text-muted-foreground">{t("admin.settings.payments.epay.pidHint")}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("admin.settings.payments.epay.key")}</Label>
                        <Input
                          type="password"
                          value={settings.epayKey ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, epayKey: e.target.value || null } : s))}
                          placeholder={t("admin.settings.payments.epay.keyPlaceholder")}
                        />
                        <p className="text-xs text-muted-foreground">{t("admin.settings.payments.epay.keyHint")}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("admin.settings.payments.epay.apiUrl")}</Label>
                        <Input
                          value={settings.epayApiUrl ?? ""}
                          onChange={(e) => setSettings((s) => (s ? { ...s, epayApiUrl: e.target.value || null } : s))}
                          placeholder="https://motionpay.net"
                        />
                        <p className="text-xs text-muted-foreground">{t("admin.settings.payments.epay.apiUrlHint")}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.settings.payments.epay.methods")}</Label>
                      <p className="text-xs text-muted-foreground">{t("admin.settings.payments.epay.methodsHint")}</p>
                      <div className="rounded-md border divide-y">
                        {(settings.epayMethods ?? defaultEpayMethods).map((m) => (
                          <div key={m.type} className="flex items-center gap-4 p-3">
                            <Switch
                              id={`epay-method-${m.type}`}
                              checked={m.enabled}
                              onCheckedChange={(checked: boolean) =>
                                setSettings((s) =>
                                  s
                                    ? {
                                        ...s,
                                        epayMethods: (s.epayMethods ?? defaultEpayMethods).map((x) =>
                                          x.type === m.type ? { ...x, enabled: checked === true } : x
                                        ),
                                      }
                                    : s
                                )
                              }
                            />
                            <Label htmlFor={`epay-method-${m.type}`} className="shrink-0 w-16 cursor-pointer font-mono text-xs">
                              {m.type}
                            </Label>
                            <Input
                              className="flex-1"
                              value={m.label}
                              onChange={(e) =>
                                setSettings((s) =>
                                  s
                                    ? {
                                        ...s,
                                        epayMethods: (s.epayMethods ?? defaultEpayMethods).map((x) =>
                                          x.type === m.type ? { ...x, label: e.target.value } : x
                                        ),
                                      }
                                    : s
                                )
                              }
                              placeholder={t("admin.settings.payments.epay.methodLabelPlaceholder")}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Button type="submit" disabled={saving} className="min-w-[140px]">
                        {saving ? t("admin.saving") : t("admin.save")}
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {t("admin.settings.ai.title")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("admin.settings.ai.subtitlePrefix")} <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-primary underline">Groq</a>, {t("admin.settings.ai.subtitleSuffix")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("admin.settings.ai.apiKey")}</Label>
                    <Input
                      type="password"
                      value={settings.groqApiKey ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, groqApiKey: e.target.value || null } : s))}
                      placeholder="gsk_..."
                    />
                    <p className="text-xs text-muted-foreground">{t("admin.settings.ai.apiKeyHint")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.settings.ai.model")}</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={settings.groqModel ?? "llama3-8b-8192"}
                      onChange={(e) => setSettings((s) => (s ? { ...s, groqModel: e.target.value } : s))}
                    >
                      <option value="llama3-8b-8192">llama3-8b-8192</option>
                      <option value="llama3-70b-8192">llama3-70b-8192</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                      <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile</option>
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                      <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b</option>
                      <option value="deepseek-r1-distill-qwen-32b">deepseek-r1-distill-qwen-32b</option>
                      <option value="qwen-2.5-32b">qwen-2.5-32b</option>
                      <option value="qwen-2.5-coder-32b">qwen-2.5-coder-32b</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                      <option value="llama3-70b-8192">llama3-70b-8192</option>
                      <option value="llama3-8b-8192">llama3-8b-8192</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                      <option value="gemma2-9b-it">gemma2-9b-it</option>
                    </select>
                    <p className="text-xs text-muted-foreground">{t("admin.settings.ai.modelHint")}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.ai.fallbacks")}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("admin.settings.ai.fallbacksHint")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                      value={settings.groqFallback1 ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, groqFallback1: e.target.value || null } : s))}
                    >
                      <option value="">{t("admin.settings.ai.noFallback1")}</option>
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                      <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b</option>
                      <option value="deepseek-r1-distill-qwen-32b">deepseek-r1-distill-qwen-32b</option>
                      <option value="qwen-2.5-32b">qwen-2.5-32b</option>
                      <option value="qwen-2.5-coder-32b">qwen-2.5-coder-32b</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                      <option value="llama3-70b-8192">llama3-70b-8192</option>
                      <option value="llama3-8b-8192">llama3-8b-8192</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                      <option value="gemma2-9b-it">gemma2-9b-it</option>
                    </select>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                      value={settings.groqFallback2 ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, groqFallback2: e.target.value || null } : s))}
                    >
                      <option value="">{t("admin.settings.ai.noFallback2")}</option>
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                      <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b</option>
                      <option value="deepseek-r1-distill-qwen-32b">deepseek-r1-distill-qwen-32b</option>
                      <option value="qwen-2.5-32b">qwen-2.5-32b</option>
                      <option value="qwen-2.5-coder-32b">qwen-2.5-coder-32b</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                      <option value="llama3-70b-8192">llama3-70b-8192</option>
                      <option value="llama3-8b-8192">llama3-8b-8192</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                      <option value="gemma2-9b-it">gemma2-9b-it</option>
                    </select>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                      value={settings.groqFallback3 ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, groqFallback3: e.target.value || null } : s))}
                    >
                      <option value="">{t("admin.settings.ai.noFallback3")}</option>
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                      <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b</option>
                      <option value="deepseek-r1-distill-qwen-32b">deepseek-r1-distill-qwen-32b</option>
                      <option value="qwen-2.5-32b">qwen-2.5-32b</option>
                      <option value="qwen-2.5-coder-32b">qwen-2.5-coder-32b</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                      <option value="llama3-70b-8192">llama3-70b-8192</option>
                      <option value="llama3-8b-8192">llama3-8b-8192</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                      <option value="gemma2-9b-it">gemma2-9b-it</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.ai.systemPrompt")}</Label>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={settings.aiSystemPrompt ?? ""}
                    onChange={(e) => setSettings((s) => (s ? { ...s, aiSystemPrompt: e.target.value } : s))}
                    placeholder={t("admin.settings.ai.systemPromptPlaceholder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("admin.settings.ai.systemPromptHint")}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <Button type="submit" disabled={saving} className="min-w-[140px]">
                    {saving ? t("admin.saving") : t("admin.save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mail-telegram">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {t("admin.settings.mailTelegram.smtp.title")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("admin.settings.mailTelegram.smtp.subtitle")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/40">
                  <input
                    type="checkbox"
                    id="skipEmailVerification"
                    checked={settings.skipEmailVerification ?? false}
                    onChange={(e) => setSettings((s) => (s ? { ...s, skipEmailVerification: e.target.checked } : s))}
                    className="rounded border"
                  />
                  <Label htmlFor="skipEmailVerification" className="cursor-pointer">
                    {t("admin.settings.mailTelegram.smtp.skipVerification")}
                  </Label>
                  <span className="text-xs text-muted-foreground ml-2">
                    {t("admin.settings.mailTelegram.smtp.skipVerificationHint")}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("admin.settings.mailTelegram.smtp.host")}</Label>
                    <Input
                      value={settings.smtpHost ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, smtpHost: e.target.value || null } : s))}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.settings.mailTelegram.smtp.port")}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={65535}
                      value={settings.smtpPort ?? 587}
                      onChange={(e) => setSettings((s) => (s ? { ...s, smtpPort: parseInt(e.target.value, 10) || 587 } : s))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={settings.smtpSecure ?? false}
                    onChange={(e) => setSettings((s) => (s ? { ...s, smtpSecure: e.target.checked } : s))}
                    className="rounded border"
                  />
                  <Label htmlFor="smtpSecure">{t("admin.settings.mailTelegram.smtp.secure")}</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("admin.settings.mailTelegram.smtp.user")}</Label>
                    <Input
                      value={settings.smtpUser ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, smtpUser: e.target.value || null } : s))}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.settings.mailTelegram.smtp.password")}</Label>
                    <Input
                      type="password"
                      value={settings.smtpPassword ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, smtpPassword: e.target.value || null } : s))}
                      placeholder="********"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("admin.settings.mailTelegram.smtp.fromEmail")}</Label>
                    <Input
                      type="email"
                      value={settings.smtpFromEmail ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, smtpFromEmail: e.target.value || null } : s))}
                      placeholder="noreply@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.settings.mailTelegram.smtp.fromName")}</Label>
                    <Input
                      value={settings.smtpFromName ?? ""}
                      onChange={(e) => setSettings((s) => (s ? { ...s, smtpFromName: e.target.value || null } : s))}
                      placeholder={t("admin.settings.mailTelegram.smtp.fromNamePlaceholder")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {t("admin.settings.mailTelegram.telegram.title")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("admin.settings.mailTelegram.telegram.subtitle")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("admin.settings.mailTelegram.telegram.token")}</Label>
                  <Input
                    type="password"
                    value={settings.telegramBotToken ?? ""}
                    onChange={(e) => setSettings((s) => (s ? { ...s, telegramBotToken: e.target.value || null } : s))}
                    placeholder="123456:ABC-DEF..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.mailTelegram.telegram.username")}</Label>
                  <Input
                    value={settings.telegramBotUsername ?? ""}
                    onChange={(e) => setSettings((s) => (s ? { ...s, telegramBotUsername: e.target.value || null } : s))}
                    placeholder="MyStealthNetBot"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.mailTelegram.telegram.adminIds")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.settings.mailTelegram.telegram.adminIdsHint")}
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {(settings.botAdminTelegramIds ?? []).map((id) => (
                      <span key={id} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm">
                        {id}
                        <button
                          type="button"
                          onClick={() => setSettings((s) => (s ? { ...s, botAdminTelegramIds: (s.botAdminTelegramIds ?? []).filter((x) => x !== id) } : s))}
                          className="text-muted-foreground hover:text-destructive"
                          title={t("admin.delete")}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="123456789"
                        className="w-36"
                        id="newBotAdminId"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const input = document.getElementById("newBotAdminId") as HTMLInputElement;
                            const v = input?.value?.trim();
                            if (v && /^\d+$/.test(v)) {
                              setSettings((s) => (s ? { ...s, botAdminTelegramIds: [...(s.botAdminTelegramIds ?? []), v] } : s));
                              input.value = "";
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById("newBotAdminId") as HTMLInputElement;
                          const v = input?.value?.trim();
                          if (v && /^\d+$/.test(v)) {
                            setSettings((s) => (s ? { ...s, botAdminTelegramIds: [...(s.botAdminTelegramIds ?? []), v] } : s));
                            input.value = "";
                          }
                        }}
                      >
                        {t("admin.settings.mailTelegram.telegram.addId")}
                      </Button>
                    </div>
                  </div>
                </div>
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
                <Button type="submit" disabled={saving}>
                  {saving ? t("admin.saving") : t("admin.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </form>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between rounded-xl border p-4 bg-background/50 mb-6">
                <div className="space-y-0.5">
                  <Label className="text-base">{t("admin.settings.theme.userThemeTitle")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.settings.theme.userThemeHint")}
                  </p>
                </div>
                <Switch
                  checked={Boolean((settings as any)?.allowUserThemeChange ?? true)}
                  onCheckedChange={(c: boolean) => setSettings((s) => s ? { ...s, allowUserThemeChange: c } : s)}
                />
              </div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t("admin.settings.theme.globalTitle")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("admin.settings.theme.globalHint")}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">{t("admin.settings.theme.accent")}</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {(Object.entries(ACCENT_PALETTES) as [string, { labelKey: string; swatch: string }][]).map(([key, palette]) => {
                    const selected = (settings.themeAccent ?? "default") === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSettings({ ...settings, themeAccent: key })}
                        className={`flex flex-col items-center gap-2 rounded-xl p-3 text-xs font-medium transition-all border-2 ${
                          selected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-transparent hover:bg-muted/50"
                        }`}
                      >
                        <div
                          className="h-10 w-10 rounded-full shadow-sm"
                          style={{ backgroundColor: palette.swatch }}
                        />
                        <span className={selected ? "text-primary" : "text-muted-foreground"}>
                          {t(palette.labelKey)}
                        </span>
                        {selected && (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-2">
                {message && <p className="text-sm text-muted-foreground mb-2">{message}</p>}
                <Button
                  onClick={() => {
                    setSaving(true);
                    setMessage("");
                    api.updateSettings(token, { themeAccent: settings.themeAccent ?? "default", allowUserThemeChange: (settings as any).allowUserThemeChange ?? true })
                      .then(() => setMessage(t("admin.settings.theme.saved")))
                      .catch(() => setMessage(t("admin.settings.errorSave")))
                      .finally(() => setSaving(false));
                  }}
                  disabled={saving}
                >
                  {saving ? t("admin.saving") : t("admin.settings.theme.saveTheme")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("admin.settings.options.title")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("admin.settings.options.subtitle")}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="sell-options-enabled"
                  checked={settings.sellOptionsEnabled ?? false}
                  onCheckedChange={(c: boolean) => setSettings((s) => (s ? { ...s, sellOptionsEnabled: !!c } : s))}
                />
                <Label htmlFor="sell-options-enabled" className="cursor-pointer">{t("admin.settings.options.enable")}</Label>
              </div>

              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 font-medium">
                  <ChevronDown className="h-4 w-4" />
                  {t("admin.settings.options.traffic.title")}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Switch
                      id="sell-traffic-enabled"
                      checked={settings.sellOptionsTrafficEnabled ?? false}
                      onCheckedChange={(c: boolean) => setSettings((s) => (s ? { ...s, sellOptionsTrafficEnabled: !!c } : s))}
                    />
                    <Label htmlFor="sell-traffic-enabled" className="cursor-pointer">{t("admin.settings.options.common.enableShort")}</Label>
                  </div>
                  <div className="rounded-md border overflow-x-auto overflow-hidden">
                    <table className="w-full text-sm min-w-[400px] [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-medium">{t("admin.settings.options.columns.name")}</th>
                          <th className="text-left p-2 font-medium w-24">{t("admin.settings.options.columns.gb")}</th>
                          <th className="text-left p-2 font-medium w-28">{t("admin.settings.options.columns.price")}</th>
                          <th className="text-left p-2 font-medium w-24">{t("admin.settings.options.columns.currency")}</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {(settings.sellOptionsTrafficProducts ?? []).map((p, i) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="p-2"><Input className="h-9 w-full max-w-[180px]" placeholder={t("admin.settings.options.placeholders.name")} value={p.name} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsTrafficProducts) return s; const arr = [...s.sellOptionsTrafficProducts]; arr[i] = { ...arr[i], name: e.target.value }; return { ...s, sellOptionsTrafficProducts: arr }; })} /></td>
                            <td className="p-2"><Input type="number" min={0.1} step={0.5} className="h-9 w-full" value={p.trafficGb || ""} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsTrafficProducts) return s; const arr = [...s.sellOptionsTrafficProducts]; arr[i] = { ...arr[i], trafficGb: parseFloat(e.target.value) || 0 }; return { ...s, sellOptionsTrafficProducts: arr }; })} /></td>
                            <td className="p-2"><Input type="number" min={0} step={1} className="h-9 w-full" value={p.price || ""} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsTrafficProducts) return s; const arr = [...s.sellOptionsTrafficProducts]; arr[i] = { ...arr[i], price: parseFloat(e.target.value) || 0 }; return { ...s, sellOptionsTrafficProducts: arr }; })} /></td>
                            <td className="p-2">
                              <select className="h-9 rounded-md border px-2 w-full bg-background" value={p.currency} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsTrafficProducts) return s; const arr = [...s.sellOptionsTrafficProducts]; arr[i] = { ...arr[i], currency: e.target.value }; return { ...s, sellOptionsTrafficProducts: arr }; })}>
                                {ALLOWED_CURRENCIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                              </select>
                            </td>
                            <td className="p-1"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettings((s) => (s ? { ...s, sellOptionsTrafficProducts: (s.sellOptionsTrafficProducts ?? []).filter((_, j) => j !== i) } : s))}><Trash2 className="h-4 w-4" /></Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => setSettings((s) => (s ? { ...s, sellOptionsTrafficProducts: [...(s.sellOptionsTrafficProducts ?? []), { id: `traffic_${Date.now()}`, name: "", trafficGb: 5, price: 0, currency: "rub" }] } : s))}>
                      <Plus className="h-4 w-4 mr-1" /> {t("admin.settings.options.add")}
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 font-medium">
                  <ChevronDown className="h-4 w-4" />
                  {t("admin.settings.options.devices.title")}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Switch
                      id="sell-devices-enabled"
                      checked={settings.sellOptionsDevicesEnabled ?? false}
                      onCheckedChange={(c: boolean) => setSettings((s) => (s ? { ...s, sellOptionsDevicesEnabled: !!c } : s))}
                    />
                    <Label htmlFor="sell-devices-enabled" className="cursor-pointer">{t("admin.settings.options.common.enableShort")}</Label>
                  </div>
                  <div className="rounded-md border overflow-x-auto overflow-hidden">
                    <table className="w-full text-sm min-w-[400px] [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-medium">{t("admin.settings.options.columns.name")}</th>
                          <th className="text-left p-2 font-medium w-20">{t("admin.settings.options.columns.count")}</th>
                          <th className="text-left p-2 font-medium w-28">{t("admin.settings.options.columns.price")}</th>
                          <th className="text-left p-2 font-medium w-24">{t("admin.settings.options.columns.currency")}</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {(settings.sellOptionsDevicesProducts ?? []).map((p, i) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="p-2"><Input className="h-9 w-full max-w-[180px]" placeholder={t("admin.settings.options.placeholders.name")} value={p.name} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsDevicesProducts) return s; const arr = [...s.sellOptionsDevicesProducts]; arr[i] = { ...arr[i], name: e.target.value }; return { ...s, sellOptionsDevicesProducts: arr }; })} /></td>
                            <td className="p-2"><Input type="number" min={1} className="h-9 w-full" value={p.deviceCount || ""} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsDevicesProducts) return s; const arr = [...s.sellOptionsDevicesProducts]; arr[i] = { ...arr[i], deviceCount: parseInt(e.target.value, 10) || 0 }; return { ...s, sellOptionsDevicesProducts: arr }; })} /></td>
                            <td className="p-2"><Input type="number" min={0} step={1} className="h-9 w-full" value={p.price || ""} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsDevicesProducts) return s; const arr = [...s.sellOptionsDevicesProducts]; arr[i] = { ...arr[i], price: parseFloat(e.target.value) || 0 }; return { ...s, sellOptionsDevicesProducts: arr }; })} /></td>
                            <td className="p-2">
                              <select className="h-9 rounded-md border px-2 w-full bg-background" value={p.currency} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsDevicesProducts) return s; const arr = [...s.sellOptionsDevicesProducts]; arr[i] = { ...arr[i], currency: e.target.value }; return { ...s, sellOptionsDevicesProducts: arr }; })}>
                                {ALLOWED_CURRENCIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                              </select>
                            </td>
                            <td className="p-1"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettings((s) => (s ? { ...s, sellOptionsDevicesProducts: (s.sellOptionsDevicesProducts ?? []).filter((_, j) => j !== i) } : s))}><Trash2 className="h-4 w-4" /></Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => setSettings((s) => (s ? { ...s, sellOptionsDevicesProducts: [...(s.sellOptionsDevicesProducts ?? []), { id: `devices_${Date.now()}`, name: "", deviceCount: 1, price: 0, currency: "rub" }] } : s))}>
                      <Plus className="h-4 w-4 mr-1" /> {t("admin.settings.options.add")}
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 font-medium">
                  <ChevronDown className="h-4 w-4" />
                  {t("admin.settings.options.servers.title")}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Switch
                      id="sell-servers-enabled"
                      checked={settings.sellOptionsServersEnabled ?? false}
                      onCheckedChange={(c: boolean) => setSettings((s) => (s ? { ...s, sellOptionsServersEnabled: !!c } : s))}
                    />
                    <Label htmlFor="sell-servers-enabled" className="cursor-pointer">{t("admin.settings.options.common.enableShort")}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("admin.settings.options.servers.hint")}</p>
                  <div className="rounded-md border overflow-x-auto overflow-hidden">
                    <table className="w-full text-sm min-w-[520px] [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-medium">{t("admin.settings.options.servers.columns.name")}</th>
                          <th className="text-left p-2 font-medium">{t("admin.settings.options.servers.columns.squad")}</th>
                          <th className="text-left p-2 font-medium w-20">{t("admin.settings.options.servers.columns.gb")}</th>
                          <th className="text-left p-2 font-medium w-28">{t("admin.settings.options.servers.columns.price")}</th>
                          <th className="text-left p-2 font-medium w-24">{t("admin.settings.options.servers.columns.currency")}</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {(settings.sellOptionsServersProducts ?? []).map((p, i) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="p-2"><Input className="h-9 w-full max-w-[160px]" placeholder={t("admin.settings.options.servers.placeholders.name")} value={p.name} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsServersProducts) return s; const arr = [...s.sellOptionsServersProducts]; arr[i] = { ...arr[i], name: e.target.value }; return { ...s, sellOptionsServersProducts: arr }; })} /></td>
                            <td className="p-2">
                              <select className="h-9 rounded-md border px-2 w-full min-w-[180px] bg-background" value={p.squadUuid} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsServersProducts) return s; const arr = [...s.sellOptionsServersProducts]; arr[i] = { ...arr[i], squadUuid: e.target.value }; return { ...s, sellOptionsServersProducts: arr }; })}>
                                <option value="">{t("admin.settings.options.servers.placeholders.squad")}</option>
                                {squads.map((sq) => <option key={sq.uuid} value={sq.uuid}>{sq.name || sq.uuid}</option>)}
                              </select>
                            </td>
                            <td className="p-2"><Input type="number" min={0} step={0.5} className="h-9 w-full" placeholder="0" value={p.trafficGb ?? ""} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsServersProducts) return s; const arr = [...s.sellOptionsServersProducts]; arr[i] = { ...arr[i], trafficGb: parseFloat(e.target.value) || 0 }; return { ...s, sellOptionsServersProducts: arr }; })} /></td>
                            <td className="p-2"><Input type="number" min={0} step={1} className="h-9 w-full" value={p.price || ""} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsServersProducts) return s; const arr = [...s.sellOptionsServersProducts]; arr[i] = { ...arr[i], price: parseFloat(e.target.value) || 0 }; return { ...s, sellOptionsServersProducts: arr }; })} /></td>
                            <td className="p-2">
                              <select className="h-9 rounded-md border px-2 w-full bg-background" value={p.currency} onChange={(e) => setSettings((s) => { if (!s?.sellOptionsServersProducts) return s; const arr = [...s.sellOptionsServersProducts]; arr[i] = { ...arr[i], currency: e.target.value }; return { ...s, sellOptionsServersProducts: arr }; })}>
                                {ALLOWED_CURRENCIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                              </select>
                            </td>
                            <td className="p-1"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettings((s) => (s ? { ...s, sellOptionsServersProducts: (s.sellOptionsServersProducts ?? []).filter((_, j) => j !== i) } : s))}><Trash2 className="h-4 w-4" /></Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => setSettings((s) => (s ? { ...s, sellOptionsServersProducts: [...(s.sellOptionsServersProducts ?? []), { id: `server_${Date.now()}`, name: "", squadUuid: squads[0]?.uuid ?? "", trafficGb: 0, price: 0, currency: "rub" }] } : s))}>
                      <Plus className="h-4 w-4 mr-1" /> {t("admin.settings.options.add")}
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="pt-4 border-t">
                {message && <p className="text-sm text-muted-foreground mb-2">{message}</p>}
                <Button type="button" onClick={saveOptionsOnly} disabled={saving}>{saving ? t("admin.saving") : t("admin.settings.options.save")}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-build">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {t("admin.settings.customBuild.title")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("admin.settings.customBuild.subtitle")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Switch
                  id="custom-build-enabled"
                  checked={!!settings.customBuildEnabled}
                  onCheckedChange={(c: boolean) => setSettings((s) => (s ? { ...s, customBuildEnabled: !!c } : s))}
                />
                <Label htmlFor="custom-build-enabled" className="cursor-pointer font-medium">{t("admin.settings.customBuild.enable")}</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.settings.customBuild.pricePerDay")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={settings.customBuildPricePerDay ?? 0}
                    onChange={(e) => setSettings((s) => (s ? { ...s, customBuildPricePerDay: parseFloat(e.target.value) || 0 } : s))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.customBuild.pricePerDevice")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={settings.customBuildPricePerDevice ?? 0}
                    onChange={(e) => setSettings((s) => (s ? { ...s, customBuildPricePerDevice: parseFloat(e.target.value) || 0 } : s))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.settings.customBuild.traffic")}</Label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="customBuildTrafficMode"
                      checked={(settings.customBuildTrafficMode ?? "unlimited") === "unlimited"}
                      onChange={() => setSettings((s) => (s ? { ...s, customBuildTrafficMode: "unlimited" as const } : s))}
                      className="rounded-full"
                    />
                    {t("admin.settings.customBuild.unlimited")}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="customBuildTrafficMode"
                      checked={(settings.customBuildTrafficMode ?? "unlimited") === "per_gb"}
                      onChange={() => setSettings((s) => (s ? { ...s, customBuildTrafficMode: "per_gb" as const } : s))}
                      className="rounded-full"
                    />
                    {t("admin.settings.customBuild.perGb")}
                  </label>
                  {(settings.customBuildTrafficMode ?? "unlimited") === "per_gb" && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="w-24"
                        value={settings.customBuildPricePerGb ?? 0}
                        onChange={(e) => setSettings((s) => (s ? { ...s, customBuildPricePerGb: parseFloat(e.target.value) || 0 } : s))}
                      />
                      <span className="text-sm text-muted-foreground">{t("admin.settings.customBuild.perGbSuffix")}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.settings.customBuild.squad")}</Label>
                <select
                  className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.customBuildSquadUuid ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, customBuildSquadUuid: e.target.value || null } : s))}
                >
                  <option value="">{t("admin.settings.customBuild.selectSquad")}</option>
                  {squads.map((s) => (
                    <option key={s.uuid} value={s.uuid}>{s.name || s.uuid}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.settings.customBuild.currency")}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings.customBuildCurrency ?? "rub"}
                    onChange={(e) => setSettings((s) => (s ? { ...s, customBuildCurrency: e.target.value } : s))}
                  >
                    {ALLOWED_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.customBuild.maxDays")}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={360}
                    value={settings.customBuildMaxDays ?? 360}
                    onChange={(e) => setSettings((s) => (s ? { ...s, customBuildMaxDays: Math.min(360, Math.max(1, parseInt(e.target.value, 10) || 360)) } : s))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.settings.customBuild.maxDevices")}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={settings.customBuildMaxDevices ?? 10}
                    onChange={(e) => setSettings((s) => (s ? { ...s, customBuildMaxDevices: Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 10)) } : s))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("admin.settings.customBuild.hint")}</p>
              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  disabled={saving}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }}
                >
                  {saving ? t("admin.saving") : t("admin.save")}
                </Button>
                {message && <span className="text-sm text-muted-foreground">{message}</span>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oauth">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                {t("admin.settings.oauth.title")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("admin.settings.oauth.subtitle")}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{t("admin.settings.oauth.google.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("admin.settings.oauth.google.hint")}</p>
                  </div>
                  <Switch
                    checked={settings?.googleLoginEnabled ?? false}
                    onCheckedChange={(v) => setSettings((s) => (s ? { ...s, googleLoginEnabled: v } : s))}
                  />
                </div>
                {settings?.googleLoginEnabled && (
                  <div className="space-y-3">
                    <div>
                      <Label>{t("admin.settings.oauth.google.clientId")}</Label>
                      <Input
                        placeholder="xxxx.apps.googleusercontent.com"
                        value={settings.googleClientId ?? ""}
                        onChange={(e) => setSettings((s) => (s ? { ...s, googleClientId: e.target.value || null } : s))}
                      />
                    </div>
                    <div>
                      <Label>{t("admin.settings.oauth.google.clientSecret")}</Label>
                      <Input
                        type="password"
                        placeholder="GOCSPX-..."
                        value={settings.googleClientSecret ?? ""}
                        onChange={(e) => setSettings((s) => (s ? { ...s, googleClientSecret: e.target.value || null } : s))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("admin.settings.oauth.google.clientSecretHint")}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.settings.oauth.google.originsHint")}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{t("admin.settings.oauth.apple.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("admin.settings.oauth.apple.hint")}</p>
                  </div>
                  <Switch
                    checked={settings?.appleLoginEnabled ?? false}
                    onCheckedChange={(v) => setSettings((s) => (s ? { ...s, appleLoginEnabled: v } : s))}
                  />
                </div>
                {settings?.appleLoginEnabled && (
                  <div className="space-y-3">
                    <div>
                      <Label>{t("admin.settings.oauth.apple.clientId")}</Label>
                      <Input
                        placeholder="com.example.service"
                        value={settings.appleClientId ?? ""}
                        onChange={(e) => setSettings((s) => (s ? { ...s, appleClientId: e.target.value || null } : s))}
                      />
                    </div>
                    <div>
                      <Label>{t("admin.settings.oauth.apple.teamId")}</Label>
                      <Input
                        placeholder="XXXXXXXXXX"
                        value={settings.appleTeamId ?? ""}
                        onChange={(e) => setSettings((s) => (s ? { ...s, appleTeamId: e.target.value || null } : s))}
                      />
                    </div>
                    <div>
                      <Label>{t("admin.settings.oauth.apple.keyId")}</Label>
                      <Input
                        placeholder="YYYYYYYYYY"
                        value={settings.appleKeyId ?? ""}
                        onChange={(e) => setSettings((s) => (s ? { ...s, appleKeyId: e.target.value || null } : s))}
                      />
                    </div>
                    <div>
                      <Label>{t("admin.settings.oauth.apple.privateKey")}</Label>
                      <Textarea
                        rows={4}
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                        value={settings.applePrivateKey ?? ""}
                        onChange={(e) => setSettings((s) => (s ? { ...s, applePrivateKey: e.target.value || null } : s))}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.settings.oauth.apple.returnUrlHint")} <code>{`${window.location.origin}/cabinet/login`}</code>
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  disabled={saving}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }}
                >
                  {saving ? t("admin.saving") : t("admin.save")}
                </Button>
                {message && <span className="text-sm text-muted-foreground">{message}</span>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t("admin.settings.landing.title")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("admin.settings.landing.subtitle")}
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setMessage("");
                    try {
                      const updated = await api.resetLandingText(token);
                      setSettings((prev) => (prev ? { ...prev, ...updated } : prev));
                      setMessage(t("admin.settings.landing.resetSuccess"));
                    } catch {
                      setMessage(t("admin.settings.landing.resetError"));
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {t("admin.settings.landing.reset")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{t("admin.settings.landing.enable")}</p>
                  <p className="text-sm text-muted-foreground">{t("admin.settings.landing.enableHint")}</p>
                </div>
                <Switch
                  checked={settings.landingEnabled ?? false}
                  onCheckedChange={(v) => setSettings((s) => (s ? { ...s, landingEnabled: v } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.heroTitle")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.heroTitlePlaceholder")}
                  value={settings.landingHeroTitle ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingHeroTitle: e.target.value || null } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.heroSubtitle")}</Label>
                <Textarea
                  rows={3}
                  placeholder={t("admin.settings.landing.heroSubtitlePlaceholder")}
                  value={settings.landingHeroSubtitle ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingHeroSubtitle: e.target.value || null } : s))}
                />
                <p className="text-xs text-muted-foreground">{t("admin.settings.landing.heroSubtitleHint")}</p>
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.heroCta")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.heroCtaPlaceholder")}
                  value={settings.landingHeroCtaText ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingHeroCtaText: e.target.value || null } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.heroBadge")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.heroBadgePlaceholder")}
                  value={settings.landingHeroBadge ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingHeroBadge: e.target.value || null } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.heroHint")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.heroHintPlaceholder")}
                  value={settings.landingHeroHint ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingHeroHint: e.target.value || null } : s))}
                />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t("admin.settings.landing.featuresTitle")}</p>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <div key={n} className="rounded-lg border p-4 space-y-2">
                  <Label>{t("admin.settings.landing.featureLabel", { index: n })}</Label>
                  <Input
                    placeholder={n === 1 ? t("admin.settings.landing.feature1TitlePlaceholder") : ""}
                    value={(settings as unknown as Record<string, string | null | undefined>)[`landingFeature${n}Label`] ?? ""}
                    onChange={(e) => setSettings((s) => (s ? { ...s, [`landingFeature${n}Label`]: e.target.value || null } : s))}
                  />
                  <Label>{t("admin.settings.landing.featureSub", { index: n })}</Label>
                  <Input
                    placeholder={n === 1 ? t("admin.settings.landing.feature1SubPlaceholder") : ""}
                    value={(settings as unknown as Record<string, string | null | undefined>)[`landingFeature${n}Sub`] ?? ""}
                    onChange={(e) => setSettings((s) => (s ? { ...s, [`landingFeature${n}Sub`]: e.target.value || null } : s))}
                  />
                </div>
              ))}
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.benefitsTitle")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.benefitsTitlePlaceholder")}
                  value={settings.landingBenefitsTitle ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingBenefitsTitle: e.target.value || null } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.benefitsSubtitle")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.benefitsSubtitlePlaceholder")}
                  value={settings.landingBenefitsSubtitle ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingBenefitsSubtitle: e.target.value || null } : s))}
                />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t("admin.settings.landing.cardsTitle")}</p>
              {([1, 2, 3, 4, 5, 6] as const).map((n) => (
                <div key={n} className="rounded-lg border p-4 space-y-2">
                  <Label>{t("admin.settings.landing.cardTitle", { index: n })}</Label>
                  <Input
                    placeholder={n === 1 ? t("admin.settings.landing.card1TitlePlaceholder") : ""}
                    value={(settings as unknown as Record<string, string | null | undefined>)[`landingBenefit${n}Title`] ?? ""}
                    onChange={(e) => setSettings((s) => (s ? { ...s, [`landingBenefit${n}Title`]: e.target.value || null } : s))}
                  />
                  <Label>{t("admin.settings.landing.cardDesc", { index: n })}</Label>
                  <Textarea
                    rows={2}
                    placeholder={n === 1 ? t("admin.settings.landing.card1DescPlaceholder") : ""}
                    value={(settings as unknown as Record<string, string | null | undefined>)[`landingBenefit${n}Desc`] ?? ""}
                    onChange={(e) => setSettings((s) => (s ? { ...s, [`landingBenefit${n}Desc`]: e.target.value || null } : s))}
                  />
                </div>
              ))}
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.tariffsTitle")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.tariffsTitlePlaceholder")}
                  value={settings.landingTariffsTitle ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingTariffsTitle: e.target.value || null } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.tariffsSubtitle")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.tariffsSubtitlePlaceholder")}
                  value={settings.landingTariffsSubtitle ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingTariffsSubtitle: e.target.value || null } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.devicesTitle")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.devicesTitlePlaceholder")}
                  value={settings.landingDevicesTitle ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingDevicesTitle: e.target.value || null } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.devicesSubtitle")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.devicesSubtitlePlaceholder")}
                  value={settings.landingDevicesSubtitle ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingDevicesSubtitle: e.target.value || null } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.faqTitle")}</Label>
                <Input
                  placeholder={t("admin.settings.landing.faqTitlePlaceholder")}
                  value={settings.landingFaqTitle ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingFaqTitle: e.target.value || null } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.faqJson")}</Label>
                <Textarea
                  rows={10}
                  className="font-mono text-sm"
                  placeholder={t("admin.settings.landing.faqJsonPlaceholder")}
                  value={settings.landingFaqJson ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingFaqJson: e.target.value || null } : s))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{t("admin.settings.landing.showTariffs")}</p>
                </div>
                <Switch
                  checked={settings.landingShowTariffs !== false}
                  onCheckedChange={(v) => setSettings((s) => (s ? { ...s, landingShowTariffs: v } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.contacts")}</Label>
                <Textarea
                  rows={3}
                  placeholder={t("admin.settings.landing.contactsPlaceholder")}
                  value={settings.landingContacts ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingContacts: e.target.value || null } : s))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.offerLink")}</Label>
                <Input
                  placeholder="https://..."
                  value={settings.landingOfferLink ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingOfferLink: e.target.value || null } : s))}
                />
                <p className="text-xs text-muted-foreground">{t("admin.settings.landing.offerLinkHint")}</p>
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.privacyLink")}</Label>
                <Input
                  placeholder="https://..."
                  value={settings.landingPrivacyLink ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingPrivacyLink: e.target.value || null } : s))}
                />
                <p className="text-xs text-muted-foreground">{t("admin.settings.landing.privacyLinkHint")}</p>
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.settings.landing.footerText")}</Label>
                <Textarea
                  rows={2}
                  placeholder={t("admin.settings.landing.footerTextPlaceholder")}
                  value={settings.landingFooterText ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, landingFooterText: e.target.value || null } : s))}
                />
              </div>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 w-full text-left font-medium">
                  <ChevronDown className="h-4 w-4" />
                  {t("admin.settings.landing.extraTexts")}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.headline1")}</Label>
                    <Input placeholder={t("admin.settings.landing.headline1Placeholder")} value={settings.landingHeroHeadline1 ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingHeroHeadline1: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.headline2")}</Label>
                    <Input placeholder={t("admin.settings.landing.headline2Placeholder")} value={settings.landingHeroHeadline2 ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingHeroHeadline2: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.headerBadge")}</Label>
                    <Input placeholder={t("admin.settings.landing.headerBadgePlaceholder")} value={settings.landingHeaderBadge ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingHeaderBadge: e.target.value || null } : s))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>{t("admin.settings.landing.buttonLogin")}</Label><Input placeholder={t("admin.settings.landing.buttonLoginPlaceholder")} value={settings.landingButtonLogin ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingButtonLogin: e.target.value || null } : s))} /></div>
                    <div><Label>{t("admin.settings.landing.buttonLoginCabinet")}</Label><Input placeholder={t("admin.settings.landing.buttonLoginCabinetPlaceholder")} value={settings.landingButtonLoginCabinet ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingButtonLoginCabinet: e.target.value || null } : s))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>{t("admin.settings.landing.extra.navBenefits")}</Label><Input placeholder={t("admin.settings.landing.extra.navBenefitsPlaceholder")} value={settings.landingNavBenefits ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingNavBenefits: e.target.value || null } : s))} /></div>
                    <div><Label>{t("admin.settings.landing.extra.navTariffs")}</Label><Input placeholder={t("admin.settings.landing.extra.navTariffsPlaceholder")} value={settings.landingNavTariffs ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingNavTariffs: e.target.value || null } : s))} /></div>
                    <div><Label>{t("admin.settings.landing.extra.navDevices")}</Label><Input placeholder={t("admin.settings.landing.extra.navDevicesPlaceholder")} value={settings.landingNavDevices ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingNavDevices: e.target.value || null } : s))} /></div>
                    <div><Label>{t("admin.settings.landing.extra.navFaq")}</Label><Input placeholder={t("admin.settings.landing.extra.navFaqPlaceholder")} value={settings.landingNavFaq ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingNavFaq: e.target.value || null } : s))} /></div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.benefitsBadge")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.benefitsBadgePlaceholder")} value={settings.landingBenefitsBadge ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingBenefitsBadge: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.defaultPaymentText")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.defaultPaymentTextPlaceholder")} value={settings.landingDefaultPaymentText ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingDefaultPaymentText: e.target.value || null } : s))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>{t("admin.settings.landing.extra.buttonChooseTariff")}</Label><Input placeholder={t("admin.settings.landing.extra.buttonChooseTariffPlaceholder")} value={settings.landingButtonChooseTariff ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingButtonChooseTariff: e.target.value || null } : s))} /></div>
                    <div><Label>{t("admin.settings.landing.extra.buttonWatchTariffs")}</Label><Input placeholder={t("admin.settings.landing.extra.buttonWatchTariffsPlaceholder")} value={settings.landingButtonWatchTariffs ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingButtonWatchTariffs: e.target.value || null } : s))} /></div>
                    <div><Label>{t("admin.settings.landing.extra.buttonStart")}</Label><Input placeholder={t("admin.settings.landing.extra.buttonStartPlaceholder")} value={settings.landingButtonStart ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingButtonStart: e.target.value || null } : s))} /></div>
                    <div><Label>{t("admin.settings.landing.extra.buttonOpenCabinet")}</Label><Input placeholder={t("admin.settings.landing.extra.buttonOpenCabinetPlaceholder")} value={settings.landingButtonOpenCabinet ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingButtonOpenCabinet: e.target.value || null } : s))} /></div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.noTariffsMessage")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.noTariffsMessagePlaceholder")} value={settings.landingNoTariffsMessage ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingNoTariffsMessage: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.stats")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder={t("admin.settings.landing.extra.statsPlatformsPlaceholder")} value={settings.landingStatsPlatforms ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingStatsPlatforms: e.target.value || null } : s))} />
                      <Input placeholder={t("admin.settings.landing.extra.statsTariffsPlaceholder")} value={settings.landingStatsTariffsLabel ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingStatsTariffsLabel: e.target.value || null } : s))} />
                      <Input placeholder={t("admin.settings.landing.extra.statsAccessPlaceholder")} value={settings.landingStatsAccessLabel ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingStatsAccessLabel: e.target.value || null } : s))} />
                      <Input placeholder={t("admin.settings.landing.extra.statsPaymentPlaceholder")} value={settings.landingStatsPaymentMethods ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingStatsPaymentMethods: e.target.value || null } : s))} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.readyEyebrow")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.readyEyebrowPlaceholder")} value={settings.landingReadyToConnectEyebrow ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingReadyToConnectEyebrow: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.readyTitle")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.readyTitlePlaceholder")} value={settings.landingReadyToConnectTitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingReadyToConnectTitle: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.readyDesc")}</Label>
                    <Textarea rows={3} placeholder={t("admin.settings.landing.extra.readyDescPlaceholder")} value={settings.landingReadyToConnectDesc ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingReadyToConnectDesc: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.infraTitle")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.infraTitlePlaceholder")} value={settings.landingInfraTitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingInfraTitle: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.networkCockpitText")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.networkCockpitTextPlaceholder")} value={settings.landingNetworkCockpitText ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingNetworkCockpitText: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.comfortTitle")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.comfortTitlePlaceholder")} value={settings.landingComfortTitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingComfortTitle: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.comfortBadge")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.comfortBadgePlaceholder")} value={settings.landingComfortBadge ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingComfortBadge: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.principlesTitle")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.principlesTitlePlaceholder")} value={settings.landingPrinciplesTitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingPrinciplesTitle: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.pulseTitle")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.pulseTitlePlaceholder")} value={settings.landingPulseTitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingPulseTitle: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.techTitle")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.techTitlePlaceholder")} value={settings.landingTechTitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingTechTitle: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.techDesc")}</Label>
                    <Textarea rows={2} placeholder={t("admin.settings.landing.extra.techDescPlaceholder")} value={settings.landingTechDesc ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingTechDesc: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.categorySubtitle")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.categorySubtitlePlaceholder")} value={settings.landingCategorySubtitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingCategorySubtitle: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.tariffDefaultDesc")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.tariffDefaultDescPlaceholder")} value={settings.landingTariffDefaultDesc ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingTariffDefaultDesc: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.tariffBullets")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.tariffBullet1Placeholder")} value={settings.landingTariffBullet1 ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingTariffBullet1: e.target.value || null } : s))} />
                    <Input placeholder={t("admin.settings.landing.extra.tariffBullet2Placeholder")} value={settings.landingTariffBullet2 ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingTariffBullet2: e.target.value || null } : s))} />
                    <Input placeholder={t("admin.settings.landing.extra.tariffBullet3Placeholder")} value={settings.landingTariffBullet3 ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingTariffBullet3: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.lowestTariffDesc")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.lowestTariffDescPlaceholder")} value={settings.landingLowestTariffDesc ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingLowestTariffDesc: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.devicesCockpitText")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.devicesCockpitTextPlaceholder")} value={settings.landingDevicesCockpitText ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingDevicesCockpitText: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.universality")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.universalityTitlePlaceholder")} value={settings.landingUniversalityTitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingUniversalityTitle: e.target.value || null } : s))} />
                    <Textarea rows={2} placeholder={t("admin.settings.landing.extra.universalityDescPlaceholder")} value={settings.landingUniversalityDesc ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingUniversalityDesc: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.quickSetup")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.quickSetupTitlePlaceholder")} value={settings.landingQuickSetupTitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingQuickSetupTitle: e.target.value || null } : s))} />
                    <Textarea rows={2} placeholder={t("admin.settings.landing.extra.quickSetupDescPlaceholder")} value={settings.landingQuickSetupDesc ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingQuickSetupDesc: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.premiumServiceTitle")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.premiumServiceTitlePlaceholder")} value={settings.landingPremiumServiceTitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingPremiumServiceTitle: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.premiumServiceParas")}</Label>
                    <Textarea rows={2} placeholder={t("admin.settings.landing.extra.premiumServicePara1Placeholder")} value={settings.landingPremiumServicePara1 ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingPremiumServicePara1: e.target.value || null } : s))} />
                    <Textarea rows={2} placeholder={t("admin.settings.landing.extra.premiumServicePara2Placeholder")} value={settings.landingPremiumServicePara2 ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingPremiumServicePara2: e.target.value || null } : s))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("admin.settings.landing.extra.howItWorks")}</Label>
                    <Input placeholder={t("admin.settings.landing.extra.howItWorksTitlePlaceholder")} value={settings.landingHowItWorksTitle ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingHowItWorksTitle: e.target.value || null } : s))} />
                    <Textarea rows={2} placeholder={t("admin.settings.landing.extra.howItWorksDescPlaceholder")} value={settings.landingHowItWorksDesc ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, landingHowItWorksDesc: e.target.value || null } : s))} />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.settings.landing.extra.steps")}</p>
                  {([0, 1, 2] as const).map((i) => (
                    <div key={i} className="rounded-lg border p-4 space-y-2">
                      <Label>{t("admin.settings.landing.extra.stepTitle", { index: i + 1 })}</Label>
                      <Input value={landingJourneySteps[i]?.title ?? ""} onChange={(e) => setLandingJourneySteps((prev) => { const n = [...prev]; n[i] = { ...(n[i] ?? { title: "", desc: "" }), title: e.target.value }; return n; })} placeholder={t("admin.settings.landing.extra.stepTitlePlaceholder")} />
                      <Label>{t("admin.settings.landing.extra.stepDesc", { index: i + 1 })}</Label>
                      <Textarea rows={2} value={landingJourneySteps[i]?.desc ?? ""} onChange={(e) => setLandingJourneySteps((prev) => { const n = [...prev]; n[i] = { ...(n[i] ?? { title: "", desc: "" }), desc: e.target.value }; return n; })} placeholder={t("admin.settings.landing.extra.stepDescPlaceholder")} />
                    </div>
                  ))}
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.settings.landing.extra.signalCards")}</p>
                  {([0, 1, 2] as const).map((i) => (
                    <div key={i} className="rounded-lg border p-4 space-y-2">
                      <Label>{t("admin.settings.landing.extra.signalEyebrow", { index: i + 1 })}</Label>
                      <Input value={landingSignalCards[i]?.eyebrow ?? ""} onChange={(e) => setLandingSignalCards((prev) => { const n = [...prev]; n[i] = { ...(n[i] ?? { eyebrow: "", title: "", desc: "" }), eyebrow: e.target.value }; return n; })} placeholder={t("admin.settings.landing.extra.signalEyebrowPlaceholder")} />
                      <Label>{t("admin.settings.landing.extra.signalTitle", { index: i + 1 })}</Label>
                      <Input value={landingSignalCards[i]?.title ?? ""} onChange={(e) => setLandingSignalCards((prev) => { const n = [...prev]; n[i] = { ...(n[i] ?? { eyebrow: "", title: "", desc: "" }), title: e.target.value }; return n; })} placeholder={t("admin.settings.landing.extra.signalTitlePlaceholder")} />
                      <Label>{t("admin.settings.landing.extra.signalDesc", { index: i + 1 })}</Label>
                      <Textarea rows={2} value={landingSignalCards[i]?.desc ?? ""} onChange={(e) => setLandingSignalCards((prev) => { const n = [...prev]; n[i] = { ...(n[i] ?? { eyebrow: "", title: "", desc: "" }), desc: e.target.value }; return n; })} placeholder={t("admin.settings.landing.extra.signalDescPlaceholder")} />
                    </div>
                  ))}
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.settings.landing.extra.trustPoints")}</p>
                  {([0, 1, 2] as const).map((i) => (
                    <div key={i} className="grid gap-2">
                      <Label>{t("admin.settings.landing.extra.point", { index: i + 1 })}</Label>
                      <Input value={landingTrustPoints[i] ?? ""} onChange={(e) => setLandingTrustPoints((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })} placeholder={t("admin.settings.landing.extra.pointPlaceholder")} />
                    </div>
                  ))}
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.settings.landing.extra.experiencePanels")}</p>
                  {([0, 1, 2] as const).map((i) => (
                    <div key={i} className="rounded-lg border p-4 space-y-2">
                      <Label>{t("admin.settings.landing.extra.panelTitle", { index: i + 1 })}</Label>
                      <Input value={landingExperiencePanels[i]?.title ?? ""} onChange={(e) => setLandingExperiencePanels((prev) => { const n = [...prev]; n[i] = { ...(n[i] ?? { title: "", desc: "" }), title: e.target.value }; return n; })} placeholder={t("admin.settings.landing.extra.panelTitlePlaceholder")} />
                      <Label>{t("admin.settings.landing.extra.panelDesc", { index: i + 1 })}</Label>
                      <Textarea rows={2} value={landingExperiencePanels[i]?.desc ?? ""} onChange={(e) => setLandingExperiencePanels((prev) => { const n = [...prev]; n[i] = { ...(n[i] ?? { title: "", desc: "" }), desc: e.target.value }; return n; })} placeholder={t("admin.settings.landing.extra.panelDescPlaceholder")} />
                    </div>
                  ))}
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.settings.landing.extra.devicesList")}</p>
                  <div className="grid gap-2">
                    {([0, 1, 2, 3, 4, 5, 6, 7] as const).map((i) => (
                      <div key={i}>
                        <Label>{t("admin.settings.landing.extra.device", { index: i + 1 })}</Label>
                        <Input value={landingDevicesList[i] ?? ""} onChange={(e) => setLandingDevicesList((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })} placeholder={i === 0 ? "Windows" : i === 1 ? "macOS" : i === 2 ? "iPhone / iPad" : i === 3 ? "Android" : "Linux"} />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.settings.landing.extra.quickStart")}</p>
                  {([0, 1, 2] as const).map((i) => (
                    <div key={i} className="grid gap-2">
                      <Label>{t("admin.settings.landing.extra.point", { index: i + 1 })}</Label>
                      <Input value={landingQuickStartList[i] ?? ""} onChange={(e) => setLandingQuickStartList((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })} placeholder={t("admin.settings.landing.extra.quickStartPlaceholder")} />
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  disabled={saving}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }}
                >
                  {saving ? t("admin.saving") : t("admin.save")}
                </Button>
                {message && <span className="text-sm text-muted-foreground">{message}</span>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                {t("admin.settings.sync.title")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("admin.settings.sync.subtitle")}
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSyncFromRemna}
                disabled={syncLoading !== null}
              >
                <Download className="h-4 w-4 mr-2" />
                {syncLoading === "from" ? t("admin.settings.sync.loading") : t("admin.settings.sync.from")}
              </Button>
              <Button
                variant="outline"
                onClick={handleSyncToRemna}
                disabled={syncLoading !== null}
              >
                <Upload className="h-4 w-4 mr-2" />
                {syncLoading === "to" ? t("admin.settings.sync.loading") : t("admin.settings.sync.to")}
              </Button>
              <Button
                variant="outline"
                onClick={handleSyncCreateRemnaForMissing}
                disabled={syncLoading !== null}
              >
                <Link2 className="h-4 w-4 mr-2" />
                {syncLoading === "missing" ? t("admin.settings.sync.processing") : t("admin.settings.sync.bindMissing")}
              </Button>
              {syncMessage && (
                <span className="text-sm text-muted-foreground">{syncMessage}</span>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={twoFaEnableOpen} onOpenChange={(open) => !open && closeTwoFaEnable()}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {t("admin.settings.twoFa.enableTitle")}
            </DialogTitle>
            <DialogDescription>
              {twoFaStep === 1
                ? t("admin.settings.twoFa.enableStep1")
                : t("admin.settings.twoFa.enableStep2")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {twoFaLoading && !twoFaSetupData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : twoFaStep === 1 && twoFaSetupData ? (
              <>
                <div className="flex justify-center rounded-xl bg-white p-4 dark:bg-white/95">
                  <QRCodeSVG value={twoFaSetupData.otpauthUrl} size={200} level="M" />
                </div>
                <p className="text-xs text-muted-foreground break-all font-mono bg-muted/50 rounded-lg p-2">{t("admin.settings.twoFa.secret")}: {twoFaSetupData.secret}</p>
                <Button onClick={() => setTwoFaStep(2)}>{t("admin.settings.twoFa.next")}</Button>
              </>
            ) : twoFaStep === 2 ? (
              <>
                <Input
                  placeholder={t("admin.settings.twoFa.codePlaceholder")}
                  maxLength={6}
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-[0.4em] font-mono"
                />
                <Button onClick={confirmTwoFaEnable} disabled={twoFaLoading || twoFaCode.length !== 6}>
                  {twoFaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("admin.settings.twoFa.confirm")}
                </Button>
              </>
            ) : null}
            {twoFaError && <p className="text-sm text-destructive">{twoFaError}</p>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={twoFaDisableOpen} onOpenChange={(open) => !open && setTwoFaDisableOpen(false)}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t("admin.settings.twoFa.disableTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.settings.twoFa.disableDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Input
              placeholder={t("admin.settings.twoFa.codePlaceholder")}
              maxLength={6}
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.4em] font-mono"
            />
            <Button onClick={confirmTwoFaDisable} disabled={twoFaLoading || twoFaCode.length !== 6}>
              {twoFaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("admin.settings.twoFa.disableAction")}
            </Button>
            {twoFaError && <p className="text-sm text-destructive">{twoFaError}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
