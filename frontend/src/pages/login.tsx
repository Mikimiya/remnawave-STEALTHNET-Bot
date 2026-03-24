import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Loader2, Lock, Fingerprint, Zap } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

/* floating particles */
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let id = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    addEventListener("resize", resize);
    const pts = Array.from({ length: 30 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: Math.random() * 1.5 + 0.5, dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25, o: Math.random() * 0.4 + 0.1 }));
    const draw = () => { ctx.clearRect(0, 0, innerWidth, innerHeight); for (const p of pts) { p.x += p.dx; p.y += p.dy; if (p.x < 0) p.x = innerWidth; if (p.x > innerWidth) p.x = 0; if (p.y < 0) p.y = innerHeight; if (p.y > innerHeight) p.y = 0; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${p.o})`; ctx.fill(); } id = requestAnimationFrame(draw); };
    draw();
    return () => { cancelAnimationFrame(id); removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-0" />;
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { state, login, submit2FACode, clearPending2FA } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [brand, setBrand] = useState<{ serviceName: string; logo: string | null }>({
    serviceName: "",
    logo: null,
  });
  const pending2FA = Boolean(state.pending2FAToken);

  useEffect(() => {
    api
      .getPublicConfig()
      .then((cfg) => {
        setBrand({
          serviceName: cfg.serviceName ?? "",
          logo: cfg.logo ?? null,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (state.accessToken) navigate("/", { replace: true });
  }, [state.accessToken, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.login.enterLogin"));
    } finally {
      setLoading(false);
    }
  }

  async function handle2FASubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.trim().length !== 6) {
      setError(t("admin.login.twoFaError"));
      return;
    }
    setLoading(true);
    try {
      await submit2FACode(code.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-svh overflow-hidden">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12%] top-[5%] h-[420px] w-[420px] animate-[float_20s_ease-in-out_infinite] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[20%] h-[360px] w-[360px] animate-[float_25s_ease-in-out_infinite_reverse] rounded-full bg-blue-500/15 blur-[110px]" />
        <div className="absolute bottom-[-8%] left-[30%] h-[380px] w-[380px] animate-[float_22s_ease-in-out_infinite_3s] rounded-full bg-violet-500/12 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_50%)]" />
      </div>
      <Particles />

      <div className="relative z-10 flex min-h-svh items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-[440px]"
        >
          <Card className="relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-white/60 shadow-[0_30px_100px_rgba(15,23,42,0.2)] backdrop-blur-3xl dark:bg-slate-950/60 dark:shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
            {/* top glow */}
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/[0.08] via-primary/[0.03] to-transparent" />
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <CardContent className="relative p-7 sm:p-9">
              {/* top bar */}
              <div className="mb-8 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/40 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-white/5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  {brand.serviceName || "Coolgo Network"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground dark:bg-white/5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400/60" />
                  </span>
                  Admin
                </div>
              </div>

              {/* icon + title */}
              <div className="mb-8 space-y-5 text-center">
                <motion.div
                  key={pending2FA ? "2fa" : "login"}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35 }}
                  className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-xl shadow-primary/10"
                >
                  {pending2FA ? <Fingerprint className="h-9 w-9" /> : brand.logo ? (
                    <img src={brand.logo} alt="" className="h-10 w-10 rounded-xl object-contain" />
                  ) : (
                    <Lock className="h-9 w-9" />
                  )}
                </motion.div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary/70">
                    {pending2FA ? "verification" : "admin panel"}
                  </p>
                  <h2 className="text-[1.75rem] font-bold tracking-tight text-foreground">
                    {pending2FA ? t("admin.login.twoFaSubtitle") : (brand.serviceName || t("admin.login.title"))}
                  </h2>
                  <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                    {pending2FA ? t("admin.login.twoFaSubtitle") : t("admin.login.subtitle")}
                  </p>
                </div>
              </div>

              {/* form */}
              {pending2FA ? (
                <motion.form
                  key="2fa-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handle2FASubmit}
                  className="space-y-5"
                >
                  {error && (
                    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-2.5">
                    <Label htmlFor="code" className="text-sm font-medium">{t("admin.login.twoFaLabel")}</Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="h-12 rounded-xl border-white/10 bg-white/50 text-center text-lg font-mono tracking-[0.4em] shadow-sm backdrop-blur placeholder:text-muted-foreground/50 focus-visible:ring-primary/40 dark:bg-white/5"
                    />
                  </div>
                  <Button type="submit" className="h-12 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01]" disabled={loading || code.length !== 6}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t("admin.login.enterLogin")}
                  </Button>
                  <Button type="button" variant="ghost" className="h-10 w-full rounded-xl text-sm" onClick={clearPending2FA}>
                    {t("admin.login.cancelTwoFa")}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {error && (
                    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@stealthnet.local"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-12 rounded-xl border-white/10 bg-white/50 px-4 shadow-sm backdrop-blur placeholder:text-muted-foreground/50 focus-visible:ring-primary/40 dark:bg-white/5"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="password" className="text-sm font-medium">{t("admin.login.passwordLabel")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-12 rounded-xl border-white/10 bg-white/50 px-4 shadow-sm backdrop-blur placeholder:text-muted-foreground/50 focus-visible:ring-primary/40 dark:bg-white/5"
                    />
                  </div>
                  <Button type="submit" className="h-12 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01]" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t("admin.login.enterLoading")}</span>
                    ) : (
                      <span className="flex items-center gap-2"><Zap className="h-4 w-4" />{t("admin.login.enterLogin")}</span>
                    )}
                  </Button>
                </motion.form>
              )}

              {/* bottom decorative line */}
              <div className="mt-8 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                <Lock className="h-3 w-3 text-muted-foreground/30" />
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* float keyframe */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
