import type {
    TemplateSummaryResponse,
    TemplateDetailResponse,
    CreateTemplateRequest,
    CreateTemplateResponse,
    UpdateTemplateRequest,
} from "../types/template-types";
import { getHeaders } from "../utils/get-headers";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function getTemplates(): Promise<TemplateSummaryResponse[]> {
  const response = await fetch(`${BASE_URL}/api/v1/templates`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Не удалось получить список шаблонов");
  }

  return response.json();
}

export async function getTemplateDetail(
  templateId: string,
): Promise<TemplateDetailResponse> {
  const response = await fetch(
    `${BASE_URL}/api/v1/templates/detail/${templateId}`,
    {
      method: "GET",
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Не удалось получить данные шаблона");
  }

  return response.json();
}

export async function createTemplate(
  payload: CreateTemplateRequest,
): Promise<CreateTemplateResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/templates`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Не удалось создать шаблон");
  }

  return response.json();
}

export async function updateTemplate(
  templateId: string,
  payload: UpdateTemplateRequest,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/v1/templates/${templateId}`, {
    method: "PUT",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Не удалось обновить шаблон");
  }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/v1/templates/${templateId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Не удалось удалить шаблон");
  }
}
