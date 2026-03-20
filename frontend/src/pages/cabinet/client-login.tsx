import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, AlertCircle } from "lucide-react";
import { useClientAuth } from "@/contexts/client-auth";
import { api } from "@/lib/api";
import type { PublicConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function ClientLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState<{ serviceName: string; logo: string | null }>({ serviceName: "", logo: null });
  const [telegramBotUsername, setTelegramBotUsername] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [publicAppUrl, setPublicAppUrl] = useState<string | null>(null);
  const [appleEnabled, setAppleEnabled] = useState(false);
  const telegramWidgetRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const { login, registerByTelegram, loginByGoogle, loginByApple } = useClientAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  function validateEmail(value: string): string {
    if (!value.trim()) return t("auth.emailRequired");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t("auth.emailInvalid");
    return "";
  }

  function handleEmailBlur() {
    setEmailError(validateEmail(email));
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  }

  function validateAll(): boolean {
    const emailErr = validateEmail(email);
    setEmailError(emailErr);
    return !emailErr;
  }

  useEffect(() => {
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const utm: Record<string, string> = {};
    for (const k of keys) {
      const v = searchParams.get(k)?.trim();
      if (v) utm[k] = v;
    }
    if (Object.keys(utm).length > 0) {
      try {
        localStorage.setItem("stealthnet_utm", JSON.stringify(utm));
      } catch {}
    }
  }, [searchParams]);

  useEffect(() => {
    api.getPublicConfig().then((c: PublicConfig) => {
      setBrand({ serviceName: c.serviceName ?? "", logo: c.logo ?? null });
      setTelegramBotUsername(c.telegramBotUsername ?? null);
      setGoogleEnabled(!!c.googleLoginEnabled);
      setGoogleClientId(c.googleClientId ?? null);
      setPublicAppUrl(c.publicAppUrl ?? null);
      setAppleEnabled(!!c.appleLoginEnabled);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!telegramBotUsername || !telegramWidgetRef.current) return;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", telegramBotUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onTelegramLoginAuth(user)");
    script.async = true;
    (window as unknown as { onTelegramLoginAuth: (user: { id: number; username?: string }) => void }).onTelegramLoginAuth = (user) => {
      registerByTelegram({ telegramId: String(user.id), telegramUsername: user.username }).then(() => navigate("/cabinet/dashboard", { replace: true }));
    };
    telegramWidgetRef.current.innerHTML = "";
    telegramWidgetRef.current.appendChild(script);
  }, [telegramBotUsername, registerByTelegram, navigate]);

  const handleGoogleLogin = useCallback(() => {
    if (!googleEnabled || !googleClientId) return;
    setError("");
    const state = "google_" + Math.random().toString(36).slice(2);
    const nonce = Math.random().toString(36).slice(2);
    try {
      sessionStorage.setItem("stealthnet_google_oauth_state", state);
      sessionStorage.setItem("stealthnet_google_oauth_nonce", nonce);
    } catch {}
    const baseUrl = (publicAppUrl ?? "").trim().replace(/\/$/, "") || window.location.origin;
    const redirectUri = baseUrl + "/cabinet/login";
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", googleClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "id_token");
    url.searchParams.set("scope", "openid email");
    url.searchParams.set("nonce", nonce);
    url.searchParams.set("state", state);
    window.location.href = url.toString();
  }, [googleEnabled, googleClientId, publicAppUrl]);

  useEffect(() => {
    const hash = window.location.hash?.replace("#", "") || "";
    const params = new URLSearchParams(hash);
    const state = params.get("state") || "";
    if (!state.startsWith("google_") || !params.get("id_token")) return;
    const idToken = params.get("id_token");
    if (!idToken) return;
    try {
      const saved = sessionStorage.getItem("stealthnet_google_oauth_state");
      if (saved !== state) return;
      sessionStorage.removeItem("stealthnet_google_oauth_state");
      sessionStorage.removeItem("stealthnet_google_oauth_nonce");
    } catch {}
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setLoading(true);
    loginByGoogle(idToken).then(() => navigate("/cabinet/dashboard", { replace: true })).catch((err: unknown) => setError(err instanceof Error ? err.message : t("common.error"))).finally(() => setLoading(false));
  }, [loginByGoogle, navigate, t]);

  const handleAppleLogin = useCallback(async () => {
    if (!appleEnabled) return;
    setError("");
    setLoading(true);
    try {
      const cfg = await api.getPublicConfig();
      const appleClientIdVal = cfg.appleClientId;
      if (!appleClientIdVal) throw new Error("Apple Sign In not configured");
      const baseUrl = (cfg.publicAppUrl ?? "").trim().replace(/\/$/, "") || window.location.origin;
      const redirectUri = baseUrl + "/cabinet/login";
      const state = Math.random().toString(36).slice(2);
      const url = new URL("https://appleid.apple.com/auth/authorize");
      url.searchParams.set("client_id", appleClientIdVal);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code id_token");
      url.searchParams.set("response_mode", "fragment");
      url.searchParams.set("scope", "email");
      url.searchParams.set("state", state);
      window.location.href = url.toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      setLoading(false);
    }
  }, [appleEnabled, t]);

  useEffect(() => {
    const hash = window.location.hash?.replace("#", "") || "";
    const params = new URLSearchParams(hash);
    if (params.get("state")?.startsWith("google_")) return;
    if (!params.get("id_token")) return;
    const idToken = params.get("id_token");
    if (!idToken) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setLoading(true);
    loginByApple(idToken).then(() => navigate("/cabinet/dashboard", { replace: true })).catch((err: unknown) => setError(err instanceof Error ? err.message : t("common.error"))).finally(() => setLoading(false));
  }, [loginByApple, navigate, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validateAll()) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate("/cabinet/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      <AuthShell
        brand={brand}
        icon={LogIn}
        eyebrow="secure login"
        title={t("auth.loginTitle")}
        subtitle={t("auth.loginSubtitle")}
        sideTitle={brand.serviceName ? `${brand.serviceName} — private access without friction.` : "Private access without friction."}
        sideDescription="Use one clean sign-in flow for your cabinet, payments, subscriptions, and support. Fast to enter, easy to trust, and comfortable on mobile."
        sidePoints={[
          "One-click access to your plans, balance, and connection links",
          "Google, Apple, Telegram, and classic email sign-in in one place",
          "Designed for calm, premium onboarding on phones and desktops",
        ]}
        footer={<>{t("auth.noAccount")} <Link to="/cabinet/register" className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline">{t("auth.register")}</Link></>}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" name="prevent_autofill" autoComplete="off" tabIndex={-1} className="absolute h-0 w-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden />
          {error && <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-medium">{t("auth.email")}</Label>
            <Input id="email" type="email" name="login_email" placeholder={t("auth.enterEmail")} value={email} onChange={handleEmailChange} onBlur={handleEmailBlur} required autoComplete="username" className={cn("h-12 rounded-2xl border-white/10 bg-white/50 px-4 shadow-sm backdrop-blur placeholder:text-muted-foreground/70 dark:bg-white/5", emailError ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary/40")} />
            {emailError && <p className="px-1 text-xs text-destructive dark:text-red-400">{emailError}</p>}
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-sm font-medium">{t("auth.password")}</Label>
            <Input id="password" type="password" name="login_password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="h-12 rounded-2xl border-white/10 bg-white/50 px-4 shadow-sm backdrop-blur placeholder:text-muted-foreground/70 focus-visible:ring-primary/40 dark:bg-white/5" />
          </div>
          <Button type="submit" className="h-12 w-full rounded-2xl text-sm font-semibold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01]" disabled={loading}>{loading ? t("auth.loginLoading") : t("auth.login")}</Button>
          {(telegramBotUsername || googleEnabled || appleEnabled) && <div className="space-y-4"><div className="relative flex items-center gap-3"><div className="h-px flex-1 bg-border/70" /><span className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">{t("common.or")}</span><div className="h-px flex-1 bg-border/70" /></div><div className="grid gap-3">{googleEnabled && googleClientId && <button type="button" onClick={handleGoogleLogin} disabled={loading} title={t("auth.loginViaGoogle")} className={cn("flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/50 px-4 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-all hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10", "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2")}><GoogleIcon className="h-5 w-5" />{t("auth.loginViaGoogle")}</button>}{appleEnabled && <Button type="button" variant="outline" className="h-12 w-full rounded-2xl gap-3 border-white/10 bg-white/50 text-sm font-medium shadow-sm backdrop-blur hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10" onClick={handleAppleLogin} disabled={loading}><svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>{t("auth.loginViaApple")}</Button>}{telegramBotUsername && <div className="rounded-2xl border border-white/10 bg-white/35 px-3 py-3 shadow-sm backdrop-blur dark:bg-white/5"><div ref={telegramWidgetRef} className="flex min-h-[44px] justify-center" /></div>}</div></div>}
        </form>
      </AuthShell>
    </motion.div>
  );
}
