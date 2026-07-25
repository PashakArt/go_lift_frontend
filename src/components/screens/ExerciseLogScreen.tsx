import React, { useEffect, useState, useCallback } from 'react';
import type { CompletedSet, GetExercisesResponse, TenantBranding } from '../../types';
import { getCompletedExercises } from '../../api';

interface ExerciseLogScreenProps {
  activeExercise: GetExercisesResponse;
  branding: TenantBranding;
  weightInput: string;
  repsInput: string;
  durationInput: string;
  distanceInput: string;
  setWeightInput: (val: string) => void;
  setRepsInput: (val: string) => void;
  setDurationInput: (val: string) => void;
  setDistanceInput: (val: string) => void;
  onSaveSet: (setId: string | null) => Promise<void> | void; 
  onBackToExercises: () => void;
  onFinishExercise: () => void;
}

export const ExerciseLogScreen: React.FC<ExerciseLogScreenProps> = ({
  activeExercise,
  branding,
  weightInput,
  repsInput,
  durationInput,
  distanceInput,
  setWeightInput,
  setRepsInput,
  setDurationInput,
  setDistanceInput,
  onSaveSet,
  onBackToExercises,
  onFinishExercise,
}) => {
  const { background_color, text_color, primary_color, accent_color, surface_color } = branding.theme;

  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [editingSetId, setEditingSetId] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    try {
      setError(null);
      const sets = await getCompletedExercises(activeExercise.exercise_id);
      setCompletedSets(sets);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки подходов';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeExercise.exercise_id]);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        const sets = await getCompletedExercises(activeExercise.exercise_id);
        if (!isCancelled) {
          setCompletedSets(sets);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Ошибка загрузки подходов';
          setError(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [activeExercise.exercise_id]);

  const handleSelectSetForEdit = (set: CompletedSet) => {
    setEditingSetId(set.set_id);
    setWeightInput(set.weight !== undefined && set.weight !== null ? String(set.weight) : '');
    setRepsInput(set.reps !== undefined && set.reps !== null ? String(set.reps) : '');
    setDurationInput(set.duration_seconds !== undefined && set.duration_seconds !== null ? String(set.duration_seconds) : '');
    setDistanceInput(set.distance_m !== undefined && set.distance_m !== null ? String(set.distance_m) : '');
  };

  const handleCancelEdit = () => {
    setEditingSetId(null);
    setWeightInput('');
    setRepsInput('');
    setDurationInput('');
    setDistanceInput('');
  };

  const handleSaveAndRefresh = async () => {
    await onSaveSet(editingSetId);
    handleCancelEdit();
    await fetchSets();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={onBackToExercises}
          style={{ background: 'none', border: 'none', color: primary_color, cursor: 'pointer', fontSize: '16px' }}
        >
          ← К упражнениям
        </button>
      </div>

      <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>{activeExercise.name}</h2>

      {/* Выполненные подходы */}
      <div style={{ backgroundColor: surface_color, borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, opacity: 0.8 }}>Выполненные подходы:</h4>
          <span style={{ fontSize: '11px', opacity: 0.5 }}>Нажмите для редактирования</span>
        </div>

        {isLoading ? (
          <div style={{ fontSize: '14px', opacity: 0.6, padding: '8px 0' }}>Загрузка подходов...</div>
        ) : error ? (
          <div style={{ fontSize: '13px', color: '#ef4444', padding: '8px 0' }}>{error}</div>
        ) : completedSets.length === 0 ? (
          <div style={{ fontSize: '14px', opacity: 0.5, padding: '8px 0' }}>Подходов пока нет</div>
        ) : (
          completedSets.map((set: CompletedSet) => {
            const isSelected = set.set_id === editingSetId;
            return (
              <div
                key={set.set_id || set.set_number}
                onClick={() => handleSelectSetForEdit(set)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  marginBottom: '4px',
                  borderRadius: '8px',
                  borderBottom: isSelected ? 'none' : '1px solid #333',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  borderLeft: isSelected ? `4px solid ${accent_color}` : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <span>Подход {set.set_number} {isSelected ? '✏️' : ''}</span>
                <strong>
                  {/* СТАТИКА */}
                  {activeExercise.type === 'EXERCISE_TYPE_STATIC' && (
                    <>
                      {set.weight ? `${set.weight} кг × ` : ''}
                      {set.duration_seconds ?? 0} сек
                    </>
                  )}

                  {/* ДИНАМИКА / ВЕС ТЕЛА */}
                  {activeExercise.type !== 'EXERCISE_TYPE_STATIC' && activeExercise.type !== 'EXERCISE_TYPE_CARDIO' && (
                    <>
                      {set.weight ? `${set.weight} кг × ` : ''}
                      {set.reps ?? 0} повт.
                    </>
                  )}

                  {/* КАРДИО */}
                  {activeExercise.type === 'EXERCISE_TYPE_CARDIO' && (
                    <>
                      {set.distance_m !== undefined ? `${set.distance_m} м` : ''}
                      {set.distance_m !== undefined && set.duration_seconds !== undefined ? ' за ' : ''}
                      {set.duration_seconds !== undefined ? `${set.duration_seconds} сек` : ''}
                    </>
                  )}
                </strong>
              </div>
            );
          })
        )}
      </div>

      {/* Карточка добавления/редактирования */}
      <div style={{ backgroundColor: surface_color, borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>
            {editingSetId ? 'Редактировать подход' : 'Добавить подход'}
          </h3>
          {editingSetId && (
            <button
              onClick={handleCancelEdit}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
            >
              Отмена
            </button>
          )}
        </div>

        {/* Форма ввода параметров подхода */}
        {activeExercise.type === 'EXERCISE_TYPE_CARDIO' ? (
          /* КАРДИО: Дистанция + Время */
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Дистанция (м)</label>
              <input
                type="number" value={distanceInput} onChange={(e) => setDistanceInput(e.target.value)} placeholder="1000"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color, boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Время (сек)</label>
              <input
                type="number" value={durationInput} onChange={(e) => setDurationInput(e.target.value)} placeholder="300"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color, boxSizing: 'border-box' }} />
            </div>
          </div>
        ) : activeExercise.type === 'EXERCISE_TYPE_STATIC' ? (
          /* СТАТИКА: Доп. вес + Время удержания */
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Доп. вес (кг)</label>
              <input
                type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="0"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color, boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Время (сек)</label>
              <input
                type="number" value={durationInput} onChange={(e) => setDurationInput(e.target.value)} placeholder="60"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color, boxSizing: 'border-box' }} />
            </div>
          </div>
        ) : (
          /* СИЛОВЫЕ / ВЕС ТЕЛА: Вес + Повторения */
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
                Вес {activeExercise.type === 'EXERCISE_TYPE_BODYWEIGHT' ? '(доп. кг)' : '(кг)'}
              </label>
              <input
                type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="0"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color, boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Повторения</label>
              <input
                type="number" value={repsInput} onChange={(e) => setRepsInput(e.target.value)} placeholder="10"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color, boxSizing: 'border-box' }} />
            </div>
          </div>
        )}

        <button
          onClick={handleSaveAndRefresh}
          style={{
            width: '100%',
            backgroundColor: editingSetId ? primary_color : accent_color,
            border: 'none',
            color: '#fff',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {editingSetId ? '💾 Сохранить изменения' : '+ Записать подход'}
        </button>
      </div>

      {/* Кнопка завершения упражнения */}
      <button
        onClick={onFinishExercise}
        style={{
          width: '100%',
          backgroundColor: primary_color,
          border: 'none',
          color: '#fff',
          padding: '14px',
          borderRadius: '12px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Закончить упражнение
      </button>
    </div>
  );
};