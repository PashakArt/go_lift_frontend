import { useEffect, useState } from 'react';
import { getMuscleGroups, getExercises, getTenantIdFromUrl } from './api/api';
import type { GetMuscleGroupsResponse, GetExercisesResponse } from './types/types';

import { useTelegramAuth } from './hooks/useTelegramAuth';
import { useTemplates } from './hooks/useTemplates';
import { useWorkout } from './hooks/useWorkout';

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

export default function App() {
  const [step, setStep] = useState<AppStep>('LOADING');
  const [muscleGroups, setMuscleGroups] = useState<GetMuscleGroupsResponse[]>([]);
  const [exercises, setExercises] = useState<GetExercisesResponse[]>([]);

  const tenantId = getTenantIdFromUrl();

  const { initDataRaw, branding, backendStatus, initResponse, isLoading, setBackendStatus } = useTelegramAuth();
  const templateState = useTemplates();
  const workoutState = useWorkout();

  // FIX Ошибки 2: Выполняем первичную загрузку прямо при смене isLoading
  useEffect(() => {
    if (isLoading) return;

    const initAppStep = async () => {
      if (!initResponse) return;

      if (initResponse.has_active_session && initResponse.session_id) {
        workoutState.setSessionId(initResponse.session_id);
        try {
          const groups = await getMuscleGroups(initDataRaw);
          setMuscleGroups(groups);
          setStep('SELECT_MUSCLE_GROUP');
        } catch (err) {
          console.error('Не удалось загрузить группы мышц:', err);
          setStep('MAIN');
        }
      } else if (initResponse.is_new_user) {
        setStep('WELCOME_NEW');
      } else {
        setStep('MAIN');
      }
    };

    initAppStep();
  }, [isLoading, initResponse, initDataRaw]);

  const loadMuscleGroups = async (rawInitData?: string) => {
    try {
      const groups = await getMuscleGroups(rawInitData || initDataRaw);
      setMuscleGroups(groups);
      setStep('SELECT_MUSCLE_GROUP');
    } catch (err) {
      console.error('Не удалось загрузить группы мышц:', err);
      setStep('MAIN');
    }
  };

  const handleOpenTemplatesList = async () => {
    try {
      setStep('LOADING');
      setBackendStatus('Загрузка программ...');
      await templateState.fetchTemplates();
      setStep('TEMPLATES_LIST');
    } catch {
      setStep('MAIN');
    }
  };

  const handleSelectTemplateDetail = async (templateId: string) => {
    try {
      setStep('LOADING');
      setBackendStatus('Загрузка плана...');
      await templateState.fetchTemplateDetail(templateId);
      setStep('TEMPLATE_DETAIL');
    } catch {
      setStep('TEMPLATES_LIST');
    }
  };

  const handleStartFreeWorkout = async () => {
    try {
      setStep('LOADING');
      await workoutState.startWorkout();
      await loadMuscleGroups();
    } catch {
      setStep('MAIN');
    }
  };

  const handleSelectMuscleGroup = async (groupId: string) => {
    try {
      setStep('LOADING');
      const exerciseList = await getExercises(groupId);
      setExercises(exerciseList);
      setStep('SELECT_EXERCISE');
    } catch {
      setStep('SELECT_MUSCLE_GROUP');
    }
  };

  const handleStartAddTemplateExercise = async () => {
    try {
      setStep('LOADING');
      setBackendStatus('Загрузка групп мышц...');
      const groups = await getMuscleGroups(initDataRaw);
      setMuscleGroups(groups);
      setStep('TEMPLATE_SELECT_MUSCLE_GROUP');
    } catch {
      setStep('CREATE_TEMPLATE');
    }
  };

  const handleTemplateSelectMuscleGroup = async (groupId: string) => {
    try {
      setStep('LOADING');
      const list = await getExercises(groupId);
      setExercises(list);
      setStep('TEMPLATE_SELECT_EXERCISE');
    } catch {
      setStep('TEMPLATE_SELECT_MUSCLE_GROUP');
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
        sessionId={workoutState.sessionId}
        onFinishWorkout={async () => {
          setStep('LOADING');
          setBackendStatus('Завершение тренировки...');
          await workoutState.finishCurrentWorkout();
          setStep('MAIN');
        }}
      />
      
      <main style={{ width: '100%', maxWidth: '400px', flex: 1 }}>
        {step === 'LOADING' && <LoadingScreen status={backendStatus} branding={branding} />}
        {step === 'WELCOME_NEW' && <WelcomeScreen branding={branding} onStart={() => setStep('MAIN')} />}

        {step === 'MAIN' && (
          <MainScreen
            branding={branding}
            sessionId={workoutState.sessionId}
            onStartWorkout={handleStartFreeWorkout}
            onOpenTemplates={handleOpenTemplatesList}
          />
        )}

        {step === 'TEMPLATES_LIST' && (
          <TemplatesListScreen
            branding={branding}
            templates={templateState.templates}
            onSelectTemplate={handleSelectTemplateDetail}
            onCreateNew={() => {
              templateState.resetTemplateForm();
              setStep('CREATE_TEMPLATE');
            }}
            onBack={() => setStep('MAIN')}
          />
        )}

        {step === 'TEMPLATE_DETAIL' && templateState.selectedTemplateDetail && (
          <TemplateDetailScreen
            branding={branding}
            template={templateState.selectedTemplateDetail}
            onEdit={() => {
              templateState.startEditTemplate();
              setStep('CREATE_TEMPLATE');
            }}
            onDelete={async (id) => {
              setStep('LOADING');
              setBackendStatus('Удаление...');
              await templateState.removeTemplate(id);
              setStep('TEMPLATES_LIST');
            }}
            onBack={() => setStep('TEMPLATES_LIST')}
          />
        )}

        {step === 'CREATE_TEMPLATE' && (
          <TemplateEditorScreen 
            branding={branding}
            templateName={templateState.templateTitle}
            onTemplateNameChange={templateState.setTemplateTitle}
            exercises={templateState.templateExercises}
            onUpdateSet={templateState.updateTemplateSet}
            onAddSet={templateState.addTemplateSet}
            onRemoveSet={templateState.removeTemplateSet}
            onRemoveExercise={templateState.removeTemplateExercise}
            onAddExerciseClick={handleStartAddTemplateExercise}
            onSaveTemplate={async () => {
              await templateState.saveTemplate();
              setStep('TEMPLATES_LIST');
            }}
            onBack={() => {
              const prevStep = templateState.editingTemplateId ? 'TEMPLATE_DETAIL' : 'TEMPLATES_LIST';
              templateState.resetTemplateForm();
              setStep(prevStep);
            }}
            isSaving={templateState.isSavingTemplate}
            isEditing={Boolean(templateState.editingTemplateId)}
          />
        )}

        {step === 'TEMPLATE_SELECT_MUSCLE_GROUP' && (
          <SelectMuscleGroupScreen 
            muscleGroups={muscleGroups} 
            branding={branding} 
            onSelectGroup={handleTemplateSelectMuscleGroup} 
          />
        )}

        {step === 'TEMPLATE_SELECT_EXERCISE' && (
          <SelectExerciseScreen 
            exercises={exercises} 
            branding={branding} 
            onSelectExercise={(ex) => {
              templateState.addExerciseToTemplate(ex);
              setStep('CREATE_TEMPLATE');
            }} 
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
            onSelectExercise={(ex) => {
              workoutState.setActiveExercise(ex);
              setStep('EXERCISE_LOG');
            }} 
            onBack={() => setStep('SELECT_MUSCLE_GROUP')} 
          />
        )}

        {step === 'EXERCISE_LOG' && workoutState.activeExercise && (
          <ExerciseLogScreen 
            activeExercise={workoutState.activeExercise}
            branding={branding}
            weightInput={workoutState.weightInput}
            repsInput={workoutState.repsInput}
            durationInput={workoutState.durationInput}
            distanceInput={workoutState.distanceInput}
            setWeightInput={workoutState.setWeightInput}
            setRepsInput={workoutState.setRepsInput}
            setDurationInput={workoutState.setDurationInput}
            setDistanceInput={workoutState.setDistanceInput}
            onSaveSet={workoutState.saveSet}
            onBackToExercises={() => setStep('SELECT_EXERCISE')}
            onFinishExercise={() => setStep('SELECT_MUSCLE_GROUP')}
          />
        )}
      </main>
    </div>
  );
}