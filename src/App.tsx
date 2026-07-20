import React, { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { init, startTraining, getMuscleGroups, getExercises, getTenantIdFromUrl } from './api';
import type { GetMuscleGroupsResponse, GetExercisesResponse, InitResponse, TenantBranding } from './types';

const getMuscleImage = (imageName: string) => {
  return new URL(`./assets/muscles/${imageName}`, import.meta.url).href;
};

type AppStep = 'LOADING' | 'WELCOME_NEW' | 'MAIN' | 'SELECT_MUSCLE_GROUP' | 'SELECT_EXERCISE';

// Стартовая заглушка, пока не прилетел ответ от бэка
const INITIAL_BRANDING: TenantBranding = {
  theme: {
    mode: "dark",
    text_color: "#FFFFFF",
    accent_color: "#10b981", // Временный изумрудный
    primary_color: "#10b981",
    surface_color: "#1E1E1E",
    background_color: "#121212"
  },
  assets: {
    logo_url: ""
  }
};

function App() {
  const [step, setStep] = useState<AppStep>('LOADING');
  const [tgUser, setTgUser] = useState<{ firstName: string; id: number } | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>('Инициализация...');
  
  // Наш хамелеон-стейт
  const [branding, setBranding] = useState<TenantBranding>(INITIAL_BRANDING);

  const [initData, setInitData] = useState<InitResponse | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<GetMuscleGroupsResponse[]>([]);
  const [exercises, setExercises] = useState<GetExercisesResponse[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const tenantId = getTenantIdFromUrl();

  const isTelegramContext = 
    window.location.href.includes('tgWebAppData') || 
    window.location.href.includes('tgWebAppPlatform') ||
    (window as any).Telegram?.WebApp?.initData !== undefined;

  useEffect(() => {
    if (!isTelegramContext) {
      setStep('MAIN');
      return;
    }

    let attempts = 0;
    
    const checkAndAuth = async () => {
      attempts++;
      let rawData = '';

      try {
        const { initDataRaw, initData: sdkData } = retrieveLaunchParams();
        if (initDataRaw && sdkData?.user) {
          rawData = initDataRaw;
          setTgUser({ firstName: sdkData.user.firstName, id: sdkData.user.id });
        }
      } catch (e) {}

      if (!rawData) {
        const nativeRaw = (window as any).Telegram?.WebApp?.initData;
        const nativeUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
        if (nativeRaw && nativeUser) {
          rawData = nativeRaw;
          setTgUser({ firstName: nativeUser.first_name, id: nativeUser.id });
        }
      }

      if (rawData) {
        try {
          const data = await init(rawData, tenantId);
          setInitData(data);
          
          // Применяем тонкие настройки темы и ассеты из бэка
          setBranding(data.branding);

          if (data.activeSession) {
            setSessionId(data.activeSession.sessionId);
            handleLoadMuscleGroups();
          } else if (data.isNewUser) {
            setStep('WELCOME_NEW');
          } else {
            setStep('MAIN');
          }
          return true;
        } catch (err: any) {
          setBackendStatus(`Ошибка: ${err.message}`);
          return true; 
        }
      }

      if (attempts >= 10) {
        setBackendStatus("Не удалось связаться с Telegram.");
      }
      return false;
    };

    checkAndAuth().then(found => {
      if (!found) {
        const interval = setInterval(async () => {
          const done = await checkAndAuth();
          if (done) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
      }
    });
  }, [isTelegramContext, tenantId]);

  const handleStartWorkout = async () => {
    try {
      setStep('LOADING');
      const res = await startTraining(tenantId);
      setSessionId(res.sessionId);
      await handleLoadMuscleGroups();
    } catch (err: any) {
      alert(`Ошибка старта тренировки: ${err.message}`);
      setStep('MAIN');
    }
  };

  const handleLoadMuscleGroups = async () => {
    try {
      const groups = await getMuscleGroups();
      setMuscleGroups(groups);
      setStep('SELECT_MUSCLE_GROUP');
    } catch (err: any) {
      alert(`Не удалось загрузить группы мышц: ${err.message}`);
    }
  };

  const handleSelectMuscleGroup = async (groupId: string) => {
    try {
      setStep('LOADING');
      setSelectedMuscleGroup(groupId);
      const exerciseList = await getExercises(groupId);
      const sorted = [...exerciseList].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
      setExercises(sorted);
      setStep('SELECT_EXERCISE');
    } catch (err: any) {
      alert(`Не удалось загрузить упражнения: ${err.message}`);
      setStep('SELECT_MUSCLE_GROUP');
    }
  };

  // Выносим цвета в хелперы для удобства чтения JSX
  const { background_color, text_color, primary_color, accent_color, surface_color } = branding.theme;

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'sans-serif', 
      minHeight: '100vh', 
      backgroundColor: background_color, 
      color: text_color,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      
      {/* Шапка с Логотипом */}
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
          {tenantId === '00000000-0000-0000-0000-000000000000' ? 'Розничная сеть GoLift' : `ID зала: ${tenantId}`}
        </small>
      </header>

      {/* Контентная часть */}
      <main style={{ width: '100%', maxWidth: '400px', flex: 1 }}>

        {/* ЭКРАН: Загрузка */}
        {step === 'LOADING' && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <p style={{ color: text_color, opacity: 0.7 }}>{backendStatus}</p>
            <div style={{ color: primary_color, fontSize: '24px' }}>⏳</div>
          </div>
        )}

        {/* ЭКРАН: Приветствие новичка */}
        {step === 'WELCOME_NEW' && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2 style={{ fontSize: '22px' }}>Добро пожаловать! 🎉</h2>
            <p style={{ color: text_color, opacity: 0.7, fontSize: '15px', lineHeight: '1.5' }}>
              Мы поможем тебе удобно вести дневник тренировок, следить за весами и прогрессировать в твоем любимом зале.
            </p>
            <button 
              onClick={() => setStep('MAIN')}
              style={{
                backgroundColor: primary_color, color: '#fff', border: 'none', padding: '14px 28px',
                borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', width: '100%', marginTop: '30px', cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              ПОЕХАЛИ!
            </button>
          </div>
        )}

        {/* ЭКРАН: Главная страница */}
        {step === 'MAIN' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', color: text_color }}>
              Привет, <strong style={{ color: text_color }}>{tgUser?.firstName || 'Атлет'}</strong>!
            </p>
            
            <div style={{ 
              backgroundColor: surface_color, padding: '20px', borderRadius: '16px', margin: '30px 0',
              border: `1px solid ${primary_color}20`, transition: 'background-color 0.3s, border-color 0.3s'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: text_color, opacity: 0.6 }}>Твой статус</p>
              <h3 style={{ margin: '0', fontSize: '18px' }}>Готов к новой тренировке?</h3>
            </div>

            <button 
              onClick={handleStartWorkout}
              style={{
                backgroundColor: primary_color, color: '#fff', border: 'none', padding: '16px 32px',
                borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', width: '100%', cursor: 'pointer',
                boxShadow: `0 4px 14px ${primaryColor}40`,
                transition: 'all 0.3s'
              }}
            >
              НАЧАТЬ ТРЕНИРОВКУ
            </button>
          </div>
        )}

        {/* ЭКРАН: Выбор мышечной группы */}
        {step === 'SELECT_MUSCLE_GROUP' && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>Выберите целевую зону</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {muscleGroups.map(group => (
                <div 
                  key={group.id}
                  onClick={() => handleSelectMuscleGroup(group.id)}
                  style={{
                    backgroundColor: surface_color, borderRadius: '14px', padding: '12px', textAlign: 'center',
                    cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = accent_color}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <img 
                    src={getMuscleImage(group.imageName)} 
                    alt={group.name} 
                    style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '8px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Muscle';
                    }}
                  />
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{group.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ЭКРАН: Выбор упражнения */}
        {step === 'SELECT_EXERCISE' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <button 
                onClick={() => setStep('SELECT_MUSCLE_GROUP')}
                style={{ background: 'none', border: 'none', color: primary_color, cursor: 'pointer', fontSize: '16px' }}
              >
                ← Назад
              </button>
              <h2 style={{ fontSize: '18px', margin: '0 auto' }}>Упражнения</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {exercises.map(ex => (
                <div 
                  key={ex.id}
                  style={{
                    backgroundColor: surface_color, borderRadius: '12px', padding: '12px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: `1px solid ${primary_color}15`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', backgroundColor: background_color, borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                    }}>
                      🏋️‍♂️
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{ex.name}</div>
                      {ex.isFavorite && <small style={{ color: accent_color }}>⭐ Избранное</small>}
                    </div>
                  </div>
                  
                  <button style={{
                    backgroundColor: primary_color, border: 'none', color: '#fff',
                    borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}>
                    Выбрать
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;