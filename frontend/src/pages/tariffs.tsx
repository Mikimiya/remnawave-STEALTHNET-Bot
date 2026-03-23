import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth";
import { api } from "@/lib/api";
import type {
  TariffCategoryWithTariffs,
  TariffRecord,
  TariffSubGroupRecord,
  CreateTariffPayload,
  UpdateTariffPayload,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  CreditCard,
  Loader2,
  ChevronDown,
  Check,
  GripVertical,
  Layers,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BYTES_PER_GB = 1024 * 1024 * 1024;

const TRAFFIC_RESET_STRATEGIES = [
  { value: "NO_RESET", labelKey: "admin.tariffs.resetStrategyNoReset" },
  { value: "DAY", labelKey: "admin.tariffs.resetStrategyDay" },
  { value: "WEEK", labelKey: "admin.tariffs.resetStrategyWeek" },
  { value: "MONTH", labelKey: "admin.tariffs.resetStrategyMonth" },
];

const CURRENCIES = [
  { value: "usd", label: "USD" },
  { value: "rub", label: "RUB" },
  { value: "cny", label: "CNY" },
];

function formatTraffic(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes >= BYTES_PER_GB) return `${(bytes / BYTES_PER_GB).toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

type SquadOption = { uuid: string; name?: string };

function SortableCategoryCard({
  cat,
  onEditCategory,
  onDeleteCategory,
  onAddTariff,
  onEditTariff,
  onDeleteTariff,
  onTariffDragEnd,
  onAddSubGroup,
  onEditSubGroup,
  onDeleteSubGroup,
  formatPrice,
  formatTraffic,
}: {
  cat: TariffCategoryWithTariffs;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  onAddTariff: () => void;
  onEditTariff: (t: TariffRecord) => void;
  onDeleteTariff: (id: string) => void;
  onTariffDragEnd: (event: DragEndEvent) => void;
  onAddSubGroup: () => void;
  onEditSubGroup: (sg: TariffSubGroupRecord) => void;
  onDeleteSubGroup: (id: string) => void;
  formatPrice: (amount: number, currency: string) => string;
  formatTraffic: (bytes: number | null) => string;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
  });
  const tariffSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden rounded-xl border shadow-sm ${isDragging ? "opacity-80 shadow-lg z-10" : ""}`}
    >
      <CardHeader className="pb-2 bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <span
              className="flex h-9 w-9 shrink-0 cursor-grab active:cursor-grabbing items-center justify-center rounded-lg bg-muted/80 text-muted-foreground hover:bg-muted"
              {...attributes}
              {...listeners}
              title={t("admin.tariffs.dragTitle")}
            >
              <GripVertical className="h-5 w-5" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderOpen className="h-5 w-5" />
            </span>
            {cat.name}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={onAddSubGroup} title={t("admin.tariffs.addSubGroup")}>
              <Layers className="h-3.5 w-3.5 mr-1" />
              {t("admin.tariffs.addSubGroup")}
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={onEditCategory} title={t("admin.tariffs.editCategory")}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              {t("admin.tariffs.editCategory")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-destructive hover:text-destructive"
              onClick={onDeleteCategory}
              title={t("admin.tariffs.deleteCategory")}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {t("admin.tariffs.deleteCategory")}
            </Button>
            <Button size="sm" className="rounded-lg shadow-sm" onClick={onAddTariff}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("admin.tariffs.addTariff")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {(() => {
          const subGroups = [...(cat.subGroups ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
          const ungrouped = cat.tariffs.filter((tr) => !tr.subGroupId);
          const grouped = subGroups.map((sg) => ({
            ...sg,
            tariffs: cat.tariffs.filter((tr) => tr.subGroupId === sg.id),
          }));

          const hasAny = cat.tariffs.length > 0 || subGroups.length > 0;
          if (!hasAny) {
            return (
              <p className="text-sm text-muted-foreground py-2">
                {t("admin.tariffs.emptyTariffs")}
              </p>
            );
          }

          return (
            <div className="space-y-4">
              {/* Sub-groups */}
              {grouped.map((sg) => (
                <div key={sg.id} className="rounded-lg border border-dashed border-border/50 bg-muted/10">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/20 rounded-t-lg">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      {sg.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEditSubGroup(sg)} title={t("admin.tariffs.editSubGroup")}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => onDeleteSubGroup(sg.id)} title={t("admin.tariffs.deleteSubGroup")}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {sg.tariffs.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-3 py-2">{t("admin.tariffs.emptySubGroup")}</p>
                  ) : (
                    <DndContext sensors={tariffSensors} collisionDetection={closestCenter} onDragEnd={onTariffDragEnd}>
                      <SortableContext items={sg.tariffs.map((tr) => tr.id)} strategy={verticalListSortingStrategy}>
                        <ul className="space-y-2 p-2">
                          {sg.tariffs.map((tr) => (
                            <SortableTariffRow key={tr.id} tariff={tr} onEdit={() => onEditTariff(tr)} onDelete={() => onDeleteTariff(tr.id)} formatPrice={formatPrice} formatTraffic={formatTraffic} />
                          ))}
                        </ul>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              ))}

              {/* Ungrouped tariffs */}
              {ungrouped.length > 0 && (
                <DndContext sensors={tariffSensors} collisionDetection={closestCenter} onDragEnd={onTariffDragEnd}>
                  <SortableContext items={ungrouped.map((tr) => tr.id)} strategy={verticalListSortingStrategy}>
                    {subGroups.length > 0 && (
                      <p className="text-xs font-medium text-muted-foreground px-1 pt-1">{t("admin.tariffs.ungroupedTariffs")}</p>
                    )}
                    <ul className="space-y-2">
                      {ungrouped.map((tr) => (
                        <SortableTariffRow key={tr.id} tariff={tr} onEdit={() => onEditTariff(tr)} onDelete={() => onDeleteTariff(tr.id)} formatPrice={formatPrice} formatTraffic={formatTraffic} />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}

function SortableTariffRow({
  tariff: tariffItem,
  onEdit,
  onDelete,
  formatPrice,
  formatTraffic,
}: {
  tariff: TariffRecord;
  onEdit: () => void;
  onDelete: () => void;
  formatPrice: (amount: number, currency: string) => string;
  formatTraffic: (bytes: number | null) => string;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tariffItem.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-muted/30 transition-colors ${isDragging ? "opacity-80 shadow-md z-10" : ""}`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="flex h-8 w-8 shrink-0 cursor-grab active:cursor-grabbing items-center justify-center rounded-lg bg-muted/80 text-muted-foreground hover:bg-muted"
          {...attributes}
          {...listeners}
          title={t("admin.tariffs.dragTitle")}
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <CreditCard className="h-4 w-4" />
        </span>
        <span className="font-medium">{tariffItem.name}</span>
        {tariffItem.description?.trim() ? (
          <span className="text-muted-foreground text-sm max-w-[200px] truncate" title={tariffItem.description}>
            {tariffItem.description}
          </span>
        ) : null}
        <span className="text-muted-foreground text-sm">{tariffItem.durationDays} {t("admin.tariffs.days")}</span>
        <span className="font-semibold text-primary">
          {formatPrice(tariffItem.price ?? 0, tariffItem.currency ?? "usd")}
        </span>
        <span className="text-muted-foreground text-sm">{t("admin.tariffs.squadsCount")}: {tariffItem.internalSquadUuids.length}</span>
        <span className="text-muted-foreground text-sm">{t("admin.tariffs.trafficLabel")}: {formatTraffic(tariffItem.trafficLimitBytes)}</span>
        {tariffItem.trafficResetStrategy && tariffItem.trafficResetStrategy !== "NO_RESET" && (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
            {t(TRAFFIC_RESET_STRATEGIES.find((s) => s.value === tariffItem.trafficResetStrategy)?.labelKey ?? "admin.tariffs.resetStrategyNoReset")}
          </span>
        )}
        {tariffItem.deviceLimit != null && (
          <span className="text-muted-foreground text-sm">{t("admin.tariffs.devicesLabel")}: {tariffItem.deviceLimit}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-lg h-8" onClick={onEdit} title={t("admin.tariffs.editCategory")}>
          <Pencil className="h-3.5 w-3.5 mr-1" />
          {t("admin.tariffs.editCategory")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          title={t("admin.tariffs.deleteCategory")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

export function TariffsPage() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const token = state.accessToken ?? null;

  const [categories, setCategories] = useState<TariffCategoryWithTariffs[]>([]);
  const [squads, setSquads] = useState<SquadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [remnaConfigured, setRemnaConfigured] = useState<boolean | null>(null);

  const [categoryModal, setCategoryModal] = useState<"add" | { edit: TariffCategoryWithTariffs } | null>(null);
  const [tariffModal, setTariffModal] = useState<
    | { kind: "add"; categoryId: string }
    | { kind: "edit"; category: TariffCategoryWithTariffs; tariff: TariffRecord }
    | null
  >(null);
  const [subGroupModal, setSubGroupModal] = useState<
    | { kind: "add"; categoryId: string }
    | { kind: "edit"; subGroup: TariffSubGroupRecord }
    | null
  >(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [status, cats, squadsRes] = await Promise.all([
        api.getRemnaStatus(token),
        api.getTariffCategories(token),
        api.getRemnaSquadsInternal(token).catch(() => ({ response: { internalSquads: [] } })),
      ]);
      setRemnaConfigured(status.configured);
      setCategories(cats.items);
      const res = squadsRes as { response?: { internalSquads?: { uuid?: string; name?: string }[] } };
      const list = res?.response?.internalSquads ?? (Array.isArray(res?.response) ? res.response : []);
      setSquads(Array.isArray(list) ? list.map((s) => ({ uuid: s.uuid ?? "", name: s.name })) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.tariffs.errorLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleDeleteCategory = async (id: string) => {
    if (!token || !confirm(t("admin.tariffs.deleteCategoryConfirm"))) return;
    try {
      await api.deleteTariffCategory(token, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.tariffs.errorDelete"));
    }
  };

  const handleDeleteTariff = async (id: string) => {
    if (!token || !confirm(t("admin.tariffs.deleteTariffConfirm"))) return;
    try {
      await api.deleteTariff(token, id);
      await load();
      setTariffModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.tariffs.errorDelete"));
    }
  };

  const handleDeleteSubGroup = async (id: string) => {
    if (!token || !confirm(t("admin.tariffs.deleteSubGroupConfirm"))) return;
    try {
      await api.deleteTariffSubGroup(token, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.tariffs.errorDelete"));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    if (!token) return;
    try {
      await Promise.all(
        reordered.map((cat, index) =>
          api.updateTariffCategory(token, cat.id, { sortOrder: index })
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.tariffs.errorOrder"));
      load();
    }
  };

  const handleTariffDragEnd = async (
    event: DragEndEvent,
    category: TariffCategoryWithTariffs
  ) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const tariffs = category.tariffs;
    const oldIndex = tariffs.findIndex((t) => t.id === active.id);
    const newIndex = tariffs.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(tariffs, oldIndex, newIndex);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === category.id ? { ...c, tariffs: reordered } : c
      )
    );
    if (!token) return;
    try {
      await Promise.all(
        reordered.map((tr, index) =>
          api.updateTariff(token, tr.id, { sortOrder: index })
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.tariffs.errorOrder"));
      load();
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.tariffs.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("admin.tariffs.subtitle")}
          </p>
        </div>
        <Button onClick={() => setCategoryModal("add")} className="rounded-xl shadow-sm shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          {t("admin.tariffs.addCategory")}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {remnaConfigured === false && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {t("admin.tariffs.remnaWarning")}
            </p>
          </CardContent>
        </Card>
      )}

      {categories.length === 0 && !loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              {t("admin.tariffs.emptyCategories")}
            </p>
            <div className="flex justify-center">
              <Button onClick={() => setCategoryModal("add")}>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.tariffs.createCategory")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {categories.map((cat) => (
                <SortableCategoryCard
                  key={cat.id}
                  cat={cat}
                  onEditCategory={() => setCategoryModal({ edit: cat })}
                  onDeleteCategory={() => handleDeleteCategory(cat.id)}
                  onAddTariff={() => setTariffModal({ kind: "add", categoryId: cat.id })}
                  onEditTariff={(t) => setTariffModal({ kind: "edit", category: cat, tariff: t })}
                  onDeleteTariff={handleDeleteTariff}
                  onTariffDragEnd={(e) => handleTariffDragEnd(e, cat)}
                  onAddSubGroup={() => setSubGroupModal({ kind: "add", categoryId: cat.id })}
                  onEditSubGroup={(sg) => setSubGroupModal({ kind: "edit", subGroup: sg })}
                  onDeleteSubGroup={handleDeleteSubGroup}
                  formatPrice={formatPrice}
                  formatTraffic={formatTraffic}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Модалка категории */}
      {categoryModal && (
        <CategoryModal
          token={token}
          modal={categoryModal}
          onClose={() => setCategoryModal(null)}
          onSaved={() => {
            setCategoryModal(null);
            load();
          }}
          saving={saving}
          setSaving={setSaving}
        />
      )}

      {/* Модалка тарифа */}
      {tariffModal && (
        <TariffModal
          token={token}
          squads={squads}
          modal={tariffModal}
          categories={categories}
          onClose={() => setTariffModal(null)}
          onSaved={() => {
            setTariffModal(null);
            load();
          }}
          saving={saving}
          setSaving={setSaving}
        />
      )}

      {/* Модалка подгруппы */}
      {subGroupModal && (
        <SubGroupModal
          token={token}
          modal={subGroupModal}
          onClose={() => setSubGroupModal(null)}
          onSaved={() => {
            setSubGroupModal(null);
            load();
          }}
          saving={saving}
          setSaving={setSaving}
        />
      )}
    </div>
  );
}

function CategoryModal({
  token,
  modal,
  onClose,
  onSaved,
  saving,
  setSaving,
}: {
  token: string | null;
  modal: "add" | { edit: TariffCategoryWithTariffs };
  onClose: () => void;
  onSaved: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const isEdit = modal !== "add";
  const editCat = isEdit ? (modal as { edit: TariffCategoryWithTariffs }).edit : null;
  const [name, setName] = useState(editCat?.name ?? "");
  const [emojiKey, setEmojiKey] = useState<string>(editCat?.emojiKey ?? "");

  useEffect(() => {
    if (isEdit && editCat) {
      setName(editCat.name);
      setEmojiKey(editCat.emojiKey ?? "");
    } else {
      setName("");
      setEmojiKey("");
    }
  }, [modal, isEdit, editCat?.name, editCat?.emojiKey]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), emojiKey: emojiKey.trim() || null };
      if (isEdit) {
        await api.updateTariffCategory(token, (modal as { edit: TariffCategoryWithTariffs }).edit.id, payload);
      } else {
        await api.createTariffCategory(token, payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("admin.tariffs.catModalTitleEdit") : t("admin.tariffs.catModalTitleNew")}</DialogTitle>
          <DialogDescription className="sr-only">{t("admin.tariffs.catModalTitleNew")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <Label htmlFor="cat-name">{t("admin.tariffs.catNameLabel")}</Label>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("admin.tariffs.catNamePlaceholder")}
            className="mt-1 mb-4"
            required
          />
          <Label htmlFor="cat-emoji" className="mt-2 block">{t("admin.tariffs.catEmojiLabel")}</Label>
          <select
            id="cat-emoji"
            value={emojiKey}
            onChange={(e) => setEmojiKey(e.target.value)}
            className="mt-1 mb-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("admin.tariffs.catEmojiNone")}</option>
            <option value="ordinary">ordinary — 📦</option>
            <option value="premium">premium — ⭐</option>
          </select>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>{t("admin.common.cancel")}</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isEdit ? t("admin.common.save") : t("admin.common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TariffModal({
  token,
  squads,
  modal,
  categories,
  onClose,
  onSaved,
  saving,
  setSaving,
}: {
  token: string | null;
  squads: SquadOption[];
  modal: { kind: "add"; categoryId: string } | { kind: "edit"; category: TariffCategoryWithTariffs; tariff: TariffRecord };
  categories: TariffCategoryWithTariffs[];
  onClose: () => void;
  onSaved: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const isEdit = modal.kind === "edit";
  const tariff = isEdit ? modal.tariff : null;
  const categoryId = isEdit ? modal.category.id : modal.categoryId;

  const [name, setName] = useState(tariff?.name ?? "");
  const [description, setDescription] = useState(tariff?.description ?? "");
  const [durationDays, setDurationDays] = useState(tariff?.durationDays ?? 30);
  const [selectedSquadUuids, setSelectedSquadUuids] = useState<string[]>(tariff?.internalSquadUuids ?? []);
  const [trafficGb, setTrafficGb] = useState<string>(
    tariff?.trafficLimitBytes != null ? String((tariff.trafficLimitBytes / BYTES_PER_GB).toFixed(2)) : ""
  );
  const [deviceLimit, setDeviceLimit] = useState<string>(tariff?.deviceLimit != null ? String(tariff.deviceLimit) : "");
  const [trafficResetStrategy, setTrafficResetStrategy] = useState<string>(tariff?.trafficResetStrategy ?? "NO_RESET");
  const [price, setPrice] = useState<string>(tariff?.price != null ? String(tariff.price) : "0");
  const [currency, setCurrency] = useState<string>((tariff?.currency ?? "usd").toLowerCase());
  const [subGroupId, setSubGroupId] = useState<string>(tariff?.subGroupId ?? "");

  const currentCategory = categories.find((c) => c.id === categoryId);
  const availableSubGroups = [...(currentCategory?.subGroups ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (isEdit && tariff) {
      setName(tariff.name);
      setDescription(tariff.description ?? "");
      setDurationDays(tariff.durationDays);
      setSelectedSquadUuids(tariff.internalSquadUuids);
      setTrafficGb(tariff.trafficLimitBytes != null ? String((tariff.trafficLimitBytes / BYTES_PER_GB).toFixed(2)) : "");
      setDeviceLimit(tariff.deviceLimit != null ? String(tariff.deviceLimit) : "");
      setPrice(String(tariff.price ?? 0));
      setCurrency((tariff.currency ?? "usd").toLowerCase());
      setTrafficResetStrategy(tariff.trafficResetStrategy ?? "NO_RESET");
      setSubGroupId(tariff.subGroupId ?? "");
    } else {
      setName("");
      setDescription("");
      setDurationDays(30);
      setSelectedSquadUuids([]);
      setTrafficGb("");
      setDeviceLimit("");
      setPrice("0");
      setCurrency("usd");
      setTrafficResetStrategy("NO_RESET");
      setSubGroupId("");
    }
  }, [modal, isEdit, tariff]);

  const [squadsOpen, setSquadsOpen] = useState(false);
  const squadsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (squadsRef.current && !squadsRef.current.contains(e.target as Node)) {
        setSquadsOpen(false);
      }
    };
    if (squadsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [squadsOpen]);

  const toggleSquad = (uuid: string) => {
    setSelectedSquadUuids((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const selectedSquadsList = squads.filter((s) => selectedSquadUuids.includes(s.uuid));
  const squadsTriggerLabel =
    selectedSquadUuids.length === 0
      ? t("admin.tariffs.squadsPlaceholder")
      : selectedSquadUuids.length === 1
        ? selectedSquadsList[0]?.name || selectedSquadsList[0]?.uuid || "1"
        : t("admin.tariffs.squadsSelected", { n: selectedSquadUuids.length });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim() || selectedSquadUuids.length === 0) return;
    const trafficLimitBytes =
      trafficGb.trim() !== "" ? Math.round(parseFloat(trafficGb) * BYTES_PER_GB) : null;
    const deviceLimitNum = deviceLimit.trim() !== "" ? parseInt(deviceLimit, 10) : null;
    if (deviceLimit.trim() !== "" && (isNaN(deviceLimitNum!) || deviceLimitNum! < 0)) return;
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) return;

    setSaving(true);
    try {
      if (isEdit && tariff) {
        const payload: UpdateTariffPayload = {
          name: name.trim(),
          description: description.trim() || null,
          durationDays,
          internalSquadUuids: selectedSquadUuids,
          trafficLimitBytes: trafficLimitBytes ?? null,
          deviceLimit: deviceLimitNum ?? null,
          price: priceNum,
          currency: currency || "usd",
          trafficResetStrategy,
          subGroupId: subGroupId || null,
        };
        await api.updateTariff(token, tariff.id, payload);
      } else {
        const payload: CreateTariffPayload = {
          categoryId,
          name: name.trim(),
          description: description.trim() || null,
          durationDays,
          internalSquadUuids: selectedSquadUuids,
          trafficLimitBytes: trafficLimitBytes ?? null,
          deviceLimit: deviceLimitNum ?? null,
          price: priceNum,
          currency: currency || "usd",
          trafficResetStrategy,
          subGroupId: subGroupId || null,
        };
        await api.createTariff(token, payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("admin.tariffs.tariffModalTitleEdit") : t("admin.tariffs.tariffModalTitleNew")}</DialogTitle>
          <DialogDescription className="sr-only">{t("admin.tariffs.tariffModalTitleNew")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="tariff-name">{t("admin.tariffs.tariffNameLabel")}</Label>
            <Input
              id="tariff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("admin.tariffs.tariffNamePlaceholder")}
              required
              className="mt-1"
            />
          </div>
          {availableSubGroups.length > 0 && (
            <div>
              <Label htmlFor="tariff-sub-group">{t("admin.tariffs.subGroupLabel")}</Label>
              <select
                id="tariff-sub-group"
                value={subGroupId}
                onChange={(e) => setSubGroupId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">{t("admin.tariffs.subGroupNone")}</option>
                {availableSubGroups.map((sg) => (
                  <option key={sg.id} value={sg.id}>{sg.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="tariff-desc">{t("admin.tariffs.tariffDescLabel")}</Label>
            <textarea
              id="tariff-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("admin.tariffs.tariffDescPlaceholder")}
              rows={3}
              maxLength={5000}
              className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <Label htmlFor="tariff-days">{t("admin.tariffs.tariffDaysLabel")}</Label>
            <Input
              id="tariff-days"
              type="number"
              min={1}
              max={3650}
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 1)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tariff-price">{t("admin.tariffs.tariffPriceLabel")}</Label>
              <Input
                id="tariff-price"
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tariff-currency">{t("admin.tariffs.tariffCurrencyLabel")}</Label>
              <select
                id="tariff-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div ref={squadsRef} className="relative">
            <Label>{t("admin.tariffs.squadsLabel")}</Label>
            <p className="text-xs text-muted-foreground mb-1.5 mt-1">{t("admin.tariffs.squadsHint")}</p>
            {squads.length === 0 ? (
              <div className="flex h-10 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                {t("admin.tariffs.squadsEmpty")}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSquadsOpen((o) => !o)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className={selectedSquadUuids.length === 0 ? "text-muted-foreground" : ""}>
                    {squadsTriggerLabel}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${squadsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {squadsOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
                    <div className="max-h-48 overflow-y-auto p-1">
                      {squads.map((s) => {
                        const checked = selectedSquadUuids.includes(s.uuid);
                        return (
                          <button
                            key={s.uuid}
                            type="button"
                            onClick={() => toggleSquad(s.uuid)}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none"
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                checked ? "bg-primary border-primary text-primary-foreground" : "border-input"
                              }`}
                            >
                              {checked ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span className="truncate">{s.name || s.uuid}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <Label htmlFor="tariff-traffic">{t("admin.tariffs.trafficLimitLabel")}</Label>
            <Input
              id="tariff-traffic"
              type="number"
              min={0}
              step={0.1}
              value={trafficGb}
              onChange={(e) => setTrafficGb(e.target.value)}
              placeholder={t("admin.tariffs.trafficLimitPlaceholder")}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{t("admin.tariffs.trafficHint")}</p>
          </div>
          <div>
            <Label htmlFor="tariff-reset-strategy">{t("admin.tariffs.resetStrategyLabel")}</Label>
            <select
              id="tariff-reset-strategy"
              value={trafficResetStrategy}
              onChange={(e) => setTrafficResetStrategy(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {TRAFFIC_RESET_STRATEGIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.labelKey)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">{t("admin.tariffs.resetStrategyHint")}</p>
          </div>
          <div>
            <Label htmlFor="tariff-devices">{t("admin.tariffs.deviceLimitLabel")}</Label>
            <Input
              id="tariff-devices"
              type="number"
              min={0}
              value={deviceLimit}
              onChange={(e) => setDeviceLimit(e.target.value)}
              placeholder={t("admin.tariffs.deviceLimitPlaceholder")}
              className="mt-1"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>{t("admin.common.cancel")}</Button>
            <Button type="submit" disabled={saving || selectedSquadUuids.length === 0}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isEdit ? t("admin.common.save") : t("admin.common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubGroupModal({
  token,
  modal,
  onClose,
  onSaved,
  saving,
  setSaving,
}: {
  token: string | null;
  modal: { kind: "add"; categoryId: string } | { kind: "edit"; subGroup: TariffSubGroupRecord };
  onClose: () => void;
  onSaved: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const isEdit = modal.kind === "edit";
  const sg = isEdit ? modal.subGroup : null;
  const [name, setName] = useState(sg?.name ?? "");

  useEffect(() => {
    if (isEdit && sg) {
      setName(sg.name);
    } else {
      setName("");
    }
  }, [modal, isEdit, sg?.name]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setSaving(true);
    try {
      if (isEdit && sg) {
        await api.updateTariffSubGroup(token, sg.id, { name: name.trim() });
      } else if (modal.kind === "add") {
        await api.createTariffSubGroup(token, { categoryId: modal.categoryId, name: name.trim() });
      }
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("admin.tariffs.subGroupModalTitleEdit") : t("admin.tariffs.subGroupModalTitleNew")}</DialogTitle>
          <DialogDescription className="sr-only">{t("admin.tariffs.subGroupModalTitleNew")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <Label htmlFor="sg-name">{t("admin.tariffs.subGroupNameLabel")}</Label>
          <Input
            id="sg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("admin.tariffs.subGroupNamePlaceholder")}
            className="mt-1 mb-4"
            required
          />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>{t("admin.common.cancel")}</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isEdit ? t("admin.common.save") : t("admin.common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
