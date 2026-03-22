import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { PublicConfig } from "@/lib/api";

export function ClientForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState<{ serviceName: string; logo: string | null }>({ serviceName: "", logo: null });

  useEffect(() => {
    api.getPublicConfig().then((c: PublicConfig) => {
      setBrand({ serviceName: c.serviceName ?? "", logo: c.logo ?? null });
    }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.clientForgotPassword(email.trim());
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      <AuthShell
        brand={brand}
        icon={KeyRound}
        eyebrow="password recovery"
        title={t("auth.forgotPasswordTitle")}
        subtitle={t("auth.forgotPasswordSubtitle")}
        sideTitle={t("auth.forgotPasswordSideTitle")}
        sideDescription={t("auth.forgotPasswordSideDescription")}
        sidePoints={[
          t("auth.forgotPasswordPoint1"),
          t("auth.forgotPasswordPoint2"),
          t("auth.forgotPasswordPoint3"),
        ]}
        footer={<><Link to="/cabinet/login" className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline">{t("auth.backToLogin")}</Link></>}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
          {message && <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{message}</span></div>}
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-medium">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.enterEmail")}
              required
              autoComplete="email"
              className="h-12 rounded-xl border-white/10 bg-white/50 px-4 shadow-sm backdrop-blur placeholder:text-muted-foreground/70 dark:bg-white/5"
            />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{t("auth.forgotPasswordHelp")}</p>
          <Button type="submit" className="h-12 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01]" disabled={loading}>
            {loading ? t("auth.forgotPasswordSubmitting") : t("auth.sendResetLink")}
          </Button>
        </form>
      </AuthShell>
    </motion.div>
  );
}