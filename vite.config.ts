import './server/env.ts';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { adminServer, staticSnapshot } from './server/vite.ts';

// Настройки сборщика Vite: подключаем поддержку React (JSX, быстрый перезапуск)
// и сервер админ-панели (адреса /api, /data и /uploads — см. server/vite.ts)
export default defineConfig({
  plugins: [react(), adminServer(), staticSnapshot()],
  server: {
    // Папку с данными меняет админ-панель — следить за ней сборщику не нужно
    watch: { ignored: ['**/data/**'] },
    // При разработке Vite может отдать любой файл проекта. Запрещаем пользователей и ключ сессий
    // (первые четыре строки — запреты Vite по умолчанию)
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/data/private/**'] },
  },
});
