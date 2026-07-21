import React from 'react';
import type { GetMuscleGroupsResponse, TenantBranding } from '../../types';
import { getMuscleImage } from '../../utils/assets';

interface SelectMuscleGroupScreenProps {
  muscleGroups: GetMuscleGroupsResponse[];
  branding: TenantBranding;
  onSelectGroup: (groupId: string) => void;
}

export const SelectMuscleGroupScreen: React.FC<SelectMuscleGroupScreenProps> = ({
  muscleGroups,
  branding,
  onSelectGroup,
}) => {
  const { surface_color, accent_color } = branding.theme;

  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>Выберите целевую зону</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {muscleGroups.map((group) => {
          const imgSrc = getMuscleImage(group.code);
          return (
            <div 
              key={group.muscle_group_id}
              onClick={() => onSelectGroup(group.muscle_group_id)}
              style={{
                backgroundColor: surface_color, borderRadius: '14px', padding: '16px 12px', textAlign: 'center',
                cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = accent_color)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            >
              {imgSrc ? (
                <img src={imgSrc} alt={group.name} style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '10px' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🏋️‍♂️</div>
              )}
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{group.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};