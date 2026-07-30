import React from 'react';
import type { TenantBranding } from '../../types/types';
import type { TemplateSummaryResponse } from '../../types/template-types';

interface Props {
  isOpen: boolean;
  branding: TenantBranding;
  templates: TemplateSummaryResponse[];
  onSelectFree: () => void;
  onSelectTemplate: (templateId: string) => void;
  onClose: () => void;
}

export const StartWorkoutModal: React.FC<Props> = ({
  isOpen,
  branding,
  templates,
  onSelectFree,
  onSelectTemplate,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 1000
    }}>
      <div style={{
        width: '100%',
        backgroundColor: branding.theme.surface_color,
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Формат тренировки</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {templates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Выбрать программу</div>
            {templates.map((t) => (
              <button
                key={t.template_id}
                onClick={() => onSelectTemplate(t.template_id)}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: `1px solid ${branding.theme.primary_color}`,
                  backgroundColor: 'transparent',
                  color: branding.theme.text_color,
                  textAlign: 'left',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                📋 {t.name}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onSelectFree}
          style={{
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: branding.theme.primary_color,
            color: '#FFF',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          ⚡ Свободная тренировка
        </button>
      </div>
    </div>
  );
};