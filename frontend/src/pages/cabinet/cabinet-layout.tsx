import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useClientAuth } from "@/contexts/client-auth";
import { CabinetConfigProvider, useCabinetConfig } from "@/contexts/cabinet-config";
import { createContext, useContext } from "react";
import { useIsMiniapp } from "@/hooks/use-is-miniapp";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { GlassSelect } from "@/components/ui/glass-select";
import { LayoutDashboard, Package, User, LogOut, Shield, Users, Sun, Moon, PlusCircle, Globe, KeyRound, MessageSquare, Palette, Monitor, Check, Loader2, Settings, Layers, MoreHorizontal, ChevronDown, Wallet, X } from "lucide-react";
import { useTheme, ACCENT_PALETTES, type ThemeMode, type ThemeAccent } from "@/contexts/theme";
import { cn, formatMoney } from "@/lib/utils";
import { FloatingChat } from "@/components/floating-chat";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

function AnalyticsScripts() {
  useEffect(() => {
    api.getPublicConfig().then((c) => {
      if (c.googleAnalyticsId?.trim()) {
        const id = c.googleAnalyticsId.trim();
        if (document.getElementById("ga4-script")) return;
        const script = document.createElement("script");
        script.id = "ga4-script";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
        document.head.appendChild(script);
        const init = document.createElement("script");
        init.id = "ga4-init";
        init.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`;
        document.head.appendChild(init);
      }
      if (c.yandexMetrikaId?.trim()) {
        const id = c.yandexMetrikaId.trim();
        const ymId = /^\d+$/.test(id) ? id : "0";
        if (document.getElementById("ym-script")) return;
        const script = document.createElement("script");
        script.id = "ym-script";
        script.async = true;
        script.textContent = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");ym(${ymId}, "init", {clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`;
        document.head.appendChild(script);
      }
    }).catch(() => { });
  }, []);
  return null;
}

const IsMiniappContext = createContext(false);
export function useCabinetMiniapp() {
  return useContext(IsMiniappContext);
}

/** Экран ввода кода 2FA после успешной проверки пароля или Telegram */
function Client2FAStepScreen() {
  const { t } = useTranslation();
  const { state, submit2FACode, clearPending2FA } = useClientAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!state.pending2FAToken || code.trim().length !== 6) {
  setError(t("cabinetLayout.twoFa.codeRequired"));
        return;
      }
      setError(null);
      setLoading(true);
      try {
        await submit2FACode(code.trim());
      } catch (err) {
  setError(err instanceof Error ? err.message : t("cabinetLayout.twoFa.invalidCode"));
      } finally {
        setLoading(false);
      }
    },
    [state.pending2FAToken, code, submit2FACode]
  );

  if (!state.pending2FAToken) return null;

  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-background p-4 sm:p-8 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)] min-w-0">
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 dark:border-white/5 bg-[hsl(var(--card)/0.85)] backdrop-blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6 shadow-inner border border-primary/20">
            <KeyRound className="h-8 w-8" />
          </div>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("cabinetLayout.twoFa.title")}</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">{t("cabinetLayout.twoFa.description")}</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            <div className="relative w-full">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000 000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full h-16 text-center text-3xl tracking-[0.3em] font-mono font-bold rounded-2xl border border-primary/20 bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 text-foreground transition-all"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full h-12 rounded-2xl font-bold text-base shadow-lg shadow-primary/20" disabled={loading || code.trim().length !== 6}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {t("cabinetLayout.twoFa.confirm")}
              </Button>
              <Button type="button" variant="ghost" className="w-full h-10 rounded-xl text-muted-foreground" disabled={loading} onClick={clearPending2FA}>
                {t("common.cancel")}
              </Button>
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive text-center animate-in fade-in">{error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

const ALL_NAV_ITEMS = [
  { to: "/cabinet/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, alwaysMore: false },
  { to: "/cabinet/tariffs", labelKey: "nav.tariffs", icon: Package, alwaysMore: false },
  { to: "/cabinet/custom-build", labelKey: "nav.customBuild", icon: Layers, alwaysMore: false },
  { to: "/cabinet/proxy", labelKey: "nav.proxy", icon: Globe, alwaysMore: false },
  { to: "/cabinet/singbox", labelKey: "nav.singbox", icon: KeyRound, alwaysMore: false },
  { to: "/cabinet/referral", labelKey: "nav.referral", icon: Users, alwaysMore: false },
  { to: "/cabinet/profile", labelKey: "nav.profile", icon: User, alwaysMore: false },
  { to: "/cabinet/extra-options", labelKey: "nav.extraOptions", icon: PlusCircle, alwaysMore: true },
  { to: "/cabinet/tickets", labelKey: "nav.tickets", icon: MessageSquare, alwaysMore: true },
];

const MODE_OPTIONS: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "theme.modeLight" },
  { value: "dark", icon: Moon, label: "theme.modeDark" },
  { value: "system", icon: Monitor, label: "theme.modeSystem" },
];

function ThemePopover() {
  const [show, setShow] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { config: themeConfig, setMode, setAccent, resolvedMode, allowUserThemeChange } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (!show) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    // defer to next tick so the opening click doesn't immediately close
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handleClick); };
  }, [show]);

  // Если смена темы запрещена — просто кнопка солнышко/луна без дропдауна
  if (!allowUserThemeChange) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 bg-background/20 hover:bg-background/40 transition-all duration-300"
        onClick={() => setMode(resolvedMode === "dark" ? "light" : "dark")}
      >
        <span className="relative h-4 w-4">
          <Sun className={cn("absolute inset-0 h-4 w-4 transition-all duration-500", resolvedMode === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
          <Moon className={cn("absolute inset-0 h-4 w-4 transition-all duration-500", resolvedMode === "light" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0")} />
        </span>
      </Button>
    );
  }

  return (
    <div className="relative" ref={popoverRef}>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-background/20 hover:bg-background/40" onClick={() => setShow(!show)}>
        <Palette className="h-3.5 w-3.5" />
      </Button>
      <div
        className={cn(
          "absolute -right-2 sm:right-0 top-full z-50 mt-3 w-[calc(100vw-2rem)] sm:w-[320px] max-w-[320px] rounded-[2rem] border border-white/40 dark:border-white/10 bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-[32px] p-5 shadow-[0_10px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_60px_rgba(0,0,0,0.5)] transition-all duration-300 origin-top-right",
          show
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-95 pointer-events-none -translate-y-2"
        )}
      >
        <div className="mb-5">
          <h4 className="mb-3 text-sm font-semibold tracking-tight text-foreground">{t("cabinetLayout.theme.title")}</h4>
          <div className="flex rounded-xl bg-muted/60 p-1 border border-border/50">
            {MODE_OPTIONS.map((opt) => {
              const isActive = themeConfig.mode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all duration-300",
                    isActive
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                      : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                  )}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  {t(opt.label)}
                </button>
              );
            })}
          </div>
        </div>

        {allowUserThemeChange && (
          <div>
            <h4 className="mb-3 text-sm font-semibold tracking-tight text-foreground">{t("cabinetLayout.theme.accent")}</h4>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(ACCENT_PALETTES) as [ThemeAccent, typeof ACCENT_PALETTES["default"]][]).map(([key, palette]) => {
                const isActive = themeConfig.accent === key;
                return (
                  <button
                    key={key}
                    onClick={() => setAccent(key)}
                    className={cn(
                      "group flex flex-col items-center gap-2 rounded-xl p-2 transition-all duration-300",
                      isActive ? "bg-primary/10" : "hover:bg-muted/60"
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform duration-300",
                        isActive ? "scale-110 ring-4 ring-primary/20" : "group-hover:scale-110"
                      )}
                      style={{ backgroundColor: palette.swatch }}
                    >
                      {isActive && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium tracking-tight truncate w-full text-center transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {t(palette.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPopover() {
  const [show, setShow] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { state, refreshProfile } = useClientAuth();
  const { t, i18n } = useTranslation();

  const [activeLanguages, setActiveLanguages] = useState<string[]>([]);
  const [activeCurrencies, setActiveCurrencies] = useState<string[]>([]);
  const [preferredLang, setPreferredLang] = useState(state.client?.preferredLang ?? "ru");
  const [preferredCurrency, setPreferredCurrency] = useState(state.client?.preferredCurrency ?? "usd");
  const [saving, setSaving] = useState(false);
  const defaultCurrencies = ["usd", "rub", "cny"];

  useEffect(() => {
    if (!show) {
      if (state.client) {
        setPreferredLang(state.client.preferredLang);
        setPreferredCurrency(state.client.preferredCurrency);
      }
      return;
    }

    api.getPublicConfig()
      .then((c) => {
        setActiveLanguages(c.activeLanguages?.length ? c.activeLanguages : ["ru", "en"]);
        setActiveCurrencies(c.activeCurrencies?.length ? c.activeCurrencies : defaultCurrencies);
      })
      .catch(() => { });

    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handleClick); };
  }, [show, state.client]);

  async function handleSave() {
    if (!state.token) return;
    setSaving(true);
    try {
      await api.clientUpdateProfile(state.token, { preferredLang, preferredCurrency });
      await refreshProfile();
      // 保存后同步 UI 语言（若 preferredLang 是支持的语言）
      const supported = SUPPORTED_LANGUAGES.map((l) => l.code as string);
      if (supported.includes(preferredLang)) {
        i18n.changeLanguage(preferredLang);
        try { localStorage.setItem("stealthnet_lang", preferredLang); } catch { /* ignore */ }
      }
      setShow(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function switchUiLang(code: SupportedLanguage) {
    i18n.changeLanguage(code);
    setPreferredLang(code);
    try { localStorage.setItem("stealthnet_lang", code); } catch { /* ignore */ }
  }

  const langs = activeLanguages.length ? activeLanguages : ["ru", "en"];
  const currencies = activeCurrencies.length ? activeCurrencies : defaultCurrencies;

  return (
    <div className="relative" ref={popoverRef}>
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2 bg-background/20 hover:bg-background/40" onClick={() => setShow(!show)}>
        <Settings className="h-3.5 w-3.5" />
      </Button>
      <div
        className={cn(
          "absolute -right-2 sm:right-0 top-full z-50 mt-3 w-[calc(100vw-2rem)] sm:w-[260px] max-w-[260px] rounded-[2rem] border border-white/40 dark:border-white/10 bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-[32px] p-5 shadow-[0_10px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_60px_rgba(0,0,0,0.5)] transition-all duration-300 origin-top-right",
          show ? "opacity-100 scale-100 pointer-events-auto translate-y-0" : "opacity-0 scale-95 pointer-events-none -translate-y-2"
        )}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Settings className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold tracking-tight text-foreground truncate">{t("onboarding.step3", "Settings")}</h4>
            <p className="text-[10px] text-muted-foreground mt-[1px] uppercase tracking-wider font-semibold truncate">{t("onboarding.language")} & {t("onboarding.currency")}</p>
          </div>
        </div>

        <div className="space-y-4 mb-5">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium pl-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> {t("onboarding.language")}
            </label>
            <GlassSelect
              value={preferredLang}
              onChange={(v) => switchUiLang(v as SupportedLanguage)}
              options={langs.map((code) => {
                const found = SUPPORTED_LANGUAGES.find((s) => s.code === code);
                return { value: code, label: found ? `${found.flag} ${found.label}` : code.toUpperCase() };
              })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium pl-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {t("onboarding.currency")}</label>
            <GlassSelect
              value={preferredCurrency}
              onChange={(v) => setPreferredCurrency(v)}
              options={currencies.map((c) => ({ value: c, label: c.toUpperCase() }))}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full h-10 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}

function resolveNavItems(config: { sellOptionsEnabled?: boolean; showProxyEnabled?: boolean; showSingboxEnabled?: boolean; ticketsEnabled?: boolean; customBuildConfig?: { enabled: true } | null } | null) {
  let items = ALL_NAV_ITEMS;
  if (!config?.ticketsEnabled) items = items.filter((i) => i.to !== "/cabinet/tickets");
  if (!config?.customBuildConfig) items = items.filter((i) => i.to !== "/cabinet/custom-build");
  if (!config?.sellOptionsEnabled) items = items.filter((i) => i.to !== "/cabinet/extra-options");
  if (!config?.showProxyEnabled) items = items.filter((i) => i.to !== "/cabinet/proxy");
  if (!config?.showSingboxEnabled) items = items.filter((i) => i.to !== "/cabinet/singbox");

  return items;
}

const MAX_VISIBLE_NAV = 4;
const MAX_VISIBLE_DESKTOP = 5;

function MobileCabinetShell() {
  const location = useLocation();
  const { state, logout, refreshProfile } = useClientAuth();
  const config = useCabinetConfig();
  const { t } = useTranslation();
  const navItems = useMemo(() => resolveNavItems(config), [config?.sellOptionsEnabled, config?.showProxyEnabled, config?.showSingboxEnabled, config?.ticketsEnabled, config?.customBuildConfig]);
  const [logoError, setLogoError] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const mainItems = navItems.filter((i) => !i.alwaysMore);
  const visibleItems = mainItems.slice(0, MAX_VISIBLE_NAV);
  const moreItems = [...mainItems.slice(MAX_VISIBLE_NAV), ...navItems.filter((i) => i.alwaysMore)];
  const hasMore = moreItems.length > 0;

  // Swipe-to-close for drawer
  const touchStartX = useRef(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 60) setMoreMenuOpen(false);
  }, []);

  useEffect(() => { setLogoError(false); }, [config?.logo]);
  useEffect(() => {
    if (state.token) refreshProfile().catch(() => { });
  }, [state.token, refreshProfile]);

  // Auto-close drawer on route change
  useEffect(() => { setMoreMenuOpen(false); }, [location.pathname]);

  // Body scroll lock & Escape key for drawer
  useEffect(() => {
    if (!moreMenuOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [moreMenuOpen]);

  const serviceName = config?.serviceName ?? "";
  const logo = config?.logo && !logoError ? config.logo : null;

  return (
    <div className="min-h-svh flex flex-col bg-transparent min-w-0 overflow-x-hidden pb-36 relative">
      <FloatingChat />
      <header className="sticky top-0 z-50 border-b border-border shrink-0 transition-all duration-300" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="absolute inset-0 bg-card/40 backdrop-blur-xl -z-10 pointer-events-none" />
        <div className="relative flex h-14 items-center justify-between gap-3 px-4 min-w-0 w-full max-w-7xl mx-auto">
          <Link to="/cabinet/dashboard" className="flex items-center gap-2.5 font-semibold text-base tracking-tight shrink-0 min-w-0">
            {logo ? (
              <span className="flex items-center justify-center h-8 px-1.5 rounded-lg dark:bg-transparent bg-zinc-900 shrink-0">
                <img src={logo} alt="" className="h-6 max-w-[100px] object-contain" onError={() => setLogoError(true)} />
              </span>
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-sm">
                <Shield className="h-4 w-4" />
              </span>
            )}
            {serviceName ? <span className="truncate">{serviceName}</span> : null}
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemePopover />
            <SettingsPopover />
            <Button variant="ghost" size="icon" className="shrink-0 bg-background/20 hover:bg-background/40 text-muted-foreground hover:text-foreground" asChild>
              <Link to="/cabinet/login" onClick={() => logout()} title={t("auth.logout")}>
                <LogOut className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full min-w-0 px-4 py-6 max-w-7xl mx-auto transition-all duration-300">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/60 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] transition-all duration-300">
        <div className="flex items-center justify-around w-full h-[4.5rem] px-2 gap-0">
          {visibleItems.map(({ to, labelKey, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1 px-1 h-14 flex-1 min-w-0 max-w-[5rem] rounded-xl transition-all duration-300",
                  active ? "bg-primary/20 text-primary shadow-sm scale-105" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground hover:scale-105"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", active && "scale-110 drop-shadow-md")} />
                <span className="text-[10px] font-medium leading-none tracking-tight truncate w-full text-center">{t(labelKey)}</span>
              </Link>
            );
          })}
          {hasMore && (
            <button
              type="button"
              onClick={() => setMoreMenuOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 px-1 h-14 flex-1 min-w-0 max-w-[5rem] rounded-xl transition-all duration-300",
                "text-muted-foreground hover:bg-foreground/5 hover:text-foreground hover:scale-105"
              )}
              aria-label={t("cabinetLayout.more")}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none tracking-tight">{t("cabinetLayout.more")}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          moreMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMoreMenuOpen(false)}
      />

      {/* Right slide-out drawer */}
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-[70] w-[min(80vw,320px)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          moreMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-card/70 dark:bg-card/80 backdrop-blur-2xl border-l border-white/10 dark:border-white/5 shadow-[-8px_0_40px_rgba(0,0,0,0.15)] dark:shadow-[-8px_0_40px_rgba(0,0,0,0.4)]" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/15 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-500/10 blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-lg font-bold tracking-tight text-foreground">{t("cabinetLayout.menu")}</h2>
          <button
            type="button"
            onClick={() => setMoreMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info card */}
        {state.client && (
          <div className="relative mx-4 mb-4 rounded-2xl bg-primary/5 border border-primary/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {state.client.email?.trim() || (state.client.telegramUsername ? `@${state.client.telegramUsername}` : "—")}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    {formatMoney(state.client.balance, state.client.preferredCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <div className="relative flex-1 overflow-y-auto px-3 space-y-0.5">
          {navItems.map(({ to, labelKey, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMoreMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-200 active:scale-[0.98]",
                  active
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-primary/20 text-primary" : "bg-foreground/5 text-muted-foreground"
                )}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <span className="text-[15px] font-medium">{t(labelKey)}</span>
                {active && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/50" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="relative px-3 pb-4 pt-2">
          <div className="h-px bg-border/50 mx-2 mb-3" />
          <Link
            to="/cabinet/login"
            onClick={() => { logout(); setMoreMenuOpen(false); }}
            className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <LogOut className="h-[18px] w-[18px]" />
            </div>
            <span className="text-[15px] font-medium">{t("auth.logout")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    setMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return mobile;
}

function CabinetShell() {
  const location = useLocation();
  const { state, logout, refreshProfile } = useClientAuth();
  const config = useCabinetConfig();
  const { t } = useTranslation();
  const navItems = useMemo(() => resolveNavItems(config), [config?.sellOptionsEnabled, config?.showProxyEnabled, config?.showSingboxEnabled, config?.ticketsEnabled, config?.customBuildConfig]);
  const isMiniapp = useIsMiniapp();
  const isMobile = useIsMobile();
  const [logoError, setLogoError] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const mainNav = navItems.filter((i) => !i.alwaysMore);
  const visibleNav = mainNav.slice(0, MAX_VISIBLE_DESKTOP);
  const moreNav = [...mainNav.slice(MAX_VISIBLE_DESKTOP), ...navItems.filter((i) => i.alwaysMore)];

  useEffect(() => { setLogoError(false); }, [config?.logo]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  useEffect(() => {
    if (state.token) refreshProfile().catch(() => { });
  }, [state.token, refreshProfile]);
  const serviceName = config?.serviceName ?? "";
  const logo = config?.logo && !logoError ? config.logo : null;
  const headerBalance = state.client ? formatMoney(state.client.balance, state.client.preferredCurrency) : null;

  if (isMiniapp || isMobile) {
    return <MobileCabinetShell />;
  }

  return (
    <div className="min-h-svh flex flex-col bg-transparent">
      <FloatingChat />
      <header className="sticky top-0 z-50 border-b border-border shadow-sm transition-all duration-300">
        <div className="absolute inset-0 bg-card/40 backdrop-blur-xl -z-10 pointer-events-none" />
        <div className="relative w-full max-w-7xl mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Link to="/cabinet/dashboard" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight shrink-0 hover:opacity-80 transition-opacity">
            {logo ? (
              <span className="flex items-center justify-center h-9 px-2 rounded-lg dark:bg-transparent bg-zinc-900 shrink-0">
                <img src={logo} alt="" className="h-6 max-w-[110px] object-contain" onError={() => setLogoError(true)} />
              </span>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-sm">
                <Shield className="h-5 w-5" />
              </span>
            )}
            {serviceName ? <span className="hidden sm:inline truncate">{serviceName}</span> : null}
          </Link>
          <nav className="flex items-center gap-1 flex-wrap justify-center flex-1">
            {visibleNav.map(({ to, labelKey, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "inline-flex items-center gap-2 whitespace-nowrap transition-all duration-300",
                      active ? "bg-primary/20 hover:bg-primary/30 text-primary shadow-sm scale-105" : "hover:scale-105 hover:bg-background/40"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(labelKey)}
                  </Button>
                </Link>
              );
            })}
            {moreNav.length > 0 && (
              <div className="relative inline-block" ref={moreRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "inline-flex items-center gap-2 whitespace-nowrap transition-all duration-300 hover:scale-105 hover:bg-background/40",
                    moreNav.some((i) => location.pathname === i.to) ? "bg-primary/20 text-primary" : ""
                  )}
                  onClick={() => setMoreOpen(!moreOpen)}
                >
                  {t("cabinetLayout.more")}
                  <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", moreOpen && "rotate-180")} />
                </Button>
                {moreOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-border bg-card py-1.5 shadow-lg">
                    {moreNav.map(({ to, labelKey, icon: Icon }) => {
                      const active = location.pathname === to;
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                            active ? "bg-primary/20 text-primary" : "hover:bg-muted/60"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {t(labelKey)}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <ThemePopover />
            <SettingsPopover />
            <div className="hidden lg:flex h-9 items-center gap-3 rounded-full border border-border/60 bg-background/35 px-4 shadow-sm backdrop-blur-xl transition-all hover:bg-background/50">
              <span className="max-w-[120px] xl:max-w-[160px] truncate text-sm font-medium text-muted-foreground" title={state.client?.email?.trim() || (state.client?.telegramUsername ? `@${state.client.telegramUsername}` : "")}>
                {state.client?.email?.trim() ? state.client.email : state.client?.telegramUsername ? `@${state.client.telegramUsername}` : "—"}
              </span>
              <div className="w-[1px] h-4 bg-border/80" />
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground/90">
                <Wallet className="h-4 w-4 text-primary" />
                <span>{headerBalance ?? "—"}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="group h-9 rounded-full border-border/60 bg-background/35 p-0 shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
              asChild
            >
              <Link to="/cabinet/login" onClick={() => logout()} className="flex h-full items-center">
                <div className="flex h-full w-9 shrink-0 items-center justify-center">
                  <LogOut className="h-[18px] w-[18px]" />
                </div>
                <div className="grid grid-cols-[0fr] opacity-0 transition-all duration-300 group-hover:grid-cols-[1fr] group-hover:opacity-100">
                  <span className="overflow-hidden whitespace-nowrap text-sm font-medium">
                    <span className="pr-4">{t("auth.logout")}</span>
                  </span>
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}

export function CabinetLayout() {
  const location = useLocation();
  const { state } = useClientAuth();
  const isAuthPage = location.pathname === "/cabinet/login" || location.pathname === "/cabinet/register";
  const isLoggedIn = Boolean(state.token);
  const needs2FA = !isLoggedIn && Boolean(state.pending2FAToken);

  return (
    <>
      <AnalyticsScripts />
      {needs2FA ? (
        <Client2FAStepScreen />
      ) : isAuthPage || !isLoggedIn ? (
        <Outlet />
      ) : (
        <CabinetConfigProvider>
          <CabinetShellWithMiniapp />
        </CabinetConfigProvider>
      )}
    </>
  );
}

function CabinetShellWithMiniapp() {
  const isMiniapp = useIsMiniapp();
  const isMobile = useIsMobile();
  return (
    <IsMiniappContext.Provider value={isMiniapp || isMobile}>
      <CabinetShell />
    </IsMiniappContext.Provider>
  );
}
