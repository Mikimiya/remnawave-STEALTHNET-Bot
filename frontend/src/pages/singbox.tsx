import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth";
import {
  api,
  type SingboxNodeListItem,
  type CreateSingboxNodeResponse,
  type SingboxNodeDetail,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Server, Plus, Copy, Check, Loader2, Pencil, Trash2, FileJson, Layers, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SingboxCategoryItem, SingboxTariffListItem } from "@/lib/api";

function formatBytes(s: string): string {
  const n = Number(s);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusBadge(status: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    ONLINE: "bg-green-500/15 text-green-700 dark:text-green-400",
    OFFLINE: "bg-muted text-muted-foreground",
    DISABLED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  };
  const label = status === "ONLINE"
    ? t("admin.singbox.statusOnline")
    : status === "DISABLED"
      ? t("admin.singbox.statusDisabled")
      : t("admin.singbox.statusOffline");
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted"}`}>
      {label}
    </span>
  );
}

const PROTOCOLS = ["VLESS", "SHADOWSOCKS", "TROJAN", "HYSTERIA2"] as const;

export function SingboxPage() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const [nodes, setNodes] = useState<SingboxNodeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeProtocol, setNewNodeProtocol] = useState<string>("VLESS");
  const [newNodePort, setNewNodePort] = useState("443");
  const [creating, setCreating] = useState(false);
  const [addResult, setAddResult] = useState<CreateSingboxNodeResponse | null>(null);
  const [copied, setCopied] = useState<"compose" | null>(null);
  const [detailNode, setDetailNode] = useState<SingboxNodeDetail | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [configJson, setConfigJson] = useState("");
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<SingboxNodeListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPort, setEditPort] = useState("443");
  const [editProtocol, setEditProtocol] = useState("VLESS");
  const [saving, setSaving] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<SingboxNodeListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("nodes");
  const [categories, setCategories] = useState<SingboxCategoryItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryModal, setCategoryModal] = useState<"add" | { edit: SingboxCategoryItem } | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", sortOrder: "0" });
  const [tariffModal, setTariffModal] = useState<{ kind: "add"; categoryId: string } | { kind: "edit"; tariff: SingboxTariffListItem } | null>(null);
  const [tariffForm, setTariffForm] = useState({
    name: "", categoryId: "", slotCount: "1", durationDays: "30", trafficLimitBytes: "", price: "", currency: "rub", sortOrder: "0", enabled: true,
  });
  const [savingCat, setSavingCat] = useState(false);
  const [savingTariff, setSavingTariff] = useState(false);

  const token = state.accessToken;
  if (!token) return null;

  async function loadNodes() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getSingboxNodes(token);
      setNodes(res.items);
    } catch {
      setNodes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNodes();
  }, [token]);

  useEffect(() => {
    if (!token || !detailId) {
      setDetailNode(null);
      return;
    }
    setDetailLoading(true);
    api
      .getSingboxNode(token, detailId)
      .then(setDetailNode)
      .catch(() => setDetailNode(null))
      .finally(() => setDetailLoading(false));
  }, [token, detailId]);

  async function loadCategories() {
    if (!token) return;
    setCategoriesLoading(true);
    try {
      const res = await api.getSingboxCategories(token);
      setCategories(res.items);
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "categories" || activeTab === "tariffs") loadCategories();
  }, [activeTab, token]);

  async function handleSaveCategory() {
    if (!token) return;
    const name = categoryForm.name.trim();
    if (!name) return;
    setSavingCat(true);
    try {
      if (categoryModal === "add") {
        await api.createSingboxCategory(token, { name, sortOrder: parseInt(categoryForm.sortOrder, 10) || 0 });
      } else if (categoryModal && "edit" in categoryModal) {
        await api.updateSingboxCategory(token, categoryModal.edit.id, { name, sortOrder: parseInt(categoryForm.sortOrder, 10) || 0 });
      }
      await loadCategories();
      setCategoryModal(null);
      setCategoryForm({ name: "", sortOrder: "0" });
    } catch (e) {
      alert(e instanceof Error ? e.message : t("admin.singbox.errorGeneric"));
    } finally {
      setSavingCat(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!token || !confirm(t("admin.singbox.deleteCategoryConfirm"))) return;
    try {
      await api.deleteSingboxCategory(token, id);
      await loadCategories();
    } catch (e) {
      alert(e instanceof Error ? e.message : t("admin.singbox.errorDelete"));
    }
  }

  async function handleSaveTariff() {
    if (!token) return;
    const name = tariffForm.name.trim();
    if (!name) return;
    const price = parseFloat(tariffForm.price);
    if (!Number.isFinite(price) || price < 0) return;
    setSavingTariff(true);
    try {
      const trafficBytes = tariffForm.trafficLimitBytes.trim() === "" ? null : (parseInt(tariffForm.trafficLimitBytes, 10) || null);
      const payload = {
        name,
        categoryId: tariffForm.categoryId || (tariffModal && "categoryId" in tariffModal ? tariffModal.categoryId : ""),
        slotCount: parseInt(tariffForm.slotCount, 10) || 1,
        durationDays: parseInt(tariffForm.durationDays, 10) || 30,
        trafficLimitBytes: trafficBytes != null ? trafficBytes * 1024 * 1024 * 1024 : null,
        price,
        currency: tariffForm.currency.toUpperCase(),
        sortOrder: parseInt(tariffForm.sortOrder, 10) || 0,
        enabled: tariffForm.enabled,
      };
      if (tariffModal?.kind === "add") {
        if (!payload.categoryId) return;
        await api.createSingboxTariff(token, payload as Parameters<typeof api.createSingboxTariff>[1]);
      } else if (tariffModal?.kind === "edit") {
        await api.updateSingboxTariff(token, tariffModal.tariff.id, payload);
      }
      await loadCategories();
      setTariffModal(null);
      setTariffForm({ name: "", categoryId: "", slotCount: "1", durationDays: "30", trafficLimitBytes: "", price: "", currency: "rub", sortOrder: "0", enabled: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : t("admin.singbox.errorGeneric"));
    } finally {
      setSavingTariff(false);
    }
  }

  async function handleDeleteTariff(id: string) {
    if (!token || !confirm(t("admin.singbox.deleteTariffConfirm"))) return;
    try {
      await api.deleteSingboxTariff(token, id);
      await loadCategories();
      setTariffModal(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : t("admin.singbox.errorDelete"));
    }
  }

  async function handleAddNode() {
    if (!token) return;
    setCreating(true);
    setAddResult(null);
    try {
      const port = parseInt(newNodePort, 10) || 443;
      const res = await api.createSingboxNode(token, {
        name: newNodeName.trim() || "Sing-box node",
        protocol: newNodeProtocol,
        port,
        tlsEnabled: true,
      });
      setAddResult(res);
      await loadNodes();
    } catch (e) {
      alert(e instanceof Error ? e.message : t("admin.singbox.errorCreate"));
    } finally {
      setCreating(false);
    }
  }

  function copyCompose() {
    if (!addResult?.dockerCompose) return;
    navigator.clipboard.writeText(addResult.dockerCompose);
    setCopied("compose");
    setTimeout(() => setCopied(null), 2000);
  }

  function openEdit(node: SingboxNodeListItem) {
    setEditingNode(node);
    setEditName(node.name);
    setEditPort(String(node.port));
    setEditProtocol(node.protocol);
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!token || !editingNode) return;
    setSaving(true);
    try {
      const port = parseInt(editPort, 10) || 443;
      await api.updateSingboxNode(token, editingNode.id, {
        name: editName.trim(),
        port,
        protocol: editProtocol,
      });
      await loadNodes();
      setEditOpen(false);
      setEditingNode(null);
      if (detailNode?.id === editingNode.id) {
        const updated = await api.getSingboxNode(token, editingNode.id);
        setDetailNode(updated);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : t("admin.singbox.errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!token || !nodeToDelete) return;
    setDeleting(true);
    try {
      await api.deleteSingboxNode(token, nodeToDelete.id);
      await loadNodes();
      if (detailId === nodeToDelete.id) setDetailId(null);
      setNodeToDelete(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : t("admin.singbox.errorDelete"));
    } finally {
      setDeleting(false);
    }
  }

  function openConfigEditor() {
    if (!detailNode) return;
    const raw = detailNode.customConfigJson;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setConfigJson(JSON.stringify(parsed, null, 2));
      } catch {
        setConfigJson(raw);
      }
    } else {
      setConfigJson(`{
  "log": { "level": "info" },
  "inbounds": [
    {
      "type": "vless",
      "tag": "stealthnet-in",
      "listen": "::",
      "listen_port": ${detailNode.port},
      "users": []
    }
  ],
  "outbounds": [
    { "type": "direct", "tag": "direct" }
  ]
}`);
    }
    setConfigError(null);
    setConfigOpen(true);
  }

  async function saveConfig() {
    if (!token || !detailNode) return;
    setConfigError(null);
    const trimmed = configJson.trim();
    if (!trimmed) {
      setConfigError(t("admin.singbox.configEmpty"));
      return;
    }
    try {
      JSON.parse(trimmed);
    } catch (e) {
      setConfigError(`${t("admin.singbox.configInvalid")} ${e instanceof Error ? e.message : ""}`.trim());
      return;
    }
    setConfigSaving(true);
    try {
      await api.updateSingboxNode(token, detailNode.id, { customConfigJson: trimmed });
      setConfigOpen(false);
      const updated = await api.getSingboxNode(token, detailNode.id);
      setDetailNode(updated);
      await loadNodes();
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : t("admin.singbox.errorSave"));
    } finally {
      setConfigSaving(false);
    }
  }

  function formatPrice(amount: number, currency: string) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase() === "RUB" ? "RUB" : "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Server className="h-6 w-6" />
            {t("admin.singbox.pageTitle")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.singbox.pageSubtitle")}
          </p>
        </div>
        {activeTab === "nodes" && (
          <Button onClick={() => { setAddOpen(true); setAddResult(null); setNewNodeName(""); setNewNodeProtocol("VLESS"); setNewNodePort("443"); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t("admin.singbox.addNode")}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="nodes" className="flex items-center gap-1.5">
            <Server className="h-4 w-4" />
            {t("admin.singbox.tabNodes")}
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            {t("admin.singbox.tabCategories")}
          </TabsTrigger>
          <TabsTrigger value="tariffs" className="flex items-center gap-1.5">
            <Tag className="h-4 w-4" />
            {t("admin.singbox.tabTariffs")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="mt-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.singbox.nodesTitle")}</CardTitle>
              <CardDescription>{t("admin.singbox.nodesDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {nodes.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("admin.singbox.noNodes")}</p>
              ) : (
                <ul className="space-y-2">
                  {nodes.map((n) => (
                    <li
                      key={n.id}
                      className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                        detailId === n.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setDetailId(n.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium truncate">{n.name || n.id.slice(0, 8)}</span>
                        {statusBadge(n.status, t)}
                        <span className="text-xs text-muted-foreground">{n.protocol}</span>
                        {n.hasCustomConfig && (
                          <span title={t("admin.singbox.hasCustomConfig")}><FileJson className="h-3.5 w-3.5 text-muted-foreground" /></span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{n.slotsCount} {t("admin.singbox.slotsShort")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("admin.singbox.nodeDetailsTitle")}</CardTitle>
              <CardDescription>
                {detailId ? (detailLoading ? t("admin.singbox.nodeDetailsLoading") : t("admin.singbox.nodeDetailsHint")) : t("admin.singbox.nodeSelectPrompt")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!detailId ? (
                <p className="text-muted-foreground text-sm">{t("admin.singbox.nodeSelectLeft")}</p>
              ) : detailLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : detailNode ? (
                <div className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.singbox.fieldName")}</span>
                      <span>{detailNode.name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.singbox.fieldStatus")}</span>
                      {statusBadge(detailNode.status, t)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.singbox.fieldHost")}</span>
                      <span className="font-mono text-xs">{detailNode.publicHost || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.singbox.fieldPortProtocol")}</span>
                      <span>{detailNode.port} / {detailNode.protocol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.singbox.fieldLastHeartbeat")}</span>
                      <span>{formatDate(detailNode.lastSeenAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.singbox.fieldTraffic")}</span>
                      <span>↓ {formatBytes(detailNode.trafficInBytes)} ↑ {formatBytes(detailNode.trafficOutBytes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.singbox.fieldSlots")}</span>
                      <span>{detailNode.slots.length}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={openConfigEditor}>
                      <FileJson className="h-4 w-4 mr-1" />
                      {t("admin.singbox.editConfig")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit({ ...detailNode, slotsCount: detailNode.slots.length, hasCustomConfig: !!detailNode.customConfigJson } as SingboxNodeListItem)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      {t("admin.singbox.editNode")}
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setNodeToDelete({ ...detailNode, slotsCount: detailNode.slots.length, hasCustomConfig: !!detailNode.customConfigJson } as SingboxNodeListItem)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("admin.singbox.delete")}
                    </Button>
                  </div>
                  {detailNode.slots.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">{t("admin.singbox.slotsLabel")}</Label>
                      <ul className="mt-1 rounded border divide-y text-sm">
                        {detailNode.slots.map((s) => (
                          <li key={s.id} className="px-3 py-2 flex justify-between items-center">
                            <span className="font-mono text-xs">{s.userIdentifier}</span>
                            <span className="text-muted-foreground">{formatDate(s.expiresAt)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t("admin.singbox.nodeLoadFailed")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.singbox.categoriesTitle")}</CardTitle>
                <CardDescription>{t("admin.singbox.categoriesDesc")}</CardDescription>
              </div>
              <Button onClick={() => { setCategoryModal("add"); setCategoryForm({ name: "", sortOrder: "0" }); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.singbox.add")}
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : categories.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("admin.singbox.noCategories")}</p>
              ) : (
                <ul className="space-y-3">
                  {categories.map((c) => (
                    <li key={c.id} className="rounded-lg border p-3 flex items-center justify-between">
                      <span className="font-medium">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{c.tariffs.length} {t("admin.singbox.tariffsCount")}</span>
                        <Button variant="outline" size="sm" onClick={() => { setCategoryModal({ edit: c }); setCategoryForm({ name: c.name, sortOrder: String(c.sortOrder) }); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteCategory(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tariffs" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.singbox.tariffsTitle")}</CardTitle>
                <CardDescription>{t("admin.singbox.tariffsDesc")}</CardDescription>
              </div>
              <Button
                onClick={() => {
                  if (categories.length === 0) { alert(t("admin.singbox.addCategoryFirst")); return; }
                  setTariffModal({ kind: "add", categoryId: categories[0]!.id });
                  setTariffForm({ name: "", categoryId: categories[0]!.id, slotCount: "1", durationDays: "30", trafficLimitBytes: "", price: "", currency: "rub", sortOrder: "0", enabled: true });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.singbox.addTariff")}
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : categories.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("admin.singbox.addCategoryOnTab")}</p>
              ) : (
                <div className="space-y-4">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">{cat.name}</h3>
                      {cat.tariffs.length === 0 ? (
                        <p className="text-sm text-muted-foreground ml-2">{t("admin.singbox.noTariffs")}</p>
                      ) : (
                        <ul className="space-y-2">
                          {cat.tariffs.map((tariff) => (
                            <li key={tariff.id} className="rounded border p-3 flex items-center justify-between">
                              <div>
                                <span className="font-medium">{tariff.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {tariff.slotCount} {t("admin.singbox.slotsShort")} · {tariff.durationDays} {t("admin.singbox.daysShort")} · {formatPrice(tariff.price, tariff.currency)}
                                  {tariff.trafficLimitBytes ? ` · ${formatBytes(tariff.trafficLimitBytes)}` : ""}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {!tariff.enabled && <span className="text-xs text-amber-600">{t("admin.singbox.disabledShort")}</span>}
                                <Button variant="outline" size="sm" onClick={() => {
                                  setTariffModal({ kind: "edit", tariff: { ...tariff, categoryId: cat.id, categoryName: cat.name, sortOrder: 0 } as SingboxTariffListItem });
                                  setTariffForm({
                                    name: tariff.name, categoryId: cat.id, slotCount: String(tariff.slotCount), durationDays: String(tariff.durationDays),
                                    trafficLimitBytes: tariff.trafficLimitBytes ? String(Math.round(Number(tariff.trafficLimitBytes) / (1024 ** 3))) : "", price: String(tariff.price), currency: tariff.currency.toLowerCase(), sortOrder: "0", enabled: tariff.enabled,
                                  });
                                }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteTariff(tariff.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог: добавить ноду */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.singbox.addNodeTitle")}</DialogTitle>
            <DialogDescription>{t("admin.singbox.addNodeDesc")}</DialogDescription>
          </DialogHeader>
          {!addResult ? (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>{t("admin.singbox.fieldName")}</Label>
                <Input
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="Sing-box node 1"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.singbox.protocol")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={newNodeProtocol}
                  onChange={(e) => setNewNodeProtocol(e.target.value)}
                >
                  {PROTOCOLS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.singbox.port")}</Label>
                <Input
                  type="number"
                  min={1}
                  max={65535}
                  value={newNodePort}
                  onChange={(e) => setNewNodePort(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>{t("admin.singbox.cancel")}</Button>
                <Button onClick={handleAddNode} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t("admin.singbox.create")}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p className="text-sm text-green-600 dark:text-green-400">{t("admin.singbox.nodeCreated")} <code className="rounded bg-muted px-1">docker compose up -d --build</code>.</p>
              <div className="grid gap-2">
                <Label>{t("admin.singbox.dockerCompose")}</Label>
                <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">{addResult.dockerCompose}</pre>
                <Button variant="outline" size="sm" onClick={copyCompose}>
                  {copied === "compose" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied === "compose" ? t("admin.singbox.copied") : t("admin.singbox.copy")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{addResult.instructions}</p>
              <DialogFooter>
                <Button onClick={() => { setAddOpen(false); setAddResult(null); }}>{t("admin.singbox.close")}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог: редактировать ноду */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.singbox.editNodeTitle")}</DialogTitle>
          </DialogHeader>
          {editingNode && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>{t("admin.singbox.fieldName")}</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.singbox.protocol")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={editProtocol}
                  onChange={(e) => setEditProtocol(e.target.value)}
                >
                  {PROTOCOLS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.singbox.port")}</Label>
                <Input type="number" min={1} max={65535} value={editPort} onChange={(e) => setEditPort(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>{t("admin.singbox.cancel")}</Button>
                <Button onClick={handleSaveEdit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {t("admin.singbox.save")}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог: категория (добавить / изменить) */}
      <Dialog open={categoryModal !== null} onOpenChange={(open) => !open && setCategoryModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{categoryModal === "add" ? t("admin.singbox.addCategoryTitle") : t("admin.singbox.editCategoryTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t("admin.singbox.fieldName")}</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("admin.singbox.categoryPlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("admin.singbox.sortOrder")}</Label>
              <Input
                type="number"
                value={categoryForm.sortOrder}
                onChange={(e) => setCategoryForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryModal(null)}>{t("admin.singbox.cancel")}</Button>
            <Button onClick={handleSaveCategory} disabled={savingCat || !categoryForm.name.trim()}>
              {savingCat ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("admin.singbox.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог: тариф (добавить / изменить) */}
      <Dialog open={tariffModal !== null} onOpenChange={(open) => !open && setTariffModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tariffModal?.kind === "add" ? t("admin.singbox.addTariffTitle") : t("admin.singbox.editTariffTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t("admin.singbox.category")}</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={tariffForm.categoryId}
                onChange={(e) => setTariffForm((f) => ({ ...f, categoryId: e.target.value }))}
                disabled={tariffModal?.kind === "edit"}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>{t("admin.singbox.fieldName")}</Label>
              <Input value={tariffForm.name} onChange={(e) => setTariffForm((f) => ({ ...f, name: e.target.value }))} placeholder={t("admin.singbox.tariffPlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>{t("admin.singbox.slots")}</Label>
                <Input type="number" min={1} value={tariffForm.slotCount} onChange={(e) => setTariffForm((f) => ({ ...f, slotCount: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.singbox.days")}</Label>
                <Input type="number" min={1} value={tariffForm.durationDays} onChange={(e) => setTariffForm((f) => ({ ...f, durationDays: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("admin.singbox.trafficLimitGb")}</Label>
              <Input value={tariffForm.trafficLimitBytes} onChange={(e) => setTariffForm((f) => ({ ...f, trafficLimitBytes: e.target.value }))} placeholder="5" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>{t("admin.singbox.price")}</Label>
                <Input type="number" min={0} step={0.01} value={tariffForm.price} onChange={(e) => setTariffForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.singbox.currency")}</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={tariffForm.currency} onChange={(e) => setTariffForm((f) => ({ ...f, currency: e.target.value }))}>
                  <option value="rub">RUB</option>
                  <option value="usd">USD</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="tariff-enabled" checked={tariffForm.enabled} onChange={(e) => setTariffForm((f) => ({ ...f, enabled: e.target.checked }))} className="rounded border-input" />
              <Label htmlFor="tariff-enabled">{t("admin.singbox.enabledForPurchase")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTariffModal(null)}>{t("admin.singbox.cancel")}</Button>
            <Button onClick={handleSaveTariff} disabled={savingTariff || !tariffForm.name.trim()}>
              {savingTariff ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("admin.singbox.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог: удалить ноду */}
      <Dialog open={!!nodeToDelete} onOpenChange={(open) => !open && setNodeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.singbox.deleteNodeTitle")}</DialogTitle>
            <DialogDescription>{t("admin.singbox.deleteNodeDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeToDelete(null)}>{t("admin.singbox.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {t("admin.singbox.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог: редактор конфига JSON */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("admin.singbox.configTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.singbox.configDesc")} <code className="rounded bg-muted px-1">stealthnet-in</code> {t("admin.singbox.configDescSuffix")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            <textarea
              className="flex-1 min-h-[300px] w-full rounded-md border border-input bg-muted/30 p-3 font-mono text-sm resize-y"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              spellCheck={false}
            />
            {configError && <p className="text-sm text-destructive">{configError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>{t("admin.singbox.cancel")}</Button>
            <Button onClick={saveConfig} disabled={configSaving}>
              {configSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {t("admin.singbox.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
