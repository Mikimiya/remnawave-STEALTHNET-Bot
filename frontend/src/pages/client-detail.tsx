import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth";
import {
  api,
  type ClientOverviewResponse,
  type ClientPaymentsResponse,
  type ClientReferralsResponse,
  type ClientServicesResponse,
  type UpdateClientPayload,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Copy,
  Check,
  DollarSign,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  MessageSquare,
  Save,
  ShieldCheck,
  ShoppingCart,
  Ticket as TicketIcon,
  Trash2,
  Users2,
  Wifi,
} from "lucide-react";
import { OrderDetailDrawer } from "@/components/order-detail-drawer";

function fmtDate(s?: string | null) {
  if (!s) return "—";
  try { return new Date(s).toLocaleString(); } catch { return s; }
}
function fmtMoney(n: number | null | undefined, cur?: string | null) {
  if (n == null) return "—";
  return `${n.toFixed(2)}${cur ? " " + cur.toUpperCase() : ""}`;
}
function fmtBytes(b: number | null) {
  if (b == null) return "∞";
  if (b === 0) return "0";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = b; let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(2)} ${units[i]}`;
}

function Copyable({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <span className="truncate max-w-[160px]">{value}</span>
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 opacity-60" />}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, sub, highlight }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; sub?: React.ReactNode; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary/40" : undefined}>
      <CardContent className="pt-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-tight truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useAuth();
  const token = state.accessToken!;

  const [tab, setTab] = useState<"overview" | "orders" | "referrals" | "services">("overview");
  const [overview, setOverview] = useState<ClientOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    if (!id) return;
    setLoading(true); setErr(null);
    try {
      const r = await api.getClientOverview(token, id);
      setOverview(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (err || !overview) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />{t("admin.clientDetail.back", { defaultValue: "返回" })}</Button>
        <Card><CardContent className="py-10 text-center text-destructive">{err ?? t("admin.clientDetail.notFound", { defaultValue: "未找到用户" })}</CardContent></Card>
      </div>
    );
  }

  const c = overview.client;
  const s = overview.stats;

  const displayName =
    c.email ?? (c.telegramUsername ? `@${c.telegramUsername}` : c.telegramId ? `TG ${c.telegramId}` : c.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin/clients")} title={t("admin.clientDetail.back", { defaultValue: "返回列表" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              {c.isBlocked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-xs font-semibold">
                  <Ban className="h-3 w-3" />{t("admin.clientDetail.blocked", { defaultValue: "已禁用" })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 text-green-700 dark:text-green-400 px-2 py-0.5 text-xs font-semibold">
                  <CheckCircle2 className="h-3 w-3" />{t("admin.clientDetail.active", { defaultValue: "活跃" })}
                </span>
              )}
              {c.trialUsed && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t("admin.clientDetail.trialUsed", { defaultValue: "已使用试用" })}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span>ID: <Copyable value={c.id} /></span>
              {c.referralCode && <span>{t("admin.clientDetail.referralCode", { defaultValue: "推荐码" })}: <Copyable value={c.referralCode} /></span>}
              <span>{t("admin.clientDetail.registered", { defaultValue: "注册" })}: {fmtDate(c.createdAt)}</span>
              {c.utmSource && <span className="rounded bg-muted px-1.5">UTM: {c.utmSource}{c.utmCampaign ? ` / ${c.utmCampaign}` : ""}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label={t("admin.clientDetail.statBalance", { defaultValue: "余额" })} value={fmtMoney(c.balance)} sub={c.preferredCurrency.toUpperCase()} highlight />
        <StatCard icon={ShoppingCart} label={t("admin.clientDetail.statPaid", { defaultValue: "累计消费" })} value={fmtMoney(s.totalPaidAmount)} sub={`${s.paymentsPaid} ${t("admin.clientDetail.orders", { defaultValue: "笔订单" })}`} />
        <StatCard icon={Users2} label={t("admin.clientDetail.statReferrals", { defaultValue: "邀请人数" })} value={s.referralsCount} sub={t("admin.clientDetail.referralEarnings", { defaultValue: "佣金收入" }) + `: ${fmtMoney(s.referralEarnings)}`} />
        <StatCard icon={TicketIcon} label={t("admin.clientDetail.statTickets", { defaultValue: "工单" })} value={`${s.ticketsOpen}/${s.ticketsTotal}`} sub={t("admin.clientDetail.ticketsOpenTotal", { defaultValue: "未结/总" })} />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="overview">{t("admin.clientDetail.tabOverview", { defaultValue: "概览" })}</TabsTrigger>
          <TabsTrigger value="orders">{t("admin.clientDetail.tabOrders", { defaultValue: "订单" })} ({s.paymentsTotal})</TabsTrigger>
          <TabsTrigger value="referrals">{t("admin.clientDetail.tabReferrals", { defaultValue: "邀请" })}</TabsTrigger>
          <TabsTrigger value="services">{t("admin.clientDetail.tabServices", { defaultValue: "服务" })}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab overview={overview} onReload={loadOverview} />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab clientId={c.id} onOpen={(pid) => setActivePaymentId(pid)} />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralsTab clientId={c.id} />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab clientId={c.id} />
        </TabsContent>
      </Tabs>

      <OrderDetailDrawer
        paymentId={activePaymentId}
        open={Boolean(activePaymentId)}
        onOpenChange={(v) => !v && setActivePaymentId(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Overview: профиль (редактирование) + реферер + квик-инфо
// ═══════════════════════════════════════════════════════════════
function OverviewTab({ overview, onReload }: { overview: ClientOverviewResponse; onReload: () => void }) {
  const { t } = useTranslation();
  const { state } = useAuth();
  const token = state.accessToken!;
  const c = overview.client;

  const [form, setForm] = useState<UpdateClientPayload>({
    email: c.email,
    preferredLang: c.preferredLang,
    preferredCurrency: c.preferredCurrency,
    balance: c.balance,
    isBlocked: c.isBlocked,
    blockReason: c.blockReason,
    referralPercent: c.referralPercent,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pwd, setPwd] = useState({ a: "", b: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      await api.updateClient(token, c.id, form);
      setMsg(t("admin.clientDetail.saved", { defaultValue: "已保存" }));
      onReload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }
  async function setPassword() {
    if (pwd.a.length < 8) { setPwdMsg(t("admin.clientDetail.passwordTooShort", { defaultValue: "最少 8 位" })); return; }
    if (pwd.a !== pwd.b) { setPwdMsg(t("admin.clientDetail.passwordMismatch", { defaultValue: "两次输入不一致" })); return; }
    setPwdSaving(true); setPwdMsg(null);
    try {
      await api.setClientPassword(token, c.id, pwd.a);
      setPwdMsg(t("admin.clientDetail.passwordSet", { defaultValue: "密码已更新" }));
      setPwd({ a: "", b: "" });
    } catch (e) { setPwdMsg(e instanceof Error ? e.message : String(e)); }
    finally { setPwdSaving(false); }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3 mt-4">
      {/* Левая колонка: профиль */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">{t("admin.clientDetail.profileSection", { defaultValue: "基础资料" })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Сгруппированная раскладка */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1.5"><Mail className="h-3 w-3" />{t("admin.clientDetail.groupContact", { defaultValue: "联系方式" })}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  value={form.email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value || null }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-1">
                <Label>Telegram</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                  {c.telegramUsername ? `@${c.telegramUsername}` : ""}
                  {c.telegramId ? ` (${c.telegramId})` : c.telegramUsername ? "" : "—"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t("admin.clientDetail.groupPrefs", { defaultValue: "偏好" })}</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>{t("admin.clientDetail.fieldLang", { defaultValue: "语言" })}</Label>
                <Input value={form.preferredLang ?? ""} onChange={(e) => setForm((f) => ({ ...f, preferredLang: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t("admin.clientDetail.fieldCurrency", { defaultValue: "货币" })}</Label>
                <Input value={form.preferredCurrency ?? ""} onChange={(e) => setForm((f) => ({ ...f, preferredCurrency: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t("admin.clientDetail.fieldRefPercent", { defaultValue: "个人佣金%" })}</Label>
                <Input type="number" min={0} max={100}
                  value={form.referralPercent ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, referralPercent: e.target.value === "" ? null : Number(e.target.value) }))}
                  placeholder={t("admin.clientDetail.useDefault", { defaultValue: "使用默认" })}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1.5"><DollarSign className="h-3 w-3" />{t("admin.clientDetail.groupMoney", { defaultValue: "资金" })}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("admin.clientDetail.fieldBalance", { defaultValue: "余额" })}</Label>
                <Input type="number" step="0.01"
                  value={form.balance ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, balance: Number(e.target.value) || 0 }))}
                />
                <p className="text-xs text-muted-foreground">{t("admin.clientDetail.balanceHint", { defaultValue: "直接编辑会即时生效，建议在「订单」Tab 查看完整资金流。" })}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" />{t("admin.clientDetail.groupStatus", { defaultValue: "账户状态" })}</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isBlocked ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, isBlocked: e.target.checked }))}
                />
                <span>{t("admin.clientDetail.fieldBlocked", { defaultValue: "禁用此账户" })}</span>
              </label>
              {form.isBlocked && (
                <div className="space-y-1">
                  <Label>{t("admin.clientDetail.fieldBlockReason", { defaultValue: "禁用原因" })}</Label>
                  <Input value={form.blockReason ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, blockReason: e.target.value || null }))}
                  />
                </div>
              )}
            </div>
          </div>

          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          <div>
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? t("admin.clientDetail.saving", { defaultValue: "保存中..." }) : t("admin.clientDetail.save", { defaultValue: "保存修改" })}
            </Button>
          </div>

          <hr />

          {/* Пароль */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1.5"><KeyRound className="h-3 w-3" />{t("admin.clientDetail.groupPassword", { defaultValue: "重置密码" })}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="password" placeholder={t("admin.clientDetail.newPassword", { defaultValue: "新密码" })} value={pwd.a} onChange={(e) => setPwd((p) => ({ ...p, a: e.target.value }))} />
              <Input type="password" placeholder={t("admin.clientDetail.confirmPassword", { defaultValue: "确认密码" })} value={pwd.b} onChange={(e) => setPwd((p) => ({ ...p, b: e.target.value }))} />
            </div>
            {pwdMsg && <p className={`text-sm mt-2 ${pwdMsg === t("admin.clientDetail.passwordSet", { defaultValue: "密码已更新" }) ? "text-green-600" : "text-destructive"}`}>{pwdMsg}</p>}
            <Button variant="outline" size="sm" className="mt-2" onClick={setPassword} disabled={pwdSaving || pwd.a.length < 8}>
              {pwdSaving ? "..." : t("admin.clientDetail.setPassword", { defaultValue: "更新密码" })}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Правая колонка: сводка */}
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("admin.clientDetail.referrerSection", { defaultValue: "上级推荐人" })}</CardTitle></CardHeader>
          <CardContent>
            {overview.referrer ? (
              <Link to={`/admin/clients/${overview.referrer.id}`} className="flex items-center justify-between gap-2 rounded border p-3 hover:bg-muted/30">
                <div className="min-w-0">
                  <p className="font-medium truncate">{overview.referrer.email ?? (overview.referrer.telegramUsername ? `@${overview.referrer.telegramUsername}` : overview.referrer.telegramId ?? overview.referrer.id)}</p>
                  <p className="text-xs text-muted-foreground truncate font-mono">{overview.referrer.id}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">{t("admin.clientDetail.noReferrer", { defaultValue: "无上级" })}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("admin.clientDetail.quickStats", { defaultValue: "速览" })}</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.clientDetail.lastPayment", { defaultValue: "上次支付" })}</span><span>{fmtDate(overview.stats.lastPaymentAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.clientDetail.pendingOrders", { defaultValue: "未支付订单" })}</span><span>{overview.stats.paymentsPending}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.clientDetail.activeProxy", { defaultValue: "代理活跃" })}</span><span>{overview.stats.proxySlotsActive}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.clientDetail.activeSingbox", { defaultValue: "Sing-box 活跃" })}</span><span>{overview.stats.singboxSlotsActive}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.clientDetail.promoActs", { defaultValue: "促销组" })}</span><span>{overview.stats.promoActivations}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.clientDetail.promoCodes", { defaultValue: "促销码已用" })}</span><span>{overview.stats.promoCodesUsed}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base text-destructive">{t("admin.clientDetail.dangerZone", { defaultValue: "危险区" })}</CardTitle></CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="text-destructive" onClick={async () => {
              if (!confirm(t("admin.clientDetail.deleteConfirm", { defaultValue: "确定删除该用户？此操作不可恢复。" }))) return;
              try {
                await api.deleteClient(token, c.id);
                window.location.href = "/admin/clients";
              } catch (e) { alert(e instanceof Error ? e.message : String(e)); }
            }}>
              <Trash2 className="h-4 w-4 mr-1" />
              {t("admin.clientDetail.deleteUser", { defaultValue: "删除用户" })}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Orders Tab
// ═══════════════════════════════════════════════════════════════
function OrdersTab({ clientId, onOpen }: { clientId: string; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const { state } = useAuth();
  const token = state.accessToken!;
  const [data, setData] = useState<ClientPaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api.getClientPayments(token, clientId, {
      status: status || undefined,
      type: type || undefined,
      page, limit,
    }).then(setData).finally(() => setLoading(false));
  }, [token, clientId, status, type, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">{t("admin.clientDetail.ordersTitle", { defaultValue: "所有订单" })}</CardTitle>
          {data && <p className="text-xs text-muted-foreground mt-1">{data.total} {t("admin.clientDetail.records", { defaultValue: "条" })}, {t("admin.clientDetail.paidTotal", { defaultValue: "累计收款" })}: {fmtMoney(data.totalPaidAmount)}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="h-9 rounded-md border bg-transparent px-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">{t("admin.clientDetail.statusAll", { defaultValue: "全部状态" })}</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
          <select className="h-9 rounded-md border bg-transparent px-2 text-sm" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">{t("admin.clientDetail.typeAll", { defaultValue: "全部类型" })}</option>
            <option value="vpn">VPN</option>
            <option value="proxy">Proxy</option>
            <option value="singbox">Sing-box</option>
            <option value="topup">{t("admin.clientDetail.typeTopup", { defaultValue: "充值" })}</option>
            <option value="extra">{t("admin.clientDetail.typeExtra", { defaultValue: "扩展" })}</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !data?.items.length ? (
          <p className="text-sm text-muted-foreground text-center py-10">{t("admin.clientDetail.noOrders", { defaultValue: "无订单" })}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-2 pr-2">{t("admin.clientDetail.colTime", { defaultValue: "时间" })}</th>
                  <th className="text-left py-2 pr-2">{t("admin.clientDetail.colType", { defaultValue: "类型" })}</th>
                  <th className="text-left py-2 pr-2">{t("admin.clientDetail.colProduct", { defaultValue: "产品" })}</th>
                  <th className="text-right py-2 pr-2">{t("admin.clientDetail.colAmount", { defaultValue: "金额" })}</th>
                  <th className="text-left py-2 pr-2">{t("admin.clientDetail.colProvider", { defaultValue: "渠道" })}</th>
                  <th className="text-left py-2 pr-2">{t("admin.clientDetail.colStatus", { defaultValue: "状态" })}</th>
                  <th className="text-left py-2">{t("admin.clientDetail.colOrderNo", { defaultValue: "订单号" })}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/20 cursor-pointer" onClick={() => onOpen(p.id)}>
                    <td className="py-2 pr-2 whitespace-nowrap">{fmtDate(p.paidAt ?? p.createdAt)}</td>
                    <td className="py-2 pr-2">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs uppercase">{p.type}</span>
                    </td>
                    <td className="py-2 pr-2">{p.tariffName ?? (p.type === "topup" ? t("admin.clientDetail.typeTopup", { defaultValue: "余额充值" }) : "—")}</td>
                    <td className="py-2 pr-2 text-right font-medium whitespace-nowrap">
                      {fmtMoney(p.amount, p.currency)}
                      {p.originalAmount != null && p.originalAmount !== p.amount && (
                        <div className="text-xs text-muted-foreground line-through">{fmtMoney(p.originalAmount, p.currency)}</div>
                      )}
                    </td>
                    <td className="py-2 pr-2">{p.provider ?? "—"}</td>
                    <td className="py-2 pr-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "PAID" ? "bg-green-500/15 text-green-700 dark:text-green-400"
                          : p.status === "PENDING" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                      }`}>{p.status}</span>
                    </td>
                    <td className="py-2 font-mono text-xs"><Copyable value={p.orderId} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.total > limit && (
          <div className="flex items-center justify-between mt-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("admin.clientDetail.prev", { defaultValue: "上一页" })}</Button>
            <span className="text-xs text-muted-foreground">{page} / {Math.max(1, Math.ceil(data.total / limit))}</span>
            <Button variant="outline" size="sm" disabled={page * limit >= data.total} onClick={() => setPage((p) => p + 1)}>{t("admin.clientDetail.next", { defaultValue: "下一页" })}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// Referrals Tab
// ═══════════════════════════════════════════════════════════════
function ReferralsTab({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const { state } = useAuth();
  const token = state.accessToken!;
  const [data, setData] = useState<ClientReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    api.getClientReferrals(token, clientId, { page, limit }).then(setData).finally(() => setLoading(false));
  }, [token, clientId, page]);

  const earningsByLevel = useMemo(() => {
    const m: Record<number, { count: number; amount: number }> = { 1: { count: 0, amount: 0 }, 2: { count: 0, amount: 0 }, 3: { count: 0, amount: 0 } };
    data?.earnings.byLevel.forEach((l) => { m[l.level] = { count: l.count, amount: l.amount }; });
    return m;
  }, [data]);

  if (loading && !data) return <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-4 mt-4">
      {/* Верхний блок: уровни и заработок */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((lvl) => {
          const count = lvl === 1 ? data.countsByLevel.l1 : lvl === 2 ? data.countsByLevel.l2 : data.countsByLevel.l3;
          return (
            <Card key={lvl}>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">{t("admin.clientDetail.level", { defaultValue: "层级" })} L{lvl}</p>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {earningsByLevel[lvl]?.count ?? 0} {t("admin.clientDetail.credits", { defaultValue: "笔佣金" })} · {fmtMoney(earningsByLevel[lvl]?.amount ?? 0)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Реферер */}
      {data.referrer && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("admin.clientDetail.referrerSection", { defaultValue: "上级推荐人" })}</CardTitle></CardHeader>
          <CardContent>
            <Link to={`/admin/clients/${data.referrer.id}`} className="inline-flex items-center gap-2 text-primary hover:underline">
              {data.referrer.email ?? (data.referrer.telegramUsername ? `@${data.referrer.telegramUsername}` : data.referrer.telegramId ?? data.referrer.id)}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Прямые рефералы */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t("admin.clientDetail.directReferrals", { defaultValue: "直接邀请的用户 (L1)" })} · {data.directReferrals.total}</CardTitle></CardHeader>
        <CardContent>
          {!data.directReferrals.items.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("admin.clientDetail.noRefs", { defaultValue: "暂无邀请" })}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colUser", { defaultValue: "用户" })}</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colTelegram", { defaultValue: "Telegram" })}</th>
                    <th className="text-right py-2 pr-2">{t("admin.clientDetail.colSpent", { defaultValue: "累计消费" })}</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colRegistered", { defaultValue: "注册" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.directReferrals.items.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/20">
                      <td className="py-2 pr-2">
                        <Link to={`/admin/clients/${r.id}`} className="text-primary hover:underline">
                          {r.email ?? r.id.slice(0, 8)}
                        </Link>
                        {r.isBlocked && <span className="ml-2 rounded bg-destructive/15 text-destructive px-1.5 py-0.5 text-xs">{t("admin.clientDetail.blocked", { defaultValue: "禁用" })}</span>}
                      </td>
                      <td className="py-2 pr-2 text-muted-foreground">
                        {r.telegramUsername ? `@${r.telegramUsername}` : r.telegramId ?? "—"}
                      </td>
                      <td className="py-2 pr-2 text-right font-medium">{fmtMoney(r.totalPaid)}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data.directReferrals.total > limit && (
            <div className="flex items-center justify-between mt-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("admin.clientDetail.prev", { defaultValue: "上一页" })}</Button>
              <span className="text-xs text-muted-foreground">{page} / {Math.max(1, Math.ceil(data.directReferrals.total / limit))}</span>
              <Button variant="outline" size="sm" disabled={page * limit >= data.directReferrals.total} onClick={() => setPage((p) => p + 1)}>{t("admin.clientDetail.next", { defaultValue: "下一页" })}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Доходы от рефералов (последние) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.clientDetail.earningsSection", { defaultValue: "最近佣金收入" })}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{t("admin.clientDetail.earningsTotal", { defaultValue: "累计" })}: {fmtMoney(data.earnings.total)}</p>
        </CardHeader>
        <CardContent>
          {!data.recentCredits.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("admin.clientDetail.noEarnings", { defaultValue: "暂无" })}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colTime", { defaultValue: "时间" })}</th>
                    <th className="text-left py-2 pr-2">L</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colFromUser", { defaultValue: "来自" })}</th>
                    <th className="text-right py-2 pr-2">{t("admin.clientDetail.colAmount", { defaultValue: "佣金" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentCredits.map((rc) => (
                    <tr key={rc.id} className="border-b">
                      <td className="py-2 pr-2">{fmtDate(rc.createdAt)}</td>
                      <td className="py-2 pr-2">L{rc.level}</td>
                      <td className="py-2 pr-2">
                        {rc.payment?.fromClient ? (
                          <Link to={`/admin/clients/${rc.payment.fromClient.id}`} className="text-primary hover:underline">
                            {rc.payment.fromClient.email ?? (rc.payment.fromClient.telegramUsername ? `@${rc.payment.fromClient.telegramUsername}` : rc.payment.fromClient.id.slice(0, 8))}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="py-2 pr-2 text-right font-medium">{fmtMoney(rc.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Services Tab
// ═══════════════════════════════════════════════════════════════
function ServicesTab({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const { state } = useAuth();
  const token = state.accessToken!;
  const [data, setData] = useState<ClientServicesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getClientServices(token, clientId).then(setData).finally(() => setLoading(false));
  }, [token, clientId]);

  if (loading && !data) return <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-4 mt-4">
      {/* Proxy slots */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t("admin.clientDetail.proxySlots", { defaultValue: "代理 Slots" })} · {data.proxySlots.length}</CardTitle></CardHeader>
        <CardContent>
          {!data.proxySlots.length ? (
            <p className="text-sm text-muted-foreground">{t("admin.clientDetail.noData", { defaultValue: "无数据" })}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colNode", { defaultValue: "节点" })}</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colLogin", { defaultValue: "登录名" })}</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colTariff", { defaultValue: "套餐" })}</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colStatus", { defaultValue: "状态" })}</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colExpire", { defaultValue: "到期" })}</th>
                    <th className="text-right py-2 pr-2">{t("admin.clientDetail.colTraffic", { defaultValue: "流量" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.proxySlots.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2 pr-2">{s.node?.name ?? "—"}</td>
                      <td className="py-2 pr-2 font-mono text-xs">{s.login}</td>
                      <td className="py-2 pr-2">{s.tariff?.name ?? "—"}</td>
                      <td className="py-2 pr-2"><span className="rounded bg-muted px-1.5 py-0.5 text-xs">{s.status}</span></td>
                      <td className="py-2 pr-2">{fmtDate(s.expiresAt)}</td>
                      <td className="py-2 pr-2 text-right">{fmtBytes(s.trafficUsedBytes)} / {fmtBytes(s.trafficLimitBytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Singbox slots */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t("admin.clientDetail.singboxSlots", { defaultValue: "Sing-box Slots" })} · {data.singboxSlots.length}</CardTitle></CardHeader>
        <CardContent>
          {!data.singboxSlots.length ? (
            <p className="text-sm text-muted-foreground">{t("admin.clientDetail.noData", { defaultValue: "无数据" })}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colNode", { defaultValue: "节点" })}</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colIdentifier", { defaultValue: "标识" })}</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colTariff", { defaultValue: "套餐" })}</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colStatus", { defaultValue: "状态" })}</th>
                    <th className="text-left py-2 pr-2">{t("admin.clientDetail.colExpire", { defaultValue: "到期" })}</th>
                    <th className="text-right py-2 pr-2">{t("admin.clientDetail.colTraffic", { defaultValue: "流量" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.singboxSlots.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2 pr-2">{s.node?.name ?? "—"} <span className="text-xs text-muted-foreground">{s.node?.protocol}</span></td>
                      <td className="py-2 pr-2 font-mono text-xs">{s.userIdentifier.slice(0, 10)}...</td>
                      <td className="py-2 pr-2">{s.tariff?.name ?? "—"}</td>
                      <td className="py-2 pr-2"><span className="rounded bg-muted px-1.5 py-0.5 text-xs">{s.status}</span></td>
                      <td className="py-2 pr-2">{fmtDate(s.expiresAt)}</td>
                      <td className="py-2 pr-2 text-right">{fmtBytes(s.trafficUsedBytes)} / {fmtBytes(s.trafficLimitBytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("admin.clientDetail.promoActs", { defaultValue: "促销组" })}</CardTitle></CardHeader>
          <CardContent>
            {!data.promoActivations.length ? <p className="text-sm text-muted-foreground">{t("admin.clientDetail.noData", { defaultValue: "无数据" })}</p> : (
              <ul className="space-y-1.5 text-sm">
                {data.promoActivations.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span><span className="font-medium">{p.group.name}</span> <span className="text-xs text-muted-foreground font-mono">{p.group.code}</span></span>
                    <span className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("admin.clientDetail.promoCodesUsed", { defaultValue: "已用促销码" })}</CardTitle></CardHeader>
          <CardContent>
            {!data.promoCodeUsages.length ? <p className="text-sm text-muted-foreground">{t("admin.clientDetail.noData", { defaultValue: "无数据" })}</p> : (
              <ul className="space-y-1.5 text-sm">
                {data.promoCodeUsages.map((u) => (
                  <li key={u.id} className="flex justify-between gap-2">
                    <span><code className="font-mono bg-muted px-1 rounded">{u.code?.code ?? "?"}</code> <span className="text-xs text-muted-foreground">{u.code?.type}</span></span>
                    <span className="text-xs text-muted-foreground">{fmtDate(u.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tickets */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />{t("admin.clientDetail.ticketsSection", { defaultValue: "工单" })} · {data.tickets.length}</CardTitle></CardHeader>
        <CardContent>
          {!data.tickets.length ? <p className="text-sm text-muted-foreground">{t("admin.clientDetail.noData", { defaultValue: "无数据" })}</p> : (
            <ul className="space-y-1.5">
              {data.tickets.map((tk) => (
                <li key={tk.id} className="flex justify-between items-center gap-2 rounded border p-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{tk.subject}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(tk.updatedAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${tk.status === "open" ? "bg-amber-500/15 text-amber-700" : tk.status === "needs_reply" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {tk.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wifi className="h-4 w-4" />
        {t("admin.clientDetail.remnaHint", { defaultValue: "VPN / Remnawave 详细操作请使用用户列表编辑弹窗中的 Remna 区域或 Squads 管理。" })}
      </div>
    </div>
  );
}
