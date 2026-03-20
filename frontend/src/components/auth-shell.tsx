import { Shield, Sparkles } from "lucide-react";
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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[8%] h-64 w-64 rounded-full bg-primary/15 blur-[80px]" />
        <div className="absolute right-[-8%] top-[24%] h-72 w-72 rounded-full bg-blue-500/10 blur-[90px]" />
        <div className="absolute bottom-[-8%] left-[20%] h-72 w-72 rounded-full bg-violet-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_35%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <Card className="group relative hidden overflow-hidden rounded-[2rem] border-white/10 bg-white/40 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:bg-slate-950/40 dark:shadow-[0_20px_80px_rgba(0,0,0,0.4)] lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10" />
            <CardContent className="relative flex h-full flex-col justify-between p-8 xl:p-10">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70 dark:bg-white/5 dark:text-foreground/80">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {eyebrow}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {brand.logo ? (
                      <span className="flex h-12 items-center justify-center rounded-2xl bg-zinc-900 px-3 dark:bg-transparent">
                        <img src={brand.logo} alt="" className="h-8 max-w-[150px] object-contain" />
                      </span>
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner">
                        <Shield className="h-6 w-6" />
                      </span>
                    )}
                    {brand.serviceName ? <span className="text-lg font-semibold tracking-tight">{brand.serviceName}</span> : null}
                  </div>

                  <div className="space-y-3">
                    <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-foreground xl:text-[2.9rem] xl:leading-[1.05]">
                      {sideTitle}
                    </h1>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground xl:text-base">
                      {sideDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {sidePoints.map((point, idx) => (
                  <div
                    key={point + idx}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/35 px-4 py-3 text-sm text-foreground/85 shadow-sm backdrop-blur dark:bg-white/5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <span className="text-xs font-bold">0{idx + 1}</span>
                    </span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-[2rem] border-white/10 bg-white/55 shadow-[0_20px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:bg-slate-950/55 dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
            <CardContent className="relative p-5 sm:p-7 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground dark:bg-white/5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  {brand.serviceName || "STEALTHNET"}
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/40 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-white/5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400/60" />
                  Secure access
                </div>
              </div>

              <div className="mb-6 space-y-4 text-center sm:mb-8">
                <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-primary/10 text-primary shadow-inner", accentClassName)}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">{eyebrow}</p>
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">{title}</h2>
                  <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">{subtitle}</p>
                </div>
              </div>

              <div className="space-y-5">{children}</div>

              <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
