import type { ExerciseTypeEnum } from "./types";

export interface TargetSet {
  set_num: number;
  weight?: number;
  reps?: number;
  duration_seconds?: number;
  distance_meters?: number;
}

export interface CreateTemplateItem {
  exercise_id: string;
  order_index: number;
  target_sets: TargetSet[];
}

export interface CreateTemplateRequest {
  name: string;
  items: CreateTemplateItem[];
}

export interface CreateTemplateResponse {
  template_id: string;
}

export interface TemplateSummaryResponse {
  template_id: string;
  name: string;
  exercises_count: number;
  created_at: string;
}

export interface TemplateDetailItem {
  exercise_id: string;
  name: string;
  type: ExerciseTypeEnum | string;
  order_index: number;
  target_sets: TargetSet[];
}

export interface TemplateDetailResponse {
  template_id: string;
  name: string;
  created_at: string;
  items: TemplateDetailItem[];
}

export interface UpdateTemplateRequest {
  name: string;
  items: TemplateDetailItem[];
}
