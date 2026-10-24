// Запросы админ-панели к серверу (адреса /api/… — см. server/app.ts)
import type { CollectionName, FieldErrors, Item } from './schema';

export type SessionUser = { login: string; name: string };
export type Session = { user: SessionUser | null; setup: boolean };
export type UserInfo = SessionUser & { createdAt: string };
export type UploadedFile = { url: string; name: string; size: number };

export type ApplicationStatus = 'new' | 'progress' | 'done';

/** Заявка или вопрос с формы на сайте (см. server/applications.ts) */
export type Application = {
  id: string;
  createdAt: string;
  topic: 'enroll' | 'question' | 'idea';
  // Заявка на запись — ФИО ученика, вопрос или отзыв — имя автора
  name: string;
  // Возраст и класс ученика (только в заявке на запись; у старых заявок их нет)
  age?: number | null;
  grade?: string | null;
  phone: string;
  email: string;
  directionId: string | null;
  directionTitle: string | null;
  // Группа (у заявок, отправленных до появления групп, её нет)
  groupId?: string | null;
  groupName?: string | null;
  message: string;
  status: ApplicationStatus;
  note: string;
  seatTaken: boolean;
};

/** Ошибка от сервера: понятный текст и ошибки по полям формы */
export class ApiError extends Error {
  status: number;
  fields: FieldErrors;

  constructor(status: number, message: string, fields: FieldErrors = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

// Когда сессия закончилась, AdminApp показывает окно входа поверх текущей страницы —
// так несохранённые изменения в форме не пропадут
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

const NO_CONNECTION = 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.';

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, NO_CONNECTION);
  }
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError(res.status, 'Сервер админ-панели не отвечает. Попробуйте обновить страницу.');
  }
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 && url !== '/api/session') onUnauthorized();
    throw new ApiError(res.status, data.error ?? 'Не получилось', data.fields ?? {});
  }
  return data as T;
}

const itemUrl = (name: CollectionName, id: string) => `/api/collections/${name}/${encodeURIComponent(id)}`;

export const adminApi = {
  /**
   * Кто вошёл. 'static' — сайт открыт без сервера (статическая версия на Vercel или GitHub Pages),
   * там админ-панель работать не может.
   */
  async session(): Promise<Session | 'static'> {
    let res: Response;
    try {
      res = await fetch('/api/session', { credentials: 'same-origin' });
    } catch {
      throw new ApiError(0, NO_CONNECTION);
    }
    // Вместо ответа сервера пришла обычная страница — значит, сервера нет
    if (!res.headers.get('content-type')?.includes('application/json')) return 'static';
    const data = await res.json();
    if (!res.ok) throw new ApiError(res.status, data.error ?? 'Не получилось');
    return data as Session;
  },
  login: (login: string, password: string) => request<{ user: SessionUser }>('POST', '/api/session', { login, password }),
  logout: () => request<{ ok: true }>('DELETE', '/api/session'),

  create: (name: CollectionName, item: Item) => request<{ item: Item }>('POST', `/api/collections/${name}`, item),
  update: (name: CollectionName, id: string, item: Item) => request<{ item: Item }>('PUT', itemUrl(name, id), item),
  remove: (name: CollectionName, id: string) => request<{ ok: true }>('DELETE', itemUrl(name, id)),
  reorder: (name: CollectionName, order: string[]) => request<{ ok: true }>('PUT', `/api/collections/${name}`, { order }),

  users: () => request<{ users: UserInfo[] }>('GET', '/api/users'),
  createUser: (user: { login: string; name: string; password: string }) => request<{ user: SessionUser }>('POST', '/api/users', user),
  updateUser: (login: string, changes: { name?: string; password?: string }) =>
    request<{ user: SessionUser }>('PUT', `/api/users/${encodeURIComponent(login)}`, changes),
  removeUser: (login: string) => request<{ ok: true }>('DELETE', `/api/users/${encodeURIComponent(login)}`),

  applications: () => request<{ applications: Application[] }>('GET', '/api/applications'),
  // takeSeat — «записали ребёнка»: вычесть одно свободное место у направления
  updateApplication: (id: string, changes: { status?: ApplicationStatus; note?: string; takeSeat?: boolean }) =>
    request<{ application: Application; direction: Item | null }>('PUT', `/api/applications/${encodeURIComponent(id)}`, changes),
  removeApplication: (id: string) => request<{ ok: true }>('DELETE', `/api/applications/${encodeURIComponent(id)}`),
};

/**
 * Загрузка файла. Через XMLHttpRequest, а не fetch: так видно, сколько уже загрузилось
 * (onProgress получает долю от 0 до 1) — для больших фото на медленном интернете это важно.
 */
export function uploadFile(file: File, onProgress?: (share: number) => void): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploads');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let data: { error?: string } & Partial<UploadedFile> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // ответ не JSON — ниже покажем общую ошибку
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) {
        resolve(data as UploadedFile);
        return;
      }
      if (xhr.status === 401) onUnauthorized();
      reject(new ApiError(xhr.status, data.error ?? 'Файл не загрузился. Попробуйте ещё раз.'));
    };
    xhr.onerror = () => reject(new ApiError(0, NO_CONNECTION));
    xhr.send(file);
  });
}
