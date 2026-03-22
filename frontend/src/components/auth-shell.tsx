import { useEffect, useRef } from "react";
import { Shield, Sparkles, Lock, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Brand = {
  serviceName: string;
  logo: string | null;
};

type AuthShellProps = {
  brand: Brand;
  icon: React.ComponentType<{ className?: string }>;
  accentClassName?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  sideTitle: string;
  sideDescription: string;
  sidePoints: string[];
  children: React.ReactNode;
};

/* ── floating particles canvas ── */
function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      }

      // draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" />;
}

/* ── icons for side points ── */
const sideIcons = [Zap, Shield, Lock];

export function AuthShell({
  brand,
  icon: Icon,
  accentClassName,
  eyebrow,
  title,
  subtitle,
  footer,
  sideTitle,
  sideDescription,
  sidePoints,
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-svh overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      {/* ── animated mesh background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* large animated gradient blobs */}
        <div className="absolute left-[-15%] top-[5%] h-[500px] w-[500px] animate-[float_20s_ease-in-out_infinite] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-[-10%] top-[18%] h-[400px] w-[400px] animate-[float_25s_ease-in-out_infinite_reverse] rounded-full bg-blue-500/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[25%] h-[450px] w-[450px] animate-[float_22s_ease-in-out_infinite_2s] rounded-full bg-violet-500/15 blur-[130px]" />
        <div className="absolute right-[20%] bottom-[15%] h-[350px] w-[350px] animate-[float_18s_ease-in-out_infinite_4s] rounded-full bg-rose-500/10 blur-[100px]" />
        {/* overlay noise */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      </div>

      <FloatingParticles />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-0 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          {/* ═══ Left – info panel ═══ */}
          <Card className="group relative hidden overflow-hidden rounded-l-[2.5rem] rounded-r-none border-r-0 border-white/[0.08] bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl dark:from-slate-950/90 dark:via-slate-950/80 dark:to-black/90 lg:block">
            {/* decorative gradient sweep */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-blue-600/10" />
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/20 blur-[80px]" />
            <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-violet-600/15 blur-[60px]" />

            <CardContent className="relative flex h-full flex-col justify-between p-8 xl:p-10">
              <div className="space-y-8">
                {/* badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 shadow-inner">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {eyebrow}
                </div>

                {/* brand + headline */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    {brand.logo ? (
                      <span className="flex h-12 items-center justify-center rounded-2xl bg-white/5 px-3">
                        <img src={brand.logo} alt="" className="h-8 max-w-[150px] object-contain brightness-0 invert" />
                      </span>
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-lg shadow-primary/10">
                        <Shield className="h-6 w-6" />
                      </span>
                    )}
                    {brand.serviceName ? (
                      <span className="text-lg font-semibold tracking-tight text-white">{brand.serviceName}</span>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <h1 className="max-w-lg text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white xl:text-[2.9rem]">
                      {sideTitle}
                    </h1>
                    <p className="max-w-xl text-sm leading-relaxed text-white/50 xl:text-[15px]">
                      {sideDescription}
                    </p>
                  </div>
                </div>
              </div>

              {/* feature cards */}
              <div className="space-y-3 pt-6">
                {sidePoints.map((point, idx) => {
                  const SideIcon = sideIcons[idx % sideIcons.length];
                  return (
                    <div
                      key={point + idx}
                      className="group/card flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-3.5 text-sm text-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-white/[0.07]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 text-primary shadow-lg shadow-primary/10 transition-transform duration-300 group-hover/card:scale-110">
                        <SideIcon className="h-4 w-4" />
                      </span>
                      <span className="leading-snug">{point}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ═══ Right – form panel ═══ */}
          <Card className="relative overflow-hidden rounded-[2.5rem] border-white/[0.08] bg-white/60 shadow-[0_30px_100px_rgba(15,23,42,0.18)] backdrop-blur-3xl dark:bg-slate-950/60 dark:shadow-[0_30px_100px_rgba(0,0,0,0.5)] lg:rounded-l-none lg:rounded-r-[2.5rem]">
            {/* top glow */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/[0.08] via-primary/[0.03] to-transparent" />
            {/* shimmer line */}
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <CardContent className="relative p-6 sm:p-8 md:p-10">
              {/* top bar */}
              <div className="mb-8 flex items-center justify-between gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/40 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-white/60 hover:text-foreground dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  {brand.serviceName || "STEALTHNET"}
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/40 px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground dark:bg-white/5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400/60" />
                  </span>
                  Secure
                </div>
              </div>

              {/* heading area */}
              <div className="mb-8 space-y-5 text-center">
                <div
                  className={cn(
                    "mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-xl shadow-primary/10 transition-transform duration-500 hover:scale-105",
                    accentClassName,
                  )}
                >
                  <Icon className="h-9 w-9" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary/70">{eyebrow}</p>
                  <h2 className="text-[1.75rem] font-bold tracking-tight text-foreground sm:text-[2rem]">{title}</h2>
                  <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>
                </div>
              </div>

              {/* form content */}
              <div className="space-y-5">{children}</div>

              {/* footer */}
              <div className="mt-8 border-t border-white/[0.06] pt-6 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* global keyframe for floating blobs */}
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
