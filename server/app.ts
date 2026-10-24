/**
 * Сервер админ-панели: обрабатывает адреса
 *   /data/<раздел>.json  — данные разделов (читает и сайт, и админ-панель)
 *   /uploads/…           — загруженные фото и документы
 *   /api/…               — вход, изменение данных, загрузка файлов, пользователи, заявки с сайта
 *
 * Одна и та же функция handle работает и при разработке (внутри Vite, см. server/vite.ts),
 * и на настоящем сервере (server/index.ts).
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { collections, isCollectionName } from '../src/admin/schema.ts';
import type { CollectionName, Item } from '../src/admin/schema.ts';
import { createApplications } from './applications.ts';
import { checkCredentials, createAuth, hashPassword, MIN_PASSWORD } from './auth.ts';
import { createContent } from './content.ts';
import { assertSameOrigin, HttpError, readJson, safeJoin, sendFile, sendJson, setSecurityHeaders } from './http.ts';
import { createStore } from './store.ts';
import type { User } from './store.ts';
import { saveUpload } from './uploads.ts';

/** Папка с данными: DATA_DIR из окружения или data в корне проекта */
export function resolveDataDir(root: string) {
  return path.resolve(root, process.env.DATA_DIR || 'data');
}

const publicUser = (user: User) => ({ login: user.login, name: user.name });

function log(user: User, message: string) {
  console.log(`[админ-панель] ${user.login}: ${message}`);
}

function describe(name: CollectionName, item: Item) {
  const collection = collections[name];
  return `${collection.label} → «${String(item[collection.titleField] ?? item[collection.idField])}»`;
}

export async function createApp({ root, dataDir = resolveDataDir(root) }: { root: string; dataDir?: string }) {
  const store = createStore(dataDir, path.join(root, 'content'));
  const created = await store.init();
  const auth = createAuth(store, await store.sessionSecret());
  const content = createContent(store);
  const applications = createApplications(store);

  if (created.length > 0) console.log(`[админ-панель] Начальные данные скопированы в ${dataDir}`);
  if ((await store.readUsers()).length === 0) {
    console.log('[админ-панель] Пока нет ни одного пользователя. Создайте его командой:  npm run admin');
  }

  async function requireUser(req: IncomingMessage) {
    const user = await auth.current(req);
    if (!user) throw new HttpError(401, 'Сессия закончилась — войдите снова');
    return user;
  }

  async function users(req: IncomingMessage, res: ServerResponse, me: User, login: string | undefined) {
    const method = req.method;

    if (!login && method === 'GET') {
      const list = await store.readUsers();
      return sendJson(res, 200, { users: list.map((u) => ({ ...publicUser(u), createdAt: u.createdAt })) });
    }

    if (!login && method === 'POST') {
      const body = (await readJson(req)) as Record<string, unknown>;
      const newLogin = String(body.login ?? '').trim().toLowerCase();
      const name = String(body.name ?? '').trim();
      const password = String(body.password ?? '');
      const errors = checkCredentials(newLogin, password);
      if (!name) errors.name = 'Укажите имя';
      if (name.length > 80) errors.name = 'Слишком длинное имя';
      if (Object.keys(errors).length > 0) throw new HttpError(422, 'Проверьте поля формы', errors);
      const hash = await hashPassword(password);
      const user = await store.updatePrivate<User, User>('users', async (list) => {
        if (list.some((u) => u.login === newLogin)) throw new HttpError(422, 'Проверьте поля формы', { login: 'Такой логин уже есть' });
        const created: User = { login: newLogin, name, hash, createdAt: new Date().toISOString() };
        return { list: [...list, created], result: created };
      });
      log(me, `добавил(а) пользователя ${user.login}`);
      return sendJson(res, 201, { user: publicUser(user) });
    }

    if (login && method === 'PUT') {
      const body = (await readJson(req)) as Record<string, unknown>;
      const name = body.name === undefined ? undefined : String(body.name).trim();
      const password = body.password === undefined ? undefined : String(body.password);
      if (name !== undefined && (!name || name.length > 80)) throw new HttpError(422, 'Проверьте поля формы', { name: 'Укажите имя' });
      if (password !== undefined && password.length < MIN_PASSWORD) {
        throw new HttpError(422, 'Проверьте поля формы', { password: `Пароль должен быть не короче ${MIN_PASSWORD} символов` });
      }
      const hash = password === undefined ? undefined : await hashPassword(password);
      const user = await store.updatePrivate<User, User>('users', async (list) => {
        const index = list.findIndex((u) => u.login === login);
        if (index === -1) throw new HttpError(404, 'Пользователь не найден');
        const changed: User = { ...list[index], name: name ?? list[index].name, hash: hash ?? list[index].hash };
        const next = [...list];
        next[index] = changed;
        return { list: next, result: changed };
      });
      // Смена своего пароля: старая сессия перестаёт действовать, поэтому сразу выдаём новую
      if (user.login === me.login) auth.issue(req, res, user);
      log(me, `изменил(а) пользователя ${user.login}${password ? ' (новый пароль)' : ''}`);
      return sendJson(res, 200, { user: publicUser(user) });
    }

    if (login && method === 'DELETE') {
      if (login === me.login) throw new HttpError(400, 'Нельзя удалить самого себя');
      await store.updatePrivate<User, null>('users', async (list) => {
        if (!list.some((u) => u.login === login)) throw new HttpError(404, 'Пользователь не найден');
        return { list: list.filter((u) => u.login !== login), result: null };
      });
      log(me, `удалил(а) пользователя ${login}`);
      return sendJson(res, 200, { ok: true });
    }

    throw new HttpError(404, 'Неизвестный адрес');
  }

  async function api(req: IncomingMessage, res: ServerResponse, parts: string[]) {
    const method = req.method ?? 'GET';
    if (method !== 'GET' && method !== 'HEAD') assertSameOrigin(req);
    const [section, name, id] = parts;

    if (section === 'session' && parts.length === 1) {
      if (method === 'GET') {
        const user = await auth.current(req);
        const setup = (await store.readUsers()).length === 0;
        return sendJson(res, 200, { user: user && publicUser(user), setup });
      }
      if (method === 'POST') {
        const body = (await readJson(req)) as Record<string, unknown>;
        const user = await auth.login(req, res, String(body.login ?? ''), String(body.password ?? ''));
        log(user, 'вошёл(вошла) в админ-панель');
        return sendJson(res, 200, { user: publicUser(user) });
      }
      if (method === 'DELETE') {
        auth.clear(req, res);
        return sendJson(res, 200, { ok: true });
      }
    }

    // Заявка с сайта: отправить может любой посетитель, без входа
    if (section === 'applications' && parts.length === 1 && method === 'POST') {
      const application = await applications.submit(req, await readJson(req, 64 * 1024));
      if (application) console.log(`[сайт] Новая заявка: ${application.directionTitle ?? application.topic}`);
      return sendJson(res, 201, { ok: true });
    }

    const me = await requireUser(req);

    if (section === 'applications' && parts.length <= 2) {
      if (!name && method === 'GET') return sendJson(res, 200, { applications: await applications.list() });
      if (name && method === 'PUT') {
        const result = await applications.update(name, await readJson(req));
        log(me, `изменил(а) заявку ${name}${result.direction ? ` (место вычтено: ${String(result.direction.title)})` : ''}`);
        return sendJson(res, 200, result);
      }
      if (name && method === 'DELETE') {
        await applications.remove(name);
        log(me, `удалил(а) заявку ${name}`);
        return sendJson(res, 200, { ok: true });
      }
    }

    if (section === 'collections' && name && parts.length <= 3) {
      if (!isCollectionName(name)) throw new HttpError(404, 'Такого раздела нет');
      if (!id && method === 'POST') {
        const item = await content.create(name, await readJson(req));
        log(me, `добавил(а) ${describe(name, item)}`);
        return sendJson(res, 201, { item });
      }
      if (!id && method === 'PUT') {
        const body = (await readJson(req)) as Record<string, unknown>;
        await content.reorder(name, body.order);
        log(me, `изменил(а) порядок: ${collections[name].label}`);
        return sendJson(res, 200, { ok: true });
      }
      if (id && method === 'PUT') {
        const item = await content.update(name, id, await readJson(req));
        log(me, `изменил(а) ${describe(name, item)}`);
        return sendJson(res, 200, { item });
      }
      if (id && method === 'DELETE') {
        await content.remove(name, id);
        log(me, `удалил(а) запись ${id}: ${collections[name].label}`);
        return sendJson(res, 200, { ok: true });
      }
    }

    if (section === 'uploads' && parts.length === 1 && method === 'POST') {
      const file = await saveUpload(req, store.uploadsDir);
      log(me, `загрузил(а) файл ${file.url}`);
      return sendJson(res, 201, file);
    }

    if (section === 'users' && parts.length <= 2) return users(req, res, me, name);

    throw new HttpError(404, 'Неизвестный адрес');
  }

  const uploadsRoot = path.resolve(store.uploadsDir);

  /** Обрабатывает запрос, если он относится к админ-панели. Возвращает false для всех остальных адресов */
  async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    const isRead = req.method === 'GET' || req.method === 'HEAD';

    // Данные разделов. no-cache: браузер каждый раз уточняет, не изменился ли файл (ответ 304 — очень быстрый)
    const data = /^\/data\/([a-z-]+)\.json$/.exec(pathname);
    if (data && isRead && isCollectionName(data[1])) {
      setSecurityHeaders(res);
      return sendFile(req, res, store.fileOf(data[1]), 'no-cache');
    }

    // Всё остальное в папке data (пользователи, ключ сессий, резервные копии) наружу не отдаём.
    // Это важно при разработке: Vite умеет отдавать любые файлы проекта.
    let decoded = pathname;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      // испорченный адрес — проверяем как есть
    }
    const lower = decoded.toLowerCase().replace(/\\/g, '/');
    if (lower.startsWith('/data/') || /\/data\/(private|backups)(\/|$)/.test(lower)) {
      setSecurityHeaders(res);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Не найдено');
      return true;
    }

    // Загруженные файлы. Имя каждого файла уникально, поэтому их можно кэшировать надолго
    if (pathname.startsWith('/uploads/') && isRead) {
      setSecurityHeaders(res);
      const rest = pathname.slice('/uploads/'.length);
      const file = rest.split('/').some((part) => part.startsWith('.')) ? null : safeJoin(uploadsRoot, rest);
      if (file && (await sendFile(req, res, file, 'public, max-age=31536000, immutable'))) return true;
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Файл не найден');
      return true;
    }

    if (!pathname.startsWith('/api/')) return false;

    setSecurityHeaders(res);
    try {
      const parts = pathname
        .slice('/api/'.length)
        .split('/')
        .filter(Boolean)
        .map((part) => decodeURIComponent(part));
      await api(req, res, parts);
    } catch (error) {
      if (res.headersSent) return true;
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message, fields: error.fields });
      } else if (error instanceof URIError) {
        sendJson(res, 400, { error: 'Неверный адрес' });
      } else {
        console.error('[админ-панель] Ошибка сервера:', error);
        sendJson(res, 500, { error: 'На сервере что-то пошло не так. Попробуйте ещё раз.' });
      }
    }
    return true;
  }

  return { handle, store };
}
