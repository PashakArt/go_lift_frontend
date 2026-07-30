import React from 'react';
import type { GetExercisesResponse, TenantBranding } from '../../../types/types';

export interface TemplateExerciseItem {
  exercise: GetExercisesResponse;
  sets: { weight: number | null; reps: number | null }[];
}

interface TemplateEditorScreenProps {
  branding: TenantBranding;
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  exercises: TemplateExerciseItem[];
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number | null) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onAddExerciseClick: () => void;
  onSaveTemplate: () => void;
  onBack: () => void;
  isSaving?: boolean;
  isEditing?: boolean;
}

export const TemplateEditorScreen: React.FC<TemplateEditorScreenProps> = ({
  branding,
  templateName,
  onTemplateNameChange,
  exercises,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onAddExerciseClick,
  onSaveTemplate,
  onBack,
  isSaving = false,
  isEditing = false,
}) => {
  const { surface_color, text_color, primary_color, accent_color } = branding.theme;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
      {/* Сброс спиннеров инпутов */}
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Верхняя навигация */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: accent_color,
          fontSize: '15px',
          fontWeight: 500,
          cursor: 'pointer',
          padding: 0,
          marginBottom: '16px',
        }}
      >
        ← Главная
      </button>

      <h2 style={{ color: text_color, fontSize: '22px', fontWeight: 700, margin: '0 0 20px 0' }}>
        {isEditing ? 'Редактирование плана' : 'Создание плана'}
      </h2>

      {/* Название плана */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', color: `${text_color}80`, fontSize: '13px', marginBottom: '8px' }}>
          Название программы
        </label>
        <input
          type="text"
          placeholder="Например: День ног"
          value={templateName}
          onChange={(e) => onTemplateNameChange(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: surface_color,
            border: `1px solid ${text_color}20`,
            borderRadius: '12px',
            padding: '12px 14px',
            color: text_color,
            fontSize: '15px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Карточки упражнений */}
      {exercises.map((item, exIdx) => (
        <div
          key={`${item.exercise.exercise_id}-${exIdx}`}
          style={{
            backgroundColor: surface_color,
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            border: `1px solid ${text_color}15`,
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          {/* Шапка упражнения */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ color: text_color, fontSize: '16px', fontWeight: 600 }}>
              {item.exercise.name}
            </span>
            <button
              onClick={() => onRemoveExercise(exIdx)}
              style={{
                background: `${text_color}12`,
                border: 'none',
                color: `${text_color}80`,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              title="Удалить упражнение"
            >
              ✕
            </button>
          </div>

          {/* Заголовки столбцов */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 1fr 28px',
              gap: '8px',
              fontSize: '12px',
              color: `${text_color}60`,
              marginBottom: '8px',
              textAlign: 'center',
              alignItems: 'center',
            }}
          >
            <span style={{ textAlign: 'left' }}>Сет</span>
            <span>Вес (кг)</span>
            <span>Повторы</span>
            <span></span>
          </div>

          {/* Список сетов */}
          {item.sets.map((set, setIdx) => (
            <div
              key={setIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 1fr 28px',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span style={{ color: `${text_color}50`, fontSize: '13px', fontWeight: 600 }}>
                #{setIdx + 1}
              </span>

              {/* Инпут Веса */}
              <div style={{ minWidth: 0 }}>
                <input
                  type="number"
                  placeholder="0"
                  value={set.weight ?? ''}
                  onChange={(e) =>
                    onUpdateSet(
                      exIdx,
                      setIdx,
                      'weight',
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  style={{
                    width: '100%',
                    backgroundColor: `${text_color}08`,
                    border: `1px solid ${text_color}15`,
                    borderRadius: '10px',
                    padding: '8px 0',
                    color: text_color,
                    fontSize: '15px',
                    fontWeight: 600,
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Инпут Повторов */}
              <div style={{ minWidth: 0 }}>
                <input
                  type="number"
                  placeholder="0"
                  value={set.reps ?? ''}
                  onChange={(e) =>
                    onUpdateSet(
                      exIdx,
                      setIdx,
                      'reps',
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  style={{
                    width: '100%',
                    backgroundColor: `${text_color}08`,
                    border: `1px solid ${text_color}15`,
                    borderRadius: '10px',
                    padding: '8px 0',
                    color: text_color,
                    fontSize: '15px',
                    fontWeight: 600,
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Удалить сет */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {item.sets.length > 1 ? (
                  <button
                    onClick={() => onRemoveSet(exIdx, setIdx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: `${text_color}40`,
                      fontSize: '14px',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            </div>
          ))}

          {/* Кнопка Добавить сет */}
          <button
            onClick={() => onAddSet(exIdx)}
            style={{
              width: '100%',
              marginTop: '6px',
              backgroundColor: 'transparent',
              border: `1px dashed ${primary_color}60`,
              borderRadius: '10px',
              padding: '10px',
              color: primary_color,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            + Подход
          </button>
        </div>
      ))}

      {/* Кнопка Добавить упражнение */}
      <button
        onClick={onAddExerciseClick}
        style={{
          width: '100%',
          backgroundColor: surface_color,
          border: `1px solid ${primary_color}`,
          borderRadius: '12px',
          padding: '12px',
          color: primary_color,
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '16px',
          boxSizing: 'border-box',
        }}
      >
        + Добавить упражнение
      </button>

      {/* Главная кнопка Сохранить */}
      <button
        onClick={onSaveTemplate}
        disabled={isSaving}
        style={{
          width: '100%',
          backgroundColor: primary_color,
          border: 'none',
          borderRadius: '12px',
          padding: '14px',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 700,
          cursor: isSaving ? 'not-allowed' : 'pointer',
          opacity: isSaving ? 0.7 : 1,
          boxSizing: 'border-box',
        }}
      >
        {isSaving ? 'Сохранение...' : 'Сохранить план'}
      </button>
    </div>
  );
};