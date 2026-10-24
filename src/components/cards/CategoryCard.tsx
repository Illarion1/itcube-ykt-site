import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { CategorySummary } from '../../api/types';
import { ageRange, hoursRange, plural } from '../../lib/format';
import { CategoryIcon } from '../ui/CategoryIcon';

type Props = {
  category: CategorySummary;
  index: number;
};

/**
 * Карточка категории: номер, значок, название, описание, возраст, длительность,
 * часы в неделю и отметка «Идёт запись». Вся карточка — ссылка на страницу категории.
 * При наведении карточка поднимается и становится тёмной, стрелка уезжает вверх-вправо.
 */
export function CategoryCard({ category, index }: Props) {
  const chip = 'rounded-full bg-white px-3 py-1.5 transition-colors duration-500 group-hover:bg-white/10';

  return (
    <Link
      to={`/directions/${category.slug}`}
      className="group flex h-full min-h-[19rem] flex-col rounded-card bg-surface p-6 transition-[background-color,color,transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-ink hover:text-white hover:shadow-card lg:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-display text-sm font-semibold text-muted transition-colors duration-500 group-hover:text-white/50">
          {String(index + 1).padStart(2, '0')} · {category.directionsCount}{' '}
          {plural(category.directionsCount, ['направление', 'направления', 'направлений'])}
        </span>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-ink transition-colors duration-500 group-hover:bg-accent">
          <CategoryIcon name={category.icon} />
        </span>
      </div>

      {/* Размер подобран, чтобы длинные слова («администрирование») помещались в карточку целиком */}
      <h3 className="mt-8 font-display text-xl font-semibold leading-tight lg:text-[1.375rem]">{category.title}</h3>
      <p className="mt-3 text-muted transition-colors duration-500 group-hover:text-white/60">{category.short}</p>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-8">
        {/* В новой категории направлений может ещё не быть — тогда и показывать нечего */}
        {category.directionsCount > 0 ? (
          <ul className="flex flex-wrap gap-2 text-sm font-medium" aria-label="Коротко о категории">
            {category.openCount > 0 && (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                Идёт запись
              </li>
            )}
            <li className={chip}>{ageRange(category.ageFrom, category.ageTo)}</li>
            <li className={chip}>{category.duration}</li>
            <li className={chip}>{hoursRange(category.hoursMin, category.hoursMax)}</li>
          </ul>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          Подробнее
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white transition-all duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-accent group-hover:text-ink">
            <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </span>
      </div>
    </Link>
  );
}
