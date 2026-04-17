import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Brand = {
  serviceName: string;
  logo: string | null;
};

type AuthShellProps = {
  brand: Brand;
  icon?: React.ComponentType<{ className?: string }>;
  accentClassName?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** extra classes on the outer card */
  className?: string;
};

export function AuthShell({
  brand,
  icon: Icon,
  accentClassName,
  eyebrow,
  title,
  subtitle,
  footer,
  children,
  className,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-10 sm:px-6">
      {/* ── background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        {/* soft radial glow */}
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-[120px]" />
        {/* grid pattern for texture */}
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--primary) / 0.08) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className={cn("relative z-10 w-full max-w-[420px]", className)}>
        {/* card */}
        <div className="rounded-2xl border border-border/50 bg-white/80 shadow-2xl shadow-black/[0.04] backdrop-blur-xl dark:border-white/[0.06] dark:bg-slate-900/80 dark:shadow-black/[0.3]">
          <div className="p-7 sm:p-8">
            {/* brand bar */}
            <div className="mb-7 flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
              >
                {brand.logo ? (
                  <img src={brand.logo} alt="" className="h-6 object-contain dark:brightness-0 dark:invert" />
                ) : (
                  <Shield className="h-5 w-5 text-primary" />
                )}
                {brand.serviceName || "STEALTHNET"}
              </Link>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Secure
              </span>
            </div>

            {/* heading */}
            <div className="mb-7 text-center">
              {Icon && (
                <div
                  className={cn(
                    "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/[0.08]",
                    accentClassName,
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
              )}
              {eyebrow && (
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/50">{eyebrow}</p>
              )}
              <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
              {subtitle && <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>}
            </div>

            {/* content */}
            {children}

            {/* footer */}
            {footer && (
              <div className="mt-7 border-t border-border/30 pt-5 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
