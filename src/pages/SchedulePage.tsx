import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { enrollUrl, getCategories, getDirections, getDocList, isEnrollable, openGroups } from '../api';
import type { Direction } from '../api/types';
import { site } from '../data/site';
import { useData } from '../hooks/useData';
import { cn } from '../lib/cn';
import { ageRange, plural } from '../lib/format';
import { busyDays, days, flatLessons, lessonsOn, timeRange } from '../lib/schedule';
import type { Day } from '../lib/schedule';
import { Button } from '../components/ui/Button';
import { DocList } from '../components/ui/DocList';
import { PageHeader } from '../components/ui/PageHeader';
import { ScheduleList } from '../components/ui/ScheduleList';

const fieldClass =
  'h-12 w-full rounded-full border border-line bg-white px-5 text-base outline-none transition-colors hover:border-ink/40 focus-visible:border-ink';

const directionUrl = (d: Direction) => `/directions/${d.category}#${d.id}`;
// Все занятия направления, с названием группы у каждого
const lessonsOf = (d: Direction) => flatLessons(d.groups);

// Зелёная точка у группы, в которую идёт набор
function VacancyDot() {
  return (
    <>
      <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-accent align-middle" aria-hidden="true" />
      <span className="sr-only"> — есть свободные места</span>
    </>
  );
}

/**
 * Расписание занятий: дни и время групп каждого направления, по категориям.
 * На компьютере — таблица по дням недели (как в утверждённом расписании), на телефоне — карточки.
 * Расписание сотрудники ставят в админ-панели (раздел «Расписание»). Фильтры хранятся в адресе страницы.
 */
export function SchedulePage() {
  const { data: directions } = useData(getDirections);
  const { data: categories } = useData(getCategories);
  const { data: documents } = useData(() => getDocList('schedule'));
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const age = params.get('age') ?? '';
  const dayParam = params.get('day') ?? '';
  const day = days.some((d) => d.value === dayParam) ? (dayParam as Day) : '';

  // Меняем один фильтр, остальные оставляем как есть
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const all = directions ?? [];
  const categoryTitle = Object.fromEntries((categories ?? []).map((c) => [c.slug, c.title]));
  const words = q.toLowerCase().replace(/ё/g, 'е').split(/\s+/).filter(Boolean);
  const matches = (d: Direction) => {
    const text = `${d.title} ${d.teacher} ${categoryTitle[d.category] ?? ''}`.toLowerCase().replace(/ё/g, 'е');
    if (!words.every((w) => text.includes(w))) return false;
    if (category && d.category !== category) return false;
    if (age && (Number(age) < d.ageFrom || Number(age) > d.ageTo)) return false;
    return true;
  };

  const filtered = all.filter((d) => lessonsOf(d).length > 0 && matches(d) && (!day || lessonsOf(d).some((l) => l.day === day)));
  // Направления без расписания при выборе дня не показываем: про их дни ничего не известно
  const pending = day ? [] : all.filter((d) => lessonsOf(d).length === 0 && matches(d));
  // Столбцы — дни, в которые вообще есть занятия (обычно без воскресенья)
  const columns = days.filter((d) => busyDays(all.flatMap(lessonsOf)).includes(d.value));
  const anyVacancy = filtered.some(isEnrollable);

  const known = new Set(categories?.map((c) => c.slug));
  const groups = [
    ...(categories ?? []).map((c) => ({ key: c.slug, title: c.title, items: filtered.filter((d) => d.category === c.slug) })),
    { key: 'other', title: 'Другие направления', items: filtered.filter((d) => !known.has(d.category)) },
  ].filter((group) => group.items.length > 0);

  const hasFilters = Boolean(q || category || age || day);
  const reset = () => setParams(new URLSearchParams(), { replace: true });

  return (
    <>
      <PageHeader
        eyebrow="Обучение"
        title="Расписание занятий"
        crumbs={[{ label: 'Обучение', to: '/directions' }]}
        lead="Дни и время занятий каждой группы. Расписание может меняться — об изменениях сообщает педагог."
      />

      <div className="container-x space-y-16 pb-20 lg:pb-28">
        <div>
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="grid gap-3 rounded-panel bg-surface p-4 sm:p-6 md:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr]"
          >
            <label className="relative">
              <span className="sr-only">Поиск по направлению или педагогу</span>
              <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => update('q', e.target.value)} placeholder="Направление или педагог…" className={`${fieldClass} pl-12`} />
            </label>
            <label>
              <span className="sr-only">Категория</span>
              <select value={category} onChange={(e) => update('category', e.target.value)} className={fieldClass}>
                <option value="">Все категории</option>
                {(categories ?? []).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Возраст ребёнка</span>
              <select value={age} onChange={(e) => update('age', e.target.value)} className={fieldClass}>
                <option value="">Любой возраст</option>
                {Array.from({ length: 13 }, (_, i) => i + 6).map((n) => (
                  <option key={n} value={n}>
                    {n} {plural(n, ['год', 'года', 'лет'])}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">День недели</span>
              <select value={day} onChange={(e) => update('day', e.target.value)} className={fieldClass}>
                <option value="">Любой день</option>
                {days.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="font-medium" aria-live="polite">
              {directions ? `Найдено: ${filtered.length} ${plural(filtered.length, ['направление', 'направления', 'направлений'])}` : 'Загружаем расписание…'}
            </p>
            {anyVacancy && (
              <p className="hidden items-center text-sm text-muted lg:flex">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                группа, в которую сейчас идёт набор
              </p>
            )}
            {hasFilters && (
              <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
                <X size={16} aria-hidden="true" />
                Сбросить фильтры
              </button>
            )}
          </div>

          {!directions || !categories ? (
            <div className="mt-6 h-64 animate-pulse rounded-panel bg-surface" aria-busy="true" aria-label="Загрузка" />
          ) : (
            filtered.length === 0 && (
              <div className="mt-6 rounded-panel border border-dashed border-line p-10 text-center">
                <p className="font-display text-h3 font-semibold">{all.some((d) => lessonsOf(d).length > 0) ? 'Ничего не нашлось' : 'Расписание скоро появится'}</p>
                <p className="mt-3 text-muted">
                  {hasFilters ? 'Попробуйте изменить запрос или сбросить фильтры.' : `Пока его можно узнать по телефону ${site.phones[0].display}.`}
                </p>
                {hasFilters && (
                  <div className="mt-6">
                    <Button variant="dark" onClick={reset}>
                      Показать всё расписание
                    </Button>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`schedule-${group.key}`}>
            <h2 id={`schedule-${group.key}`} className="font-display text-h3 font-semibold">
              {group.title}
            </h2>

            {/* Компьютер: таблица по дням недели */}
            <table className="mt-6 hidden w-full table-fixed border-collapse text-sm lg:table">
              <caption className="sr-only">Расписание: {group.title}</caption>
              <thead>
                <tr className="border-b border-ink text-left">
                  <th scope="col" className="w-[28%] py-3 pr-4 font-semibold">
                    Направление
                  </th>
                  {columns.map((d) => (
                    <th key={d.value} scope="col" className={cn('px-2 py-3 font-semibold', d.value === day && 'bg-accent-soft')}>
                      <abbr title={d.label} className="no-underline">
                        {d.short}
                      </abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.items.map((direction) => {
                  const recruiting = new Set(openGroups(direction).map((g) => g.name));
                  return (
                    <tr key={direction.id} className="border-b border-line align-top">
                      <th scope="row" className="py-4 pr-4 text-left font-normal">
                        <DirectionInfo direction={direction} />
                      </th>
                      {columns.map((d) => (
                        <td key={d.value} className={cn('px-2 py-4', d.value === day && 'bg-accent-soft')}>
                          <ul className="space-y-2">
                            {lessonsOn(lessonsOf(direction), d.value).map((lesson, index) => (
                              <li key={index}>
                                <span className="block font-semibold">
                                  {lesson.group}
                                  {recruiting.has(lesson.group) && <VacancyDot />}
                                </span>
                                <span className="tabular-nums">{timeRange(lesson)}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Телефон и планшет: карточка на каждое направление */}
            <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:hidden">
              {group.items.map((direction) => (
                <li key={direction.id} className="rounded-card border border-line p-5">
                  <DirectionInfo direction={direction} />
                  <ScheduleList
                    groups={
                      day
                        ? direction.groups.map((g) => ({ ...g, lessons: g.lessons.filter((l) => l.day === day) })).filter((g) => g.lessons.length > 0)
                        : direction.groups
                    }
                    vacancies={direction.enrollOpen}
                    className="mt-4 border-t border-line pt-4"
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}

        {pending.length > 0 && (
          <section aria-labelledby="schedule-pending">
            <h2 id="schedule-pending" className="font-display text-h3 font-semibold">
              Расписание уточняется
            </h2>
            <p className="mt-3 max-w-3xl text-muted">
              Для этих направлений расписание пока не опубликовано. Его можно узнать по телефону{' '}
              <a href={site.phones[0].href} className="font-semibold text-ink underline underline-offset-4">
                {site.phones[0].display}
              </a>
              .
            </p>
            <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {pending.map((direction) => (
                <li key={direction.id} className="text-sm">
                  <Link to={directionUrl(direction)} className="font-semibold hover:underline">
                    {direction.title}
                  </Link>
                  <span className="text-muted">
                    {' '}
                    · {direction.level.toLowerCase()}, <span className="whitespace-nowrap">{ageRange(direction.ageFrom, direction.ageTo)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {documents && documents.length > 0 && (
          <section aria-labelledby="schedule-documents">
            <h2 id="schedule-documents" className="font-display text-h3 font-semibold">
              Документы
            </h2>
            <div className="mt-6 max-w-4xl">
              <DocList items={documents} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/** Название направления и коротко о нём: уровень, возраст, педагог, где занятия, идёт ли запись */
function DirectionInfo({ direction }: { direction: Direction }) {
  const open = isEnrollable(direction);
  return (
    <>
      <Link to={directionUrl(direction)} className="font-semibold leading-snug hover:underline">
        {direction.title}
      </Link>
      <p className="mt-1 text-muted">
        {direction.level} · {ageRange(direction.ageFrom, direction.ageTo)}
      </p>
      <p className="text-muted">{direction.teacher}</p>
      {(direction.room || direction.scheduleNote) && <p className="text-muted">{[direction.room, direction.scheduleNote].filter(Boolean).join(' · ')}</p>}
      {open && (
        <Link to={enrollUrl(direction)} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 font-semibold hover:bg-accent">
          <span className="h-2 w-2 rounded-full bg-accent-hover" aria-hidden="true" />
          Идёт запись — записаться
        </Link>
      )}
    </>
  );
}
