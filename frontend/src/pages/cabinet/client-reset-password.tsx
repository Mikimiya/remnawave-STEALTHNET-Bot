import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { KeySquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { translateBackendMessage } from "@/lib/utils";
import { useCabinetConfig } from "@/contexts/cabinet-config";

export function ClientResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const config = useCabinetConfig();
  const brand = { serviceName: config?.serviceName ?? "", logo: config?.logo ?? "/favicon.svg" };

  useEffect(() => {
    if (!token) {
      setError(t("auth.invalidLinkExpired"));
      setChecking(false);
      return;
    }

    setChecking(true);
    api.clientVerifyPasswordReset(token)
      .then((res) => {
        setMessage(translateBackendMessage(res.message, t));
        setEmail(res.email);
        setError("");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? translateBackendMessage(err.message, t) : t("auth.invalidLinkExpired"));
      })
      .finally(() => setChecking(false));
  }, [token, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError(t("auth.resetPasswordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.clientResetPassword(token, password);
      setMessage(translateBackendMessage(res.message, t));
      window.setTimeout(() => navigate("/cabinet/login", { replace: true }), 1200);
    } catch (err) {
      setError(err instanceof Error ? translateBackendMessage(err.message, t) : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      <AuthShell
        brand={brand}
        icon={KeySquare}
        eyebrow="new password"
        title={t("auth.resetPasswordTitle")}
        subtitle={t("auth.resetPasswordSubtitle")}
        footer={<><Link to="/cabinet/login" className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline">{t("auth.backToLogin")}</Link></>}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {checking ? <p className="text-sm text-muted-foreground">{t("auth.verifyingLink")}</p> : null}
          {error && <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
          {message && !error && <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{message}</span></div>}

          {!checking && !error && (
            <>
              {email && <p className="text-xs leading-5 text-muted-foreground">{t("auth.resetPasswordFor", { email })}</p>}
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-medium">{t("auth.newPassword")}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className="h-12 rounded-xl border-white/10 bg-white/50 px-4 shadow-sm backdrop-blur dark:bg-white/5" />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">{t("auth.confirmNewPassword")}</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className="h-12 rounded-xl border-white/10 bg-white/50 px-4 shadow-sm backdrop-blur dark:bg-white/5" />
              </div>
              <Button type="submit" className="h-12 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01]" disabled={loading}>
                {loading ? t("auth.resetPasswordSubmitting") : t("auth.resetPasswordAction")}
              </Button>
            </>
          )}
        </form>
      </AuthShell>
    </motion.div>
  );
}