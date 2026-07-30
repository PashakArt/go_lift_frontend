import React from 'react';
import type { TenantBranding } from '../../../types/types';
import type { TemplateSummaryResponse } from '../../../types/template-types';

interface TemplatesListScreenProps {
  branding: TenantBranding;
  templates: TemplateSummaryResponse[];
  onSelectTemplate: (templateId: string) => void;
  onCreateNew: () => void;
  onBack: () => void;
}

export const TemplatesListScreen: React.FC<TemplatesListScreenProps> = ({
  branding,
  templates,
  onSelectTemplate,
  onCreateNew,
  onBack,
}) => {
  const { surface_color, text_color, primary_color, accent_color } = branding.theme;

  const getExercisesWord = (count: number) => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'упражнений';
    if (lastDigit === 1) return 'упражнение';
    if (lastDigit >= 2 && lastDigit <= 4) return 'упражнения';
    return 'упражнений';
  };

  return (
    <div style={{ width: '100%', paddingBottom: '40px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: accent_color,
          fontSize: '15px',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '16px',
        }}
      >
        ← Главная
      </button>

      <h2 style={{ color: text_color, fontSize: '24px', margin: '0 0 20px 0' }}>
        Мои программы
      </h2>

      {templates.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: `${text_color}60`,
            padding: '40px 20px',
            backgroundColor: surface_color,
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          У вас пока нет сохраненных программ тренировок
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {templates.map((tpl) => (
            <div
              key={tpl.template_id}
              onClick={() => onSelectTemplate(tpl.template_id)}
              style={{
                backgroundColor: surface_color,
                borderRadius: '16px',
                padding: '16px',
                border: `1px solid ${text_color}15`,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ color: text_color, fontWeight: 600, fontSize: '17px' }}>
                  {tpl.name}
                </div>
                <div style={{ color: `${text_color}60`, fontSize: '13px', marginTop: '4px' }}>
                  {tpl.exercises_count} {getExercisesWord(tpl.exercises_count)}
                </div>
              </div>
              <span style={{ color: `${text_color}40`, fontSize: '20px' }}>›</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onCreateNew}
        style={{
          width: '100%',
          backgroundColor: primary_color,
          border: 'none',
          borderRadius: '12px',
          padding: '16px',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        + Создать новый план
      </button>
    </div>
  );
};