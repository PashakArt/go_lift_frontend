import React from 'react';
import type { TenantBranding } from '../../types';

interface MainScreenProps {
  userName?: string;
  sessionId: string | null;
  branding: TenantBranding;
  onStartWorkout: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ userName, sessionId, branding, onStartWorkout }) => {
  const { text_color, surface_color, primary_color } = branding.theme;

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '18px', color: text_color }}>
        Привет, <strong style={{ color: text_color }}>{userName || 'Атлет'}</strong>!
      </p>
      
      <div style={{ 
        backgroundColor: surface_color, padding: '20px', borderRadius: '16px', margin: '30px 0',
        border: `1px solid ${primary_color}20`, transition: 'background-color 0.3s, border-color 0.3s'
      }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: text_color, opacity: 0.6 }}>
          {sessionId ? `Активная сессия: ${sessionId.slice(0, 8)}...` : 'Статус'}
        </p>
        <h3 style={{ margin: '0', fontSize: '18px' }}>
          {sessionId ? 'Продолжить тренировку' : 'Готов к новой тренировке?'}
        </h3>
      </div>

      <button 
        onClick={onStartWorkout}
        style={{
          backgroundColor: primary_color, color: '#fff', border: 'none', padding: '16px 32px',
          borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', width: '100%', cursor: 'pointer',
          boxShadow: `0 4px 14px ${primary_color}40`,
          transition: 'all 0.3s'
        }}
      >
        {sessionId ? 'ПРОДОЛЖИТЬ ТРЕНИРОВКУ' : 'НАЧАТЬ ТРЕНИРОВКУ'}
      </button>
    </div>
  );
};