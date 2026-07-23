import React from 'react';
import type { TenantBranding } from '../../types';

interface MainScreenProps {
  userName?: string;
  sessionId: string | null;
  branding: TenantBranding;
  onStartWorkout: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ userName, sessionId, branding, onStartWorkout }) => {
  const { text_color, surface_color, primary_color, accent_color } = branding.theme;

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      {/* Приветствие */}
      <h2 style={{ fontSize: '22px', fontWeight: 600, color: text_color, margin: '0 0 20px 0' }}>
        Привет, {userName || 'Атлет'}! 👋
      </h2>
      
      {/* Карточка состояния */}
      <div style={{ 
        backgroundColor: surface_color, 
        padding: '24px 20px', 
        borderRadius: '16px', 
        margin: '20px 0 28px 0',
        border: `1px solid ${sessionId ? accent_color : primary_color}30`, 
        transition: 'all 0.3s ease'
      }}>
        {sessionId && (
          <div style={{
            display: 'inline-block',
            backgroundColor: `${accent_color}20`,
            color: accent_color,
            fontSize: '12px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '20px',
            marginBottom: '10px'
          }}>
            • Сессия активна
          </div>
        )}

        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: text_color }}>
          {sessionId ? 'Продолжить текущую тренировку' : 'Готов к новой тренировке?'}
        </h3>
      </div>

      {/* Главная кнопка */}
      <button 
        onClick={onStartWorkout}
        style={{
          backgroundColor: primary_color, 
          color: '#ffffff', 
          border: 'none', 
          padding: '16px 24px',
          borderRadius: '14px', 
          fontSize: '16px', 
          fontWeight: 700, 
          letterSpacing: '0.5px',
          width: '100%', 
          cursor: 'pointer',
          boxShadow: `0 6px 20px ${primary_color}40`,
          transition: 'transform 0.1s active, background-color 0.3s'
        }}
      >
        {sessionId ? 'ПРОДОЛЖИТЬ ТРЕНИРОВКУ' : 'НАЧАТЬ ТРЕНИРОВКУ'}
      </button>
    </div>
  );
};