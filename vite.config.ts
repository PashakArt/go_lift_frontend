import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,

    // Настройки для корректной работы через прокси/туннели:
    hmr: {
      clientPort: 5173, // Принудительно заставляем HMR работать локально
    },
    watch: {
      usePolling: true, // Помогает стабильнее отслеживать файлы на Mac/Unix через туннели
    },
  },
});
