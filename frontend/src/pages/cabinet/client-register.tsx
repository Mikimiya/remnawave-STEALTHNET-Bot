import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus, Mail, AlertCircle, ArrowLeft, ArrowRight, Inbox } from "lucide-react";
import { useClientAuth } from "@/contexts/client-auth";
import { useCabinetConfig } from "@/contexts/cabinet-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import { cn, translateBackendMessage } from "@/lib/utils";
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

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

const UTM_STORAGE_KEY = "stealthnet_utm";

function getUtmFromSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = searchParams.get(k)?.trim();
    if (v) out[k] = v;
  }
  return out;
}

function getStoredUtm(): Record<string, string> {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: Record<string, string> = {};
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    for (const k of keys) {
      const v = (parsed as Record<string, unknown>)[k];
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

function storeUtm(utm: Record<string, string>) {
  if (Object.keys(utm).length === 0) return;
  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // ignore
  }
}

function useUtmCapture(searchParams: URLSearchParams) {
  const fromUrl = getUtmFromSearchParams(searchParams);
  if (Object.keys(fromUrl).length > 0) storeUtm(fromUrl);
  const fromStorage = getStoredUtm();
  return { ...fromStorage, ...fromUrl };
}

export function ClientRegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const config = useCabinetConfig();
  const brand = { serviceName: config?.serviceName ?? "", logo: config?.logo ?? "/favicon.svg" };
  const defaults = {
    lang: config?.defaultLanguage || "ru",
    currency: (config?.defaultCurrency || "usd").toLowerCase(),
  };
  const googleEnabled = !!config?.googleLoginEnabled;
  const googleClientId = config?.googleClientId ?? null;
  const publicAppUrl = config?.publicAppUrl ?? null;
  const appleEnabled = !!config?.appleLoginEnabled;
  const telegramBotUsername = config?.telegramBotUsername?.replace(/^@/, "") ?? null;
  const telegramEnabled = !!telegramBotUsername;
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref")?.trim() || undefined;
  const utm = useUtmCapture(searchParams);
  const { register, loginByGoogle, loginByApple } = useClientAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  function validateEmail(value: string): string {
    if (!value.trim()) return t("auth.emailRequired");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t("auth.emailInvalid");
    return "";
  }

  function validatePassword(value: string): string {
    if (!value) return t("auth.passwordRequired");
    if (value.length < 8) return t("auth.passwordTooShort");
    return "";
  }

  /* ── OAuth handlers (unchanged logic) ── */
  const handleGoogleLogin = useCallback(() => {
    if (!googleEnabled || !googleClientId) return;
    setError("");
    const state = "google_" + Math.random().toString(36).slice(2);
    const nonce = Math.random().toString(36).slice(2);
    try {
      sessionStorage.setItem("stealthnet_google_oauth_state", state);
      sessionStorage.setItem("stealthnet_google_oauth_nonce", nonce);
    } catch { /* ignore */ }
    const baseUrl = (publicAppUrl ?? "").trim().replace(/\/$/, "") || window.location.origin;
    const redirectUri = baseUrl + "/cabinet/register";
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
    } catch { /* ignore */ }
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setLoading(true);
    loginByGoogle(idToken)
      .then(() => navigate("/cabinet/dashboard", { replace: true }))
      .catch((err: unknown) => setError(err instanceof Error ? translateBackendMessage(err.message, t) : t("common.error")))
      .finally(() => setLoading(false));
  }, [loginByGoogle, navigate, t]);

  const handleAppleLogin = useCallback(async () => {
    if (!appleEnabled || !config) return;
    setError("");
    setLoading(true);
    try {
      const appleClientIdVal = config.appleClientId;
      if (!appleClientIdVal) throw new Error("Apple Sign In not configured");
      const baseUrl = (config.publicAppUrl ?? "").trim().replace(/\/$/, "") || window.location.origin;
      const redirectUri = baseUrl + "/cabinet/register";
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
      setError(err instanceof Error ? translateBackendMessage(err.message, t) : t("common.error"));
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
    loginByApple(idToken)
      .then(() => navigate("/cabinet/dashboard", { replace: true }))
      .catch((err: unknown) => setError(err instanceof Error ? translateBackendMessage(err.message, t) : t("common.error")))
      .finally(() => setLoading(false));
  }, [loginByApple, navigate, t]);

  /* ── step handlers ── */
  function handleEmailNext() {
    const err = validateEmail(email);
    setEmailError(err);
    if (!err) {
      setError("");
      setStep(2);
    }
  }

  async function handlePasswordSubmit() {
    const err = validatePassword(password);
    setPasswordError(err);
    if (err) return;

    setError("");
    setLoading(true);
    try {
      const result = await register({
        email,
        password,
        preferredLang: defaults.lang,
        preferredCurrency: defaults.currency,
        referralCode: refCode,
        ...utm,
      });
      if (result?.requiresVerification) {
        setStep(3);
      } else {
        navigate("/cabinet/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? translateBackendMessage(err.message, t) : t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  }

  /* ── step indicator ── */
  const stepIndicator = (
    <div className="mb-6 flex items-center justify-center gap-1.5">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={cn(
            "h-1 rounded-full transition-all duration-300",
            s === step ? "w-6 bg-primary" : s < step ? "w-3 bg-primary/40" : "w-3 bg-border/60",
          )}
        />
      ))}
    </div>
  );

  /* ── Step 1: Email ── */
  if (step === 1) {
    return (
      <AuthShell
        brand={brand}
        icon={UserPlus}
        title={t("auth.registerTitle")}
        subtitle={t("auth.registerSubtitle")}
        footer={<>{t("auth.haveAccount")} <Link to="/cabinet/login" className="font-semibold text-primary transition-colors hover:text-primary/80">{t("auth.login")}</Link></>}
      >
        {stepIndicator}
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] font-medium text-foreground/70">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              name="register_email"
              placeholder={t("auth.enterEmail")}
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
              onBlur={() => { if (email) setEmailError(validateEmail(email)); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleEmailNext(); } }}
              required
              autoFocus
              autoComplete="email"
              className={cn(
                "h-11 rounded-xl border-border/40 bg-muted/40 px-3.5 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-primary/30 dark:bg-white/[0.06] backdrop-blur-sm",
                emailError && "border-destructive focus-visible:ring-destructive/30"
              )}
            />
            {emailError && <p className="px-0.5 text-xs text-destructive">{emailError}</p>}
          </div>

          <Button onClick={handleEmailNext} className="mt-1 h-11 w-full rounded-xl text-sm font-semibold shadow-sm transition-all duration-150 hover:shadow-lg hover:shadow-primary/20" disabled={!email.trim()}>
            <span className="flex items-center gap-2">{t("common.next") || "Next"}<ArrowRight className="h-4 w-4" /></span>
          </Button>

          {(googleEnabled || appleEnabled || telegramEnabled) && (
            <>
              <div className="relative flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[11px] font-medium text-muted-foreground/50">{t("common.or")}</span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid gap-2.5">
                {telegramEnabled && (
                  <a href={`https://t.me/${telegramBotUsername}`} target="_blank" rel="noopener noreferrer" className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 text-sm font-medium text-foreground transition-all hover:bg-muted/40 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] backdrop-blur-sm">
                    <TelegramIcon className="h-4 w-4 text-[#2AABEE]" />
                    {t("auth.loginViaTelegram")}
                  </a>
                )}
                {googleEnabled && googleClientId && (
                  <button type="button" onClick={handleGoogleLogin} disabled={loading} className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 text-sm font-medium text-foreground transition-all hover:bg-muted/40 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] backdrop-blur-sm">
                    <GoogleIcon className="h-4 w-4" />
                    {t("auth.registerViaGoogle")}
                  </button>
                )}
                {appleEnabled && (
                  <button type="button" onClick={handleAppleLogin} disabled={loading} className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 text-sm font-medium text-foreground transition-all hover:bg-muted/40 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] backdrop-blur-sm">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    {t("auth.registerViaApple")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </AuthShell>
    );
  }

  /* ── Step 2: Password ── */
  if (step === 2) {
    return (
      <AuthShell
        brand={brand}
        title={t("auth.password") || "Create password"}
        subtitle={email}
        footer={<>{t("auth.haveAccount")} <Link to="/cabinet/login" className="font-semibold text-primary transition-colors hover:text-primary/80">{t("auth.login")}</Link></>}
      >
        {stepIndicator}
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[13px] font-medium text-foreground/70">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              name="register_password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
              onBlur={() => { if (password) setPasswordError(validatePassword(password)); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handlePasswordSubmit(); } }}
              required
              autoFocus
              autoComplete="new-password"
              className={cn(
                "h-11 rounded-xl border-border/40 bg-muted/40 px-3.5 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-primary/30 dark:bg-white/[0.06] backdrop-blur-sm",
                passwordError && "border-destructive focus-visible:ring-destructive/30"
              )}
            />
            {passwordError && <p className="px-0.5 text-xs text-destructive">{passwordError}</p>}
            <p className="px-0.5 text-xs text-muted-foreground/60">{t("auth.passwordTooShort") || "Minimum 8 characters"}</p>
          </div>

          <div className="flex gap-2.5">
            <Button variant="outline" onClick={() => { setStep(1); setError(""); }} className="h-11 rounded-xl px-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button onClick={handlePasswordSubmit} className="h-11 flex-1 rounded-xl text-sm font-semibold shadow-sm transition-all duration-150 hover:shadow-lg hover:shadow-primary/20" disabled={loading || !password}>
              {loading ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />{t("auth.registerLoading")}</span>
              ) : t("auth.register")}
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  /* ── Step 3: Check your email ── */
  return (
    <AuthShell
      brand={brand}
      title={t("auth.emailVerificationSent") || "Check your email"}
      footer={<>{t("auth.haveAccount")} <Link to="/cabinet/login" className="font-semibold text-primary transition-colors hover:text-primary/80">{t("auth.login")}</Link></>}
    >
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/[0.1]">
          <Mail className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-foreground">
            {t("auth.verificationEmailSentTo") || "We've sent a verification link to"}
          </p>
          <p className="text-sm font-semibold text-foreground">{email}</p>
        </div>

        <div className="rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-left dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex items-start gap-2.5">
            <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1 text-[13px] text-amber-800 dark:text-amber-300">
              <p className="font-medium">{t("auth.checkSpamTitle") || "Didn't receive it?"}</p>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-700/80 dark:text-amber-400/70">
                <li>{t("auth.checkSpamFolder") || "Check your Spam / Junk folder"}</li>
                <li>{t("auth.checkEmailTypo") || "Make sure the email address is correct"}</li>
                <li>{t("auth.waitFewMinutes") || "Wait a few minutes and try again"}</li>
              </ul>
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={() => { setStep(1); setPassword(""); setError(""); }} className="h-11 w-full rounded-xl text-sm font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("auth.tryAnotherEmail") || "Try another email"}
        </Button>
      </div>
    </AuthShell>
  );
}
