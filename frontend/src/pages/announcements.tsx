import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth";
import { api } from "@/lib/api";
import type { AnnouncementRecord, CreateAnnouncementPayload } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Megaphone,
  Pin,
  Eye,
  EyeOff,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export function AnnouncementsPage() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const token = state.accessToken!;

  const [items, setItems] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAnnouncementPayload>({ title: "", content: "", pinned: false, published: false });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [viewItem, setViewItem] = useState<AnnouncementRecord | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.getAdminAnnouncements(token);
      setItems(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditId(null);
    setForm({ title: "", content: "", pinned: false, published: false });
    setPreviewMode(false);
    setEditOpen(true);
  }

  function openEdit(item: AnnouncementRecord) {
    setEditId(item.id);
    setForm({ title: item.title, content: item.content, pinned: item.pinned, published: item.published });
    setPreviewMode(false);
    setEditOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      if (editId) {
        await api.updateAnnouncement(token, editId, form);
      } else {
        await api.createAnnouncement(token, form);
      }
      setEditOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    await api.deleteAnnouncement(token, id);
    load();
  }

  async function togglePublish(item: AnnouncementRecord) {
    await api.updateAnnouncement(token, item.id, { published: !item.published });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{t("admin.announcements.title")}</h1>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("admin.announcements.create")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Megaphone className="h-12 w-12 opacity-20" />
            <p>{t("admin.announcements.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/[0.06] px-4 py-3 cursor-pointer hover:bg-muted/60 dark:hover:bg-white/10 transition-colors"
              onClick={() => setViewItem(item)}
            >
              {item.pinned && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : t("admin.announcements.draft")}
                  {!item.published && (
                    <span className="ml-2 text-amber-500 font-medium">{t("admin.announcements.unpublished")}</span>
                  )}
                </p>
              </div>
              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(item)}>
                  {item.published ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewItem?.pinned && <Pin className="h-4 w-4 text-amber-500" />}
              {viewItem?.title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {viewItem?.publishedAt ? new Date(viewItem.publishedAt).toLocaleString() : t("admin.announcements.draft")}
            </p>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{viewItem?.content ?? ""}</ReactMarkdown>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewItem(null); if (viewItem) openEdit(viewItem); }}>
              <Pencil className="h-4 w-4 mr-2" />
              {t("admin.announcements.edit")}
            </Button>
            <Button variant="outline" onClick={() => setViewItem(null)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? t("admin.announcements.edit") : t("admin.announcements.create")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("admin.announcements.titleLabel")}</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>{t("admin.announcements.contentLabel")}</Label>
                <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                  {previewMode ? t("admin.announcements.editMode") : t("admin.announcements.preview")}
                </Button>
              </div>
              {previewMode ? (
                <div className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-4 min-h-[200px]">
                  <ReactMarkdown>{form.content}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  className="w-full min-h-[200px] rounded-lg border bg-background px-3 py-2 text-sm font-mono resize-y"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Markdown..."
                />
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.pinned ?? false} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
                <Pin className="h-3.5 w-3.5" />
                {t("admin.announcements.pinned")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.published ?? false} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                <Eye className="h-3.5 w-3.5" />
                {t("admin.announcements.published")}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving || !form.title.trim() || !form.content.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
