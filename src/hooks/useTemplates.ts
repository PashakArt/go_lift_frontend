import { useState } from "react";
import type { GetExercisesResponse } from "../types/types";
import type {
  TemplateDetailResponse,
  TemplateSummaryResponse,
  TemplateDetailItem,
} from "../types/template-types";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateDetail,
  getTemplates,
} from "../api/template-api";

export interface TemplateExerciseItem {
  exercise: GetExercisesResponse;
  sets: { weight: number | null; reps: number | null }[];
}

export function useTemplates() {
  const [templates, setTemplates] = useState<TemplateSummaryResponse[]>([]);
  const [selectedTemplateDetail, setSelectedTemplateDetail] =
    useState<TemplateDetailResponse | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateExercises, setTemplateExercises] = useState<
    TemplateExerciseItem[]
  >([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const fetchTemplates = async () => {
    const list = await getTemplates();
    setTemplates(list);
    return list;
  };

  const fetchTemplateDetail = async (id: string) => {
    const detail = await getTemplateDetail(id);
    setSelectedTemplateDetail(detail);
    return detail;
  };

  const startEditTemplate = () => {
    if (!selectedTemplateDetail) return;
    setEditingTemplateId(selectedTemplateDetail.template_id);
    setTemplateTitle(selectedTemplateDetail.name);

    const mapped: TemplateExerciseItem[] = selectedTemplateDetail.items.map(
      (item) => ({
        exercise: {
          exercise_id: item.exercise_id,
          name: item.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: item.type as any,
          muscle_group_id: "",
        },
        sets: item.target_sets.map((s) => ({
          weight: s.weight ?? null,
          reps: s.reps ?? null,
        })),
      }),
    );

    setTemplateExercises(mapped);
  };

  const resetTemplateForm = () => {
    setTemplateTitle("");
    setTemplateExercises([]);
    setEditingTemplateId(null);
  };

  const addExerciseToTemplate = (exercise: GetExercisesResponse) => {
    setTemplateExercises((prev) => [
      ...prev,
      {
        exercise,
        sets: [
          { weight: 0, reps: 10 },
          { weight: 0, reps: 10 },
        ],
      },
    ]);
  };

  const updateTemplateSet = (
    exIdx: number,
    setIdx: number,
    field: "weight" | "reps",
    value: number | null,
  ) => {
    setTemplateExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exIdx] };
      const nextSets = [...targetEx.sets];
      nextSets[setIdx] = { ...nextSets[setIdx], [field]: value };
      targetEx.sets = nextSets;
      next[exIdx] = targetEx;
      return next;
    });
  };

  const addTemplateSet = (exIdx: number) => {
    setTemplateExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exIdx] };
      const lastSet = targetEx.sets[targetEx.sets.length - 1];
      targetEx.sets = [
        ...targetEx.sets,
        { weight: lastSet?.weight ?? 0, reps: lastSet?.reps ?? 10 },
      ];
      next[exIdx] = targetEx;
      return next;
    });
  };

  const removeTemplateSet = (exIdx: number, setIdx: number) => {
    setTemplateExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exIdx] };
      targetEx.sets = targetEx.sets.filter((_, idx) => idx !== setIdx);
      next[exIdx] = targetEx;
      return next;
    });
  };

  const removeTemplateExercise = (index: number) => {
    setTemplateExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const saveTemplate = async () => {
    if (!templateTitle.trim() || templateExercises.length === 0) return;

    try {
      setIsSavingTemplate(true);
      const items: TemplateDetailItem[] = templateExercises.map(
        (item, idx) => ({
          exercise_id: item.exercise.exercise_id,
          name: item.exercise.name,
          type: item.exercise.type,
          order_index: idx + 1,
          target_sets: item.sets.map((s, sIdx) => ({
            set_num: sIdx + 1,
            weight: s.weight ?? 0,
            reps: s.reps ?? 10,
          })),
        }),
      );

      if (editingTemplateId) {
        await updateTemplate(editingTemplateId, { name: templateTitle, items });
      } else {
        await createTemplate({
          name: templateTitle,
          items: items.map((i) => ({
            exercise_id: i.exercise_id,
            order_index: i.order_index,
            target_sets: i.target_sets,
          })),
        });
      }

      resetTemplateForm();
      await fetchTemplates();
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const removeTemplate = async (templateId: string) => {
    await deleteTemplate(templateId);
    setSelectedTemplateDetail(null);
    await fetchTemplates();
  };

  return {
    templates,
    selectedTemplateDetail,
    editingTemplateId,
    templateTitle,
    templateExercises,
    isSavingTemplate,
    setTemplateTitle,
    fetchTemplates,
    fetchTemplateDetail,
    startEditTemplate,
    resetTemplateForm,
    addExerciseToTemplate,
    updateTemplateSet,
    addTemplateSet,
    removeTemplateSet,
    removeTemplateExercise,
    saveTemplate,
    removeTemplate,
  };
}
