import { useCallback, useEffect, useState } from "react";
import { BarChart3, Loader2, ArrowUpFromLine, ArrowDownToLine, Activity } from "lucide-react";
import { useClientAuth } from "@/contexts/client-auth";
import { api } from "@/lib/api";
import type { TrafficLogEntry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

/* ──── source tabs ──── */

const SOURCES = [
  { key: "vpn", labelKey: "trafficReport.sourceVpn" },
  { key: "proxy", labelKey: "trafficReport.sourceProxy" },
  { key: "singbox", labelKey: "trafficReport.sourceSingbox" },
] as const;

const PERIOD_OPTIONS = [
  { days: 7, labelKey: "trafficReport.period7d" },
  { days: 30, labelKey: "trafficReport.period30d" },
  { days: 90, labelKey: "trafficReport.period90d" },
] as const;

export function ClientTrafficPage() {
  const { state } = useClientAuth();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const token = state.token ?? null;

  const [source, setSource] = useState<string>("vpn");
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<TrafficLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.clientGetTrafficLog(token, { days, source });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("trafficReport.loadError"));
    } finally {
      setLoading(false);
    }
  }, [token, days, source, t]);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, days, source, loadData]);

  /* chart data */
  const chartData = data.map((d) => ({
    date: formatDateShort(d.date, lang),
    rawDate: d.date,
    upload: Number(d.uploadBytes),
    download: Number(d.downloadBytes),
    total: Number(d.usedBytes),
  }));

  /* summary */
  const totalUpload = chartData.reduce((s, d) => s + d.upload, 0);
  const totalDownload = chartData.reduce((s, d) => s + d.download, 0);
  const totalTraffic = chartData.reduce((s, d) => s + d.total, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">{t("trafficReport.title")}</h1>
      </div>

      {/* Source tabs */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <Button
            key={s.key}
            variant={source === s.key ? "default" : "outline"}
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => setSource(s.key)}
          >
            {t(s.labelKey)}
          </Button>
        ))}
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          icon={<Activity className="h-4 w-4 text-primary" />}
          label={t("trafficReport.totalTraffic")}
          value={formatBytes(totalTraffic)}
        />
        <SummaryCard
          icon={<ArrowUpFromLine className="h-4 w-4 text-blue-500" />}
          label={t("trafficReport.upload")}
          value={formatBytes(totalUpload)}
        />
        <SummaryCard
          icon={<ArrowDownToLine className="h-4 w-4 text-emerald-500" />}
          label={t("trafficReport.download")}
          value={formatBytes(totalDownload)}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <BarChart3 className="h-12 w-12 opacity-40" />
          <p className="text-sm">{t("trafficReport.noData")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl p-4">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradUpload" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDownload" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatBytes(v)}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                  fontSize: 12,
                }}
                formatter={((value: any, name: any) => [formatBytes(Number(value) || 0), name === "upload" ? t("trafficReport.upload") : t("trafficReport.download")]) as any}
                labelFormatter={(label: any) => String(label)}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value: string) =>
                  value === "upload" ? t("trafficReport.upload") : t("trafficReport.download")
                }
              />
              <Area
                type="monotone"
                dataKey="upload"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#gradUpload)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="download"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#gradDownload)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily breakdown table */}
      {!loading && chartData.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40">
            <h3 className="text-sm font-semibold">{t("trafficReport.dailyBreakdown")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t("trafficReport.date")}</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">{t("trafficReport.upload")}</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">{t("trafficReport.download")}</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">{t("trafficReport.total")}</th>
                </tr>
              </thead>
              <tbody>
                {[...chartData].reverse().map((d) => (
                  <tr key={d.rawDate} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-foreground/80">{d.date}</td>
                    <td className="px-4 py-2.5 text-right text-blue-500/90 font-medium">{formatBytes(d.upload)}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-500/90 font-medium">{formatBytes(d.download)}</td>
                    <td className="px-4 py-2.5 text-right text-foreground font-medium">{formatBytes(d.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-base font-bold tracking-tight">{value}</span>
    </div>
  );
}
