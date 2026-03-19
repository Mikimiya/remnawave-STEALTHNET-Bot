import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth";
import {
  api,
  type ClientRecord,
  type UpdateClientPayload,
  type UpdateClientRemnaPayload,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Ban, ShieldCheck, Wifi, Ticket, KeyRound, Search, Filter } from "lucide-react";

export function ClientsPage() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const [data, setData] = useState<{ items: ClientRecord[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [editForm, setEditForm] = useState<UpdateClientPayload & Partial<UpdateClientRemnaPayload>>({});
  const [remnaData, setRemnaData] = useState<{ squads: { uuid: string; name?: string }[] }>({ squads: [] });
  const [clientRemnaSquads, setClientRemnaSquads] = useState<string[]>([]);
  const [settings, setSettings] = useState<{ activeLanguages: string[]; activeCurrencies: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState<{ newPassword: string; confirm: string }>({ newPassword: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [filterBlocked, setFilterBlocked] = useState<"all" | "blocked" | "active">("all");
  const token = state.accessToken!;

  useEffect(() => {
    api.getSettings(token).then((s) => setSettings({ activeLanguages: s.activeLanguages, activeCurrencies: s.activeCurrencies })).catch(() => {});
  }, [token]);

  const loadClients = () => {
    setLoading(true);
    const isBlocked =
      filterBlocked === "blocked" ? true : filterBlocked === "active" ? false : undefined;
    api.getClients(token, page, 20, { search: searchApplied || undefined, isBlocked }).then((r) => {
      setData({ items: r.items, total: r.total });
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadClients();
  }, [token, page, searchApplied, filterBlocked]);

  const applySearch = () => {
    setSearchApplied(search);
    setPage(1);
  };

  useEffect(() => {
    if (editing?.remnawaveUuid) {
      api.getRemnaSquadsInternal(token).then((raw: unknown) => {
        const res = raw as { response?: { internalSquads?: { uuid: string; name?: string }[] } };
        const items = res?.response?.internalSquads ?? (Array.isArray(res) ? res : []);
        setRemnaData({ squads: Array.isArray(items) ? items : [] });
      }).catch(() => setRemnaData({ squads: [] }));
      api.getClientRemna(token, editing.id).then((raw: unknown) => {
        const res = raw as { response?: { activeInternalSquads?: Array<{ uuid?: string } | string> } };
        const arr = res?.response?.activeInternalSquads ?? [];
        const uuids = Array.isArray(arr) ? arr.map((s) => (typeof s === "string" ? s : s?.uuid)).filter((u): u is string => Boolean(u)) : [];
        setClientRemnaSquads(uuids);
      }).catch(() => setClientRemnaSquads([]));
    } else {
      setRemnaData({ squads: [] });
      setClientRemnaSquads([]);
    }
  }, [token, editing?.id, editing?.remnawaveUuid]);

  function openEdit(c: ClientRecord) {
    setEditing(c);
    setEditForm({
      email: c.email ?? undefined,
      preferredLang: c.preferredLang,
      preferredCurrency: c.preferredCurrency,
      balance: c.balance,
      isBlocked: c.isBlocked,
      blockReason: c.blockReason ?? undefined,
      referralPercent: c.referralPercent ?? undefined,
    });
    setActionMessage(null);
  }

  async function saveClient() {
    if (!editing) return;
    setSaving(true);
    setActionMessage(null);
    try {
      const updated = await api.updateClient(token, editing.id, {
        email: editForm.email ?? null,
        preferredLang: editForm.preferredLang,
        preferredCurrency: editForm.preferredCurrency,
        balance: editForm.balance,
        isBlocked: editForm.isBlocked,
        blockReason: editForm.blockReason ?? null,
        referralPercent: editForm.referralPercent ?? null,
      });
      setEditing(updated);
      setEditForm({});
      setActionMessage(t("admin.clients.saved"));
      loadClients();
    } catch (e) {
      setActionMessage(e instanceof Error ? e.message : t("admin.clients.errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  async function saveRemnaLimits() {
    if (!editing?.remnawaveUuid) return;
    setSaving(true);
    setActionMessage(null);
    try {
      const payload: UpdateClientRemnaPayload = {};
      if (editForm.trafficLimitBytes !== undefined) payload.trafficLimitBytes = editForm.trafficLimitBytes;
      if (editForm.trafficLimitStrategy) payload.trafficLimitStrategy = editForm.trafficLimitStrategy;
      if (editForm.hwidDeviceLimit !== undefined) payload.hwidDeviceLimit = editForm.hwidDeviceLimit;
      if (editForm.expireAt) payload.expireAt = editForm.expireAt;
      await api.updateClientRemna(token, editing.id, payload);
      setActionMessage(t("admin.clients.remnaUpdated"));
    } catch (e) {
      setActionMessage(e instanceof Error ? e.message : t("admin.clients.remnaError"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteClient(c: ClientRecord) {
    if (!confirm(`${t("admin.clients.deleteConfirm")} ${c.email || c.telegramId || c.id}?`)) return;
    try {
      await api.deleteClient(token, c.id);
      if (editing?.id === c.id) setEditing(null);
      loadClients();
    } catch (e) {
      alert(e instanceof Error ? e.message : t("admin.clients.deleteError"));
    }
  }

  async function remnaAction(
    name: string,
    fn: () => Promise<unknown>
  ) {
    setActionMessage(null);
    try {
      await fn();
      setActionMessage(name);
      loadClients();
    } catch (e) {
      setActionMessage(`${name}: ${e instanceof Error ? e.message : t("admin.clients.errorGeneric")}`);
    }
  }

  async function saveClientPassword() {
    if (!editing) return;
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage(t("admin.clients.passwordTooShort"));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPasswordMessage(t("admin.clients.passwordMismatch"));
      return;
    }
    setPasswordMessage(null);
    setSavingPassword(true);
    try {
      await api.setClientPassword(token, editing.id, passwordForm.newPassword);
      setPasswordMessage(t("admin.clients.passwordSet"));
      setPasswordForm({ newPassword: "", confirm: "" });
    } catch (e) {
      setPasswordMessage(e instanceof Error ? e.message : t("admin.clients.errorGeneric"));
    } finally {
      setSavingPassword(false);
    }
  }

  async function squadAdd(squadUuid: string) {
    if (!editing) return;
    await remnaAction(t("admin.clients.squadAdded"), () => api.clientRemnaSquadAdd(token, editing.id, squadUuid));
    setClientRemnaSquads((prev) => (prev.includes(squadUuid) ? prev : [...prev, squadUuid]));
  }

  async function squadRemove(squadUuid: string) {
    if (!editing) return;
    await remnaAction(t("admin.clients.squadRemoved"), () => api.clientRemnaSquadRemove(token, editing.id, squadUuid));
    setClientRemnaSquads((prev) => prev.filter((u) => u !== squadUuid));
  }

  if (loading && !data) return <div className="text-muted-foreground">{t("admin.clients.loading")}</div>;
  if (!data) return <div className="text-destructive">{t("admin.clients.loadError")}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.clients.title")}</h1>
        <p className="text-muted-foreground">{t("admin.clients.subtitle")}</p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t("admin.clients.total")}: {data.total}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t("admin.clients.prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 20 >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("admin.clients.next")}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                  placeholder={t("admin.clients.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                  className="max-w-xs"
                />
                <Button variant="secondary" size="sm" onClick={applySearch}>
                  {t("admin.clients.searchBtn")}
                </Button>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={filterBlocked}
                onChange={(e) => {
                  setFilterBlocked(e.target.value as "all" | "blocked" | "active");
                  setPage(1);
                }}
              >
                <option value="all">{t("admin.clients.filterAll")}</option>
                <option value="active">{t("admin.clients.filterActive")}</option>
                <option value="blocked">{t("admin.clients.filterBlocked")}</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">{t("admin.clients.colEmail")}</th>
                  <th className="text-left py-2 px-2">{t("admin.clients.colTelegram")}</th>
                  <th className="text-left py-2 px-2">{t("admin.clients.colNode")}</th>
                  <th className="text-left py-2 px-2">{t("admin.clients.colLang")}</th>
                  <th className="text-left py-2 px-2">{t("admin.clients.colCurrency")}</th>
                  <th className="text-left py-2 px-2">{t("admin.clients.colBalance")}</th>
                  <th className="text-left py-2 px-2">{t("admin.clients.colRefPercent")}</th>
                  <th className="text-left py-2 px-2">{t("admin.clients.colBlocked")}</th>
                  <th className="text-left py-2 px-2">{t("admin.clients.colDate")}</th>
                  <th className="text-left py-2 px-2">{t("admin.clients.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="py-2 px-2">{c.email ?? "—"}</td>
                    <td className="py-2 px-2">
                      {c.telegramId != null || c.telegramUsername ? (
                        <span title={c.telegramId ?? undefined}>
                          {c.telegramUsername ? `@${c.telegramUsername}` : ""}
                          {c.telegramUsername && c.telegramId ? " " : ""}
                          {c.telegramId != null ? `(ID: ${c.telegramId})` : ""}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 px-2">
                      {c.activeNode ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-xs font-medium">
                          {c.activeNode}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2">{c.preferredLang}</td>
                    <td className="py-2 px-2">{c.preferredCurrency}</td>
                    <td className="py-2 px-2">{c.balance}</td>
                    <td className="py-2 px-2">{c.referralPercent != null ? c.referralPercent + "%" : "—"}</td>
                    <td className="py-2 px-2">{c.isBlocked ? <span className="text-destructive">{t("admin.clients.blockedYes")}</span> : "—"}</td>
                    <td className="py-2 px-2 text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-2 flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)} title={t("admin.clients.editTitle")}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteClient(c)} title={t("admin.clients.deleteTitle")} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <ClientEditModal
          client={editing}
          editForm={editForm}
          setEditForm={setEditForm}
          saving={saving}
          actionMessage={actionMessage}
          remnaData={remnaData}
          clientRemnaSquads={clientRemnaSquads}
          activeLanguages={settings?.activeLanguages ?? []}
          activeCurrencies={settings?.activeCurrencies ?? []}
          onClose={() => {
            setEditing(null);
            setPasswordForm({ newPassword: "", confirm: "" });
            setPasswordMessage(null);
          }}
          onSave={saveClient}
          onSaveRemnaLimits={saveRemnaLimits}
          onRemnaAction={remnaAction}
          onSquadAdd={squadAdd}
          onSquadRemove={squadRemove}
          onSetPassword={saveClientPassword}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          passwordMessage={passwordMessage}
          savingPassword={savingPassword}
          token={token}
        />
      )}
    </div>
  );
}

function ClientEditModal({
  client: editing,
  editForm,
  setEditForm,
  saving,
  actionMessage,
  remnaData,
  onClose,
  onSave,
  onSaveRemnaLimits,
  onRemnaAction,
  onSquadAdd,
  onSquadRemove,
  onSetPassword,
  passwordForm,
  setPasswordForm,
  passwordMessage,
  savingPassword,
  token,
  activeLanguages,
  activeCurrencies,
  clientRemnaSquads,
}: {
  client: ClientRecord;
  editForm: UpdateClientPayload & Partial<UpdateClientRemnaPayload>;
  setEditForm: React.Dispatch<React.SetStateAction<UpdateClientPayload & Partial<UpdateClientRemnaPayload>>>;
  saving: boolean;
  actionMessage: string | null;
  remnaData: { squads: { uuid: string; name?: string }[] };
  clientRemnaSquads: string[];
  activeLanguages: string[];
  activeCurrencies: string[];
  onClose: () => void;
  onSave: () => Promise<void>;
  onSaveRemnaLimits: () => Promise<void>;
  onRemnaAction: (name: string, fn: () => Promise<unknown>) => Promise<void>;
  onSquadAdd: (squadUuid: string) => Promise<void>;
  onSquadRemove: (squadUuid: string) => Promise<void>;
  onSetPassword: () => Promise<void>;
  passwordForm: { newPassword: string; confirm: string };
  setPasswordForm: React.Dispatch<React.SetStateAction<{ newPassword: string; confirm: string }>>;
  passwordMessage: string | null;
  savingPassword: boolean;
  token: string;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0 text-left">
          <DialogTitle>{t("admin.clients.editModalTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("admin.clients.editModalDesc")}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4">
          <div className="mb-4 rounded-xl bg-muted/50 p-3 text-sm">
            <div className="font-medium mb-1">{t("admin.clients.clientInfoLabel")}</div>
            <div className="space-y-0.5 text-muted-foreground">
              {editing.email && <div>{t("admin.clients.fieldEmail")}: {editing.email}</div>}
              <div>
                {t("admin.clients.fieldTelegramUsername")}: {editing.telegramUsername ? `@${editing.telegramUsername}` : "—"}
              </div>
              <div>
                {t("admin.clients.fieldTelegramId")}: {editing.telegramId != null ? editing.telegramId : "—"}
              </div>
              <div>{t("admin.clients.fieldPanelId")}: {editing.id}</div>
              <div>
                {t("admin.clients.fieldRefCode")}: {editing.referralCode ? (
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{editing.referralCode}</code>
                ) : "—"}
              </div>
              <div>
                {t("admin.clients.fieldReferrals")}: {editing._count?.referrals ?? 0}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("admin.clients.fieldEmail")}</Label>
                <Input
                  value={editForm.email ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value || undefined }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.clients.fieldLang")}</Label>
                <Select
                  value={editForm.preferredLang ?? ""}
                  onChange={(v) => setEditForm((f) => ({ ...f, preferredLang: v }))}
                  options={(() => {
                    const langs = activeLanguages.length ? activeLanguages.map((l) => l.trim()) : ["ru", "en"];
                    const current = (editForm.preferredLang ?? editing.preferredLang ?? "").trim();
                    const set = new Set(langs);
                    if (current && !set.has(current)) set.add(current);
                    return [...set].map((l) => ({ value: l, label: l }));
                  })()}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.clients.fieldCurrency")}</Label>
                <Select
                  value={editForm.preferredCurrency ?? ""}
                  onChange={(v) => setEditForm((f) => ({ ...f, preferredCurrency: v }))}
                  options={(() => {
                    const currs = activeCurrencies.length ? activeCurrencies.map((c) => c.trim()) : ["usd", "rub", "cny"];
                    const current = (editForm.preferredCurrency ?? editing.preferredCurrency ?? "").trim();
                    const set = new Set(currs);
                    if (current && !set.has(current)) set.add(current);
                    return [...set].map((c) => ({ value: c, label: c.toUpperCase() }));
                  })()}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.clients.fieldBalance")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.balance ?? 0}
                  onChange={(e) => setEditForm((f) => ({ ...f, balance: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.clients.fieldRefPercent")}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.referralPercent ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      referralPercent: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                  placeholder={t("admin.clients.fieldRefPercentPlaceholder")}
                />
              </div>
              <div className="space-y-2 flex items-end gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.isBlocked ?? false}
                    onChange={(e) => setEditForm((f) => ({ ...f, isBlocked: e.target.checked }))}
                  />
                  <span>{t("admin.clients.fieldBlocked")}</span>
                </label>
              </div>
              {(editForm.isBlocked ?? editing.isBlocked) && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("admin.clients.fieldBlockReason")}</Label>
                  <Input
                    value={editForm.blockReason ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, blockReason: e.target.value || undefined }))}
                    placeholder={t("admin.clients.fieldBlockReasonPlaceholder")}
                  />
                </div>
              )}
            </div>
            {actionMessage && <p className="text-sm text-muted-foreground">{actionMessage}</p>}
            <div className="flex gap-2">
              <Button onClick={onSave} disabled={saving}>{saving ? t("admin.clients.savingBtn") : t("admin.clients.saveBtn")}</Button>
            </div>

            <hr />
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                {t("admin.clients.passwordSectionTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t("admin.clients.passwordSectionDesc")}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("admin.clients.fieldNewPassword")}</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.clients.fieldConfirmPassword")}</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {passwordMessage && (
                <p className={`text-sm mt-2 ${passwordMessage === t("admin.clients.passwordSet") ? "text-green-600" : "text-destructive"}`}>
                  {passwordMessage}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onSetPassword}
                disabled={savingPassword || !passwordForm.newPassword || passwordForm.newPassword.length < 8}
              >
                {savingPassword ? t("admin.clients.savingBtn") : t("admin.clients.setPasswordBtn")}
              </Button>
            </div>

            {editing.remnawaveUuid && (
              <>
                <hr />
                <div>
                  <h3 className="font-semibold mb-2">{t("admin.clients.remnaSection")}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 text-sm">
                    <div className="space-y-2">
                      <Label>{t("admin.clients.remnaTrafficLabel")}</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={
                          editForm.trafficLimitBytes !== undefined && editForm.trafficLimitBytes > 0
                            ? (editForm.trafficLimitBytes / (1024 ** 3)).toFixed(2).replace(/\.?0+$/, "")
                            : editForm.trafficLimitBytes === 0
                              ? "0"
                              : ""
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditForm((f) => ({
                            ...f,
                            trafficLimitBytes:
                              v === ""
                                ? undefined
                                : (() => {
                                    const gb = parseFloat(v);
                                    return Number.isNaN(gb) ? undefined : Math.round(gb * 1024 ** 3);
                                  })(),
                          }));
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.clients.remnaHwidLabel")}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={editForm.hwidDeviceLimit ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            hwidDeviceLimit: e.target.value === "" ? undefined : Number(e.target.value),
                          }))
                        }
                        placeholder="—"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.clients.remnaResetLabel")}</Label>
                      <Select
                        value={editForm.trafficLimitStrategy ?? ""}
                        onChange={(v) => setEditForm((f) => ({ ...f, trafficLimitStrategy: v as UpdateClientRemnaPayload["trafficLimitStrategy"] }))}
                        options={[
                          { value: "", label: t("admin.clients.remnaStrategyNone") },
                          { value: "NO_RESET", label: t("admin.clients.remnaStrategyNoReset") },
                          { value: "DAY", label: t("admin.clients.remnaStrategyDay") },
                          { value: "WEEK", label: t("admin.clients.remnaStrategyWeek") },
                          { value: "MONTH", label: t("admin.clients.remnaStrategyMonth") },
                        ]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.clients.remnaExpireLabel")}</Label>
                      <Input
                        type="datetime-local"
                        value={editForm.expireAt ? editForm.expireAt.slice(0, 16) : ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            expireAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" onClick={onSaveRemnaLimits} disabled={saving}>
                    {t("admin.clients.remnaApplyBtn")}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemnaAction(t("admin.clients.remnaRevoked"), () => api.clientRemnaRevokeSubscription(token, editing.id))}
                  >
                    <Ticket className="h-4 w-4 mr-1" /> {t("admin.clients.remnaRevokeBtn")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemnaAction(t("admin.clients.remnaDisabled"), () => api.clientRemnaDisable(token, editing.id))}
                  >
                    <Ban className="h-4 w-4 mr-1" /> {t("admin.clients.remnaDisableBtn")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemnaAction(t("admin.clients.remnaEnabled"), () => api.clientRemnaEnable(token, editing.id))}
                  >
                    <ShieldCheck className="h-4 w-4 mr-1" /> {t("admin.clients.remnaEnableBtn")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemnaAction(t("admin.clients.remnaTrafficReset"), () => api.clientRemnaResetTraffic(token, editing.id))}
                  >
                    <Wifi className="h-4 w-4 mr-1" /> {t("admin.clients.remnaResetTrafficBtn")}
                  </Button>
                </div>

                {remnaData.squads.length > 0 && (
                  <div className="mt-4">
                    <Label>{t("admin.clients.squadsLabel")}</Label>
                    <p className="text-xs text-muted-foreground mb-2">{t("admin.clients.squadsDesc")}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {remnaData.squads.map((s) => {
                        const inSquad = clientRemnaSquads.includes(s.uuid);
                        return (
                          <span
                            key={s.uuid}
                            className={`inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs border ${
                              inSquad ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-transparent text-muted-foreground"
                            }`}
                          >
                            <span className="font-medium">{s.name || s.uuid}</span>
                            <span className="text-[10px]">{inSquad ? t("admin.clients.inSquad") : t("admin.clients.notInSquad")}</span>
                            {inSquad ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1 text-destructive"
                                onClick={() => onSquadRemove(s.uuid)}
                                title={t("admin.clients.squadRemoveBtn")}
                              >
                                {t("admin.clients.squadRemoveBtn")}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1"
                                onClick={() => onSquadAdd(s.uuid)}
                                title={t("admin.clients.squadAddBtn")}
                              >
                                {t("admin.clients.squadAddBtn")}
                              </Button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
