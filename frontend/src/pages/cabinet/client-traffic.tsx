import { useCallback, useEffect, useState } from "react";
import { BarChart3, Loader2, Globe, CalendarDays } from "lucide-react";
import { useClientAuth } from "@/contexts/client-auth";
import { api } from "@/lib/api";
import type { TrafficLogEntry, TrafficTopNode, TrafficNodeSeries } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import ReactCountryFlag from "react-country-flag";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

/* ──── helpers ──── */

function bytesToDisplay(bytes: number): { value: number; unit: string } {
  if (bytes >= 1024 ** 3) return { value: +(bytes / 1024 ** 3).toFixed(2), unit: "GB" };
  if (bytes >= 1024 ** 2) return { value: +(bytes / 1024 ** 2).toFixed(2), unit: "MB" };
  if (bytes >= 1024) return { value: +(bytes / 1024).toFixed(1), unit: "KB" };
  return { value: bytes, unit: "B" };
}

function formatBytes(bytes: number): string {
  const { value, unit } = bytesToDisplay(bytes);
  return `${value} ${unit}`;
}

function getLocale(lang?: string): string {
  const l = (lang || "zh").slice(0, 2);
  if (l === "zh") return "zh-CN";
  if (l === "en") return "en-US";
  return "ru-RU";
}

function formatDateShort(dateStr: string, lang?: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString(getLocale(lang), { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

const PERIOD_OPTIONS = [
  { days: 7, labelKey: "trafficReport.period7d" },
  { days: 30, labelKey: "trafficReport.period30d" },
  { days: 90, labelKey: "trafficReport.period90d" },
] as const;

const NODE_COLORS = [
  "hsl(var(--primary))",
  "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1",
];

function CountryFlag({ code, size = "1.1em" }: { code?: string; size?: string }) {
  if (!code || code.length !== 2) return <span>🌐</span>;
  return <ReactCountryFlag countryCode={code.toUpperCase()} svg style={{ width: size, height: size, borderRadius: "2px" }} />;
}

export function ClientTrafficPage() {
  const { state } = useClientAuth();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const token = state.token ?? null;

  const [days, setDays] = useState<number>(7);
  const [data, setData] = useState<TrafficLogEntry[]>([]);
  const [topNodes, setTopNodes] = useState<TrafficTopNode[]>([]);
  const [series, setSeries] = useState<TrafficNodeSeries[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"date" | "node">("date");

  const loadData = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.clientGetTrafficLog(token, { days });
      setData(res.logs);
      setTopNodes(res.topNodes ?? []);
      setSeries(res.series ?? []);
      setCategories(res.categories ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("trafficReport.loadError"));
    } finally {
      setLoading(false);
    }
  }, [token, days, t]);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, days, loadData]);

  /* chart data */
  const chartData = data.map((d) => ({
    date: formatDateShort(d.date, lang),
    rawDate: d.date,
    total: Number(d.usedBytes),
  }));

  const nodeBarData = topNodes.map((n) => ({
    ...n,
    label: n.name,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="hidden md:block relative overflow-hidden rounded-3xl bg-muted/40 dark:bg-white/[0.06] backdrop-blur-2xl border border-border/50 dark:border-white/10 p-5 sm:p-8">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-primary shrink-0" />
            {t("trafficReport.title")}
          </h1>
          <p className="mt-2 text-[14px] sm:text-[15px] text-muted-foreground max-w-xl leading-relaxed">
            {t("trafficReport.subtitle")}
          </p>
        </div>
      </div>

      {/* Period selector + view toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_OPTIONS.map((p) => (
          <Button
            key={p.days}
            variant={days === p.days ? "secondary" : "ghost"}
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => setDays(p.days)}
          >
            {t(p.labelKey)}
          </Button>
        ))}
        <div className="ml-auto flex gap-1">
          <Button
            variant={view === "date" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => setView("date")}
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            {t("trafficReport.viewByDate")}
          </Button>
          <Button
            variant={view === "node" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => setView("node")}
          >
            <Globe className="h-3.5 w-3.5 mr-1" />
            {t("trafficReport.viewByNode")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : chartData.length === 0 && topNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <BarChart3 className="h-12 w-12 opacity-40" />
          <p className="text-sm">{t("trafficReport.noData")}</p>
        </div>
      ) : view === "date" ? (
        <>
          {/* Daily chart */}
          <div className="rounded-2xl border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/[0.06] backdrop-blur-xl p-4">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatBytes(v)} width={70} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", fontSize: 12 }}
                  formatter={((value: any) => [formatBytes(Number(value) || 0), t("trafficReport.totalTraffic")]) as any}
                  labelFormatter={(label: any) => String(label)}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#gradTotal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily breakdown table */}
          {chartData.length > 0 && (
            <div className="rounded-2xl border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/[0.06] backdrop-blur-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 dark:border-white/10">
                <h3 className="text-sm font-semibold">{t("trafficReport.dailyBreakdown")}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40 dark:border-white/10">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t("trafficReport.date")}</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">{t("trafficReport.totalTraffic")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...chartData].reverse().map((d) => (
                      <tr key={d.rawDate} className="border-b border-border/30 dark:border-white/5 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-foreground/90">{d.date}</td>
                        <td className="px-4 py-2.5 text-right text-foreground font-medium">{formatBytes(d.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Node bar chart */}
          {topNodes.length > 0 && (
            <div className="rounded-2xl border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/[0.06] backdrop-blur-xl p-4">
              <ResponsiveContainer width="100%" height={Math.max(200, topNodes.length * 44)}>
                <BarChart data={nodeBarData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => formatBytes(v)} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={(props: any) => {
                      const { x, y, payload } = props;
                      const node = nodeBarData.find((n) => n.label === payload.value);
                      return (
                        <foreignObject x={x - 130} y={y - 10} width={130} height={20}>
                          <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", textAlign: "right", lineHeight: "20px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                            <CountryFlag code={node?.countryCode} size="1em" />
                            <span>{payload.value}</span>
                          </div>
                        </foreignObject>
                      );
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", fontSize: 12 }}
                    formatter={((value: any) => [formatBytes(Number(value) || 0), t("trafficReport.nodeTraffic")]) as any}
                  />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                    {topNodes.map((_n, i) => (
                      <Cell key={i} fill={NODE_COLORS[i % NODE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Node breakdown table */}
          {topNodes.length > 0 && (
            <div className="rounded-2xl border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/[0.06] backdrop-blur-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 dark:border-white/10">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  {t("trafficReport.viewByNode")}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40 dark:border-white/10">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t("trafficReport.nodeName")}</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">{t("trafficReport.nodeTraffic")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topNodes.map((n, i) => (
                      <tr key={n.uuid || i} className="border-b border-border/30 dark:border-white/5 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-foreground/90">
                          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: NODE_COLORS[i % NODE_COLORS.length] }} />
                          <CountryFlag code={n.countryCode} /> {n.name}
                        </td>
                        <td className="px-4 py-2.5 text-right text-foreground font-medium">{formatBytes(n.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per-node daily sparklines (series) */}
          {series.length > 0 && categories.length > 0 && (
            <div className="rounded-2xl border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/[0.06] backdrop-blur-xl p-4">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={categories.map((date, i) => {
                    const row: Record<string, any> = { date: formatDateShort(date, lang) };
                    series.forEach((s) => { row[s.name] = s.data[i] ?? 0; });
                    return row;
                  })}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatBytes(v)} width={70} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", fontSize: 12 }}
                    formatter={((value: any, name: string) => [formatBytes(Number(value) || 0), name]) as any}
                  />
                  {series.map((s, i) => (
                    <Area
                      key={s.uuid || s.name}
                      type="monotone"
                      dataKey={s.name}
                      stroke={NODE_COLORS[i % NODE_COLORS.length]}
                      fill={NODE_COLORS[i % NODE_COLORS.length]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                      stackId="nodes"
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
