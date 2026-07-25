import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { init, startTraining, getMuscleGroups, getExercises, getTenantIdFromUrl, logWorkoutSet, finishTraining } from './api';
import type { 
  GetMuscleGroupsResponse, 
  GetExercisesResponse, 
  InitResponse, 
  TenantBranding, 
  SelectedExercise,
  LogSetRequest
} from './types';

import { Header } from './components/Header';
import { LoadingScreen } from './components/screens/LoadingScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { MainScreen } from './components/screens/MainScreen';
import { SelectMuscleGroupScreen } from './components/screens/SelectMuscleGroupScreen';
import { SelectExerciseScreen } from './components/screens/SelectExerciseScreen';
import { ExerciseLogScreen } from './components/screens/ExerciseLogScreen';

type AppStep = 'LOADING' | 'WELCOME_NEW' | 'MAIN' | 'SELECT_MUSCLE_GROUP' | 'SELECT_EXERCISE' | 'EXERCISE_LOG';

const INITIAL_BRANDING: TenantBranding = {
  theme: {
    mode: "dark",
    text_color: "#FFFFFF",
    accent_color: "#2AABEE",  
    primary_color: "#2AABEE", 
    surface_color: "#1E1E1E",
    background_color: "#121212",
  },
  assets: { logo_url: "https://go-lift.ru/logo.png" }
};

const MOCK_INIT_DATA = "query_id=AAH...&user=%7B%22id%22%3A12345678%2C%22first_name%22%3A%22LocalDev%22%2C%22username%22%3A%22devuser%22%7D";

export default function App() {
  const [step, setStep] = useState<AppStep>('LOADING');
  const [tgUser, setTgUser] = useState<{ firstName: string; id: number } | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>('Инициализация...');
  const [branding, setBranding] = useState<TenantBranding>(INITIAL_BRANDING);
  const [initDataRawState, setInitDataRawState] = useState<string>('');
  
  const [muscleGroups, setMuscleGroups] = useState<GetMuscleGroupsResponse[]>([]);
  const [exercises, setExercises] = useState<GetExercisesResponse[]>([]);
  const [, setSelectedMuscleGroup] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [activeExercise, setActiveExercise] = useState<GetExercisesResponse | null>(null);
  const [, setWorkoutExercises] = useState<SelectedExercise[]>([]);

  const [weightInput, setWeightInput] = useState<string>('');
  const [repsInput, setRepsInput] = useState<string>('');
  const [durationInput, setDurationInput] = useState<string>('');
  const [distanceInput, setDistanceInput] = useState<string>('');

  const tenantId = getTenantIdFromUrl();
  const isTelegramContext = Boolean(
    window.location.href.includes('tgWebAppData') || 
    window.location.href.includes('tgWebAppPlatform') ||
    window.Telegram?.WebApp?.initData
  );

  const handleLoadMuscleGroups = async (rawInitData?: string) => {
    try {
      const groups = await getMuscleGroups(rawInitData || initDataRawState);
      setMuscleGroups(groups);
      setStep('SELECT_MUSCLE_GROUP');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      alert(`Не удалось загрузить группы мышц: ${msg}`);
      setStep('MAIN');
    }
  };

  const handleFinishWorkout = async () => {
    const confirmFinish = window.confirm('Вы уверены, что хотите завершить тренировку?');
    if (!confirmFinish) return;

    try {
      setStep('LOADING');
      setBackendStatus('Завершение тренировки...');
      
      await finishTraining();
      
      // Сбрасываем локальное состояние тренировки
      setSessionId(null);
      setWorkoutExercises([]);
      setActiveExercise(null);
      setSelectedMuscleGroup(null);
      
      // Возвращаем пользователя на главный экран
      setStep('MAIN');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      alert(`Не удалось завершить тренировку: ${msg}`);
      setStep('EXERCISE_LOG'); // Возвращаем назад в случае ошибки
    }
  };

  useEffect(() => {
    const auth = async () => {
      let rawData = '';

      // 1. Пробуем аккуратно достать данные из Telegram SDK или Telegram WebApp
      if (isTelegramContext) {
        try {
          const launchParams = retrieveLaunchParams();
          const initDataRaw = typeof launchParams.initDataRaw === 'string' ? launchParams.initDataRaw : '';

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sdkData = launchParams.initData as Record<string, any> | undefined;
          if (initDataRaw && sdkData?.user) {
            rawData = initDataRaw;
            setTgUser({ firstName: sdkData.user.firstName, id: sdkData.user.id });
          }
        } catch {
          // Игнорируем SDK ошибки, если запустились вне Telegram
        }

        if (!rawData) {
          const nativeRaw = window.Telegram?.WebApp?.initData;
          const nativeUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
          if (nativeRaw && nativeUser) {
            rawData = nativeRaw;
            setTgUser({ firstName: nativeUser.first_name, id: nativeUser.id });
          }
        }
      }

      // 2. Если мы на Localhost и данные не появились — берем MOCK_INIT_DATA
      if (!rawData) {
        console.warn("⚠️ Telegram Context не найден. Используем MOCK_INIT_DATA для разработки");
        rawData = MOCK_INIT_DATA;
        setTgUser({ firstName: 'Локальный Атлет', id: 77777 });
      }

      // 3. Авторизация на бэкенде
      try {
        setInitDataRawState(rawData);
        setBackendStatus('Авторизация на бэкенде...');
        const data: InitResponse = await init(rawData);
        
        if (data.branding) setBranding(data.branding);

        if (data.has_active_session && data.session_id) {
          setSessionId(data.session_id);
          await handleLoadMuscleGroups(rawData);
        } else if (data.is_new_user) {
          setStep('WELCOME_NEW');
        } else {
          setStep('MAIN');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Ошибка инициализации';
        setBackendStatus(`Ошибка бэкенда: ${msg}`);
      }
    };

    auth();
  }, []);

  const handleStartWorkout = async () => {
    try {
      setStep('LOADING');
      const res = await startTraining();
      setSessionId(res.session_id);
      await handleLoadMuscleGroups(initDataRawState);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      alert(`Ошибка старта тренировки: ${msg}`);
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      alert(`Не удалось загрузить упражнения: ${msg}`);
      setStep('SELECT_MUSCLE_GROUP');
    }
  };

  const handleSelectExercise = (exercise: GetExercisesResponse) => {
    setActiveExercise(exercise);
    setStep('EXERCISE_LOG');
  };

  const handleSaveSet = async (setId: string | null) => {
    if (!activeExercise || !sessionId) {
      alert('Нет активной сессии или не выбрано упражнение');
      return;
    }

    const isCardio = activeExercise.type === 'EXERCISE_TYPE_CARDIO';
    const isStatic = activeExercise.type === 'EXERCISE_TYPE_STATIC';

    // Вытаскиваем нужные поля в зависимости от типа
    const weight = !isCardio && weightInput !== '' ? parseFloat(weightInput) : undefined;
    const reps = !isCardio && !isStatic && repsInput !== '' ? parseInt(repsInput, 10) : undefined;
    const duration_seconds = (isCardio || isStatic) && durationInput !== '' ? parseInt(durationInput, 10) : undefined;
    const distance_meters = isCardio && distanceInput !== '' ? parseInt(distanceInput, 10) : undefined;

    if (reps === undefined && duration_seconds === undefined && distance_meters === undefined) {
      alert('Заполните параметры подхода');
      return;
    }

    const payload: LogSetRequest = {
      set_id: setId ?? undefined,
      session_id: sessionId,
      exercise_id: activeExercise.exercise_id,
      weight,
      reps,
      duration_seconds,
      distance_meters,
    };

    try {
      await logWorkoutSet(payload);

      setWeightInput('');
      setRepsInput('');
      setDurationInput('');
      setDistanceInput('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения';
      alert(`Ошибка сохранения подхода: ${msg}`);
    }
  };

  return (
    <div style={{ 
      padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', 
      backgroundColor: branding.theme.background_color, color: branding.theme.text_color,
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      <Header 
        branding={branding} 
        tenantId={tenantId} 
        sessionId={sessionId}
        onFinishWorkout={handleFinishWorkout}
      />
      <main style={{ width: '100%', maxWidth: '400px', flex: 1 }}>
        {step === 'LOADING' && (
          <LoadingScreen status={backendStatus} branding={branding} />
        )}

        {step === 'WELCOME_NEW' && (
          <WelcomeScreen branding={branding} onStart={() => setStep('MAIN')} />
        )}

        {step === 'MAIN' && (
          <MainScreen 
            userName={tgUser?.firstName} 
            sessionId={sessionId} 
            branding={branding} 
            onStartWorkout={handleStartWorkout} 
          />
        )}

        {step === 'SELECT_MUSCLE_GROUP' && (
          <SelectMuscleGroupScreen 
            muscleGroups={muscleGroups} 
            branding={branding} 
            onSelectGroup={handleSelectMuscleGroup} 
          />
        )}

        {step === 'SELECT_EXERCISE' && (
          <SelectExerciseScreen 
            exercises={exercises} 
            branding={branding} 
            onSelectExercise={handleSelectExercise} 
            onBack={() => setStep('SELECT_MUSCLE_GROUP')} 
          />
        )}

        {step === 'EXERCISE_LOG' && activeExercise && (
          <ExerciseLogScreen 
            activeExercise={activeExercise}
            branding={branding}
            weightInput={weightInput}
            repsInput={repsInput}
            durationInput={durationInput}
            distanceInput={distanceInput}
            setWeightInput={setWeightInput}
            setRepsInput={setRepsInput}
            setDurationInput={setDurationInput}
            setDistanceInput={setDistanceInput}
            onSaveSet={handleSaveSet}
            onBackToExercises={() => setStep('SELECT_EXERCISE')}
            onFinishExercise={() => setStep('SELECT_MUSCLE_GROUP')}
          />
        )}
      </main>
    </div>
  );
}