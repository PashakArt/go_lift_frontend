import { useState } from "react";
import { startTraining, logWorkoutSet, finishTraining } from "../api/api";
import type { GetExercisesResponse, LogSetRequest } from "../types/types";

export function useWorkout() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] =
    useState<GetExercisesResponse | null>(null);

  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [distanceInput, setDistanceInput] = useState("");

  const startWorkout = async () => {
    const res = await startTraining();
    setSessionId(res.session_id);
    return res.session_id;
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
    startWorkout,
    saveSet,
    finishCurrentWorkout,
  };
}
