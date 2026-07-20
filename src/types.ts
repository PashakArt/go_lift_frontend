enum ExerciseTypeEnum {
  DYNAMIC = "EXERCISE_TYPE_DYNAMIC",
  BODYWEIGHT = "EXERCISE_TYPE_BODYWEIGHT",
}

interface TenantTheme {
  mode: "dark" | "light";
  text_color: string;
  accent_color: string;
  primary_color: string;
  surface_color: string;
  background_color: string;
}

interface TenantAssets {
  logo_url: string;
}

export interface TenantBranding {
  theme: TenantTheme;
  assets: TenantAssets;
}

export interface InitResponse {
  user_id: string;
  token: string;
  has_active_session: boolean;
  session_id: string;
  is_new_user: boolean;
  branding: TenantBranding;
}

export interface StartTrainingResponse {
    session_id: string;
}

export interface GetMuscleGroupsResponse {
  muscle_group_id: string;
  code: string;
  name: string;
}

export interface GetExercisesResponse {
  exercise_id: string;
  name: string;
  type: ExerciseTypeEnum;
}