import React, { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { signInOrSignUp } from './api'; // Импортируем наш метод

function App() {
  const [tgUser, setTgUser] = useState<{ firstName: string; id: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<string>('Ожидание авторизации на бэкенде...');

  const tenantConfig = {
    tenant_id: "super_gym_01",
    branding: { company_name: "Super Gym Premium", primary_color: "#FF5733" }
  };

  const isTelegramContext = 
    window.location.href.includes('tgWebAppData') || 
    window.location.href.includes('tgWebAppPlatform') ||
    (window as any).Telegram?.WebApp?.initData !== undefined;

  useEffect(() => {
    if (!isTelegramContext) {
      setIsLoading(false);
      return;
    }

    let attempts = 0;
    
    const checkAndAuth = async () => {
      attempts++;
      let rawData = '';

      // 1. Пробуем достать initDataRaw через SDK
      try {
        const { initDataRaw, initData } = retrieveLaunchParams();
        if (initDataRaw && initData?.user) {
          rawData = initDataRaw;
          setTgUser({ firstName: initData.user.firstName, id: initData.user.id });
        }
      } catch (e) {}

      // 2. Если SDK не успел, пробуем через нативный объект
      if (!rawData) {
        const nativeRaw = (window as any).Telegram?.WebApp?.initData;
        const nativeUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
        if (nativeRaw && nativeUser) {
          rawData = nativeRaw;
          setTgUser({ firstName: nativeUser.first_name, id: nativeUser.id });
        }
      }

      // Если нашли сырые данные — отправляем их на бэк!
      if (rawData) {
        try {
          setBackendStatus('Авторизация на бэкенде...');
          const data = await signInOrSignUp(rawData);
          
          setBackendStatus('Успешно авторизован на бэкенде! Токен получен.');
          console.log('Ответ бэкенда:', data);
          
          // Здесь ты можешь сохранить полученный JWT-токен в localStorage/state
          // localStorage.setItem('token', data.token);
          
          setIsLoading(false);
          return true;
        } catch (err: any) {
          setBackendStatus(`Ошибка бэка: ${err.message}`);
          setIsLoading(false);
          return true; // Останавливаем таймер, так как попытка была, но бэк ответил ошибкой
        }
      }

      if (attempts >= 10) {
        setBackendStatus("Не удалось получить данные от Telegram для бэкенда.");
        setIsLoading(false);
      }
      
      return false;
    };

    // Запуск процесса
    checkAndAuth().then(found => {
      if (!found) {
        const interval = setInterval(async () => {
          const done = await checkAndAuth();
          if (done) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
      }
    });
  }, [isTelegramContext]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#121212', color: '#ffffff', textAlign: 'center' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '26px', margin: '0' }}>{tenantConfig.branding.company_name}</h1>
        <small style={{ color: '#666' }}>ID зала: {tenantConfig.tenant_id}</small>
      </header>

      <main style={{ marginTop: '50px' }}>
        {isLoading ? (
          <p style={{ fontSize: '16px', color: '#aaa' }}>Загрузка профиля...</p>
        ) : isTelegramContext && tgUser ? (
          <div>
            <p style={{ fontSize: '18px', color: '#aaa' }}>
              Привет, <strong style={{ color: '#fff' }}>{tgUser.firstName}</strong>! (ID: {tgUser.id})
            </p>
            {/* Статус интеграции с бэком */}
            <p style={{ fontSize: '14px', color: '#888', fontStyle: 'italic' }}>
              Статус: {backendStatus}
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#1e1e1e', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <p style={{ fontSize: '16px', color: '#ffb703', margin: '0' }}>
              ⚠️ Работа приложения доступна только внутри Telegram.
            </p>
          </div>
        )}

        <button style={{
          backgroundColor: tenantConfig.branding.primary_color, 
          color: '#fff', border: 'none', padding: '16px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', width: '100%', maxWidth: '280px', marginTop: '20px',
          opacity: isLoading ? 0.6 : 1
        }} disabled={isLoading}>
          НАЧАТЬ ТРЕНИРОВКУ
        </button>
      </main>
    </div>
  );
}

export default App;