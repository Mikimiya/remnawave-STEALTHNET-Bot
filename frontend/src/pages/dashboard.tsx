import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  TrendingUp,
  Server,
  DollarSign,
  UserPlus,
  Activity,
  Loader2,
  Power,
  PowerOff,
  RotateCw,
  Cpu,
  Globe,
  WifiOff,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { DashboardStats, RemnaNode, RemnaNodesResponse } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { useTranslation } from "react-i18next";

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ─── Helpers ─── */
function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return "—";
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + " GB";
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

function canAccessRemnaNodes(role: string, allowedSections: string[] | undefined): boolean {
  if (role === "ADMIN") return true;
  return Array.isArray(allowedSections) && allowedSections.includes("remna-nodes");
}

/* ─── Stat card accent configs ─── */
const STAT_CARD_STYLES = [
  { gradient: "from-blue-500/10 to-blue-600/5", iconBg: "bg-blue-500/10", iconColor: "text-blue-500" },
  { gradient: "from-violet-500/10 to-violet-600/5", iconBg: "bg-violet-500/10", iconColor: "text-violet-500" },
  { gradient: "from-emerald-500/10 to-emerald-600/5", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500" },
  { gradient: "from-amber-500/10 to-amber-600/5", iconBg: "bg-amber-500/10", iconColor: "text-amber-500" },
];

/* ─── Hero Stat Card ─── */
function HeroStatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  styleIndex,
  index,
}: {
  icon: typeof Users;
  title: string;
  value: string | number;
  subtitle: string;
  styleIndex: number;
  index: number;
}) {
  const s = STAT_CARD_STYLES[styleIndex % STAT_CARD_STYLES.length];
  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible">
      <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${s.gradient}`}>
        <div className={`absolute -top-6 -right-6 h-24 w-24 rounded-full ${s.iconBg} opacity-50 blur-2xl`} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className={`rounded-xl ${s.iconBg} p-2.5`}>
              <Icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Revenue Metric ─── */
function RevenueMetric({
  label,
  amount,
  count,
  currency,
  paymentsLabel,
  accent = false,
}: {
  label: string;
  amount: number;
  count: number;
  currency: string;
  paymentsLabel: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 transition-colors ${accent ? "bg-primary/5 ring-1 ring-primary/10" : "bg-muted/30"}`}>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold tracking-tight ${accent ? "text-primary" : ""}`}>
        {formatMoney(amount, currency)}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1">
        {count} {paymentsLabel}
      </p>
    </div>
  );
}

/* ─── Analytics Mini Card ─── */
function AnalyticsMiniCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/20 p-3 ring-1 ring-border/50 transition-all hover:bg-muted/40">
      <div className="rounded-lg bg-muted/50 p-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

/* ─── Node Card ─── */
function NodeCard({
  node,
  isBusy,
  onAction,
  t,
}: {
  node: RemnaNode;
  isBusy: boolean;
  onAction: (uuid: string, action: "enable" | "disable" | "restart") => void;
  t: (key: string) => string;
}) {
  const trafficStr =
    node.trafficLimitBytes != null
      ? `${formatBytes(node.trafficUsedBytes ?? 0)} / ${formatBytes(node.trafficLimitBytes)}`
      : formatBytes(node.trafficUsedBytes);

  const trafficPercent =
    node.trafficLimitBytes && node.trafficUsedBytes
      ? Math.min(100, Math.round((node.trafficUsedBytes / node.trafficLimitBytes) * 100))
      : null;

  return (
    <Card className="border-0 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className={`h-2 w-2 rounded-full ${
              node.isDisabled
                ? "bg-muted-foreground/40"
                : node.isConnected
                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                  : node.isConnecting
                    ? "bg-amber-500 animate-pulse"
                    : "bg-red-500"
            }`} />
            <span className="font-medium text-sm">{node.name || node.uuid.slice(0, 8)}</span>
          </div>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            node.isDisabled
              ? "bg-muted text-muted-foreground"
              : node.isConnected
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
          }`}>
            {node.isDisabled
              ? t("admin.dash.nodeDisabled")
              : node.isConnected
                ? t("admin.dash.nodeOnline")
                : node.isConnecting
                  ? t("admin.dash.nodeConnecting")
                  : t("admin.dash.nodeOffline")}
          </span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-px bg-border/30">
          <div className="bg-card p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Globe className="h-3 w-3" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{t("admin.dash.nodeAddress")}</span>
            </div>
            <p className="font-mono text-xs truncate">{node.address}{node.port != null ? `:${node.port}` : ""}</p>
          </div>
          <div className="bg-card p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{t("admin.dash.nodeOnlineUsers")}</span>
            </div>
            <p className="text-sm font-semibold">{node.usersOnline ?? "—"}</p>
          </div>
          <div className="bg-card p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Cpu className="h-3 w-3" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{t("admin.dash.nodeCpuRam")}</span>
            </div>
            <p className="text-xs font-medium">
              {node.cpuCount != null ? node.cpuCount : "—"} cores / {node.totalRam?.trim() || "—"}
            </p>
          </div>
          <div className="bg-card p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Activity className="h-3 w-3" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{t("admin.dash.nodeTraffic")}</span>
            </div>
            <p className="text-xs font-medium">{trafficStr}</p>
            {trafficPercent != null && (
              <div className="mt-1.5 h-1 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    trafficPercent > 80 ? "bg-red-500" : trafficPercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${trafficPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 border-t border-border/50 px-3 py-2">
          {node.isDisabled ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs flex-1 gap-1"
              disabled={isBusy}
              onClick={() => onAction(node.uuid, "enable")}
            >
              {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
              {t("admin.enable")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs flex-1 gap-1"
              disabled={isBusy}
              onClick={() => onAction(node.uuid, "disable")}
            >
              {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <PowerOff className="h-3 w-3" />}
              {t("admin.disable")}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs flex-1 gap-1"
            disabled={isBusy}
            onClick={() => onAction(node.uuid, "restart")}
          >
            <RotateCw className="h-3 w-3" />
            {t("admin.restart")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { state } = useAuth();
  const token = state.accessToken ?? null;
  const admin = state.admin;
  const hasRemnaNodesAccess = admin ? canAccessRemnaNodes(admin.role, admin.allowedSections) : false;
  const { t } = useTranslation();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [nodes, setNodes] = useState<RemnaNode[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<string>("USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeActionUuid, setNodeActionUuid] = useState<string | null>(null);

  const refetchNodes = async () => {
    if (!token || !hasRemnaNodesAccess) return;
    const data = (await api.getRemnaNodes(token).catch(() => ({ response: [] }))) as RemnaNodesResponse;
    setNodes(Array.isArray(data?.response) ? data.response : []);
  };

  const handleNodeAction = async (
    nodeUuid: string,
    action: "enable" | "disable" | "restart",
  ) => {
    if (!token || !hasRemnaNodesAccess) return;
    setNodeActionUuid(nodeUuid);
    try {
      if (action === "enable") await api.remnaNodeEnable(token, nodeUuid);
      else if (action === "disable") await api.remnaNodeDisable(token, nodeUuid);
      else await api.remnaNodeRestart(token, nodeUuid);
      await refetchNodes();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.dash.nodeActionError"));
    } finally {
      setNodeActionUuid(null);
    }
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const statsP = api.getDashboardStats(token!);
        const nodesP = hasRemnaNodesAccess
          ? api.getRemnaNodes(token!).catch(() => ({ response: [] }))
          : Promise.resolve(null);
        const settingsP = api.getSettings(token!).catch(() => null);
        const [statsRes, nodesRes, settingsRes] = await Promise.all([statsP, nodesP, settingsP]);
        if (cancelled) return;
        setStats(statsRes);
        if (nodesRes != null) {
          const data = nodesRes as RemnaNodesResponse;
          setNodes(Array.isArray(data?.response) ? data.response : []);
        } else {
          setNodes([]);
        }
        const curr = settingsRes?.defaultCurrency;
        setDefaultCurrency(curr ? String(curr).toUpperCase() : "USD");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t("admin.error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, hasRemnaNodesAccess]);

  /* ── Derived values ── */
  const onlineNodes = nodes.filter((n) => n.isConnected && !n.isDisabled).length;
  const offlineNodes = nodes.filter((n) => !n.isConnected && !n.isDisabled).length;
  const totalOnlineUsers = nodes.reduce((sum, n) => sum + (n.usersOnline ?? 0), 0);

  /* ── Loading state ── */
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">{t("admin.dash.title")}…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.dash.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("admin.dash.subtitle")}</p>
        </div>
        {hasRemnaNodesAccess && nodes.length > 0 && (
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {onlineNodes} {t("admin.dash.nodeOnline")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {offlineNodes} {t("admin.dash.nodeOffline")}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {totalOnlineUsers} {t("admin.dash.nodeOnlineUsers")}
            </span>
          </div>
        )}
      </div>

      {/* ── Alerts ── */}
      {admin?.role === "MANAGER" && (!admin.allowedSections || admin.allowedSections.length === 0) && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          {t("admin.noAccess")}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Hero stat cards ── */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <HeroStatCard
          icon={Users}
          title={t("admin.dash.totalUsers")}
          value={stats?.users.total ?? "—"}
          subtitle={t("admin.dash.totalUsersDesc")}
          styleIndex={0}
          index={0}
        />
        <HeroStatCard
          icon={Shield}
          title={t("admin.dash.linkedRemna")}
          value={stats?.users.withRemna ?? "—"}
          subtitle={t("admin.dash.linkedRemnaDesc")}
          styleIndex={1}
          index={1}
        />
        <HeroStatCard
          icon={UserPlus}
          title={t("admin.dash.newToday")}
          value={stats?.users.newToday ?? "—"}
          subtitle={t("admin.dash.newTodayDesc")}
          styleIndex={2}
          index={2}
        />
        <HeroStatCard
          icon={TrendingUp}
          title={t("admin.dash.newLast30")}
          value={stats?.users.newLast30Days ?? "—"}
          subtitle={t("admin.dash.newLast30Desc")}
          styleIndex={3}
          index={3}
        />
      </motion.div>

      {/* ── Sales overview ── */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{t("admin.dash.salesTitle")}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <RevenueMetric
                label={t("admin.dash.totalRevenue")}
                amount={stats?.sales.totalAmount ?? 0}
                count={stats?.sales.totalCount ?? 0}
                currency={defaultCurrency}
                paymentsLabel={t("admin.dash.payments")}
                accent
              />
              <RevenueMetric
                label={t("admin.dash.today")}
                amount={stats?.sales.todayAmount ?? 0}
                count={stats?.sales.todayCount ?? 0}
                currency={defaultCurrency}
                paymentsLabel={t("admin.dash.payments")}
              />
              <RevenueMetric
                label={t("admin.dash.last7")}
                amount={stats?.sales.last7DaysAmount ?? 0}
                count={stats?.sales.last7DaysCount ?? 0}
                currency={defaultCurrency}
                paymentsLabel={t("admin.dash.payments")}
              />
              <RevenueMetric
                label={t("admin.dash.last30")}
                amount={stats?.sales.last30DaysAmount ?? 0}
                count={stats?.sales.last30DaysCount ?? 0}
                currency={defaultCurrency}
                paymentsLabel={t("admin.dash.payments")}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Analytics mini-cards ── */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">{t("admin.dash.analyticsTitle")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <AnalyticsMiniCard
                label={t("admin.dash.newUsersToday")}
                value={String(stats?.users.newToday ?? "—")}
                icon={UserPlus}
              />
              <AnalyticsMiniCard
                label={t("admin.dash.newUsers7")}
                value={String(stats?.users.newLast7Days ?? "—")}
                icon={Users}
              />
              <AnalyticsMiniCard
                label={t("admin.dash.newUsers30")}
                value={String(stats?.users.newLast30Days ?? "—")}
                icon={TrendingUp}
              />
              <AnalyticsMiniCard
                label={t("admin.dash.salesToday")}
                value={stats ? formatMoney(stats.sales.todayAmount, defaultCurrency) : "—"}
                icon={DollarSign}
              />
              <AnalyticsMiniCard
                label={t("admin.dash.sales7")}
                value={stats ? formatMoney(stats.sales.last7DaysAmount, defaultCurrency) : "—"}
                icon={Zap}
              />
              <AnalyticsMiniCard
                label={t("admin.dash.sales30")}
                value={stats ? formatMoney(stats.sales.last30DaysAmount, defaultCurrency) : "—"}
                icon={ArrowUpRight}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Remna Nodes ── */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Server className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{t("admin.dash.nodesTitle")}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("admin.dash.nodesSubtitle")}</p>
                </div>
              </div>
              {hasRemnaNodesAccess && nodes.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => refetchNodes()}
                >
                  <RotateCw className="h-3 w-3" />
                  {t("admin.refresh") || "Refresh"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!hasRemnaNodesAccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <WifiOff className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">{t("admin.dash.noNodesAccess")}</p>
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Server className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">{t("admin.dash.noNodes")}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {nodes.map((node) => (
                  <NodeCard
                    key={node.uuid}
                    node={node}
                    isBusy={nodeActionUuid === node.uuid}
                    onAction={handleNodeAction}
                    t={t}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
