export const ExerciseTypeEnum = {
  DYNAMIC: "EXERCISE_TYPE_DYNAMIC",
  BODYWEIGHT: "EXERCISE_TYPE_BODYWEIGHT",
  CARDIO: "EXERCISE_TYPE_CARDIO",
  STATIC: "EXERCISE_TYPE_STATIC",
} as const;

export type ExerciseTypeEnum =
  (typeof ExerciseTypeEnum)[keyof typeof ExerciseTypeEnum];

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

export interface SetEntry {
  set_id?: string;
  set_number: number;
  weight?: number;
  reps?: number;
  duration_seconds?: number;
  distance_meters?: number;
}

export interface SelectedExercise {
  exercise_id: string;
  name: string;
  type: string;
  sets: SetEntry[];
}

export interface LogSetRequest {
  session_id: string;
  exercise_id: string;
  set_id?: string;
  weight?: number;
  reps?: number;
  duration_seconds?: number;
  distance_meters?: number;
}

export interface LogSetResponse {
  set_id: string;
  set_number: number;
}

export interface CompletedSet {
  set_id: string;
  set_number: number;
  weight?: number;
  reps?: number;
  duration_seconds?: number;
  distance_m?: number;
}

export interface TrainingDaysResponse {
  days: string[];
}

interface WorkoutSessionDayDetail {
  session_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  exercises: SelectedExercise[];
}

export interface WorkoutsForDayResponse {
  date: string;
  sessions: WorkoutSessionDayDetail[];
}