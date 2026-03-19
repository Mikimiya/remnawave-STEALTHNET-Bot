import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { state, updateAdmin } = useAuth();
  const navigate = useNavigate();
  const token = state.accessToken;
  const { t } = useTranslation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPass !== confirm) {
      setError(t("admin.changePass.mismatch"));
      return;
    }
    if (newPass.length < 8) {
      setError(t("admin.changePass.minLength"));
      return;
    }
    if (!token) {
      setError(t("admin.noAccess"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.changePassword(current, newPass, token);
      if (res.admin) updateAdmin(res.admin);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.changePass.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.changePass.title")}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("admin.changePass.subtitle")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="current">{t("admin.changePass.currentLabel")}</Label>
                <Input
                  id="current"
                  type="password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">{t("admin.changePass.newLabel")}</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("admin.changePass.confirmLabel")}</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("admin.saving") : t("admin.changePass.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
