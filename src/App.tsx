import React, { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { init, startTraining, getMuscleGroups, getExercises, getTenantIdFromUrl, logWorkoutSet } from './api';
import type { 
  GetMuscleGroupsResponse, 
  GetExercisesResponse, 
  InitResponse, 
  TenantBranding, 
  StartTrainingResponse,
  SelectedExercise,
  SetEntry,
  LogSetRequest
} from './types';

// Динамическая загрузка картинок мышц
const muscleImages = import.meta.glob<{ default: string }>('./assets/muscles/*.png', { eager: true });
const getMuscleImage = (code?: string): string => {
  if (!code) return '';
  const fileName = `./assets/muscles/${code.toLowerCase()}.png`;
  return muscleImages[fileName]?.default || '';
};

// Заготовка под динамическую загрузку картинок упражнений из src/assets/exercises/
const exerciseImages = import.meta.glob<{ default: string }>('./assets/exercises/*.png', { eager: true });
const getExerciseImage = (code?: string): string => {
  if (!code) return '';
  const fileName = `./assets/exercises/${code.toLowerCase()}.png`;
  return exerciseImages[fileName]?.default || '';
};

type AppStep = 'LOADING' | 'WELCOME_NEW' | 'MAIN' | 'SELECT_MUSCLE_GROUP' | 'SELECT_EXERCISE' | 'EXERCISE_LOG';

const INITIAL_BRANDING: TenantBranding = {
  theme: {
    mode: "dark",
    text_color: "#FFFFFF",
    accent_color: "#10b981",
    primary_color: "#10b981",
    surface_color: "#1E1E1E",
    background_color: "#121212"
  },
  assets: {
    logo_url: ""
  }
};

// Мок initData для разработки в обычном браузере
const MOCK_INIT_DATA = "query_id=AAH...&user=%7B%22id%22%3A12345678%2C%22first_name%22%3A%22LocalDev%22%2C%22username%22%3A%22devuser%22%7D";

function App() {
  const [step, setStep] = useState<AppStep>('LOADING');
  const [tgUser, setTgUser] = useState<{ firstName: string; id: number } | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>('Инициализация...');
  
  const [branding, setBranding] = useState<TenantBranding>(INITIAL_BRANDING);
  const [initDataRawState, setInitDataRawState] = useState<string>('');
  
  const [muscleGroups, setMuscleGroups] = useState<GetMuscleGroupsResponse[]>([]);
  const [exercises, setExercises] = useState<GetExercisesResponse[]>([]);
  const [, setSelectedMuscleGroup] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Выбранное упражнение и список сохраненных упражнений с подходами
  const [activeExercise, setActiveExercise] = useState<GetExercisesResponse | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<SelectedExercise[]>([]);

  // Поля ввода для подхода
  const [weightInput, setWeightInput] = useState<string>('');
  const [repsInput, setRepsInput] = useState<string>('');
  const [durationInput, setDurationInput] = useState<string>('');
  const [distanceInput, setDistanceInput] = useState<string>('');

  const tenantId = getTenantIdFromUrl();

  const isTelegramContext = 
    window.location.href.includes('tgWebAppData') || 
    window.location.href.includes('tgWebAppPlatform') ||
    (window as any).Telegram?.WebApp?.initData !== undefined;

  useEffect(() => {
    const auth = async () => {
      let rawData = '';

      // 1. Если мы внутри Telegram (Web или Mobile app)
      if (isTelegramContext) {
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
      }

      // 2. Если мы в ОБЫЧНОМ БРАУЗЕРЕ (localhost) — задействуем Local Mock
      if (!rawData) {
        console.log("🛠️ Обычный браузер detected: авторизуемся через MOCK_INIT_DATA");
        rawData = MOCK_INIT_DATA;
        setTgUser({ firstName: 'Локальный Атлет', id: 77777 });
      }

      // 3. Отправляем запрос на бэкенд
      try {
        setInitDataRawState(rawData);
        setBackendStatus('Авторизация на бэкенде...');

        const data: InitResponse = await init(rawData);
        
        if (data.branding) {
          setBranding(data.branding);
        }

        if (data.has_active_session && data.session_id) {
          setSessionId(data.session_id);
          await handleLoadMuscleGroups(rawData);
        } else if (data.is_new_user) {
          setStep('WELCOME_NEW');
        } else {
          setStep('MAIN');
        }
      } catch (err: any) {
        console.error("Ошибка при init:", err);
        setBackendStatus(`Ошибка бэкенда: ${err.message}`);
      }
    };

    auth();
  }, [isTelegramContext]);

  const handleStartWorkout = async () => {
    try {
      setStep('LOADING');
      const res: StartTrainingResponse = await startTraining();
      setSessionId(res.session_id);
      await handleLoadMuscleGroups(initDataRawState);
    } catch (err: any) {
      alert(`Ошибка старта тренировки: ${err.message}`);
      setStep('MAIN');
    }
  };

  const handleLoadMuscleGroups = async (rawInitData?: string) => {
    try {
      const dataToPass = rawInitData || initDataRawState;
      const groups = await getMuscleGroups(dataToPass);
      setMuscleGroups(groups);
      setStep('SELECT_MUSCLE_GROUP');
    } catch (err: any) {
      alert(`Не удалось загрузить группы мышц: ${err.message}`);
      setStep('MAIN');
    }
  };

  const handleSelectMuscleGroup = async (groupId: string) => {
    try {
      setStep('LOADING');
      setSelectedMuscleGroup(groupId);
      const exerciseList = await getExercises(groupId);
      setExercises(exerciseList);
      setStep('SELECT_EXERCISE');
    } catch (err: any) {
      alert(`Не удалось загрузить упражнения: ${err.message}`);
      setStep('SELECT_MUSCLE_GROUP');
    }
  };

  const handleSelectExercise = (exercise: GetExercisesResponse) => {
    setActiveExercise(exercise);
    setStep('EXERCISE_LOG');
  };

const handleAddSet = async () => {
    if (!activeExercise || !sessionId) {
      alert('Нет активной сессии или не выбрано упражнение');
      return;
    }

    const weight = weightInput ? parseFloat(weightInput) : undefined;
    const reps = repsInput ? parseInt(repsInput, 10) : undefined;
    const duration_seconds = durationInput ? parseInt(durationInput, 10) : undefined;
    const distance_meters = distanceInput ? parseInt(distanceInput, 10) : undefined;

    if (reps === undefined && duration_seconds === undefined && distance_meters === undefined) {
      alert('Укажите повторения, время или дистанцию');
      return;
    }

    // Вычисляем предварительный номер для DTO (если бэкенд требует set_number в request)
    const existingIdx = workoutExercises.findIndex((e) => e.exercise_id === activeExercise.exercise_id);
    const nextSetNumber = existingIdx >= 0 ? workoutExercises[existingIdx].sets.length + 1 : 1;

    const payload: LogSetRequest = {
      session_id: sessionId,
      exercise_id: activeExercise.exercise_id,
      set_number: nextSetNumber,
      weight,
      reps,
      duration_seconds,
      distance_meters,
    };

    try {
      // 1. Получаем реальные set_id и set_number от бэкенда
      const res = await logWorkoutSet(payload);

      // 2. Формируем объект с реальным set_id
      const newSet: SetEntry = {
        set_id: res.set_id,
        set_number: res.set_number || nextSetNumber, // Приоритет номеру от бэка
        weight,
        reps,
        duration_seconds,
        distance_meters,
      };

      setWorkoutExercises((prev) => {
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx].sets.push(newSet);
          return updated;
        } else {
          return [
            ...prev,
            {
              exercise_id: activeExercise.exercise_id,
              name: activeExercise.name,
              type: activeExercise.type,
              sets: [newSet],
            },
          ];
        }
      });

      // 3. Очищаем форму
      setWeightInput('');
      setRepsInput('');
      setDurationInput('');
      setDistanceInput('');
    } catch (err: any) {
      alert(`Ошибка сохранения подхода: ${err.message}`);
    }
  };

  const { background_color, text_color, primary_color, accent_color, surface_color } = branding.theme;
  const currentExerciseData = workoutExercises.find(e => e.exercise_id === activeExercise?.exercise_id);

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
      
      {/* Шапка */}
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
          {tenantId === '00000000-0000-0000-0000-000000000000' ? 'Дефолтный тенант' : `Тенант: ${tenantId}`}
        </small>
      </header>

      {/* Основной экран */}
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
              Мы поможем тебе удобно вести дневник тренировок, следить за весами и прогрессировать.
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
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: text_color, opacity: 0.6 }}>
                {sessionId ? `Активная сессия: ${sessionId.slice(0, 8)}...` : 'Статус'}
              </p>
              <h3 style={{ margin: '0', fontSize: '18px' }}>
                {sessionId ? 'Продолжить тренировку' : 'Готов к новой тренировке?'}
              </h3>
            </div>

            <button 
              onClick={handleStartWorkout}
              style={{
                backgroundColor: primary_color, color: '#fff', border: 'none', padding: '16px 32px',
                borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', width: '100%', cursor: 'pointer',
                boxShadow: `0 4px 14px ${primary_color}40`,
                transition: 'all 0.3s'
              }}
            >
              {sessionId ? 'ПРОДОЛЖИТЬ ТРЕНИРОВКУ' : 'НАЧАТЬ ТРЕНИРОВКУ'}
            </button>
          </div>
        )}

        {/* ЭКРАН: Выбор мышечной группы */}
        {step === 'SELECT_MUSCLE_GROUP' && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>Выберите целевую зону</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {muscleGroups.map(group => {
                const imgSrc = getMuscleImage(group.code);
                return (
                  <div 
                    key={group.muscle_group_id}
                    onClick={() => handleSelectMuscleGroup(group.muscle_group_id)}
                    style={{
                      backgroundColor: surface_color, borderRadius: '14px', padding: '16px 12px', textAlign: 'center',
                      cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s', display: 'flex',
                      flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = accent_color}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    {imgSrc ? (
                      <img src={imgSrc} alt={group.name} style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '10px' }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🏋️‍♂️</div>
                    )}
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{group.name}</div>
                  </div>
                );
              })}
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
              {exercises.map(ex => {
                const exImgSrc = getExerciseImage(ex.name);
                return (
                  <div 
                    key={ex.exercise_id}
                    onClick={() => handleSelectExercise(ex)}
                    style={{
                      backgroundColor: surface_color, borderRadius: '12px', padding: '12px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      border: `1px solid ${primary_color}15`, cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '44px', height: '44px', backgroundColor: background_color, borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                      }}>
                        {exImgSrc ? (
                          <img src={exImgSrc} alt={ex.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '20px' }}>🏋️‍♂️</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{ex.name}</div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectExercise(ex);
                      }}
                      style={{
                        backgroundColor: primary_color, border: 'none', color: '#fff',
                        borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
                        transition: 'background-color 0.3s'
                      }}
                    >
                      Выбрать
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ЭКРАН: Лог подходов конкретного упражнения */}
        {step === 'EXERCISE_LOG' && activeExercise && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <button 
                onClick={() => setStep('SELECT_EXERCISE')}
                style={{ background: 'none', border: 'none', color: primary_color, cursor: 'pointer', fontSize: '16px' }}
              >
                ← К упражнениям
              </button>
            </div>

            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>{activeExercise.name}</h2>

            {/* Выполненные подходы */}
            {currentExerciseData && currentExerciseData.sets.length > 0 && (
              <div style={{ backgroundColor: surface_color, borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Выполненные подходы:</h4>
                {currentExerciseData.sets.map((set: SetEntry) => (
                  <div key={set.set_number} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #333' }}>
                    <span>Подход {set.set_number}</span>
                    <strong>
                      {set.reps !== undefined ? `${set.weight || 0} кг × ${set.reps} повт.` : ''}
                      {set.distance_meters !== undefined || set.duration_seconds !== undefined 
                        ? `${set.distance_meters || 0} м за ${set.duration_seconds || 0} сек` 
                        : ''}
                    </strong>
                  </div>
                ))}
              </div>
            )}

            {/* Форма добавления подхода */}
            <div style={{ backgroundColor: surface_color, borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Добавить подход</h4>
              
              {activeExercise.type === 'EXERCISE_TYPE_CARDIO' ? (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Дистанция (м)</label>
                    <input 
                      type="number" value={distanceInput} onChange={(e) => setDistanceInput(e.target.value)} placeholder="1000"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Время (сек)</label>
                    <input 
                      type="number" value={durationInput} onChange={(e) => setDurationInput(e.target.value)} placeholder="300"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
                      Вес {activeExercise.type === 'EXERCISE_TYPE_BODYWEIGHT' ? '(доп. кг)' : '(кг)'}
                    </label>
                    <input 
                      type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="0"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Повторения</label>
                    <input 
                      type="number" value={repsInput} onChange={(e) => setRepsInput(e.target.value)} placeholder="10"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: background_color, color: text_color }}
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={handleAddSet}
                style={{ width: '100%', backgroundColor: accent_color, border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                + Записать подход
              </button>
            </div>

            <button 
              onClick={() => setStep('SELECT_MUSCLE_GROUP')}
              style={{ width: '100%', backgroundColor: primary_color, border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Закончить упражнение
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;