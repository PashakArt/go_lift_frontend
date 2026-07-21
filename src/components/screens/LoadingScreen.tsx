import React from 'react';
import type { TenantBranding } from '../../types';

interface LoadingScreenProps {
  status: string;
  branding: TenantBranding;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ status, branding }) => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <p style={{ color: branding.theme.text_color, opacity: 0.7 }}>{status}</p>
      <div style={{ color: branding.theme.primary_color, fontSize: '24px' }}>⏳</div>
    </div>
  );
};