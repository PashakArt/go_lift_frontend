import React from 'react';
import type { TenantBranding } from '../types';

interface HeaderProps {
  branding: TenantBranding;
  tenantId: string;
  sessionId?: string | null;
  onFinishWorkout?: () => void;
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
    <header style={{ marginBottom: '16px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ width: sessionId ? '90px' : '0px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {branding.assets.logo_url ? (
            <img 
              src={branding.assets.logo_url} 
              alt="Logo" 
              style={{ height: '52px', maxWidth: '180px', objectFit: 'contain' }} 
            />
          ) : (
            <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 700, color: primary_color }}>
              GoLift
            </h1>
          )}
        </div>

        {sessionId ? (
          <button
            onClick={onFinishWorkout}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
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

      {!isDefaultTenant && (
        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <small style={{ color: '#888', fontSize: '11px' }}>
            {tenantId}
          </small>
        </div>
      )}
    </header>
  );
};