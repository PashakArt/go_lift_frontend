import React, { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

function App() {
  const [tgUser, setTgUser] = useState<{ firstName: string; id: number } | null>(null);
  // Заменяем строку ошибки на статус загрузки
  const [isLoading, setIsLoading] = useState(true);

  const tenantConfig = {
    tenant_id: "super_gym_01",
    branding: {
      company_name: "Super Gym Premium",
      primary_color: "#FF5733" 
    }
  };

  const isTelegramContext = 
    window.location.href.includes('tgWebAppData') || 
    window.location.href.includes('tgWebAppPlatform') ||
    (window as any).Telegram?.WebApp?.initData !== undefined;

  useEffect(() => {
    if (!isTelegramContext) {
      setIsLoading(false); // Если мы точно в браузере, прекращаем загрузку
      return;
    }

    let attempts = 0;
    
    const checkUserData = () => {
      attempts++;
      
      try {
        const { initData } = retrieveLaunchParams();
        if (initData && initData.user) {
          setTgUser({ firstName: initData.user.firstName, id: initData.user.id });
          setIsLoading(false);
          return true;
        }
      } catch (e) {
        // Логируем ошибку только для разработчика в консоль
        console.warn("Ожидание инициализации SDK...");
      }

      const nativeUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      if (nativeUser) {
        setTgUser({
          firstName: nativeUser.first_name,
          id: nativeUser.id
        });
        setIsLoading(false);
        return true;
      }

      if (attempts >= 10) {
        console.error("Данные не появились в window.Telegram спустя 1 сек. Возможно, ngrok затер хэш URL.");
        setIsLoading(false); // Прекращаем крутить лоадер
      }
      
      return false;
    };

    const isFound = checkUserData();
    
    if (!isFound) {
      const interval = setInterval(() => {
        const found = checkUserData();
        if (found) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isTelegramContext]);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'sans-serif',
      minHeight: '100vh',
      backgroundColor: '#121212', 
      color: '#ffffff',
      textAlign: 'center'
    }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '26px', margin: '0' }}>
          {tenantConfig.branding.company_name}
        </h1>
        <small style={{ color: '#666' }}>ID зала: {tenantConfig.tenant_id}</small>
      </header>

      <main style={{ marginTop: '50px' }}>
        {/* СЦЕНАРИЙ 1: Идет загрузка/ожидание данных от Телеграма */}
        {isLoading ? (
          <p style={{ fontSize: '16px', color: '#aaa' }}>Загрузка профиля...</p>
        ) : isTelegramContext && tgUser ? (
          /* СЦЕНАРИЙ 2: Всё успешно определилось */
          <p style={{ fontSize: '18px', color: '#aaa' }}>
            Привет, <strong style={{ color: '#fff' }}>{tgUser.firstName}</strong>! <br />
            (ID: {tgUser.id}) <br />
            Готов к тренировке?
          </p>
        ) : (
          /* СЦЕНАРИЙ 3: Это обычный браузер (или критическая ошибка) */
          <div style={{ backgroundColor: '#1e1e1e', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <p style={{ fontSize: '16px', color: '#ffb703', margin: '0' }}>
              ⚠️ Работа приложения доступна только внутри Telegram.
            </p>
          </div>
        )}

        <button style={{
          backgroundColor: tenantConfig.branding.primary_color, 
          color: '#fff',
          border: 'none',
          padding: '16px 32px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          width: '100%',
          maxWidth: '280px',
          marginTop: '20px',
          cursor: 'pointer',
          opacity: isLoading || (!tgUser && isTelegramContext) ? 0.6 : 1 // Блокируем, если не загрузилось
        }} disabled={isLoading}>
          НАЧАТЬ ТРЕНИРОВКУ
        </button>
      </main>
    </div>
  );
}

export default App;