import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth";
import { api, type AdminSettings } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Megaphone,
  Link2,
  BarChart3,
  Target,
  Copy,
  Check,
  ExternalLink,
  Info,
  TrendingUp,
  Loader2,
} from "lucide-react";

type CampaignsStatsRow = { source: string; campaign: string | null; registrations: number; trials: number; payments: number; revenue: number };

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}
function fmtDec(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}
function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-5" />}
      <span className="ml-1.5">{copied ? t("admin.marketing.copied") : (label ?? t("admin.marketing.copyBtn"))}</span>
    </Button>
  );
}

function LinkRow({ title, href, description }: { title: string; href: string; description?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2 py-2 border-b border-border/60 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{title}</p>
        {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
        <p className="text-xs font-mono text-muted-foreground truncate mt-1" title={href}>{href}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <CopyButton text={href} />
        <Button variant="ghost" size="sm" asChild>
          <a href={href} target="_blank" rel="noopener noreferrer" title={t("admin.marketing.open")}>
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export function MarketingPage() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const token = state.accessToken;
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [gaId, setGaId] = useState("");
  const [ymId, setYmId] = useState("");
  const [campaignsStats, setCampaignsStats] = useState<CampaignsStatsRow[] | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.getSettings(token).then((s) => {
      setSettings(s);
      setGaId(s.googleAnalyticsId ?? "");
      setYmId(s.yandexMetrikaId ?? "");
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.getAnalytics(token).then((data) => {
      setCampaignsStats(data.campaignsStats ?? []);
    }).catch(() => setCampaignsStats([])).finally(() => setAnalyticsLoading(false));
  }, [token]);

  const saveAnalyticsIds = async () => {
    if (!token) return;
    setSaving(true);
    setMessage("");
    setIsError(false);
    try {
      const updated = await api.updateSettings(token, {
        googleAnalyticsId: gaId.trim() || null,
        yandexMetrikaId: ymId.trim() || null,
      });
      setSettings(updated);
      setGaId(updated.googleAnalyticsId ?? "");
      setYmId(updated.yandexMetrikaId ?? "");
      setMessage(t("admin.marketing.savedOk"));
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : t("admin.marketing.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const baseUrl = (settings.publicAppUrl ?? "").replace(/\/$/, "") || "";
  const botUsername = settings.telegramBotUsername?.replace(/^@/, "") ?? "your_bot";
  const botUrl = `https://t.me/${botUsername}`;

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            {t("admin.marketing.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("admin.marketing.subtitle")}
          </p>
        </div>

        {/* ─── Полезные ссылки ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {t("admin.marketing.usefulLinks")}
            </CardTitle>
            <CardDescription>
              {t("admin.marketing.usefulLinksDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <LinkRow
              title={t("admin.marketing.linkCabLogin")}
              href={`${baseUrl}/cabinet/login`}
              description={t("admin.marketing.linkCabLoginDesc")}
            />
            <LinkRow
              title={t("admin.marketing.linkCabRegister")}
              href={`${baseUrl}/cabinet/register`}
              description={t("admin.marketing.linkCabRegisterDesc")}
            />
            <LinkRow
              title={t("admin.marketing.linkBotStart")}
              href={`${botUrl}?start=`}
              description={t("admin.marketing.linkBotStartDesc")}
            />
            <LinkRow
              title={t("admin.marketing.linkRefTemplate")}
              href={`${baseUrl}/cabinet/register?ref=REF_CODE`}
              description={t("admin.marketing.linkRefTemplateDesc")}
            />
            <LinkRow
              title={t("admin.marketing.linkUtmTemplate")}
              href={`${baseUrl}/cabinet/register?utm_source=SOURCE&utm_medium=MEDIUM&utm_campaign=CAMPAIGN`}
              description={t("admin.marketing.linkUtmTemplateDesc")}
            />
            <LinkRow
              title={t("admin.marketing.linkBotCampaign")}
              href={`${botUrl}?start=c_source_campaign`}
              description={t("admin.marketing.linkBotCampaignDesc")}
            />
            <LinkRow
              title={t("admin.marketing.linkBotRefCampaign")}
              href={`${botUrl}?start=ref_CODE_c_source_campaign`}
              description={t("admin.marketing.linkBotRefCampaignDesc")}
            />
          </CardContent>
        </Card>

        {/* ─── Готовые ссылки с UTM ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t("admin.marketing.utmLinks")}
            </CardTitle>
            <CardDescription>
              {t("admin.marketing.utmLinksDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <p className="text-sm font-medium text-muted-foreground mb-3">{t("admin.marketing.sectionCabRegister")}</p>
            <LinkRow
              title="Facebook / Meta"
              href={`${baseUrl}/cabinet/register?utm_source=facebook&utm_medium=cpc&utm_campaign=winter`}
              description="utm_source=facebook, utm_medium=cpc"
            />
            <LinkRow
              title={t("admin.marketing.utmVk")}
              href={`${baseUrl}/cabinet/register?utm_source=vk&utm_medium=cpc&utm_campaign=winter`}
              description="utm_source=vk, utm_medium=cpc"
            />
            <LinkRow
              title="Instagram"
              href={`${baseUrl}/cabinet/register?utm_source=instagram&utm_medium=stories&utm_campaign=winter`}
              description="utm_source=instagram, utm_medium=stories"
            />
            <LinkRow
              title={t("admin.marketing.utmEmail")}
              href={`${baseUrl}/cabinet/register?utm_source=email&utm_medium=newsletter&utm_campaign=winter`}
              description="utm_source=email, utm_medium=newsletter"
            />
            <LinkRow
              title={t("admin.marketing.utmTelegram")}
              href={`${baseUrl}/cabinet/register?utm_source=telegram&utm_medium=channel&utm_campaign=winter`}
              description="utm_source=telegram, utm_medium=channel"
            />
            <LinkRow
              title={t("admin.marketing.utmBlogger")}
              href={`${baseUrl}/cabinet/register?utm_source=blogger&utm_medium=partner&utm_campaign=winter`}
              description="utm_source=blogger, utm_medium=partner"
            />
            <p className="text-sm font-medium text-muted-foreground mt-6 mb-3">{t("admin.marketing.sectionBotStart")}</p>
            <LinkRow
              title={t("admin.marketing.botFacebook")}
              href={`${botUrl}?start=c_facebook_winter`}
              description={t("admin.marketing.botCampaignDesc")}
            />
            <LinkRow
              title={t("admin.marketing.botVk")}
              href={`${botUrl}?start=c_vk_winter`}
              description={t("admin.marketing.botCampaignDesc")}
            />
            <LinkRow
              title={t("admin.marketing.botInstagram")}
              href={`${botUrl}?start=c_instagram_winter`}
              description={t("admin.marketing.botCampaignDesc")}
            />
            <LinkRow
              title={t("admin.marketing.botEmail")}
              href={`${botUrl}?start=c_email_newsletter`}
              description={t("admin.marketing.botCampaignDesc")}
            />
            <LinkRow
              title={t("admin.marketing.botTelegram")}
              href={`${botUrl}?start=c_telegram_channel`}
              description={t("admin.marketing.botCampaignDesc")}
            />
          </CardContent>
        </Card>

        {/* ─── UTM и источники трафика ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t("admin.marketing.utmInfo")}
            </CardTitle>
            <CardDescription>
              {t("admin.marketing.utmInfoDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
              <p className="font-medium flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary" />
                {t("admin.marketing.howItWorks")}
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>{t("admin.marketing.utmSite")}</strong> {t("admin.marketing.utmSiteDesc")}</li>
                <li><strong>{t("admin.marketing.utmBot")}</strong> {t("admin.marketing.utmBotDesc")}</li>
                <li>{t("admin.marketing.utmNote")}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* ─── Аналитика по источникам (UTM) ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("admin.marketing.analyticsTitle")}
            </CardTitle>
            <CardDescription>
              {t("admin.marketing.analyticsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {analyticsLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t("admin.marketing.loadingStats")}</span>
              </div>
            ) : !campaignsStats?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                {t("admin.marketing.noStats")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("admin.marketing.colSource")}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("admin.marketing.colCampaign")}</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("admin.marketing.colRegistrations")}</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("admin.marketing.colTrials")}</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("admin.marketing.colPayments")}</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("admin.marketing.colRevenue")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignsStats.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{row.source}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.campaign ?? "—"}</td>
                        <td className="px-4 py-3 text-right">{fmt(row.registrations)}</td>
                        <td className="px-4 py-3 text-right">{fmt(row.trials)}</td>
                        <td className="px-4 py-3 text-right">{fmt(row.payments)}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">{fmtDec(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Google Analytics ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("admin.marketing.gaTitle")}
            </CardTitle>
            <CardDescription>
              {t("admin.marketing.gaDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 max-w-md">
              <Label htmlFor="ga-id">{t("admin.marketing.gaLabel")}</Label>
              <Input
                id="ga-id"
                placeholder="G-XXXXXXXXXX"
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.marketing.gaHint")}
              </p>
            </div>
            <Button onClick={saveAnalyticsIds} disabled={saving}>
              {saving ? t("admin.marketing.saving") : t("admin.marketing.save")}
            </Button>
          </CardContent>
        </Card>

        {/* ─── Яндекс.Метрика ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("admin.marketing.ymTitle")}
            </CardTitle>
            <CardDescription>
              {t("admin.marketing.ymDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 max-w-md">
              <Label htmlFor="ym-id">{t("admin.marketing.ymLabel")}</Label>
              <Input
                id="ym-id"
                type="text"
                inputMode="numeric"
                placeholder="12345678"
                value={ymId}
                onChange={(e) => setYmId(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.marketing.ymHint")}
              </p>
            </div>
            <Button onClick={saveAnalyticsIds} disabled={saving}>
              {saving ? t("admin.marketing.saving") : t("admin.marketing.save")}
            </Button>
          </CardContent>
        </Card>

        {message ? (
          <p className={isError ? "text-destructive text-sm" : "text-green-600 dark:text-green-400 text-sm"}>
            {message}
          </p>
        ) : null}
      </div>
  );
}
