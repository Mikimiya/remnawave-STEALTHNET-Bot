import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type PaymentDetail } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

function fmtDate(s?: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function fmtMoney(n: number | null | undefined, cur?: string | null) {
  if (n == null) return "—";
  return `${n.toFixed(2)}${cur ? " " + cur.toUpperCase() : ""}`;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "PAID"
      ? "bg-green-500/15 text-green-700 dark:text-green-400"
      : status === "PENDING"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : status === "FAILED"
          ? "bg-red-500/15 text-red-700 dark:text-red-400"
          : status === "REFUNDED"
            ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
            : "bg-muted text-muted-foreground";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}

function TypeBadge({ type }: { type: PaymentDetail["type"] }) {
  const { t } = useTranslation();
  const labels: Record<string, string> = {
    vpn: t("admin.orderDetail.typeVpn", { defaultValue: "VPN" }),
    proxy: t("admin.orderDetail.typeProxy", { defaultValue: "Прокси" }),
    singbox: t("admin.orderDetail.typeSingbox", { defaultValue: "Sing-box" }),
    topup: t("admin.orderDetail.typeTopup", { defaultValue: "Пополнение" }),
    extra: t("admin.orderDetail.typeExtra", { defaultValue: "Доп. опция" }),
  };
  return <span className="inline-flex rounded bg-muted px-2 py-0.5 text-xs font-medium">{labels[type] ?? type}</span>;
}

function Copyable({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="group inline-flex items-center gap-1.5 rounded border border-transparent bg-muted/40 px-2 py-1 font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors max-w-full"
      title={label ?? value}
    >
      <span className="truncate">{value}</span>
      {copied ? <Check className="h-3 w-3 shrink-0 text-green-500" /> : <Copy className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-border/40 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-xs text-muted-foreground shrink-0 sm:w-40 sm:pt-0.5">{label}</span>
      <span className="text-sm font-medium break-words sm:text-right sm:max-w-[60%]">{children}</span>
    </div>
  );
}

export interface OrderDetailDrawerProps {
  paymentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDrawer({ paymentId, open, onOpenChange }: OrderDetailDrawerProps) {
  const { state } = useAuth();
  const token = state.accessToken;
  const { t } = useTranslation();
  const [data, setData] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !paymentId || !token) return;
    setLoading(true);
    setError(null);
    setData(null);
    api
      .getPaymentDetail(token, paymentId)
      .then((d) => setData(d))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [open, paymentId, token]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 text-left">
          <DialogTitle className="flex items-center gap-2">
            {t("admin.orderDetail.title", { defaultValue: "订单详情" })}
            {data && <StatusBadge status={data.status} />}
            {data && <TypeBadge type={data.type} />}
          </DialogTitle>
          <DialogDescription className="sr-only">Order detail</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 pt-2">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          {data && !loading && (
            <div className="space-y-4">
              {/* Заголовок: orderId */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">{t("admin.orderDetail.orderId", { defaultValue: "订单号" })}</span>
                  <Copyable value={data.orderId} />
                </div>
                {data.externalId && (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{t("admin.orderDetail.externalId", { defaultValue: "支付平台订单号" })}</span>
                    <Copyable value={data.externalId} />
                  </div>
                )}
                {data.remnawaveUserId && (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Remnawave UUID</span>
                    <Copyable value={data.remnawaveUserId} />
                  </div>
                )}
              </div>

              {/* Секция: оплата */}
              <div className="rounded-xl border p-4">
                <h3 className="font-semibold text-sm mb-2">{t("admin.orderDetail.paymentSection", { defaultValue: "支付信息" })}</h3>
                <Row label={t("admin.orderDetail.amount", { defaultValue: "实付金额" })}>
                  {fmtMoney(data.amount, data.currency)}
                </Row>
                {data.originalAmount != null && data.originalAmount !== data.amount && (
                  <Row label={t("admin.orderDetail.originalAmount", { defaultValue: "原价" })}>
                    <span className="text-muted-foreground line-through mr-2">{fmtMoney(data.originalAmount, data.currency)}</span>
                    {data.discount != null && data.discount > 0 && (
                      <span className="text-green-600 text-xs">
                        {t("admin.orderDetail.discount", { defaultValue: "优惠" })}: −{fmtMoney(data.discount, data.currency)}
                      </span>
                    )}
                  </Row>
                )}
                <Row label={t("admin.orderDetail.provider", { defaultValue: "付款方式" })}>
                  {data.provider ?? "—"}
                </Row>
                <Row label={t("admin.orderDetail.status", { defaultValue: "状态" })}>
                  <StatusBadge status={data.status} />
                </Row>
                <Row label={t("admin.orderDetail.createdAt", { defaultValue: "创建时间" })}>
                  {fmtDate(data.createdAt)}
                </Row>
                <Row label={t("admin.orderDetail.paidAt", { defaultValue: "支付时间" })}>
                  {fmtDate(data.paidAt)}
                </Row>
                {data.referralDistributedAt && (
                  <Row label={t("admin.orderDetail.referralDistributedAt", { defaultValue: "佣金派发时间" })}>
                    {fmtDate(data.referralDistributedAt)}
                  </Row>
                )}
                {data.promoCode && (
                  <Row label={t("admin.orderDetail.promoCode", { defaultValue: "优惠券" })}>
                    <span className="inline-flex items-center rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-400 px-2 py-0.5 text-xs font-semibold">
                      {data.promoCode}
                    </span>
                  </Row>
                )}
              </div>

              {/* Секция: продукт */}
              <div className="rounded-xl border p-4">
                <h3 className="font-semibold text-sm mb-2">{t("admin.orderDetail.productSection", { defaultValue: "产品信息" })}</h3>
                {data.product ? (
                  <>
                    <Row label={t("admin.orderDetail.productKind", { defaultValue: "类型" })}>
                      {data.product.kind.toUpperCase()}
                    </Row>
                    <Row label={t("admin.orderDetail.productName", { defaultValue: "名称" })}>
                      {data.product.name}
                    </Row>
                    <Row label={t("admin.orderDetail.productDuration", { defaultValue: "时长" })}>
                      {data.product.durationDays} {t("admin.orderDetail.days", { defaultValue: "天" })}
                    </Row>
                    <Row label={t("admin.orderDetail.productPrice", { defaultValue: "定价" })}>
                      {fmtMoney(data.product.price, data.product.currency)}
                    </Row>
                    {data.product.kind === "proxy" && (
                      <Row label={t("admin.orderDetail.proxyCount", { defaultValue: "代理数量" })}>
                        {data.product.proxyCount}
                      </Row>
                    )}
                    {data.product.kind === "singbox" && (
                      <Row label={t("admin.orderDetail.slotCount", { defaultValue: "节点数量" })}>
                        {data.product.slotCount}
                      </Row>
                    )}
                  </>
                ) : data.type === "topup" ? (
                  <p className="text-sm text-muted-foreground">{t("admin.orderDetail.topupNote", { defaultValue: "余额充值订单" })}</p>
                ) : data.type === "extra" ? (
                  <p className="text-sm text-muted-foreground">{t("admin.orderDetail.extraNote", { defaultValue: "额外服务（流量/设备扩容等）" })}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
                {data.type === "extra" && data.extraOption != null && (
                  <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted/40 p-2 text-xs">
                    {JSON.stringify(data.extraOption, null, 2)}
                  </pre>
                )}
              </div>

              {/* Секция: клиент */}
              <div className="rounded-xl border p-4">
                <h3 className="font-semibold text-sm mb-2">{t("admin.orderDetail.clientSection", { defaultValue: "用户" })}</h3>
                {data.client ? (
                  <>
                    <Row label="ID">
                      <Link
                        to={`/admin/clients/${data.client.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <span className="font-mono text-xs">{data.client.id}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Row>
                    <Row label="Email">{data.client.email ?? "—"}</Row>
                    <Row label="Telegram">
                      {data.client.telegramUsername ? `@${data.client.telegramUsername}` : ""}
                      {data.client.telegramUsername && data.client.telegramId ? " " : ""}
                      {data.client.telegramId ? `(${data.client.telegramId})` : !data.client.telegramUsername ? "—" : ""}
                    </Row>
                    <Row label={t("admin.orderDetail.clientBalance", { defaultValue: "当前余额" })}>
                      {fmtMoney(data.client.balance)}
                    </Row>
                    <Row label={t("admin.orderDetail.clientStatus", { defaultValue: "状态" })}>
                      {data.client.isBlocked ? (
                        <span className="text-destructive">{t("admin.orderDetail.blocked", { defaultValue: "已禁用" })}</span>
                      ) : (
                        <span className="text-green-600">{t("admin.orderDetail.active", { defaultValue: "活跃" })}</span>
                      )}
                    </Row>
                  </>
                ) : (
                  <p className="text-sm text-destructive">{t("admin.orderDetail.clientDeleted", { defaultValue: "用户已被删除" })}</p>
                )}
              </div>

              {/* Секция: реферальные начисления по этому платежу */}
              {data.referralCredits.length > 0 && (
                <div className="rounded-xl border p-4">
                  <h3 className="font-semibold text-sm mb-2">{t("admin.orderDetail.referralSection", { defaultValue: "佣金派发" })}</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="py-1 text-left">L</th>
                        <th className="py-1 text-left">{t("admin.orderDetail.referrer", { defaultValue: "推荐人" })}</th>
                        <th className="py-1 text-right">{t("admin.orderDetail.amount", { defaultValue: "金额" })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.referralCredits.map((rc) => (
                        <tr key={rc.id} className="border-b border-border/40 last:border-b-0">
                          <td className="py-1.5">L{rc.level}</td>
                          <td className="py-1.5">
                            {rc.referrer ? (
                              <Link to={`/admin/clients/${rc.referrer.id}`} className="text-primary hover:underline">
                                {rc.referrer.email ?? (rc.referrer.telegramUsername ? `@${rc.referrer.telegramUsername}` : rc.referrer.telegramId ?? rc.referrer.id)}
                              </Link>
                            ) : "—"}
                          </td>
                          <td className="py-1.5 text-right font-medium">{fmtMoney(rc.amount, data.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Секция: raw metadata */}
              {data.metadataRaw && (
                <details className="rounded-xl border p-4">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    {t("admin.orderDetail.rawMetadata", { defaultValue: "原始元数据 (JSON)" })}
                  </summary>
                  <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted/40 p-2 text-xs">{data.metadataRaw}</pre>
                </details>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
