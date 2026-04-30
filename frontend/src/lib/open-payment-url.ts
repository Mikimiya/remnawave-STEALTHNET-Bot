/**
 * Открывает URL платёжной страницы в браузере.
 * В Telegram Mini App — в системном браузере (openLink), иначе — в новой вкладке.
 * Оплаты в WebView мини-аппа делать нельзя, поэтому всегда открываем снаружи.
 *
 * Если браузер заблокировал popup (типично для мобильных при async-цепочке
 * после user gesture — например, после await fetch), делаем top-level
 * навигацию через location.href, чтобы пользователь всё равно попал на
 * платёжную страницу, а не остался на исходной странице кабинета.
 */
export function openPaymentInBrowser(url: string): void {
  if (typeof window === "undefined") return;
  const raw = (window as { Telegram?: { WebApp?: false | { openLink?: (url: string) => void } } }).Telegram?.WebApp;
  const webApp = raw && typeof raw === "object" ? raw : undefined;
  if (webApp?.openLink) {
    try {
      webApp.openLink(url);
      return;
    } catch {
      // fall through to window.open / location.href
    }
  }
  let popup: Window | null = null;
  try {
    popup = window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    popup = null;
  }
  // Popup blocked or returned null → top-level redirect as fallback.
  if (!popup || popup.closed || typeof popup.closed === "undefined") {
    window.location.href = url;
  }
}
