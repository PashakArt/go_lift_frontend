import React, { useState } from 'react';
import type { TenantBranding, GetExercisesResponse } from '../../types/types';
import { createTemplate } from '../../api/template-api';

interface SetTemplateInput {
  set_number: number;
  target_weight?: number;
  target_reps?: number;
}

interface TemplateEditorScreenProps {
  branding: TenantBranding;
  title: string;
  onTitleChange: (title: string) => void;
  selectedExercisesData: GetExercisesResponse[];
  onAddExerciseRequest: () => void;
  onRemoveExercise: (index: number) => void;
  onBack: () => void;
  onSuccess: () => void;
}

export const TemplateEditorScreen: React.FC<TemplateEditorScreenProps> = ({
  branding,
  title,
  onTitleChange,
  selectedExercisesData,
  onAddExerciseRequest,
  onRemoveExercise,
  onBack,
  onSuccess,
}) => {
  const { surface_color, text_color, primary_color, accent_color } = branding.theme;

  const [setsState, setSetsState] = useState<Record<number, SetTemplateInput[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Получить или инициализировать сеты для конкретного индекса упражнения
  const getSetsForExercise = (exIndex: number): SetTemplateInput[] => {
    return setsState[exIndex] || [
      { set_number: 1, target_weight: 60, target_reps: 10 },
      { set_number: 2, target_weight: 60, target_reps: 10 },
    ];
  };

  const handleAddSet = (exIndex: number) => {
    const currentSets = getSetsForExercise(exIndex);
    const lastSet = currentSets[currentSets.length - 1];

    const updated = [
      ...currentSets,
      {
        set_number: currentSets.length + 1,
        target_weight: lastSet?.target_weight || 0,
        target_reps: lastSet?.target_reps || 0,
      },
    ];

    setSetsState((prev) => ({ ...prev, [exIndex]: updated }));
  };

  const handleSetChange = (
    exIndex: number,
    setIndex: number,
    field: 'target_weight' | 'target_reps',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    const currentSets = [...getSetsForExercise(exIndex)];
    currentSets[setIndex] = {
      ...currentSets[setIndex],
      [field]: numValue,
    };

    setSetsState((prev) => ({ ...prev, [exIndex]: currentSets }));
  };

const handleSave = async () => {
    if (!title.trim()) {
      alert('Укажите название плана');
      return;
    }
    if (selectedExercisesData.length === 0) {
      alert('Добавьте хотя бы одно упражнение');
      return;
    }

    // Приводим данные к интерфейсу CreateTemplateItem и TargetSet
    const payloadExercises = selectedExercisesData.map((ex, exIndex) => {
      const internalSets = getSetsForExercise(exIndex);

      const targetSets = internalSets.map((s, sIdx) => ({
        set_num: s.set_number || sIdx + 1,
        weight: s.target_weight,
        reps: s.target_reps,
      }));

      return {
        exercise_id: ex.exercise_id,
        order_index: exIndex + 1,
        target_sets: targetSets,
      };
    });

    try {
      setIsSubmitting(true);
      await createTemplate({
        name: title,
        items: payloadExercises,
      });
      alert(`План «${title}» успешно создан!`);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка при создании';
      alert(`Ошибка бэкенда: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div style={{ width: '100%', paddingBottom: '40px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: accent_color,
          fontSize: '15px',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '16px',
        }}
      >
        ← Назад к главному экрану
      </button>

      <h2 style={{ color: text_color, fontSize: '24px', margin: '0 0 20px 0' }}>
        Создание плана
      </h2>

      {/* Название плана */}
      <div
        style={{
          backgroundColor: surface_color,
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          border: `1px solid ${text_color}15`,
        }}
      >
        <label style={{ display: 'block', color: `${text_color}80`, fontSize: '13px', marginBottom: '8px' }}>
          Название плана
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Например: Смаевщина"
          style={{
            width: '100%',
            backgroundColor: '#121212',
            border: `1px solid ${text_color}20`,
            borderRadius: '10px',
            padding: '12px',
            color: text_color,
            fontSize: '16px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Выбранные упражнения */}
      {selectedExercisesData.map((ex, exIdx) => {
        const sets = getSetsForExercise(exIdx);

        return (
          <div
            key={`${ex.exercise_id}-${exIdx}`}
            style={{
              backgroundColor: surface_color,
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px',
              border: `1px solid ${text_color}15`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, color: text_color, fontSize: '17px', fontWeight: 600 }}>
                {ex.name}
              </h3>

              <button
                onClick={() => onRemoveExercise(exIdx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF5252',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Удалить
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 1fr',
                gap: '8px',
                fontSize: '12px',
                color: `${text_color}60`,
                marginBottom: '8px',
              }}
            >
              <span>Сет</span>
              <span>Вес (кг)</span>
              <span>Повторы</span>
            </div>

            {sets.map((set, sIdx) => (
              <div
                key={sIdx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 1fr',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ color: `${text_color}80`, fontSize: '14px' }}>
                  #{set.set_number}
                </span>
                <input
                  type="number"
                  value={set.target_weight || ''}
                  onChange={(e) => handleSetChange(exIdx, sIdx, 'target_weight', e.target.value)}
                  style={{
                    backgroundColor: '#121212',
                    border: `1px solid ${text_color}20`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: text_color,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <input
                  type="number"
                  value={set.target_reps || ''}
                  onChange={(e) => handleSetChange(exIdx, sIdx, 'target_reps', e.target.value)}
                  style={{
                    backgroundColor: '#121212',
                    border: `1px solid ${text_color}20`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: text_color,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
              </div>
            ))}

            <button
              onClick={() => handleAddSet(exIdx)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: `1px dashed ${accent_color}60`,
                borderRadius: '10px',
                padding: '10px',
                color: accent_color,
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              + Добавить подход
            </button>
          </div>
        );
      })}

      {/* Кнопка открытия экрана выбора мышц */}
      <button
        onClick={onAddExerciseRequest}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: `1px solid ${accent_color}`,
          borderRadius: '12px',
          padding: '14px',
          color: accent_color,
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '16px',
        }}
      >
        + Добавить упражнение
      </button>

      <button
        onClick={handleSave}
        disabled={isSubmitting}
        style={{
          width: '100%',
          backgroundColor: primary_color,
          border: 'none',
          borderRadius: '12px',
          padding: '16px',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? 'Сохранение...' : 'Сохранить план'}
      </button>
    </div>
  );
};