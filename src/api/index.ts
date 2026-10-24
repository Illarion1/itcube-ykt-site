/**
 * Слой данных. Компоненты получают данные ТОЛЬКО через эти функции.
 *
 * Данные лежат на сервере в файлах data/<раздел>.json, их меняют сотрудники через
 * админ-панель (/admin). Сайт скачивает каждый раздел один раз за посещение:
 * GET /data/news.json, /data/team.json и т.д. (см. server/app.ts).
 *
 * Компоненты ждут Promise, поэтому источник данных можно поменять здесь,
 * не трогая остальной код.
 */
import { isGroup, mainNav } from '../data/navigation';
import { site } from '../data/site';
import { asset } from '../lib/asset';
import { freeSeats, isEnrollable, openGroups } from '../lib/enroll';
import { makeExcerpt } from '../lib/excerpt';
import { ageRange } from '../lib/format';
import { groupsFromLessons } from '../lib/schedule';
import type { Group, Lesson } from '../lib/schedule';
import type {
  Category,
  CategorySummary,
  Direction,
  DocGroup,
  DocItem,
  DocPage,
  FaqItem,
  NewsItem,
  Paginated,
  Partner,
  SearchResults,
  Stats,
  TeamMember,
} from './types';

export { freeSeats, isEnrollable, openGroups };

type Collections = {
  news: NewsItem;
  directions: Direction;
  categories: Category;
  team: TeamMember;
  documents: DocGroup;
  faq: FaqItem;
  partners: Partner;
};

// Уже загруженные разделы: каждый скачивается один раз, повторные вызовы получают тот же Promise
const cache = new Map<keyof Collections, Promise<unknown[]>>();

function load<K extends keyof Collections>(name: K): Promise<Collections[K][]> {
  let promise = cache.get(name);
  if (!promise) {
    // no-cache: браузер уточняет у сервера, не изменился ли файл, — правки из админ-панели видны сразу
    promise = fetch(asset(`data/${name}.json`), { cache: 'no-cache' }).then((res) => {
      if (!res.ok) throw new Error(`Не удалось загрузить данные (${res.status})`);
      return res.json() as Promise<unknown[]>;
    });
    // Если загрузка не удалась, при следующем вызове попробуем ещё раз
    promise.catch(() => cache.delete(name));
    cache.set(name, promise);
  }
  return promise as Promise<Collections[K][]>;
}

/** Забыть загруженные данные раздела (или всех разделов) — после правки в админ-панели */
export function invalidate(name?: keyof Collections) {
  if (name) cache.delete(name);
  else cache.clear();
}

// Направления из data от прежней версии сайта могут быть ещё без групп (сервер переводит данные при запуске,
// а статическая копия сайта берёт файлы как есть) — собираем группы из прежнего расписания
async function loadDirections(): Promise<Direction[]> {
  return (await load('directions')).map((d) => {
    const legacy = (d as Direction & { schedule?: unknown }).schedule;
    return {
      ...d,
      groups: Array.isArray(d.groups) ? d.groups : groupsFromLessons(Array.isArray(legacy) ? (legacy as Lesson[]) : []),
      room: d.room ?? '',
      scheduleNote: d.scheduleNote ?? '',
    };
  });
}

// От свежих к старым. Если анонс не заполнен, берём начало текста
async function loadNews() {
  return (await load('news'))
    .map((n) => (n.excerpt ? n : { ...n, excerpt: makeExcerpt(n.content ?? []) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Сводка по направлениям категории: сколько их, для какого возраста, сколько часов, где идёт запись */
export function summarize(category: Category, allDirections: Direction[]): CategorySummary {
  const list = allDirections.filter((d) => d.category === category.slug);
  // В новой категории направлений может ещё не быть — тогда цифры нулевые, а карточки их не показывают
  const min = (values: number[]) => (values.length > 0 ? Math.min(...values) : 0);
  const max = (values: number[]) => (values.length > 0 ? Math.max(...values) : 0);
  return {
    ...category,
    directionsCount: list.length,
    openCount: list.filter(isEnrollable).length,
    ageFrom: min(list.map((d) => d.ageFrom)),
    ageTo: max(list.map((d) => d.ageTo)),
    hoursMin: min(list.map((d) => d.hoursPerWeek)),
    hoursMax: max(list.map((d) => d.hoursPerWeek)),
    duration: [...new Set(list.map((d) => d.duration))].join(', '),
  };
}

/** Все категории со сводкой по направлениям */
export async function getCategories(): Promise<CategorySummary[]> {
  const [categories, directions] = await Promise.all([load('categories'), loadDirections()]);
  return categories.map((c) => summarize(c, directions));
}

/** Одна категория и её направления (null — если такой нет) */
export async function getCategory(slug: string): Promise<(CategorySummary & { directions: Direction[] }) | null> {
  const [categories, directions] = await Promise.all([load('categories'), loadDirections()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  return { ...summarize(category, directions), directions: directions.filter((d) => d.category === slug) };
}

/** Все направления */
export async function getDirections(): Promise<Direction[]> {
  return loadDirections();
}

/** Направления, на которые сейчас можно записаться: запись открыта и хотя бы в одной группе есть места */
export async function getOpenDirections(): Promise<Direction[]> {
  return (await loadDirections()).filter(isEnrollable);
}

/** Адрес формы записи на направление (и сразу в группу, если она известна) */
export const enrollUrl = (direction: Direction, group?: Group) =>
  `/feedback?topic=enroll&direction=${encodeURIComponent(direction.id)}${group ? `&group=${encodeURIComponent(group.id)}` : ''}`;

/** Новости постранично; year — показать только новости этого года */
export async function getNews({ page = 1, perPage = 9, year = '' } = {}): Promise<Paginated<NewsItem>> {
  const news = await loadNews();
  const list = year ? news.filter((n) => n.date.startsWith(year)) : news;
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * perPage;
  return { items: list.slice(start, start + perPage), page: current, pages, total: list.length };
}

/** Годы, за которые есть новости (от новых к старым) */
export async function getNewsYears(): Promise<string[]> {
  const news = await loadNews();
  return [...new Set(news.map((n) => n.date.slice(0, 4)))];
}

/** Несколько самых свежих новостей */
export async function getLatestNews(limit = 3): Promise<NewsItem[]> {
  const news = await loadNews();
  return news.slice(0, limit);
}

/** Одна новость по номеру (null — если такой нет) */
export async function getNewsItem(id: number): Promise<NewsItem | null> {
  const news = await loadNews();
  return news.find((n) => n.id === id) ?? null;
}

/** Сотрудники центра */
export async function getTeam(): Promise<TeamMember[]> {
  return load('team');
}

/** Вопросы и ответы */
export async function getFaq(): Promise<FaqItem[]> {
  return load('faq');
}

/** Партнёры и организаторы */
export async function getPartners(): Promise<Partner[]> {
  return load('partners');
}

/**
 * Поиск по сайту: разделы меню, категории, направления и новости.
 * Ищем без учёта регистра; «ё» и «е» считаем одной буквой.
 */
export async function search(query: string): Promise<SearchResults> {
  const [news, categories, directions] = await Promise.all([loadNews(), load('categories'), loadDirections()]);
  const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е');
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches = (...texts: string[]) => {
    const haystack = normalize(texts.join(' '));
    return words.length > 0 && words.every((w) => haystack.includes(w));
  };

  const menuPages = mainNav.flatMap((item) => (isGroup(item) ? item.children : [item])).filter((item) => !item.external);
  const categoryTitle = Object.fromEntries(categories.map((c) => [c.slug, c.title]));

  return {
    pages: menuPages
      .filter((p) => matches(p.label, p.description ?? ''))
      .map((p) => ({ title: p.label, description: p.description ?? '', to: p.to })),
    categories: categories
      .filter((c) => matches(c.title, c.short))
      .map((c) => ({ title: c.title, description: c.short, to: `/directions/${c.slug}` })),
    directions: directions
      .filter((d) => matches(d.title, d.teacher, d.annotation, categoryTitle[d.category] ?? ''))
      .map((d) => ({
        title: `${d.title} · ${d.level}`,
        description: `${categoryTitle[d.category] ?? ''} · ${ageRange(d.ageFrom, d.ageTo)} · ${d.teacher}`,
        to: `/directions/${d.category}#${d.id}`,
      })),
    news: news
      .filter((n) => matches(n.title, n.excerpt, ...(n.content ?? [])))
      .map((n) => ({ title: n.title, description: n.excerpt, to: `/news/${n.id}`, date: n.date })),
  };
}

/** Данные формы обратной связи / записи */
export type FeedbackData = {
  topic: 'question' | 'enroll' | 'idea';
  // Для заявки на запись — ФИО ученика, для вопроса и отзыва — имя автора
  name: string;
  // Возраст (как напечатали) и класс ученика — для заявки на запись
  age: string;
  grade: string;
  phone: string;
  email: string;
  // id направления и группы — для заявки на запись
  direction: string;
  group: string;
  message: string;
  consent: boolean;
  // Поле-ловушка для спам-ботов: у людей всегда пустое
  website: string;
};

/** Ошибка отправки формы: текст для человека и ошибки по полям */
export class FeedbackError extends Error {
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.fields = fields;
  }
}

/** Отправка формы: заявка попадает в админ-панель, в раздел «Заявки и обращения» */
export async function sendFeedback(data: FeedbackData): Promise<void> {
  let res: Response;
  try {
    res = await fetch(asset('api/applications'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    throw new FeedbackError('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.');
  }
  if (res.ok) return;
  // Сайт открыт без сервера (статическая копия) — отправить форму некуда
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new FeedbackError(`Форма сейчас не работает. Позвоните нам: ${site.phones[0].display}.`);
  }
  const body = (await res.json()) as { error?: string; fields?: Record<string, string> };
  throw new FeedbackError(body.error ?? 'Не удалось отправить. Попробуйте ещё раз.', body.fields ?? {});
}

/** Разделы документов для страницы «Документы» */
export async function getDocuments(): Promise<DocGroup[]> {
  return (await load('documents')).filter((g) => g.page === 'documents');
}

/** Все документы для отдельной страницы: «План мероприятий», «Вакантные места» или «Расписание занятий» */
export async function getDocList(page: Exclude<DocPage, 'documents'>): Promise<DocItem[]> {
  return (await load('documents')).filter((g) => g.page === page).flatMap((g) => g.items);
}

/** Цифры для главной страницы */
export async function getStats(): Promise<Stats> {
  const [directions, categories, team] = await Promise.all([loadDirections(), load('categories'), load('team')]);
  return {
    directions: directions.length,
    categories: categories.length,
    teachers: team.filter((t) => t.group === 'teacher').length,
    foundedYear: site.foundedYear,
  };
}
