import React from 'react';
import type { TenantBranding } from '../types';

interface HeaderProps {
  branding: TenantBranding;
  tenantId: string;
  sessionId?: string | null;       // 👈 Передаем ID активной сессии
  onFinishWorkout?: () => void;    // 👈 Callback для завершения
}

export const Header: React.FC<HeaderProps> = ({ 
  branding, 
  tenantId, 
  sessionId, 
  onFinishWorkout 
}) => {
  const { primary_color } = branding.theme;
  const isDefaultTenant = tenantId === '00000000-0000-0000-0000-000000000000';

  return (
    <header style={{ marginBottom: '20px', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '5px' }}>
        <div style={{ width: sessionId ? '80px' : '0px' }} />

        {branding.assets.logo_url ? (
          <img 
            src={branding.assets.logo_url} 
            alt="Logo" 
            style={{ height: '40px', objectFit: 'contain' }} 
          />
        ) : (
          <h1 style={{ fontSize: '24px', margin: 0, color: primary_color, transition: 'color 0.3s' }}>
            GoLift
          </h1>
        )}

        {sessionId ? (
          <button
            onClick={onFinishWorkout}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Завершить 🏁
          </button>
        ) : (
          <div style={{ width: '0px' }} />
        )}
      </div>

      <small style={{ color: '#666', fontSize: '11px' }}>
        {isDefaultTenant ? 'Дефолтный тенант' : `Тенант: ${tenantId}`}
      </small>
    </header>
  );
};