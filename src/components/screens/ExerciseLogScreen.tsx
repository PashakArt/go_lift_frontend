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
  onAddSet: () => Promise<void> | void;
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
  onAddSet,
  onBackToExercises,
  onFinishExercise,
}) => {
  const { background_color, text_color, primary_color, accent_color, surface_color } = branding.theme;

  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(true);
      
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

  // Обертка над добавлением подхода, чтобы обновлять список подходов
  const handleAddSetAndRefresh = async () => {
    await onAddSet();
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
        <h4 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Выполненные подходы:</h4>

        {isLoading ? (
          <div style={{ fontSize: '14px', opacity: 0.6, padding: '8px 0' }}>Загрузка подходов...</div>
        ) : error ? (
          <div style={{ fontSize: '13px', color: '#ef4444', padding: '8px 0' }}>{error}</div>
        ) : completedSets.length === 0 ? (
          <div style={{ fontSize: '14px', opacity: 0.5, padding: '8px 0' }}>Подходов пока нет</div>
        ) : (
          completedSets.map((set: CompletedSet) => (
            <div 
              key={set.set_number} 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}
            >
              <span>Подход {set.set_number}</span>
              <strong>
                {/* Силовые / Вес тела */}
                {set.reps !== undefined && `${set.weight ?? 0} кг × ${set.reps} повт.`}

                {/* Кардио / Время и Дистанция */}
                {(set.distance_m !== undefined || set.duration_sec !== undefined) && (
                  <>
                    {set.distance_m !== undefined ? `${set.distance_m} м` : ''}
                    {set.distance_m !== undefined && set.duration_sec !== undefined ? ' за ' : ''}
                    {set.duration_sec !== undefined ? `${set.duration_sec} сек` : ''}
                  </>
                )}
              </strong>
            </div>
          ))
        )}
      </div>

      {/* Форма добавления подхода */}
      <div style={{ backgroundColor: surface_color, borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0' }}>Добавить подход</h4>
        
        {activeExercise.type === 'EXERCISE_TYPE_CARDIO' ? (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Дистанция (м)</label>
              <input 
                type="number" value={distanceInput} onChange={(e) => setDistanceInput(e.target.value)} placeholder="1000"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Время (сек)</label>
              <input 
                type="number" value={durationInput} onChange={(e) => setDurationInput(e.target.value)} placeholder="300"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
                Вес {activeExercise.type === 'EXERCISE_TYPE_BODYWEIGHT' ? '(доп. кг)' : '(кг)'}
              </label>
              <input 
                type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="0"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Повторения</label>
              <input 
                type="number" value={repsInput} onChange={(e) => setRepsInput(e.target.value)} placeholder="10"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color }}
              />
            </div>
          </div>
        )}

        <button 
          onClick={handleAddSetAndRefresh}
          style={{ width: '100%', backgroundColor: accent_color, border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Записать подход
        </button>
      </div>

      <button 
        onClick={onFinishExercise}
        style={{ width: '100%', backgroundColor: primary_color, border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        Закончить упражнение
      </button>
    </div>
  );
};