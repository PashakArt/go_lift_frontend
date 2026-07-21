import React from 'react';
import type { TenantBranding } from '../types';

interface HeaderProps {
  branding: TenantBranding;
  tenantId: string;
}

export const Header: React.FC<HeaderProps> = ({ branding, tenantId }) => {
  const { primary_color } = branding.theme;
  const isDefaultTenant = tenantId === '00000000-0000-0000-0000-000000000000';

  return (
    <header style={{ marginBottom: '30px', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {branding.assets.logo_url ? (
        <img 
          src={branding.assets.logo_url} 
          alt="Logo" 
          style={{ height: '40px', objectFit: 'contain', marginBottom: '10px' }} 
        />
      ) : (
        <h1 style={{ fontSize: '24px', margin: '0 0 5px 0', color: primary_color, transition: 'color 0.3s' }}>
          GoLift
        </h1>
      )}
      <small style={{ color: '#666' }}>
        {isDefaultTenant ? 'Дефолтный тенант' : `Тенант: ${tenantId}`}
      </small>
    </header>
  );
};