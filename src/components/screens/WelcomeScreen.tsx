import React from 'react';
import type { TenantBranding } from '../../types/types';

interface WelcomeScreenProps {
  branding: TenantBranding;
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ branding, onStart }) => {
  const { text_color, primary_color } = branding.theme;

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2 style={{ fontSize: '22px' }}>Добро пожаловать! 🎉</h2>
      <p style={{ color: text_color, opacity: 0.7, fontSize: '15px', lineHeight: '1.5' }}>
        Мы поможем тебе удобно вести дневник тренировок, следить за весами и прогрессировать.
      </p>
      <button 
        onClick={onStart}
        style={{
          backgroundColor: primary_color, color: '#fff', border: 'none', padding: '14px 28px',
          borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', width: '100%', marginTop: '30px', cursor: 'pointer',
          transition: 'background-color 0.3s'
        }}
      >
        ПОЕХАЛИ!
      </button>
    </div>
  );
};