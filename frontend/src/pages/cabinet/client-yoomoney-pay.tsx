/**
 * Страница перехода на оплату ЮMoney (форма перевода — с кошелька или с карты).
 * Получает paymentId из query или form из location.state, строит форму и отправляет на yoomoney.ru/quickpay/confirm.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useClientAuth } from "@/contexts/client-auth";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

const YOOMONEY_CONFIRM_URL = "https://yoomoney.ru/quickpay/confirm";

type FormData = { receiver: string; sum: number; label: string; paymentType: string; successURL: string };

export function ClientYooMoneyPayPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useClientAuth();
  const paymentId = searchParams.get("paymentId") ?? "";
  const locationStateForm = (location.state as { form?: FormData } | undefined)?.form;
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(locationStateForm ?? null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!state.token) return;
    if (locationStateForm?.receiver && locationStateForm?.label) {
      setFormData(locationStateForm);
      return;
    }
    if (!paymentId.trim()) {
      setError(t("clientYoomoneyPay.errors.paymentMissing"));
      return;
    }

    api
      .yoomoneyFormPaymentParams(state.token, paymentId)
      .then(setFormData)
    .catch((e) => setError(e instanceof Error ? e.message : t("clientYoomoneyPay.errors.loadFailed")));
  }, [state.token, paymentId, locationStateForm?.label, t]);

  useEffect(() => {
    if (!formData || submittedRef.current || !formRef.current) return;
    submittedRef.current = true;
    formRef.current.submit();
  }, [formData]);

  if (error) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive">{error}</p>
        <button type="button" className="text-primary underline" onClick={() => navigate("/cabinet/profile#topup")}>
          {t("clientYoomoneyPay.backToTopup")}
        </button>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">{t("clientYoomoneyPay.redirecting")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-6">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">{t("clientYoomoneyPay.openingForm")}</p>
      <form ref={formRef} action={YOOMONEY_CONFIRM_URL} method="POST" className="hidden">
        <input name="quickpay-form" value="button" readOnly />
        <input name="receiver" value={formData.receiver} readOnly />
        <input name="sum" value={formData.sum} readOnly />
        <input name="label" value={formData.label} readOnly />
        <input name="paymentType" value={formData.paymentType} readOnly />
        <input name="successURL" value={formData.successURL} readOnly />
      </form>
    </div>
  );
}
