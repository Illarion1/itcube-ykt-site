/**
 * Хранилище данных сайта — обычные JSON-файлы в папке data (её путь можно поменять
 * переменной окружения DATA_DIR):
 *
 *   data/news.json, team.json, …   — разделы сайта (то, что меняется в админ-панели)
 *   data/uploads/                   — загруженные фото и документы
 *   data/backups/                   — предыдущие версии файлов (последние 30 для каждого раздела)
 *   data/private/                   — пользователи админ-панели, заявки с сайта и ключ сессий; наружу не отдаётся
 *
 * При первом запуске разделы копируются из папки content — это начальные данные,
 * перенесённые со старого сайта.
 */
import { randomBytes } from 'node:crypto';
import { copyFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { collectionList } from '../src/admin/schema.ts';
import type { CollectionName, Item } from '../src/admin/schema.ts';
import { groupsFromLessons } from '../src/lib/schedule.ts';
import type { Lesson } from '../src/lib/schedule.ts';

export type User = {
  login: string;
  name: string;
  // Пароль хранится только в виде «отпечатка» (scrypt), сам пароль узнать из него нельзя
  hash: string;
  createdAt: string;
};

const BACKUPS_TO_KEEP = 30;

async function exists(file: string) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Запись «целиком или никак»: сначала во временный файл, потом мгновенная замена.
 * Если сервер выключится посреди записи, старый файл останется целым.
 */
async function writeJsonAtomic(file: string, data: unknown) {
  const tmp = `${file}.${randomBytes(4).toString('hex')}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  // В Windows файл может быть ненадолго занят антивирусом или редактором — пробуем ещё раз
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(tmp, file);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(code ?? '')) {
        await rm(tmp, { force: true });
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
}

export type Store = ReturnType<typeof createStore>;

// Закрытые файлы в data/private: пользователи админ-панели и заявки с сайта
type PrivateName = 'users' | 'applications';

export function createStore(dataDir: string, contentDir: string) {
  const fileOf = (name: CollectionName) => path.join(dataDir, `${name}.json`);
  const privateDir = path.join(dataDir, 'private');
  const backupsDir = path.join(dataDir, 'backups');
  const uploadsDir = path.join(dataDir, 'uploads');
  const privateFile = (name: PrivateName) => path.join(privateDir, `${name}.json`);

  // Изменения одного файла выполняются строго по очереди, чтобы два одновременных
  // сохранения не затёрли друг друга
  const queues = new Map<string, Promise<unknown>>();
  function exclusive<T>(key: string, task: () => Promise<T>): Promise<T> {
    const result = (queues.get(key) ?? Promise.resolve()).then(task);
    queues.set(key, result.catch(() => undefined));
    return result;
  }

  /**
   * Переход с прежней версии сайта: там нынешние направления назывались «программами» (programs.json),
   * а нынешние категории — «направлениями» (directions.json). Переименовываем файлы и поля.
   * Старые файлы сохраняются в backups/legacy. Если переход прервётся, при следующем запуске он повторится.
   */
  async function migrateLegacy() {
    const legacyPrograms = path.join(dataDir, 'programs.json');
    if (!(await exists(legacyPrograms))) return;
    const legacyDir = path.join(backupsDir, 'legacy');
    await mkdir(legacyDir, { recursive: true });

    // Прежние «направления» (в них есть slug и kind) становятся категориями. Категории, только что
    // скопированные из начальных данных, заменяем ими: прежние могли уже поправить в админ-панели
    const old = (await exists(fileOf('directions'))) ? (JSON.parse(await readFile(fileOf('directions'), 'utf8')) as Item[]) : [];
    if (old.length > 0 && old.every((d) => 'slug' in d && 'kind' in d)) {
      await copyFile(fileOf('directions'), path.join(legacyDir, 'directions.json'));
      const seed = await readFile(path.join(contentDir, 'categories.json'), 'utf8').catch(() => null);
      const current = await readFile(fileOf('categories'), 'utf8').catch(() => null);
      if (current === null || current === seed) await writeJsonAtomic(fileOf('categories'), old);
      // Резервные копии прежнего формата — тоже в legacy, чтобы их не перепутали с новыми
      for (const name of ['directions', 'programs']) {
        const dir = path.join(backupsDir, name);
        if (await exists(dir)) await rename(dir, path.join(legacyDir, `${name}-backups`));
      }
    }
    await copyFile(legacyPrograms, path.join(legacyDir, 'programs.json'));
    const programs = JSON.parse(await readFile(legacyPrograms, 'utf8')) as Item[];
    const directions = programs.map(({ direction, ...rest }) => ({ id: rest.id, title: rest.title, category: direction, ...rest, enrollOpen: false }));
    await writeJsonAtomic(fileOf('directions'), directions);
    await rm(legacyPrograms);
    console.log('[админ-панель] Данные обновлены: «программы» стали направлениями, прежние «направления» — категориями');
  }

  const readSeed = async (name: CollectionName) => JSON.parse(await readFile(path.join(contentDir, `${name}.json`), 'utf8').catch(() => '[]')) as Item[];

  /**
   * Группы направлений: у каждой — название, свободные места и занятия. Раньше расписание было общим списком
   * занятий (schedule), а свободные места — одним числом на направление (seats). Переводим так:
   *  - направления с прежним расписанием — его занятия раскладываются по группам;
   *  - направления совсем без расписания (data ещё старше) — берём группы из начальных данных, но только
   *    если направление не меняли (то же название, уровень и педагог), иначе групп нет; заодно добавляем
   *    раздел документов с утверждённым расписанием (PDF) для страницы «Расписание занятий»;
   *  - места «на всё направление» перенести нельзя: неизвестно, в какие группы. Пишем об этом в журнал.
   * Перед изменением файлов делаются резервные копии.
   */
  async function migrateGroups() {
    const current = await read('directions');
    if (current.every((d) => Array.isArray(d.groups))) return;
    const seed = new Map((await readSeed('directions')).map((d) => [d.id, d]));
    const withoutSchedule = current.some((d) => !Array.isArray(d.groups) && !Array.isArray(d.schedule));
    const lostSeats: string[] = [];

    await update('directions', (items) => ({
      items: items.map((d) => {
        if (Array.isArray(d.groups)) return d;
        const { schedule, seats, ...rest } = d;
        if (d.enrollOpen === true && typeof seats === 'number' && seats > 0) lostSeats.push(`«${String(d.title)}» (${seats})`);
        if (Array.isArray(schedule)) {
          return { ...rest, groups: groupsFromLessons(schedule as Lesson[]), room: d.room ?? '', scheduleNote: d.scheduleNote ?? '' };
        }
        const from = seed.get(d.id);
        const same = from !== undefined && from.title === d.title && from.level === d.level && from.teacher === d.teacher;
        return { ...rest, groups: (same && from.groups) || [], room: (same && from.room) || '', scheduleNote: (same && from.scheduleNote) || '' };
      }),
      result: null,
    }));

    if (withoutSchedule) {
      const documents = await read('documents');
      const scheduleDocs = (await readSeed('documents')).filter((g) => g.page === 'schedule' && !documents.some((d) => d.slug === g.slug));
      if (scheduleDocs.length > 0 && !documents.some((g) => g.page === 'schedule')) {
        await update('documents', (items) => ({ items: [...items, ...scheduleDocs], result: null }));
      }
    }
    console.log('[админ-панель] Данные обновлены: у направлений появились группы со свободными местами');
    if (lostSeats.length > 0) {
      console.log(`[админ-панель] Свободные места теперь указываются у групп. Раньше места были на всё направление: ${lostSeats.join(', ')} — отметьте их у нужных групп в разделе «Запись и места».`);
    }
  }

  /** Создаёт папки и копирует начальные данные. Возвращает разделы, которые были созданы сейчас */
  async function init(): Promise<CollectionName[]> {
    await Promise.all([privateDir, backupsDir, uploadsDir].map((dir) => mkdir(dir, { recursive: true })));
    await migrateLegacy();
    const created: CollectionName[] = [];
    for (const { name } of collectionList) {
      if (await exists(fileOf(name))) continue;
      const seed = path.join(contentDir, `${name}.json`);
      if (await exists(seed)) await copyFile(seed, fileOf(name));
      else await writeJsonAtomic(fileOf(name), []);
      created.push(name);
    }
    await migrateGroups();
    return created;
  }

  async function read(name: CollectionName): Promise<Item[]> {
    const data: unknown = JSON.parse(await readFile(fileOf(name), 'utf8'));
    if (!Array.isArray(data)) throw new Error(`Файл ${fileOf(name)} повреждён: ожидался список записей`);
    return data as Item[];
  }

  // Копия текущей версии файла перед изменением; старые копии удаляются
  async function backup(name: CollectionName) {
    const dir = path.join(backupsDir, name);
    await mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await copyFile(fileOf(name), path.join(dir, `${stamp}.json`));
    const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
    await Promise.all(files.slice(0, -BACKUPS_TO_KEEP).map((f) => rm(path.join(dir, f), { force: true })));
  }

  /**
   * Изменяет раздел: change получает текущие записи и возвращает новые записи и результат.
   * Если change выбросит ошибку, файл не изменится.
   */
  function update<T>(name: CollectionName, change: (items: Item[]) => { items: Item[]; result: T }): Promise<T> {
    return exclusive(name, async () => {
      const { items, result } = change(await read(name));
      await backup(name);
      await writeJsonAtomic(fileOf(name), items);
      return result;
    });
  }

  async function readPrivate<T>(name: PrivateName): Promise<T[]> {
    if (!(await exists(privateFile(name)))) return [];
    return JSON.parse(await readFile(privateFile(name), 'utf8')) as T[];
  }

  /** Изменяет закрытый файл так же, как update — раздел: по очереди и «целиком или никак» */
  function updatePrivate<T, R>(name: PrivateName, change: (list: T[]) => Promise<{ list: T[]; result: R }>): Promise<R> {
    return exclusive(name, async () => {
      const { list, result } = await change(await readPrivate<T>(name));
      await mkdir(privateDir, { recursive: true });
      await writeJsonAtomic(privateFile(name), list);
      return result;
    });
  }

  const readUsers = () => readPrivate<User>('users');

  /**
   * Секретный ключ для подписи сессий. Берётся из SESSION_SECRET или создаётся
   * один раз и хранится в data/private/session.key — тогда вход не слетает после перезапуска.
   */
  async function sessionSecret(): Promise<string> {
    if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
    const file = path.join(privateDir, 'session.key');
    if (await exists(file)) return (await readFile(file, 'utf8')).trim();
    const secret = randomBytes(32).toString('hex');
    await mkdir(privateDir, { recursive: true });
    await writeFile(file, secret, { encoding: 'utf8', mode: 0o600 });
    return secret;
  }

  return { dataDir, uploadsDir, fileOf, init, read, update, readPrivate, updatePrivate, readUsers, sessionSecret };
}
