import { useState } from "react";
import {
  startTraining,
  logWorkoutSet,
  finishTraining,
  getSessionExercises,
} from "../api/api";
import type {
  GetExercisesResponse,
  LogSetRequest,
  RunnerExercise,
  RunnerSet,
} from "../types/types";
import type { TemplateDetailResponse } from "../types/template-types";
import { getTemplateDetail } from "../api/template-api";

export function useWorkout() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] =
    useState<GetExercisesResponse | null>(null);

  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [distanceInput, setDistanceInput] = useState("");

  const [activeTemplate, setActiveTemplate] =
    useState<TemplateDetailResponse | null>(null);
  const [runnerExercises, setRunnerExercises] = useState<RunnerExercise[]>([]);

  const startWorkout = async () => {
    const res = await startTraining();
    setSessionId(res.session_id);
    setActiveTemplate(null);
    setRunnerExercises([]);
    return res.session_id;
  };

  // Старт тренировки ПО ШАБЛОНУ
  const startTemplateWorkout = async (
    templateId: string,
  ) => {
    const res = await startTraining(templateId);

    const [templateData, sessionExercises] = await Promise.all([
      getTemplateDetail(templateId),
      getSessionExercises(res.session_id).catch(() => []),
    ]);

    setSessionId(res.session_id);
    setActiveTemplate(templateData);

    const completedByExercise = buildCompletedSetsByExercise(sessionExercises);

    const mappedExercises: RunnerExercise[] = templateData.items.map(
      (item) => {
        const completedSets = completedByExercise.get(item.exercise_id);

        return {
          exerciseId: item.exercise_id,
          name: item.name || "Упражнение",
          type: item.type || "EXERCISE_TYPE_DYNAMIC",
          sets: item.target_sets.map((ts) => {
            const completed = completedSets?.get(ts.set_num);

            return {
              setNum: ts.set_num,
              targetWeight: ts.weight,
              targetReps: ts.reps,
              targetDurationSec: ts.duration_seconds,
              targetDistanceM: ts.distance_meters,

              weight: completed
                ? completed.weight
                : ts.weight !== undefined && ts.weight !== null
                  ? String(ts.weight)
                  : "",
              reps: completed
                ? completed.reps
                : ts.reps !== undefined && ts.reps !== null
                  ? String(ts.reps)
                  : "",
              durationSec: completed
                ? completed.durationSec
                : ts.duration_seconds !== undefined &&
                    ts.duration_seconds !== null
                  ? String(ts.duration_seconds)
                  : "",
              distanceM: completed
                ? completed.distanceM
                : ts.distance_meters !== undefined &&
                    ts.distance_meters !== null
                  ? String(ts.distance_meters)
                  : "",

              isCompleted: Boolean(completed),
              setId: completed?.setId,
            };
          }),
        };
      },
    );

    setRunnerExercises(mappedExercises);
    return res.session_id;
  };

  const updateRunnerSetFields = (
    exIdx: number,
    setIdx: number,
    fields: Partial<{
      weight: string;
      reps: string;
      durationSec: string;
      distanceM: string;
    }>,
  ) => {
    setRunnerExercises((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], ...fields };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const toggleRunnerSet = async (exIdx: number, setIdx: number) => {
    if (!sessionId) return;

    const ex = runnerExercises[exIdx];
    const targetSet = ex.sets[setIdx];

    updateRunnerSetState(exIdx, setIdx, { isSaving: true });

    try {
      const weight =
        targetSet.weight !== "" ? parseFloat(targetSet.weight) : undefined;
      const reps =
        targetSet.reps !== "" ? parseInt(targetSet.reps, 10) : undefined;
      const duration_seconds =
        targetSet.durationSec !== ""
          ? parseInt(targetSet.durationSec, 10)
          : undefined;
      const distance_meters =
        targetSet.distanceM !== ""
          ? parseInt(targetSet.distanceM, 10)
          : undefined;

      const payload: LogSetRequest = {
        set_id: targetSet.setId,
        session_id: sessionId,
        exercise_id: ex.exerciseId,
        weight,
        reps,
        duration_seconds,
        distance_meters,
      };

      const res = await logWorkoutSet(payload);

      updateRunnerSetState(exIdx, setIdx, {
        isCompleted: true,
        setId: res.set_id,
        isSaving: false,
      });
    } catch (err) {
      console.error("Ошибка сохранения подхода:", err);
      updateRunnerSetState(exIdx, setIdx, { isSaving: false });
    }
  };

  const updateRunnerSetState = (
    exIdx: number,
    setIdx: number,
    fields: Partial<RunnerSet>,
  ) => {
    setRunnerExercises((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], ...fields };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const saveSet = async (setId: string | null) => {
    if (!activeExercise || !sessionId) return;

    const isCardio = activeExercise.type === "EXERCISE_TYPE_CARDIO";
    const isStatic = activeExercise.type === "EXERCISE_TYPE_STATIC";

    const weight = !isCardio
      ? weightInput !== ""
        ? parseFloat(weightInput)
        : 0
      : undefined;
    const reps =
      !isCardio && !isStatic
        ? repsInput !== ""
          ? parseInt(repsInput, 10)
          : 10
        : undefined;
    const duration_seconds =
      isCardio || isStatic
        ? durationInput !== ""
          ? parseInt(durationInput, 10)
          : 60
        : undefined;
    const distance_meters = isCardio
      ? distanceInput !== ""
        ? parseInt(distanceInput, 10)
        : 1000
      : undefined;

    const payload: LogSetRequest = {
      set_id: setId ?? undefined,
      session_id: sessionId,
      exercise_id: activeExercise.exercise_id,
      weight,
      reps,
      duration_seconds,
      distance_meters,
    };

    await logWorkoutSet(payload);

    setWeightInput("");
    setRepsInput("");
    setDurationInput("");
    setDistanceInput("");
  };

  const finishCurrentWorkout = async () => {
    await finishTraining();
    setSessionId(null);
    setActiveExercise(null);
    setActiveTemplate(null);
    setRunnerExercises([]);
  };

  return {
    sessionId,
    setSessionId,
    activeExercise,
    setActiveExercise,
    weightInput,
    setWeightInput,
    repsInput,
    setRepsInput,
    durationInput,
    setDurationInput,
    distanceInput,
    setDistanceInput,
    activeTemplate,
    runnerExercises,
    startWorkout,
    startTemplateWorkout,
    toggleRunnerSet,
    updateRunnerSetFields,
    saveSet,
    finishCurrentWorkout,
  };
}

function buildCompletedSetsByExercise(
  sessionExercises: RunnerExercise[],
): Map<string, Map<number, RunnerSet>> {
  const result = new Map<string, Map<number, RunnerSet>>();

  for (const ex of sessionExercises) {
    const bySetNum = new Map<number, RunnerSet>();
    for (const set of ex.sets) {
      bySetNum.set(set.setNum, set);
    }
    result.set(ex.exerciseId, bySetNum);
  }

  return result;
}
