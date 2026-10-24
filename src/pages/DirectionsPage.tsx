import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { getCategories, getDirections, isEnrollable } from '../api';
import { useData } from '../hooks/useData';
import { cn } from '../lib/cn';
import { plural } from '../lib/format';
import { DirectionCard } from '../components/cards/DirectionCard';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';

const fieldClass =
  'h-12 w-full rounded-full border border-line bg-white px-5 text-base outline-none transition-colors hover:border-ink/40 focus-visible:border-ink';

/**
 * Все направления с фильтрами. Значения фильтров хранятся в адресе страницы
 * (?q=python&age=12&open=1), поэтому подборкой можно поделиться ссылкой,
 * а кнопка «Назад» в браузере возвращает предыдущие фильтры.
 */
export function DirectionsPage() {
  const directions = useData(getDirections).data ?? [];
  const categories = useData(getCategories).data ?? [];
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const age = params.get('age') ?? '';
  const level = params.get('level') ?? '';
  const onlyOpen = params.get('open') === '1';

  // Меняем один фильтр, остальные оставляем как есть
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const levels = useMemo(() => [...new Set(directions.map((d) => d.level))], [directions]);
  const categoryTitle = useMemo(() => Object.fromEntries(categories.map((c) => [c.slug, c.title])), [categories]);
  const openTotal = directions.filter(isEnrollable).length;

  const filtered = directions.filter((d) => {
    const text = `${d.title} ${d.teacher} ${d.annotation} ${categoryTitle[d.category] ?? ''}`.toLowerCase();
    if (q && !text.includes(q.trim().toLowerCase())) return false;
    if (category && d.category !== category) return false;
    if (age && (Number(age) < d.ageFrom || Number(age) > d.ageTo)) return false;
    if (level && d.level !== level) return false;
    if (onlyOpen && !isEnrollable(d)) return false;
    return true;
  });

  const hasFilters = Boolean(q || category || age || level || onlyOpen);

  return (
    <>
      <PageHeader
        eyebrow="Обучение"
        title="Направления"
        crumbs={[{ label: 'Обучение' }]}
        lead="Все направления центра. Укажите возраст ребёнка — останутся только подходящие. Записаться можно на направления, где сейчас идёт запись."
      />

      <div className="container-x pb-20 lg:pb-28">
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="grid gap-3 rounded-panel bg-surface p-4 sm:p-6 md:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr]"
        >
          <label className="relative">
            <span className="sr-only">Поиск по названию, педагогу или описанию</span>
            <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Python, роботы, Unreal…"
              className={`${fieldClass} pl-12`}
            />
          </label>
          <label>
            <span className="sr-only">Категория</span>
            <select value={category} onChange={(e) => update('category', e.target.value)} className={fieldClass}>
              <option value="">Все категории</option>
              {categories.map((c) => (
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
            <span className="sr-only">Уровень</span>
            <select value={level} onChange={(e) => update('level', e.target.value)} className={fieldClass}>
              <option value="">Любой уровень</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* aria-live — экранный чтец озвучит новое количество после смены фильтра */}
            <p className="font-medium" aria-live="polite">
              Найдено: {filtered.length} {plural(filtered.length, ['направление', 'направления', 'направлений'])}
            </p>
            <label
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2',
                onlyOpen ? 'bg-ink text-white' : 'bg-surface hover:bg-surface-strong',
              )}
            >
              <input type="checkbox" checked={onlyOpen} onChange={(e) => update('open', e.target.checked ? '1' : '')} className="sr-only" />
              <span className={cn('h-2 w-2 rounded-full', openTotal > 0 ? 'bg-accent' : 'bg-muted')} aria-hidden="true" />
              Только где идёт запись ({openTotal})
            </label>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              <X size={16} aria-hidden="true" />
              Сбросить фильтры
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((direction) => (
              <li key={direction.id}>
                <DirectionCard direction={direction} categoryTitle={categoryTitle[direction.category]} />
              </li>
            ))}
          </ul>
        ) : (
          directions.length > 0 && (
            <div className="mt-6 rounded-panel border border-dashed border-line p-10 text-center">
              <p className="font-display text-h3 font-semibold">Ничего не нашлось</p>
              <p className="mt-3 text-muted">
                {onlyOpen && openTotal === 0 ? 'Сейчас запись ни на одно направление не открыта.' : 'Попробуйте изменить запрос или сбросить фильтры.'}
              </p>
              <div className="mt-6">
                <Button variant="dark" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  Показать все направления
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
