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
  CircleDot,
  CircleOff,
  Loader2,
  Power,
  PowerOff,
  RotateCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { DashboardStats, RemnaNode, RemnaNodesResponse } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { useTranslation } from "react-i18next";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

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
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + " GB";
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return bytes + " B";
}

function formatNodeCpuRam(cpuCount: number | null | undefined, totalRam: string | null | undefined): string {
  const cpu = cpuCount != null ? String(cpuCount) : "—";
  const ram = totalRam?.trim() || "—";
  return `${cpu} / ${ram}`;
}

function canAccessRemnaNodes(role: string, allowedSections: string[] | undefined): boolean {
  if (role === "ADMIN") return true;
  return Array.isArray(allowedSections) && allowedSections.includes("remna-nodes");
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
    action: "enable" | "disable" | "restart"
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

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.dash.title")}</h1>
        <p className="text-muted-foreground">{t("admin.dash.subtitle")}</p>
      </div>

      {admin?.role === "MANAGER" && (!admin.allowedSections || admin.allowedSections.length === 0) && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
          {t("admin.noAccess")}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Статистика пользователей */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dash.totalUsers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.total ?? "—"}</div>
              <p className="text-xs text-muted-foreground">{t("admin.dash.panelClients")}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dash.linkedRemna")}</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.withRemna ?? "—"}</div>
              <p className="text-xs text-muted-foreground">remnawaveUuid</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dash.newToday")}</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.newToday ?? "—"}</div>
              <p className="text-xs text-muted-foreground">{t("admin.dash.regsToday")}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dash.new30Days")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.newLast30Days ?? "—"}</div>
              <p className="text-xs text-muted-foreground">{t("admin.dash.registrations")}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Статистика продаж */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("admin.dash.salesStats")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("admin.dash.totalIncome")}</p>
                <p className="text-xl font-semibold">{stats ? formatMoney(stats.sales.totalAmount, defaultCurrency) : "—"}</p>
                <p className="text-xs text-muted-foreground">{stats?.sales.totalCount ?? 0} {t("admin.dash.paymentsFromGateways")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("admin.dash.today")}</p>
                <p className="text-xl font-semibold">{stats ? formatMoney(stats.sales.todayAmount, defaultCurrency) : "—"}</p>
                <p className="text-xs text-muted-foreground">{stats?.sales.todayCount ?? 0} {t("admin.dash.payments")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("admin.dash.last7days")}</p>
                <p className="text-xl font-semibold">{stats ? formatMoney(stats.sales.last7DaysAmount, defaultCurrency) : "—"}</p>
                <p className="text-xs text-muted-foreground">{stats?.sales.last7DaysCount ?? 0} {t("admin.dash.payments")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("admin.dash.last30days")}</p>
                <p className="text-xl font-semibold">{stats ? formatMoney(stats.sales.last30DaysAmount, defaultCurrency) : "—"}</p>
                <p className="text-xs text-muted-foreground">{stats?.sales.last30DaysCount ?? 0} {t("admin.dash.payments")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Аналитика */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={5}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("admin.dash.analytics")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{t("admin.dash.newUsersToday")}</p>
                <p className="text-lg font-medium">{stats?.users.newToday ?? "—"}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{t("admin.dash.newUsers7d")}</p>
                <p className="text-lg font-medium">{stats?.users.newLast7Days ?? "—"}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{t("admin.dash.newUsers30d")}</p>
                <p className="text-lg font-medium">{stats?.users.newLast30Days ?? "—"}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{t("admin.dash.salesToday")}</p>
                <p className="text-lg font-medium">{stats ? formatMoney(stats.sales.todayAmount, defaultCurrency) : "—"}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{t("admin.dash.sales7d")}</p>
                <p className="text-lg font-medium">{stats ? formatMoney(stats.sales.last7DaysAmount, defaultCurrency) : "—"}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{t("admin.dash.sales30d")}</p>
                <p className="text-lg font-medium">{stats ? formatMoney(stats.sales.last30DaysAmount, defaultCurrency) : "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ноды Remna */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={6}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {t("admin.dash.remnaNodes")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("admin.dash.remnaNodesSubtitle")}
            </p>
          </CardHeader>
          <CardContent>
            {!hasRemnaNodesAccess ? (
              <p className="text-muted-foreground text-sm py-4">
                {t("admin.dash.noNodesAccess")}
              </p>
            ) : nodes.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                {t("admin.dash.noNodesLoaded")}
              </p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium">{t("admin.name")}</th>
                      <th className="text-left py-2.5 px-3 font-medium">{t("admin.dash.nodeAddress")}</th>
                      <th className="text-left py-2.5 px-3 font-medium">{t("admin.status")}</th>
                      <th className="text-left py-2.5 px-3 font-medium">{t("admin.dash.nodeConn")}</th>
                      <th className="text-left py-2.5 px-3 font-medium">{t("admin.dash.nodeTraffic")}</th>
                      <th className="text-left py-2.5 px-3 font-medium">{t("admin.dash.nodeCpuRam")}</th>
                      <th className="text-left py-2.5 px-3 font-medium">{t("admin.dash.nodeOnlineUsers")}</th>
                      <th className="text-left py-2.5 px-3 font-medium">{t("admin.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map((node) => {
                      const isBusy = nodeActionUuid === node.uuid;
                      const trafficStr = node.trafficLimitBytes != null
                        ? `${formatBytes(node.trafficUsedBytes ?? 0)} / ${formatBytes(node.trafficLimitBytes)}`
                        : formatBytes(node.trafficUsedBytes);
                      return (
                        <tr key={node.uuid} className="border-b last:border-b-0">
                          <td className="py-3 px-3 font-medium">{node.name || node.uuid}</td>
                          <td className="py-3 px-3 font-mono text-xs">
                            {node.address}
                            {node.port != null ? `:${node.port}` : ""}
                          </td>
                          <td className="py-3 px-3">
                            {node.isDisabled ? (
                              <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs">{t("admin.dash.nodeDisabled")}</span>
                            ) : node.isConnecting ? (
                              <span className="inline-flex rounded-md border px-2 py-0.5 text-xs">{t("admin.dash.nodeConnecting")}</span>
                            ) : (
                              <span className="inline-flex rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs">{t("admin.dash.nodeActive")}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {node.isConnected ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CircleDot className="h-4 w-4 shrink-0" />
                                {t("admin.dash.nodeOnline")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <CircleOff className="h-4 w-4 shrink-0" />
                                {t("admin.dash.nodeOffline")}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 tabular-nums whitespace-nowrap">{trafficStr}</td>
                          <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                            {formatNodeCpuRam(node.cpuCount, node.totalRam)}
                          </td>
                          <td className="py-3 px-3 tabular-nums">
                            {node.usersOnline != null ? node.usersOnline : "—"}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {node.isDisabled ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  disabled={isBusy}
                                  onClick={() => handleNodeAction(node.uuid, "enable")}
                                >
                                  {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                                  <span className="ml-1">{t("admin.enable")}</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  disabled={isBusy}
                                  onClick={() => handleNodeAction(node.uuid, "disable")}
                                >
                                  {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <PowerOff className="h-3 w-3" />}
                                  <span className="ml-1">{t("admin.disable")}</span>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={isBusy}
                                onClick={() => handleNodeAction(node.uuid, "restart")}
                              >
                                <RotateCw className="h-3 w-3" />
                                <span className="ml-1">{t("admin.restart")}</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
