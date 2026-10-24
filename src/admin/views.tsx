/**
 * Как разделы выглядят в админ-панели: значок в меню, строка в списке, фильтр,
 * предпросмотр «так будет на сайте» и адрес записи на сайте.
 * Предпросмотр использует те же карточки, что и сам сайт.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CircleHelp, FileText, GraduationCap, Handshake, Newspaper, Shapes, Users } from 'lucide-react';
import { freeSeats, isEnrollable, summarize } from '../api';
import type { Category, Direction, DocItem, FaqItem, NewsItem, Partner, TeamMember } from '../api/types';
import { CategoryCard } from '../components/cards/CategoryCard';
import { DirectionCard } from '../components/cards/DirectionCard';
import { NewsCard } from '../components/cards/NewsCard';
import { TeacherCard } from '../components/cards/TeacherCard';
import { PartnerCard } from '../components/home/PartnersSection';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { DocList } from '../components/ui/DocList';
import { fileUrl } from '../lib/asset';
import { makeExcerpt } from '../lib/excerpt';
import { ageRange, dayMonth, formatDate, initials, plural } from '../lib/format';
import type { Ctx } from './store';
import type { CollectionName, Item, Option } from './schema';

/** Выпадающий список над списком записей: «Все категории», «Все годы»… */
export type Filter = { label: string; options: (items: Item[], ctx: Ctx) => Option[]; valueOf: (item: Item) => string };

export type View = {
  icon: LucideIcon;
  // Слово после числа записей: 1 новость, 2 новости, 5 новостей
  forms: [string, string, string];
  // Какие ещё разделы нужны для подписей и предпросмотра (например, направлениям — категории)
  uses?: CollectionName[];
  // badge — отметка справа в строке (например, «Запись · 5 мест»)
  row: (item: Item, ctx: Ctx) => { title: string; meta?: string; thumb: ReactNode; badge?: ReactNode };
  filters?: Filter[];
  preview?: (item: Item, ctx: Ctx) => ReactNode;
  // Где запись видна на сайте
  siteUrl: (item: Item) => string;
};

const str = (value: unknown) => (typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value));
const num = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

function Thumb({ src, children, round }: { src?: string | null; children?: ReactNode; round?: boolean }) {
  return (
    <span className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden bg-surface text-sm font-semibold ${round ? 'rounded-full' : 'rounded-xl'}`} aria-hidden="true">
      {src ? <img src={fileUrl(src)} alt="" className="h-full w-full object-cover" loading="lazy" /> : children}
    </span>
  );
}

const titleOf = (items: Item[], idField: string, id: unknown, titleField: string) => str(items.find((x) => x[idField] === id)?.[titleField]);

/** Отметка о записи у направления: «Запись · 5 мест» (сумма по группам) или «Мест нет», если запись открыта, а мест ни в одной группе нет */
export function EnrollBadge({ item }: { item: Item }) {
  const badge = 'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold';
  if (isEnrollable(item)) {
    const seats = freeSeats(item);
    return (
      <span className={`${badge} bg-accent-soft text-ink`}>
        Запись · {seats} {plural(seats, ['место', 'места', 'мест'])}
      </span>
    );
  }
  if (item.enrollOpen === true) return <span className={`${badge} bg-[#FEF3F2] text-[#B42318]`}>Мест нет</span>;
  return null;
}

export const views: Record<CollectionName, View> = {
  news: {
    icon: Newspaper,
    forms: ['новость', 'новости', 'новостей'],
    row: (item) => {
      const date = str(item.date);
      const { day, month } = date ? dayMonth(date) : { day: '', month: '' };
      const photos = Array.isArray(item.gallery) ? item.gallery.length : 0;
      return {
        title: str(item.title),
        meta: [
          date && formatDate(date),
          photos > 0 && `${photos} фото`,
          !(Array.isArray(item.content) && item.content.length) && 'только анонс',
        ]
          .filter(Boolean)
          .join(' · '),
        thumb: (
          <Thumb src={str(item.image) || (Array.isArray(item.gallery) ? str(item.gallery[0]) : '')}>
            <span className="text-center leading-tight">
              {day}
              <span className="block text-[10px] font-medium text-muted">{month.slice(0, 3)}</span>
            </span>
          </Thumb>
        ),
      };
    },
    filters: [
      {
        label: 'Все годы',
        options: (items) => [...new Set(items.map((x) => str(x.date).slice(0, 4)))].sort().reverse().map((year) => ({ value: year, label: `${year} год` })),
        valueOf: (item) => str(item.date).slice(0, 4),
      },
    ],
    preview: (item) => (
      <NewsCard
        item={{
          ...(item as NewsItem),
          id: num(item.id, 0),
          title: str(item.title) || 'Заголовок новости',
          // Как на сайте: пустой анонс — начало текста
          excerpt: str(item.excerpt) || makeExcerpt(Array.isArray(item.content) ? (item.content as string[]) : []),
        }}
      />
    ),
    siteUrl: (item) => (item.id ? `/news/${item.id}` : '/news'),
  },

  directions: {
    icon: GraduationCap,
    forms: ['направление', 'направления', 'направлений'],
    uses: ['categories', 'team'],
    row: (item, ctx) => {
      const category = ctx.get('categories').find((c) => c.slug === item.category);
      return {
        title: str(item.title),
        meta: [
          str(category?.title),
          str(item.level),
          typeof item.ageFrom === 'number' && typeof item.ageTo === 'number' && ageRange(item.ageFrom, item.ageTo),
          str(item.teacher),
        ]
          .filter(Boolean)
          .join(' · '),
        thumb: (
          <Thumb round>
            <CategoryIcon name={str(category?.icon)} />
          </Thumb>
        ),
        badge: <EnrollBadge item={item} />,
      };
    },
    filters: [
      {
        label: 'Все категории',
        options: (_items, ctx) => ctx.get('categories').map((c) => ({ value: str(c.slug), label: str(c.title) })),
        valueOf: (item) => str(item.category),
      },
      {
        label: 'Запись: любая',
        options: () => [
          { value: 'open', label: 'Идёт запись' },
          { value: 'closed', label: 'Запись закрыта' },
        ],
        valueOf: (item) => (isEnrollable(item) ? 'open' : 'closed'),
      },
    ],
    preview: (item, ctx) => {
      const direction: Direction = {
        ...(item as Direction),
        title: str(item.title) || 'Название направления',
        level: str(item.level) || 'Уровень',
        ageFrom: num(item.ageFrom, 7),
        ageTo: num(item.ageTo, num(item.ageFrom, 7)),
        hoursPerWeek: num(item.hoursPerWeek, 2),
        teacher: str(item.teacher) || 'Педагог',
        groups: Array.isArray(item.groups) ? (item.groups as Direction['groups']) : [],
        room: str(item.room),
        scheduleNote: str(item.scheduleNote),
      };
      return <DirectionCard direction={direction} categoryTitle={titleOf(ctx.get('categories'), 'slug', item.category, 'title')} />;
    },
    siteUrl: (item) => (item.category ? `/directions/${str(item.category)}${item.id ? `#${str(item.id)}` : ''}` : '/directions'),
  },

  categories: {
    icon: Shapes,
    forms: ['категория', 'категории', 'категорий'],
    uses: ['directions'],
    row: (item, ctx) => {
      const list = ctx.get('directions').filter((d) => d.category === item.slug);
      const open = list.filter(isEnrollable).length;
      return {
        title: str(item.title),
        meta: [
          item.kind === 'core' ? 'Базовая' : 'Дополнительная',
          `${list.length} ${plural(list.length, ['направление', 'направления', 'направлений'])}`,
          open > 0 && `запись идёт: ${open}`,
        ]
          .filter(Boolean)
          .join(' · '),
        thumb: (
          <Thumb round>
            <CategoryIcon name={str(item.icon)} />
          </Thumb>
        ),
      };
    },
    preview: (item, ctx) => {
      const category = { ...(item as Category), title: str(item.title) || 'Название категории' };
      const all = ctx.get('categories');
      const index = all.findIndex((c) => c.slug === item.slug);
      return <CategoryCard category={summarize(category, ctx.get('directions') as Direction[])} index={index === -1 ? all.length : index} />;
    },
    siteUrl: (item) => `/directions/${str(item.slug)}`,
  },

  team: {
    icon: Users,
    forms: ['сотрудник', 'сотрудника', 'сотрудников'],
    row: (item) => ({
      title: str(item.name),
      meta: [str(item.role), item.group === 'leadership' ? 'Руководство' : 'Педагоги'].filter(Boolean).join(' · '),
      thumb: (
        <Thumb src={str(item.photo)} round>
          {initials(str(item.name))}
        </Thumb>
      ),
    }),
    filters: [
      {
        label: 'Все сотрудники',
        options: () => [
          { value: 'teacher', label: 'Педагоги' },
          { value: 'leadership', label: 'Руководство' },
        ],
        valueOf: (item) => str(item.group),
      },
    ],
    preview: (item) => (
      <div className="max-w-[18rem]">
        <TeacherCard member={{ ...(item as TeamMember), id: str(item.id), name: str(item.name) || 'Фамилия Имя Отчество' }} />
      </div>
    ),
    siteUrl: () => '/team',
  },

  documents: {
    icon: FileText,
    forms: ['раздел', 'раздела', 'разделов'],
    row: (item) => {
      const count = Array.isArray(item.items) ? item.items.length : 0;
      const page = item.page === 'events-plan' ? 'План мероприятий' : item.page === 'vacancies' ? 'Вакантные места' : item.page === 'schedule' ? 'Расписание занятий' : 'Документы';
      return {
        title: str(item.title),
        meta: `Страница «${page}» · ${count} ${plural(count, ['документ', 'документа', 'документов'])}`,
        thumb: (
          <Thumb>
            <FileText size={20} />
          </Thumb>
        ),
      };
    },
    preview: (item) => {
      const items = (Array.isArray(item.items) ? (item.items as DocItem[]) : []).filter((doc) => doc.title && doc.url);
      return (
        <div>
          <p className="mb-4 font-display text-lg font-semibold">{str(item.title) || 'Название раздела'}</p>
          {items.length > 0 ? <DocList items={items} /> : <p className="text-sm text-muted">Документов пока нет</p>}
        </div>
      );
    },
    siteUrl: (item) => (item.page === 'documents' || !item.page ? `/documents#${str(item.slug)}` : `/${str(item.page)}`),
  },

  faq: {
    icon: CircleHelp,
    forms: ['вопрос', 'вопроса', 'вопросов'],
    row: (item) => ({
      title: str(item.question),
      meta: Array.isArray(item.answer) ? str(item.answer[0]).slice(0, 90) : '',
      thumb: (
        <Thumb>
          <CircleHelp size={20} />
        </Thumb>
      ),
    }),
    preview: (item) => {
      const faq = item as FaqItem;
      return (
        <div className="border-y border-line py-4">
          <p className="font-display text-lg font-semibold leading-snug">{str(faq.question) || 'Вопрос'}</p>
          <div className="mt-3 space-y-3 text-muted">
            {(Array.isArray(faq.answer) ? faq.answer : []).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      );
    },
    siteUrl: () => '/faq',
  },

  partners: {
    icon: Handshake,
    forms: ['партнёр', 'партнёра', 'партнёров'],
    row: (item) => ({
      title: str(item.name),
      meta: str(item.role),
      thumb: <Thumb src={str(item.logo)}>{str(item.short)}</Thumb>,
    }),
    preview: (item) => <PartnerCard partner={{ ...(item as Partner), name: str(item.name) || 'Название организации' }} />,
    siteUrl: () => '/',
  },
};
