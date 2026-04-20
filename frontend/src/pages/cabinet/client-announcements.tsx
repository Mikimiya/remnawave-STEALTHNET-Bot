import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import type { AnnouncementRecord } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Megaphone, Pin, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

export function ClientAnnouncementsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.getPublicAnnouncements().then(setItems).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Megaphone className="h-12 w-12 opacity-20" />
        <p>{t("clientAnnouncements.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-muted/40 dark:bg-white/[0.06] backdrop-blur-2xl border border-border/50 dark:border-white/10 p-5 sm:p-8">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground flex items-center gap-3">
            <Megaphone className="h-7 w-7 text-primary shrink-0" />
            {t("clientAnnouncements.title")}
          </h1>
          <p className="mt-2 text-[14px] sm:text-[15px] text-muted-foreground max-w-xl leading-relaxed">
            {t("clientAnnouncements.subtitle")}
          </p>
        </div>
      </div>
      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        const plain = stripMarkdown(item.content);
        const preview = plain.length > 120 ? plain.slice(0, 120) + "…" : plain;
        const needsExpand = item.content.length > 120;

        return (
          <Card
            key={item.id}
            className="overflow-hidden rounded-[1.75rem] border border-border/30 bg-card/20 backdrop-blur-2xl cursor-pointer transition-colors hover:bg-card/30"
            onClick={() => setExpandedId(isExpanded ? null : item.id)}
          >
            <div className="px-5 pt-4 pb-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {item.pinned && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0 -rotate-45" />}
                  <h3 className="text-base font-semibold truncate">{item.title}</h3>
                </div>
                {needsExpand && (
                  <button className="shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors p-0.5">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {item.publishedAt && (
                <p className="text-[11px] text-muted-foreground/40 mt-0.5">
                  {new Date(item.publishedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <CardContent className="px-5 pt-1 pb-4">
              <AnimatePresence mode="wait">
                {isExpanded ? (
                  <motion.div
                    key="full"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 prose-headings:text-foreground prose-p:text-foreground/70 prose-strong:text-foreground prose-code:text-foreground/90 prose-code:bg-muted/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-muted/20 prose-pre:border prose-pre:border-border/30 prose-a:text-primary prose-del:text-muted-foreground/50">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
                    </div>
                  </motion.div>
                ) : (
                  <motion.p
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-muted-foreground/60 leading-relaxed"
                  >
                    {preview}
                  </motion.p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
