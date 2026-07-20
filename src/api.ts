import type {
  GetExercisesResponse,
  GetMuscleGroupsResponse,
  InitResponse,
  LogSetRequest,
  LogSetResponse,
  StartTrainingResponse,
} from "./types";

// TODO убрать в енвы
// const BASE_URL = "https://b063-185-22-65-230.ngrok-free.app";
const BASE_URL = import.meta.env.VITE_BASE_URL;

console.log(123, BASE_URL);

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

function getHeaders(
  extraHeaders: Record<string, string> = {},
): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function init(initDataRaw: string): Promise<InitResponse> {
  console.log("initDataRaw", initDataRaw);
  const response = await fetch(`${BASE_URL}/api/v1/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      init_data: initDataRaw,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`init error ${response.status}: ${errorText}`);
  }

  const data: InitResponse = await response.json();

  if (data.token) {
    localStorage.setItem("auth_token", data.token);
  }

  return data;
}

export async function startTraining(): Promise<StartTrainingResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/start`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`startTraining error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function getMuscleGroups(
  initDataRaw: string,
): Promise<GetMuscleGroupsResponse[]> {
  console.log("initDataRaw", initDataRaw);
  const response = await fetch(`${BASE_URL}/api/v1/muscle-groups`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`getMuscleGroups error - ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function getExercises(
  muscleGroupId: string,
): Promise<GetExercisesResponse[]> {
  const response = await fetch(
    `${BASE_URL}/api/v1/${muscleGroupId}/exercises`,
    {
      method: "GET",
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`getExercises error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function logWorkoutSet(payload: LogSetRequest): Promise<LogSetResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/workout/sets`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Не удалось сохранить подход");
  }

  return response.json()
}