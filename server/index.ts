/**
 * Сервер для настоящего хостинга: `npm run build`, затем `npm start`.
 * Отдаёт собранный сайт из папки dist и обслуживает админ-панель (см. server/app.ts).
 *
 * Настройки (переменные окружения или файл .env):
 *   PORT=3000          — порт
 *   HOST=0.0.0.0       — на каком адресе слушать (127.0.0.1 — только для прокси на этом же сервере)
 *   DATA_DIR=data      — где хранить данные сайта
 *   TRUST_PROXY=1      — если сайт открывают через nginx или Caddy (для HTTPS)
 */
import './env.ts';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.ts';
import { safeJoin, sendFile, setSecurityHeaders } from './http.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
const indexHtml = path.join(dist, 'index.html');

try {
  await stat(indexHtml);
} catch {
  console.error('Сайт ещё не собран. Сначала выполните: npm run build');
  process.exit(1);
}

const app = await createApp({ root });

// Файлы из dist/assets содержат в имени отпечаток содержимого — их можно кэшировать «навсегда»
function cacheControl(pathname: string) {
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  if (pathname.endsWith('.html')) return 'no-cache';
  return 'public, max-age=86400';
}

const server = http.createServer(async (req, res) => {
  try {
    if (await app.handle(req, res)) return;
    setSecurityHeaders(res);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }

    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    const file = pathname === '/' ? null : safeJoin(dist, pathname);
    if (file && (await sendFile(req, res, file, cacheControl(pathname)))) return;

    // Файла нет: адрес с расширением (картинка, скрипт) — честная ошибка 404,
    // а адрес страницы (/news/8153, /admin) — index.html, дальше разберётся React Router
    if (path.posix.extname(pathname) && !pathname.endsWith('.html')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Не найдено');
      return;
    }
    await sendFile(req, res, indexHtml, 'no-cache');
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Ошибка сервера');
  }
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';
server.listen(port, host, () => {
  console.log(`Сайт запущен: http://localhost:${port}  ·  админ-панель: http://localhost:${port}/admin`);
});

// Аккуратная остановка (Ctrl + C или команда хостинга): дожидаемся текущих запросов
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
