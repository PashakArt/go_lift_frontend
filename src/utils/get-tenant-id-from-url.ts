export function getTenantIdFromUrl(): string {
  const DEFAULT_TENANT = "00000000-0000-0000-0000-000000000000";

  // 1. Пробуем достать из стандартных query-параметров URL браузера
  const urlParams = new URLSearchParams(window.location.search);

  // Telegram Mini Apps часто прокидывает start_param в URL как tgWebAppStartParam
  const tenantFromQuery =
    urlParams.get("start_param") || urlParams.get("tgWebAppStartParam");

  if (tenantFromQuery) {
    return tenantFromQuery;
  }

  // 2. Если в URL пусто, пробуем вытащить напрямую из Telegram WebApp SDK (если мы внутри TG)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tgWebApp = (window as any).Telegram?.WebApp;
    if (tgWebApp?.initDataUnsafe?.start_param) {
      return tgWebApp.initDataUnsafe.start_param;
    }
  } catch (e) {
    console.warn("Не удалось прочитать start_param из Telegram SDK", e);
  }

  // 3. Возвращаем дефолтный UUID, если ничего не нашли
  return DEFAULT_TENANT;
}
