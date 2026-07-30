import { useState, useEffect } from "react";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { init } from "../api/api";
import type { TenantBranding, InitResponse } from "../types/types";

const INITIAL_BRANDING: TenantBranding = {
  theme: {
    mode: "dark",
    text_color: "#FFFFFF",
    accent_color: "#2AABEE",
    primary_color: "#2AABEE",
    surface_color: "#1E1E1E",
    background_color: "#121212",
  },
  assets: { logo_url: "https://go-lift.ru/logo.png" },
};

const MOCK_INIT_DATA =
  "query_id=AAH...&user=%7B%22id%22%3A12345678%2C%22first_name%22%3A%22LocalDev%22%2C%22username%22%3A%22devuser%22%7D";

export function useTelegramAuth() {
  const [initDataRaw, setInitDataRaw] = useState<string>("");
  const [branding, setBranding] = useState<TenantBranding>(INITIAL_BRANDING);
  const [backendStatus, setBackendStatus] =
    useState<string>("Инициализация...");
  const [initResponse, setInitResponse] = useState<InitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isTelegramContext = Boolean(
    window.location.href.includes("tgWebAppData") ||
    window.location.href.includes("tgWebAppPlatform") ||
    window.Telegram?.WebApp?.initData,
  );

  useEffect(() => {
    const auth = async () => {
      let rawData = "";

      if (isTelegramContext) {
        try {
          const launchParams = retrieveLaunchParams();
          const sdkData = launchParams.initData as
            | Record<string, unknown>
            | undefined;

        if (typeof launchParams.initDataRaw === "string" && sdkData?.user) {
            rawData = launchParams.initDataRaw;
        }
        } catch {
          // Игнорируем SDK ошибки
        }

        if (!rawData) {
          const nativeRaw = window.Telegram?.WebApp?.initData;
          if (nativeRaw) rawData = nativeRaw;
        }
      }

      if (!rawData) {
        console.warn(
          "⚠️ Telegram Context не найден. Используем MOCK_INIT_DATA",
        );
        rawData = MOCK_INIT_DATA;
      }

      try {
        setInitDataRaw(rawData);
        setBackendStatus("Авторизация на бэкенде...");
        const data = await init(rawData);

        if (data.branding) setBranding(data.branding);
        setInitResponse(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Ошибка инициализации";
        setBackendStatus(`Ошибка бэкенда: ${msg}`);
      } finally {
        setIsLoading(false);
      }
    };

    auth();
  }, [isTelegramContext]);

  return {
    initDataRaw,
    branding,
    backendStatus,
    initResponse,
    isLoading,
    setBackendStatus,
  };
}
