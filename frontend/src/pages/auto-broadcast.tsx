import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth";
import {
  api,
  type AutoBroadcastRule,
  type AutoBroadcastRulePayload,
  type AutoBroadcastTriggerType,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarClock, Plus, Play, Trash2, Pencil, Loader2, Clock } from "lucide-react";

export function AutoBroadcastPage() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const token = state.accessToken ?? "";

  const TRIGGER_LABELS: Record<AutoBroadcastTriggerType, string> = {
    after_registration: t("admin.autoBroadcast.triggerAfterReg"),
    inactivity: t("admin.autoBroadcast.triggerInactivity"),
    no_payment: t("admin.autoBroadcast.triggerNoPayment"),
    trial_not_connected: t("admin.autoBroadcast.triggerTrialNotConn"),
    trial_used_never_paid: t("admin.autoBroadcast.triggerTrialNeverPaid"),
    no_traffic: t("admin.autoBroadcast.triggerNoTraffic"),
    subscription_expired: t("admin.autoBroadcast.triggerExpired"),
    subscription_ending_soon: t("admin.autoBroadcast.triggerEndingSoon"),
  };

  const CHANNEL_LABELS: Record<string, string> = {
    telegram: "Telegram",
    email: "Email",
    both: t("admin.autoBroadcast.channelBoth"),
  };
  const [rules, setRules] = useState<AutoBroadcastRule[]>([]);
  const [eligibleCounts, setEligibleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [runAllLoading, setRunAllLoading] = useState(false);
  const [runningRuleId, setRunningRuleId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AutoBroadcastRulePayload>({
    name: "",
    triggerType: "after_registration",
    delayDays: 1,
    channel: "telegram",
    subject: "",
    message: "",
    enabled: true,
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [scheduleCron, setScheduleCron] = useState("");
  const [scheduleSaving, setScheduleSaving] = useState(false);

  function loadRules() {
    if (!token) return;
    setLoading(true);
    api
      .getAutoBroadcastRules(token)
      .then((list) => {
        setRules(list);
        return list;
      })
      .then((list) => {
        const counts: Record<string, number> = {};
        Promise.all(
          list.map((r) =>
            api.getAutoBroadcastEligibleCount(token, r.id).then(({ count }) => {
              counts[r.id] = count;
            })
          )
        ).then(() => setEligibleCounts(counts));
      })
      .catch(() => setRules([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRules();
  }, [token]);

  useEffect(() => {
    if (token) {
      api.getSettings(token).then((s) => setScheduleCron(s.autoBroadcastCron ?? "")).catch(() => {});
    }
  }, [token]);

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    setScheduleSaving(true);
    try {
      await api.updateSettings(token, { autoBroadcastCron: scheduleCron.trim() || null });
    } catch {
      // ignore
    } finally {
      setScheduleSaving(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      name: "",
      triggerType: "after_registration",
      delayDays: 1,
      channel: "telegram",
      subject: "",
      message: "",
      enabled: true,
    });
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(rule: AutoBroadcastRule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      triggerType: rule.triggerType,
      delayDays: rule.delayDays,
      channel: rule.channel,
      subject: rule.subject ?? "",
      message: rule.message,
      enabled: rule.enabled,
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const payload: AutoBroadcastRulePayload = {
      ...form,
      subject: form.subject?.trim() || null,
    };
    if (!payload.name.trim()) {
      setFormError(t("admin.autoBroadcast.errorName"));
      return;
    }
    if (!payload.message.trim()) {
      setFormError(t("admin.autoBroadcast.errorMessage"));
      return;
    }
    setFormSaving(true);
    try {
      if (editingId) {
        await api.updateAutoBroadcastRule(token, editingId, payload);
      } else {
        await api.createAutoBroadcastRule(token, payload);
      }
      closeForm();
      loadRules();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("admin.autoBroadcast.errorSave"));
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(ruleId: string) {
    if (!confirm(t("admin.autoBroadcast.deleteConfirm"))) return;
    try {
      await api.deleteAutoBroadcastRule(token, ruleId);
      loadRules();
    } catch {
      // ignore
    }
  }

  async function handleRunAll() {
    setRunAllLoading(true);
    try {
      const { results } = await api.runAutoBroadcastAll(token);
      const ok = results.every((r) => r.errors.length === 0);
      if (ok) loadRules();
      else alert(results.map((r) => `Rule ${r.ruleId}: ${r.errors.join("; ")}`).join("\n"));
    } catch (err) {
      alert(err instanceof Error ? err.message : t("admin.autoBroadcast.errorRun"));
    } finally {
      setRunAllLoading(false);
    }
  }

  async function handleRunOne(ruleId: string) {
    setRunningRuleId(ruleId);
    try {
      const result = await api.runAutoBroadcastRule(token, ruleId);
      if (result.errors.length > 0) alert(result.errors.join("; "));
      else loadRules();
    } catch (err) {
      alert(err instanceof Error ? err.message : t("admin.autoBroadcast.errorRun"));
    } finally {
      setRunningRuleId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("admin.autoBroadcast.title")}</h1>
          <p className="text-muted-foreground">
            {t("admin.autoBroadcast.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRunAll} disabled={runAllLoading || rules.length === 0}>
            {runAllLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {t("admin.autoBroadcast.runAll")}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("admin.autoBroadcast.addRule")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("admin.autoBroadcast.scheduleTitle")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("admin.autoBroadcast.scheduleDesc")} <code className="rounded bg-muted px-1">0 9 * * *</code> — {t("admin.autoBroadcast.scheduleDescExample")}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSchedule} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label htmlFor="schedule-cron">{t("admin.autoBroadcast.scheduleLabel")}</Label>
              <Input
                id="schedule-cron"
                value={scheduleCron}
                onChange={(e) => setScheduleCron(e.target.value)}
                placeholder="0 9 * * *"
                className="font-mono"
              />
            </div>
            <Button type="submit" disabled={scheduleSaving}>
              {scheduleSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("admin.autoBroadcast.scheduleSave")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            {t("admin.autoBroadcast.rulesTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("admin.autoBroadcast.loading")}
            </div>
          ) : rules.length === 0 ? (
            <p className="text-muted-foreground py-6">{t("admin.autoBroadcast.empty")}</p>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{rule.name}</span>
                      {!rule.enabled && (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs">{t("admin.autoBroadcast.disabled")}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {TRIGGER_LABELS[rule.triggerType]}
                      {rule.triggerType === "subscription_ending_soon"
                        ? ` · ${t("admin.autoBroadcast.daysBefore", { n: rule.delayDays })}`
                        : ` · ${t("admin.autoBroadcast.daysAfter", { n: rule.delayDays })}`}{" "}
                      · {CHANNEL_LABELS[rule.channel]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("admin.autoBroadcast.sentCount")}: {rule.sentCount ?? 0} · {t("admin.autoBroadcast.eligibleNow")}: {eligibleCounts[rule.id] ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunOne(rule.id)}
                      disabled={runningRuleId !== null}
                    >
                      {runningRuleId === rule.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {t("admin.autoBroadcast.run")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.autoBroadcast.formTitleEdit") : t("admin.autoBroadcast.formTitleNew")}</DialogTitle>
            <DialogDescription className="sr-only">{t("admin.autoBroadcast.formDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
              {formError && (
                <p className="text-sm text-destructive rounded bg-destructive/10 px-3 py-2">{formError}</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("admin.autoBroadcast.formNameLabel")}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={t("admin.autoBroadcast.formNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.autoBroadcast.formTriggerLabel")}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.triggerType}
                    onChange={(e) => {
                    const triggerVal = e.target.value as AutoBroadcastTriggerType;
                    setForm((f) => ({
                      ...f,
                      triggerType: triggerVal,
                      delayDays:
                        triggerVal === "subscription_ending_soon"
                          ? Math.max(1, Math.min(3, f.delayDays))
                          : f.delayDays,
                    }));
                  }}
                  >
                    {(Object.keys(TRIGGER_LABELS) as AutoBroadcastTriggerType[]).map((triggerKey) => (
                      <option key={triggerKey} value={triggerKey}>
                        {TRIGGER_LABELS[triggerKey]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    {form.triggerType === "subscription_ending_soon"
                      ? t("admin.autoBroadcast.formDaysLabelBefore")
                      : t("admin.autoBroadcast.formDaysLabelAfter")}
                  </Label>
                  <Input
                    type="number"
                    min={form.triggerType === "subscription_ending_soon" ? 1 : 0}
                    max={form.triggerType === "subscription_ending_soon" ? 3 : 365}
                    value={form.delayDays}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      const min = form.triggerType === "subscription_ending_soon" ? 1 : 0;
                      const max = form.triggerType === "subscription_ending_soon" ? 3 : 365;
                      setForm((f) => ({ ...f, delayDays: Math.max(min, Math.min(max, v)) }));
                    }}
                  />
                  {form.triggerType === "subscription_ending_soon" && (
                    <p className="text-xs text-muted-foreground">
                      {t("admin.autoBroadcast.formEndingSoonHint")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.autoBroadcast.formChannelLabel")}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.channel}
                    onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as "telegram" | "email" | "both" }))}
                  >
                    <option value="telegram">Telegram</option>
                    <option value="email">Email</option>
                    <option value="both">{t("admin.autoBroadcast.channelBoth")}</option>
                  </select>
                </div>
              </div>
              {(form.channel === "email" || form.channel === "both") && (
                <div className="space-y-2">
                  <Label>{t("admin.autoBroadcast.formSubjectLabel")}</Label>
                  <Input
                    value={form.subject ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder={t("admin.autoBroadcast.formSubjectPlaceholder")}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("admin.autoBroadcast.formMessageLabel")}</Label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder={t("admin.autoBroadcast.formMessagePlaceholder")}
                  maxLength={4096}
                />
                <p className="text-xs text-muted-foreground">{form.message.length} / 4096</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="form-enabled"
                  checked={form.enabled}
                  onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                  className="rounded border-input"
                />
                <Label htmlFor="form-enabled">{t("admin.autoBroadcast.formEnabledLabel")}</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeForm}>
                  {t("admin.common.cancel")}
                </Button>
                <Button type="submit" disabled={formSaving}>
                  {formSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingId ? t("admin.common.save") : t("admin.common.create")}
                </Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
