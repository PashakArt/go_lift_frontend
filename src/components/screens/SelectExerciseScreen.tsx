import React from 'react';
import type { GetExercisesResponse, TenantBranding } from '../../types';
import { getExerciseImage } from '../../utils/assets';

interface SelectExerciseScreenProps {
  exercises: GetExercisesResponse[];
  branding: TenantBranding;
  onSelectExercise: (exercise: GetExercisesResponse) => void;
  onBack: () => void;
}

export const SelectExerciseScreen: React.FC<SelectExerciseScreenProps> = ({
  exercises,
  branding,
  onSelectExercise,
  onBack,
}) => {
  const { surface_color, primary_color, background_color } = branding.theme;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: primary_color, cursor: 'pointer', fontSize: '16px' }}
        >
          ← Назад
        </button>
        <h2 style={{ fontSize: '18px', margin: '0 auto' }}>Упражнения</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {exercises.map((ex) => {
          const exImgSrc = getExerciseImage(ex.name);
          return (
            <div 
              key={ex.exercise_id}
              onClick={() => onSelectExercise(ex)}
              style={{
                backgroundColor: surface_color, borderRadius: '12px', padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: `1px solid ${primary_color}15`, cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '44px', height: '44px', backgroundColor: background_color, borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {exImgSrc ? (
                    <img src={exImgSrc} alt={ex.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '20px' }}>🏋️‍♂️</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{ex.name}</div>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectExercise(ex);
                }}
                style={{
                  backgroundColor: primary_color, border: 'none', color: '#fff',
                  borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
              >
                Выбрать
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};