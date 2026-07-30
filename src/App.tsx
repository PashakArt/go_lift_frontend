import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { init, startTraining, getMuscleGroups, getExercises, getTenantIdFromUrl, logWorkoutSet, finishTraining } from './api/api';
import type { 
  GetMuscleGroupsResponse, 
  GetExercisesResponse, 
  InitResponse, 
  TenantBranding, 
  SelectedExercise,
  LogSetRequest
} from './types/types';

import { Header } from './components/Header';
import { LoadingScreen } from './components/screens/LoadingScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { MainScreen } from './components/screens/MainScreen';
import { SelectMuscleGroupScreen } from './components/screens/SelectMuscleGroupScreen';
import { SelectExerciseScreen } from './components/screens/SelectExerciseScreen';
import { ExerciseLogScreen } from './components/screens/ExerciseLogScreen';
import { TemplateEditorScreen } from './components/screens/templates/TemplateEditorScreen';
import { TemplatesListScreen } from './components/screens/templates/TemplatesListScreen';
import { TemplateDetailScreen } from './components/screens/templates/TemplateDetailScreen';
import type { TemplateDetailResponse, TemplateSummaryResponse, TemplateDetailItem } from './types/template-types';
import { createTemplate, updateTemplate, deleteTemplate, getTemplateDetail, getTemplates } from './api/template-api';

export interface TemplateExerciseItem {
  exercise: GetExercisesResponse;
  sets: { weight: number | null; reps: number | null }[];
}

type AppStep = 
  | 'LOADING' 
  | 'WELCOME_NEW' 
  | 'MAIN' 
  | 'TEMPLATES_LIST'
  | 'TEMPLATE_DETAIL'
  | 'SELECT_MUSCLE_GROUP' 
  | 'SELECT_EXERCISE' 
  | 'EXERCISE_LOG' 
  | 'CREATE_TEMPLATE'
  | 'TEMPLATE_SELECT_MUSCLE_GROUP'
  | 'TEMPLATE_SELECT_EXERCISE';

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
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateSummaryResponse[]>([]);
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState<TemplateDetailResponse | null>(null);
  
  // Стейты шаблонов
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateExercises, setTemplateExercises] = useState<TemplateExerciseItem[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const [step, setStep] = useState<AppStep>('LOADING');
  const [, setTgUser] = useState<{ firstName: string; id: number } | null>(null);
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

  // Старт редактирования существующей программы
  const handleStartEditTemplate = () => {
    if (!selectedTemplateDetail) return;

    setEditingTemplateId(selectedTemplateDetail.template_id);
    setTemplateTitle(selectedTemplateDetail.name);

    const mappedExercises: TemplateExerciseItem[] = selectedTemplateDetail.items.map((item) => ({
      exercise: {
        exercise_id: item.exercise_id,
        name: item.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: item.type as any,
        muscle_group_id: '',
      },
      sets: item.target_sets.map((s) => ({
        weight: s.weight ?? null,
        reps: s.reps ?? null,
      })),
    }));

    setTemplateExercises(mappedExercises);
    setStep('CREATE_TEMPLATE');
  };

  // Переход в раздел "Мои программы" с Главного экрана
  const handleOpenTemplatesList = async () => {
    try {
      setStep('LOADING');
      setBackendStatus('Загрузка программ...');
      const list = await getTemplates();
      setTemplates(list);
      setStep('TEMPLATES_LIST');
    } catch (err) {
      console.error('Ошибка загрузки программ:', err);
      setStep('MAIN');
    }
  };

  // Открытие детализации конкретной программы
  const handleSelectTemplateDetail = async (templateId: string) => {
    try {
      setStep('LOADING');
      setBackendStatus('Загрузка плана...');
      const detail = await getTemplateDetail(templateId);
      setSelectedTemplateDetail(detail);
      setStep('TEMPLATE_DETAIL');
    } catch (err) {
      console.error('Ошибка загрузки деталей плана:', err);
      setStep('TEMPLATES_LIST');
    }
  };

  // Удаление программы без системного confirm
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setStep('LOADING');
      setBackendStatus('Удаление плана...');
      await deleteTemplate(templateId);
      
      const list = await getTemplates();
      setTemplates(list);
      setSelectedTemplateDetail(null);
      setStep('TEMPLATES_LIST');
    } catch (err) {
      console.error('Ошибка удаления плана:', err);
      setStep('TEMPLATE_DETAIL');
    }
  };

  // Хэндлеры создания/редактирования шаблона
  const handleStartAddTemplateExercise = async () => {
    try {
      setStep('LOADING');
      setBackendStatus('Загрузка групп мышц...');
      const groups = await getMuscleGroups(initDataRawState);
      setMuscleGroups(groups);
      setStep('TEMPLATE_SELECT_MUSCLE_GROUP');
    } catch (err) {
      console.error('Не удалось загрузить группы мышц:', err);
      setStep('CREATE_TEMPLATE');
    }
  };

  const handleTemplateSelectMuscleGroup = async (groupId: string) => {
    try {
      setStep('LOADING');
      const list = await getExercises(groupId);
      setExercises(list);
      setStep('TEMPLATE_SELECT_EXERCISE');
    } catch (err) {
      console.error('Не удалось загрузить упражнения:', err);
      setStep('TEMPLATE_SELECT_MUSCLE_GROUP');
    }
  };

  const handleTemplateSelectExercise = (exercise: GetExercisesResponse) => {
    setTemplateExercises((prev) => [
      ...prev,
      {
        exercise,
        sets: [
          { weight: 0, reps: 10 },
          { weight: 0, reps: 10 },
        ],
      },
    ]);
    setStep('CREATE_TEMPLATE');
  };

  const handleUpdateTemplateSet = (
    exIdx: number,
    setIdx: number,
    field: 'weight' | 'reps',
    value: number | null
  ) => {
    setTemplateExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exIdx] };
      const nextSets = [...targetEx.sets];
      nextSets[setIdx] = { ...nextSets[setIdx], [field]: value };
      targetEx.sets = nextSets;
      next[exIdx] = targetEx;
      return next;
    });
  };

  const handleAddTemplateSet = (exIdx: number) => {
    setTemplateExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exIdx] };
      const lastSet = targetEx.sets[targetEx.sets.length - 1];
      targetEx.sets = [
        ...targetEx.sets,
        { weight: lastSet?.weight ?? 0, reps: lastSet?.reps ?? 10 },
      ];
      next[exIdx] = targetEx;
      return next;
    });
  };

  const handleRemoveTemplateSet = (exIdx: number, setIdx: number) => {
    setTemplateExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exIdx] };
      targetEx.sets = targetEx.sets.filter((_, idx) => idx !== setIdx);
      next[exIdx] = targetEx;
      return next;
    });
  };

  // Единое сохранение шаблона (Создание / Обновление)
  const handleSaveTemplateSubmit = async () => {
    if (!templateTitle.trim() || templateExercises.length === 0) return;

    try {
      setIsSavingTemplate(true);

      const items: TemplateDetailItem[] = templateExercises.map((item, idx) => ({
        exercise_id: item.exercise.exercise_id,
        name: item.exercise.name,
        type: item.exercise.type,
        order_index: idx + 1,
        target_sets: item.sets.map((s, sIdx) => ({
          set_num: sIdx + 1,
          weight: s.weight ?? 0,
          reps: s.reps ?? 10,
        })),
      }));

      if (editingTemplateId) {
        // Редактирование
        await updateTemplate(editingTemplateId, {
          name: templateTitle,
          items,
        });
      } else {
        // Создание
        await createTemplate({
          name: templateTitle,
          items: items.map((i) => ({
            exercise_id: i.exercise_id,
            order_index: i.order_index,
            target_sets: i.target_sets,
          })),
        });
      }

      // Сброс формы и переход в список программ
      setTemplateTitle('');
      setTemplateExercises([]);
      setEditingTemplateId(null);

      const updatedList = await getTemplates();
      setTemplates(updatedList);
      setStep('TEMPLATES_LIST');
    } catch (err) {
      console.error('Ошибка сохранения плана:', err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleLoadMuscleGroups = async (rawInitData?: string) => {
    try {
      const groups = await getMuscleGroups(rawInitData || initDataRawState);
      setMuscleGroups(groups);
      setStep('SELECT_MUSCLE_GROUP');
    } catch (err) {
      console.error('Не удалось загрузить группы мышц:', err);
      setStep('MAIN');
    }
  };

  const handleFinishWorkout = async () => {
    try {
      setStep('LOADING');
      setBackendStatus('Завершение тренировки...');
      
      await finishTraining();
      
      setSessionId(null);
      setWorkoutExercises([]);
      setActiveExercise(null);
      setSelectedMuscleGroup(null);
      
      setStep('MAIN');
    } catch (err) {
      console.error('Не удалось завершить тренировку:', err);
      setStep('EXERCISE_LOG');
    }
  };

  useEffect(() => {
    const auth = async () => {
      let rawData = '';

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
          // Игнорируем SDK ошибки
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

      if (!rawData) {
        console.warn("⚠️ Telegram Context не найден. Используем MOCK_INIT_DATA для разработки");
        rawData = MOCK_INIT_DATA;
        setTgUser({ firstName: 'Локальный Атлет', id: 77777 });
      }

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

  const handleStartFreeWorkout = async () => {
    try {
      setStep('LOADING');
      const res = await startTraining();
      setSessionId(res.session_id);
      await handleLoadMuscleGroups(initDataRawState);
    } catch (err) {
      console.error('Ошибка старта тренировки:', err);
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
      console.error('Не удалось загрузить упражнения:', err);
      setStep('SELECT_MUSCLE_GROUP');
    }
  };

  const handleSelectExercise = (exercise: GetExercisesResponse) => {
    setActiveExercise(exercise);
    setStep('EXERCISE_LOG');
  };

  // Запись подхода с автоподстановкой значений по умолчанию (если поле не заполнено)
  const handleSaveSet = async (setId: string | null) => {
    if (!activeExercise || !sessionId) return;

    const isCardio = activeExercise.type === 'EXERCISE_TYPE_CARDIO';
    const isStatic = activeExercise.type === 'EXERCISE_TYPE_STATIC';

    // Подставляем дефолтные значения (0 кг, 10 повторов), если юзер не ввел вручную
    const weight = !isCardio ? (weightInput !== '' ? parseFloat(weightInput) : 0) : undefined;
    const reps = !isCardio && !isStatic ? (repsInput !== '' ? parseInt(repsInput, 10) : 10) : undefined;
    const duration_seconds = (isCardio || isStatic) ? (durationInput !== '' ? parseInt(durationInput, 10) : 60) : undefined;
    const distance_meters = isCardio ? (distanceInput !== '' ? parseInt(distanceInput, 10) : 1000) : undefined;

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
      console.error('Ошибка сохранения подхода:', err);
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
            branding={branding}
            sessionId={sessionId}
            onStartWorkout={handleStartFreeWorkout}
            onOpenTemplates={handleOpenTemplatesList}
          />
        )}

        {step === 'TEMPLATES_LIST' && (
          <TemplatesListScreen
            branding={branding}
            templates={templates}
            onSelectTemplate={handleSelectTemplateDetail}
            onCreateNew={() => {
              setEditingTemplateId(null);
              setTemplateTitle('');
              setTemplateExercises([]);
              setStep('CREATE_TEMPLATE');
            }}
            onBack={() => setStep('MAIN')}
          />
        )}

        {step === 'TEMPLATE_DETAIL' && selectedTemplateDetail && (
          <TemplateDetailScreen
            branding={branding}
            template={selectedTemplateDetail}
            onEdit={handleStartEditTemplate}
            onDelete={handleDeleteTemplate}
            onBack={() => setStep('TEMPLATES_LIST')}
          />
        )}

        {step === 'CREATE_TEMPLATE' && (
          <TemplateEditorScreen 
            branding={branding}
            templateName={templateTitle}
            onTemplateNameChange={setTemplateTitle}
            exercises={templateExercises}
            onUpdateSet={handleUpdateTemplateSet}
            onAddSet={handleAddTemplateSet}
            onRemoveSet={handleRemoveTemplateSet}
            onRemoveExercise={(index) => {
              setTemplateExercises(prev => prev.filter((_, i) => i !== index));
            }}
            onAddExerciseClick={handleStartAddTemplateExercise}
            onSaveTemplate={handleSaveTemplateSubmit}
            onBack={() => {
              setTemplateExercises([]);
              setTemplateTitle('');
              setEditingTemplateId(null);
              setStep(editingTemplateId ? 'TEMPLATE_DETAIL' : 'TEMPLATES_LIST');
            }}
            isSaving={isSavingTemplate}
            isEditing={Boolean(editingTemplateId)}
          />
        )}

        {/* ВЫБОР МЫШЦ ДЛЯ ШАБЛОНА */}
        {step === 'TEMPLATE_SELECT_MUSCLE_GROUP' && (
          <SelectMuscleGroupScreen 
            muscleGroups={muscleGroups} 
            branding={branding} 
            onSelectGroup={handleTemplateSelectMuscleGroup} 
          />
        )}

        {/* ВЫБОР УПРАЖНЕНИЯ ДЛЯ ШАБЛОНА */}
        {step === 'TEMPLATE_SELECT_EXERCISE' && (
          <SelectExerciseScreen 
            exercises={exercises} 
            branding={branding} 
            onSelectExercise={handleTemplateSelectExercise} 
            onBack={() => setStep('TEMPLATE_SELECT_MUSCLE_GROUP')} 
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