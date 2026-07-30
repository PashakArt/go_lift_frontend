import React from 'react';
import type { RunnerExercise, TenantBranding } from '../../types/types';

interface Props {
  branding: TenantBranding;
  templateName: string;
  exercises: RunnerExercise[];
  onToggleSet: (exIdx: number, setIdx: number) => void;
  onUpdateSet: (exIdx: number, setIdx: number, fields: Partial<{ weight: string; reps: string }>) => void;
  onFinishWorkout: () => void;
}

export const WorkoutRunnerScreen: React.FC<Props> = ({
  branding,
  templateName,
  exercises,
  onToggleSet,
  onUpdateSet,
  onFinishWorkout,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Заголовок тренировки */}
      <div style={{ 
        padding: '16px', 
        borderRadius: '12px', 
        backgroundColor: branding.theme.surface_color,
        border: `1px solid ${branding.theme.accent_color}40`
      }}>
        <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>
          Тренировка по программе
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>📋 {templateName}</div>
      </div>

      {/* Список упражнений */}
      {exercises.map((ex, exIdx) => (
        <div 
          key={ex.exerciseId} 
          style={{ 
            backgroundColor: branding.theme.surface_color, 
            borderRadius: '12px', 
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: branding.theme.primary_color }}>
            {exIdx + 1}. {ex.name}
          </div>

          {/* Таблица подходов */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '35px 1fr 1fr 50px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
              <span>Сет</span>
              <span>План</span>
              <span>Факт</span>
              <span>Статус</span>
            </div>

            {ex.sets.map((s, setIdx) => (
              <div 
                key={setIdx}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '35px 1fr 1fr 50px', 
                  alignItems: 'center',
                  padding: '6px 0',
                  borderRadius: '8px',
                  backgroundColor: s.isCompleted ? `${branding.theme.primary_color}15` : 'transparent',
                  transition: 'background-color 0.2s'
                }}
              >
                {/* Номер подхода */}
                <span style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>{s.setNum}</span>

                {/* План */}
                <span style={{ textAlign: 'center', fontSize: '13px', color: '#AAA' }}>
                  {s.targetWeight ? `${s.targetWeight} кг × ` : ''}{s.targetReps ?? '-'}
                </span>

                {/* Инпуты Факта */}
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={s.weight}
                    onChange={(e) => onUpdateSet(exIdx, setIdx, { weight: e.target.value })}
                    disabled={s.isCompleted}
                    style={{
                      width: '42px',
                      padding: '4px',
                      textAlign: 'center',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      backgroundColor: '#222',
                      color: '#FFF',
                      fontSize: '14px'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#666' }}>×</span>
                  <input
                    type="number"
                    value={s.reps}
                    onChange={(e) => onUpdateSet(exIdx, setIdx, { reps: e.target.value })}
                    disabled={s.isCompleted}
                    style={{
                      width: '42px',
                      padding: '4px',
                      textAlign: 'center',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      backgroundColor: '#222',
                      color: '#FFF',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Чекбокс / Кнопка выполнения */}
                <button
                  onClick={() => onToggleSet(exIdx, setIdx)}
                  disabled={s.isSaving}
                  style={{
                    height: '36px',
                    width: '36px',
                    margin: '0 auto',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: s.isCompleted ? '#2EC4B6' : '#333',
                    color: '#FFF',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: s.isCompleted ? '0 0 10px rgba(46, 196, 182, 0.4)' : 'none'
                  }}
                >
                  {s.isSaving ? '...' : s.isCompleted ? '✓' : ''}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Кнопка Завершения */}
      <button
        onClick={onFinishWorkout}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: '#E63946',
          color: '#FFF',
          fontSize: '16px',
          fontWeight: 'bold',
          marginTop: '10px',
          cursor: 'pointer'
        }}
      >
        Завершить тренировку
      </button>
    </div>
  );
};