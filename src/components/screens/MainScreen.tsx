import React, { useEffect, useState } from 'react';
import type { SetEntry, TenantBranding, WorkoutsForDayResponse } from '../../types';
import { getTrainingDays, getWorkoutsForDay } from '../../api';

interface MainScreenProps {
  userName?: string;
  sessionId: string | null;
  branding: TenantBranding;
  onStartWorkout: () => void;
}

const formatSetDetails = (set: SetEntry) => {
  const parts: string[] = [];

  // Вес
  if (set.weight) {
    parts.push(`${set.weight}кг`);
  }

  // Повторения
  if (set.reps) {
    parts.push(`${set.reps} повт`);
  }

  // Время (статические упражнения / планка)
  if (set.duration_seconds) {
    const min = Math.floor(set.duration_seconds / 60);
    const sec = set.duration_seconds % 60;
    if (min > 0) {
      parts.push(`${min}м ${sec}с`);
    } else {
      parts.push(`${sec} сек`);
    }
  }

  // Дистанция
  if (set.distance_meters) {
    parts.push(`${set.distance_meters}м`);
  }

  return parts.join(" × ");
};


const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type CalendarView = 'DAYS' | 'MONTHS' | 'YEARS';

export const MainScreen: React.FC<MainScreenProps> = ({ 
  userName, 
  sessionId, 
  branding, 
  onStartWorkout 
}) => {
  const { text_color, surface_color, primary_color, accent_color } = branding.theme;

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [trainingDays, setTrainingDays] = useState<Set<string>>(new Set());
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // Состояния для выбранного дня и просмотра тренировки
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [dayWorkouts, setDayWorkouts] = useState<WorkoutsForDayResponse | null>(null);
  const [isLoadingDayDetails, setIsLoadingDayDetails] = useState(false);

  const [viewMode, setViewMode] = useState<CalendarView>('DAYS');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Загружаем дни с тренировками при смене месяца/года
  useEffect(() => {
    let isMounted = true;

    const fetchCalendar = async () => {
      setIsLoadingCalendar(true);
      try {
        const data = await getTrainingDays(year, month + 1);
        if (isMounted) {
          setTrainingDays(new Set(data.days));
        }
      } catch (err) {
        console.error("Ошибка при загрузке календаря:", err);
      } finally {
        if (isMounted) {
          setIsLoadingCalendar(false);
        }
      }
    };

    fetchCalendar();

    return () => {
      isMounted = false;
    };
  }, [year, month]);

  // Загрузка детальных тренировок за конкретный выбранный день
  const handleSelectDay = async (dateStr: string, hasWorkout: boolean) => {
    setSelectedDateStr(dateStr);
    if (!hasWorkout) {
      setDayWorkouts(null);
      return;
    }

    setIsLoadingDayDetails(true);
    try {
      const data = await getWorkoutsForDay(dateStr);
      setDayWorkouts(data);
    } catch (err) {
      console.error("Ошибка при загрузке детальной тренировки:", err);
      setDayWorkouts(null);
    } finally {
      setIsLoadingDayDetails(false);
    }
  };

  const handlePrev = () => {
    if (viewMode === 'DAYS') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'MONTHS') {
      setCurrentDate(new Date(year - 1, month, 1));
    } else if (viewMode === 'YEARS') {
      setCurrentDate(new Date(year - 10, month, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'DAYS') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'MONTHS') {
      setCurrentDate(new Date(year + 1, month, 1));
    } else if (viewMode === 'YEARS') {
      setCurrentDate(new Date(year + 10, month, 1));
    }
  };

  const handleTitleClick = () => {
    if (viewMode === 'DAYS') {
      setViewMode('MONTHS');
    } else if (viewMode === 'MONTHS') {
      setViewMode('YEARS');
    } else {
      setViewMode('DAYS');
    }
  };

  const handleSelectMonth = (selectedMonthIndex: number) => {
    setCurrentDate(new Date(year, selectedMonthIndex, 1));
    setViewMode('DAYS');
  };

  const handleSelectYear = (selectedYear: number) => {
    setCurrentDate(new Date(selectedYear, month, 1));
    setViewMode('MONTHS');
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  const formatDayString = (dayNum: number) => {
    const m = (month + 1).toString().padStart(2, "0");
    const d = dayNum.toString().padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const currentRealYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 12 }, (_, i) => currentRealYear - 9 + i);

  return (
    <div style={{ textAlign: 'center', width: '100%', paddingBottom: '30px' }}>
      {/* Приветствие */}
      <h2 style={{ fontSize: '22px', fontWeight: 600, color: text_color, margin: '0 0 20px 0' }}>
        Привет, {userName || 'Атлет'}! 👋
      </h2>
      
      {/* Карточка состояния */}
      <div style={{ 
        backgroundColor: surface_color, 
        padding: '24px 20px', 
        borderRadius: '16px', 
        margin: '20px 0 20px 0',
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
            • Тренировка активна
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
          transition: 'transform 0.1s active, background-color 0.3s',
          marginBottom: '24px'
        }}
      >
        {sessionId ? 'ПРОДОЛЖИТЬ ТРЕНИРОВКУ' : 'НАЧАТЬ ТРЕНИРОВКУ'}
      </button>

      {/* Виджет Календаря Активности */}
      <div style={{
        backgroundColor: surface_color,
        borderRadius: '16px',
        padding: '16px',
        border: `1px solid ${text_color}10`
      }}>
        {/* Шапка Календаря */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px' 
        }}>
          <button 
            onClick={handlePrev} 
            style={{
              background: `${text_color}10`,
              border: 'none',
              color: text_color,
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            ‹
          </button>
          
          <button
            onClick={handleTitleClick}
            style={{
              background: 'none',
              border: 'none',
              color: text_color,
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
          >
            {viewMode === 'DAYS' && `${MONTH_NAMES[month]} ${year} ▾`}
            {viewMode === 'MONTHS' && `${year} ▾`}
            {viewMode === 'YEARS' && `Выберите год ▾`}
          </button>
          
          <button 
            onClick={handleNext} 
            style={{
              background: `${text_color}10`,
              border: 'none',
              color: text_color,
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            ›
          </button>
        </div>

        {/* 1. РЕЖИМ ДНЕЙ */}
        {viewMode === 'DAYS' && (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '4px', 
              marginBottom: '8px' 
            }}>
              {WEEKDAYS.map((day) => (
                <span key={day} style={{ fontSize: '11px', color: `${text_color}60`, fontWeight: 600 }}>
                  {day}
                </span>
              ))}
            </div>

            {isLoadingCalendar ? (
              <div style={{ padding: '20px 0', fontSize: '13px', color: `${text_color}60` }}>
                Загрузка дней...
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = formatDayString(dayNum);
                  const hasWorkout = trainingDays.has(dateStr);
                  const isSelected = selectedDateStr === dateStr;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleSelectDay(dateStr, hasWorkout)}
                      style={{
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: hasWorkout ? primary_color : (isSelected ? `${text_color}20` : 'transparent'),
                        color: hasWorkout ? '#ffffff' : text_color,
                        fontWeight: hasWorkout ? 700 : 400,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: hasWorkout ? `0 2px 8px ${primary_color}60` : 'none',
                        border: isSelected && !hasWorkout ? `1px solid ${text_color}60` : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 2. РЕЖИМ ВЫБОРА МЕСЯЦА */}
        {viewMode === 'MONTHS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '8px 0' }}>
            {MONTH_NAMES.map((mName, idx) => {
              const isCurrent = idx === month;
              return (
                <button
                  key={mName}
                  onClick={() => handleSelectMonth(idx)}
                  style={{
                    backgroundColor: isCurrent ? primary_color : `${text_color}10`,
                    color: isCurrent ? '#ffffff' : text_color,
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 0',
                    fontSize: '13px',
                    fontWeight: isCurrent ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {mName.slice(0, 3)}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. РЕЖИМ ВЫБОРА ГОДА */}
        {viewMode === 'YEARS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '8px 0' }}>
            {yearsList.map((yNum) => {
              const isCurrent = yNum === year;
              return (
                <button
                  key={yNum}
                  onClick={() => handleSelectYear(yNum)}
                  style={{
                    backgroundColor: isCurrent ? primary_color : `${text_color}10`,
                    color: isCurrent ? '#ffffff' : text_color,
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 0',
                    fontSize: '13px',
                    fontWeight: isCurrent ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {yNum}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Детальная информация по выбранной дате */}
      {selectedDateStr && (
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <h4 style={{ color: text_color, fontSize: '15px', margin: '0 0 10px 4px', opacity: 0.8 }}>
            Тренировки за {selectedDateStr}:
          </h4>

          {isLoadingDayDetails ? (
            <div style={{ color: `${text_color}60`, fontSize: '13px', padding: '12px', textAlign: 'center' }}>
              Загрузка деталей...
            </div>
          ) : dayWorkouts && dayWorkouts.sessions.length > 0 ? (
            dayWorkouts.sessions.map((sess, idx) => (
              <div 
                key={sess.session_id || idx}
                style={{
                  backgroundColor: surface_color,
                  borderRadius: '14px',
                  padding: '14px',
                  marginBottom: '12px',
                  border: `1px solid ${text_color}15`
                }}
              >
                <div style={{ color: primary_color, fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  Тренировка #{idx + 1} {sess.duration_seconds > 0 && `• ${Math.round(sess.duration_seconds / 60)} мин`}
                </div>

                {sess.exercises.map((ex) => (
                  <div key={ex.exercise_id} style={{ marginBottom: '10px' }}>
                    <div style={{ color: text_color, fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                      {ex.name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {ex.sets.map((set, sIdx) => {
                        const details = formatSetDetails(set);
                        return (
                          <span 
                            key={set.set_id || sIdx}
                            style={{
                              backgroundColor: `${text_color}10`,
                              color: text_color,
                              fontSize: '12px',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            #{set.set_number}{details ? `: ${details}` : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div style={{ color: `${text_color}60`, fontSize: '13px', padding: '12px', textAlign: 'center', backgroundColor: surface_color, borderRadius: '12px' }}>
              В этот день тренировок не было 😴
            </div>
          )}
        </div>
      )}
    </div>
  );
};