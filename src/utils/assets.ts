type AssetMap = Record<string, { default: string }>;

const muscleImages: AssetMap = import.meta.glob("/src/assets/muscles/*.png", {
  eager: true,
});

const exerciseImages: AssetMap = import.meta.glob(
  "/src/assets/exercises/*.png",
  { eager: true },
);

export const getMuscleImage = (code?: string): string => {
  if (!code) return "";
  const fileName = `/src/assets/muscles/${code.toLowerCase()}.png`;
  return muscleImages[fileName]?.default || "";
};

export const getExerciseImage = (name?: string): string => {
  if (!name) return "";
  const fileName = `/src/assets/exercises/${name.toLowerCase()}.png`;
  return exerciseImages[fileName]?.default || "";
};
