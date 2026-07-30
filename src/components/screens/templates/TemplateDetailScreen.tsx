import React, { useState } from 'react';
import type { TenantBranding } from '../../../types/types';
import type { TemplateDetailResponse } from '../../../types/template-types';

interface TemplateDetailScreenProps {
  branding: TenantBranding;
  template: TemplateDetailResponse;
  onDelete: (templateId: string) => void;
  onBack: () => void;
  onEdit: () => void;
}

export const TemplateDetailScreen: React.FC<TemplateDetailScreenProps> = ({
  branding,
  template,
  onDelete,
  onBack,
  onEdit,
}) => {
  const { surface_color, text_color, accent_color, primary_color } = branding.theme;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

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
        ← Назад к списку
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: text_color, fontSize: '24px', margin: 0 }}>
          {template.name}
        </h2>

        <button
            onClick={onEdit}
            style={{
              background: 'none',
              border: 'none',
              color: primary_color,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Изменить
          </button>

        <button
          onClick={() => onDelete(template.template_id)}
          style={{
            background: 'none',
            border: 'none',
            color: '#FF5252',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Удалить
        </button>
      </div>

      {showConfirmDelete && (
        <div
          style={{
            backgroundColor: `${surface_color}`,
            border: '1px solid #FF525250',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: text_color, fontSize: '13px' }}>Удалить этот план?</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowConfirmDelete(false)}
              style={{
                backgroundColor: `${text_color}15`,
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                color: text_color,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Отмена
            </button>
            <button
              onClick={() => onDelete(template.template_id)}
              style={{
                backgroundColor: '#FF5252',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Да, удалить
            </button>
          </div>
        </div>
      )}

      {template.items.map((item) => (
        <div
          key={item.exercise_id}
          style={{
            backgroundColor: surface_color,
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            border: `1px solid ${text_color}15`,
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', color: text_color, fontSize: '17px', fontWeight: 600 }}>
            {item.name}
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 1fr',
              gap: '8px',
              fontSize: '12px',
              color: `${text_color}60`,
              marginBottom: '8px',
            }}
          >
            <span>Сет</span>
            <span>Вес (кг)</span>
            <span>Повторы</span>
          </div>

          {item.target_sets.map((set) => (
            <div
              key={set.set_num}
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 1fr',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '6px',
                fontSize: '14px',
                color: text_color,
              }}
            >
              <span style={{ color: `${text_color}60` }}>#{set.set_num}</span>
              <span>{set.weight ?? '—'}</span>
              <span>{set.reps ?? '—'}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};