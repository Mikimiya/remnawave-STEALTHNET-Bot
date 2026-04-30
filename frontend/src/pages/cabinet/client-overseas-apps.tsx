import { useTranslation } from "react-i18next";
import { Smartphone, Apple, Play, Lightbulb } from "lucide-react";

interface TutorialSection {
  icon: React.ReactNode;
  titleKey: string;
  stepsKey: string;
  isSteps: boolean;
}

const SECTIONS: TutorialSection[] = [
  { icon: <Apple className="h-5 w-5" />, titleKey: "overseasApps.appleid.title", stepsKey: "overseasApps.appleid.steps", isSteps: true },
  { icon: <Smartphone className="h-5 w-5" />, titleKey: "overseasApps.tiktok.title", stepsKey: "overseasApps.tiktok.steps", isSteps: true },
  { icon: <Play className="h-5 w-5" />, titleKey: "overseasApps.googleplay.title", stepsKey: "overseasApps.googleplay.steps", isSteps: true },
  { icon: <Lightbulb className="h-5 w-5" />, titleKey: "overseasApps.tips.title", stepsKey: "overseasApps.tips.items", isSteps: false },
];

function renderMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function ClientOverseasAppsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="hidden md:block relative overflow-hidden rounded-3xl bg-muted/40 dark:bg-white/[0.06] backdrop-blur-2xl border border-border/50 dark:border-white/10 p-5 sm:p-8">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground flex items-center gap-3">
            <Smartphone className="h-7 w-7 text-primary shrink-0" />
            {t("overseasApps.title")}
          </h1>
          <p className="mt-2 text-[14px] sm:text-[15px] text-muted-foreground max-w-xl leading-relaxed">
            {t("overseasApps.subtitle")}
          </p>
        </div>
      </div>

      {/* Tutorial sections */}
      {SECTIONS.map((section, si) => {
        const items = t(section.stepsKey, { returnObjects: true }) as string[];
        if (!Array.isArray(items) || items.length === 0) return null;

        return (
          <div
            key={si}
            className="rounded-2xl border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/[0.06] backdrop-blur-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/50 dark:border-white/10 flex items-center gap-3">
              <div className="text-primary">{section.icon}</div>
              <h2 className="text-base font-semibold">{t(section.titleKey)}</h2>
            </div>
            <div className="p-5 space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  {section.isSteps ? (
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-primary mt-0.5">•</span>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {renderMarkdown(item)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
