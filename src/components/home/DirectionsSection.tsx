import { Link } from 'react-router-dom';
import { getCategories } from '../../api';
import type { CategorySummary } from '../../api/types';
import { useData } from '../../hooks/useData';
import { plural } from '../../lib/format';
import { CategoryCard } from '../cards/CategoryCard';
import { Button } from '../ui/Button';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';

/** Направления по категориям: базовые категории карточками и тёмный блок со ссылками на дополнительные */
export function DirectionsSection() {
  const { data } = useData(getCategories);
  const core = data?.filter((c) => c.kind === 'core') ?? [];
  const extra = data?.filter((c) => c.kind === 'extra') ?? [];
  const total = data?.reduce((sum, c) => sum + c.directionsCount, 0) ?? 0;

  return (
    <section aria-labelledby="directions-title" className="py-20 lg:py-28">
      <div className="container-x">
        <SectionHeader
          eyebrow="Направления"
          titleId="directions-title"
          title="Чему можно научиться"
          description={
            data &&
            `${total} ${plural(total, ['направление', 'направления', 'направлений'])} для разного возраста и уровня подготовки: базовые для сети «IT-куб» и дополнительные.`
          }
          action={
            <Button to="/directions" variant="outline" arrow>
              Все направления
            </Button>
          }
        />

        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data
            ? core.map((category, index) => (
                <li key={category.slug}>
                  <Reveal delay={(index % 3) * 0.08} className="h-full">
                    <CategoryCard category={category} index={index} />
                  </Reveal>
                </li>
              ))
            : Array.from({ length: 6 }, (_, index) => (
                <li key={index} className="h-[19rem] animate-pulse rounded-card bg-surface" />
              ))}
        </ul>

        {extra.length > 0 && (
          <Reveal className="mt-4">
            <ExtraCategories items={extra} />
          </Reveal>
        )}
      </div>
    </section>
  );
}

function ExtraCategories({ items }: { items: CategorySummary[] }) {
  return (
    <div className="on-dark flex flex-col gap-8 rounded-card bg-ink p-6 text-white lg:flex-row lg:items-start lg:justify-between lg:p-10">
      <div className="max-w-sm">
        <h3 className="font-display text-h3 font-semibold">
          Ещё {items.length} {plural(items.length, ['категория', 'категории', 'категорий'])}
        </h3>
        <p className="mt-3 text-white/60">Дизайн, игры, космос, архитектура и не только — выбирайте по интересам.</p>
      </div>
      <ul className="flex flex-wrap gap-2 lg:max-w-2xl lg:justify-end">
        {items.map((category) => (
          <li key={category.slug}>
            <Link
              to={`/directions/${category.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-ink"
            >
              <CategoryIcon name={category.icon} size={16} />
              {category.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
