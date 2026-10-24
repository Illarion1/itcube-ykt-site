import { enrollUrl, getCategories, getDocList, getOpenDirections, openGroups } from '../api';
import type { Direction } from '../api/types';
import { useData } from '../hooks/useData';
import { ageRange, plural } from '../lib/format';
import { formatSlots } from '../lib/schedule';
import { Button } from '../components/ui/Button';
import { DocList } from '../components/ui/DocList';
import { PageHeader } from '../components/ui/PageHeader';

/**
 * Вакантные места: только группы, в которые сейчас нужны ученики, — по направлениям и категориям.
 * В какие группы идёт набор и сколько там мест, сотрудники отмечают в админ-панели
 * (раздел «Запись и места»). Кнопка «Записаться» открывает форму заявки с выбранными направлением и группой.
 */
export function VacanciesPage() {
  const { data: directions } = useData(getOpenDirections);
  const { data: categories } = useData(getCategories);
  const { data: documents } = useData(() => getDocList('vacancies'));

  const groups = directions?.flatMap(openGroups) ?? [];
  const total = groups.reduce((sum, g) => sum + g.seats, 0);
  // Разделы — в том же порядке, что и категории; направления без известной категории — в конце
  const known = new Set(categories?.map((c) => c.slug));
  const sections = [
    ...(categories ?? []).map((c) => ({ key: c.slug, title: c.title, items: directions?.filter((d) => d.category === c.slug) ?? [] })),
    { key: 'other', title: 'Другие направления', items: directions?.filter((d) => !known.has(d.category)) ?? [] },
  ].filter((section) => section.items.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="Обучение"
        title="Вакантные места"
        crumbs={[{ label: 'Обучение', to: '/directions' }]}
        lead="Группы, в которые сейчас нужны ученики: возраст, дни и время занятий, количество свободных мест. Нажмите «Записаться» — откроется форма заявки."
      />

      <div className="container-x space-y-16 pb-20 lg:pb-28">
        {!directions || !categories ? (
          <div className="h-64 animate-pulse rounded-panel bg-surface" aria-busy="true" aria-label="Загрузка" />
        ) : directions.length === 0 ? (
          <div className="rounded-panel bg-surface p-8 lg:p-12">
            <h2 className="font-display text-h3 font-semibold">Сейчас свободных мест нет</h2>
            <p className="mt-3 max-w-2xl text-muted">
              Когда откроется набор, группы со свободными местами появятся на этой странице. Можно задать вопрос — подскажем, когда начнётся
              набор.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/feedback" variant="dark" arrow>
                Задать вопрос
              </Button>
              <Button to="/directions" variant="outline">
                Все направления
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-lg">
              Свободно <b>{total}</b> {plural(total, ['место', 'места', 'мест'])} в {groups.length} {plural(groups.length, ['группе', 'группах', 'группах'])}.
            </p>
            {sections.map((section) => (
              <section key={section.key} aria-labelledby={`vacancies-${section.key}`}>
                <h2 id={`vacancies-${section.key}`} className="font-display text-h3 font-semibold">
                  {section.title}
                </h2>
                <ul className="mt-6 space-y-4">
                  {section.items.map((direction) => (
                    <li key={direction.id}>
                      <VacancyCard direction={direction} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}

        {documents && documents.length > 0 && (
          <section aria-labelledby="vacancies-documents">
            <h2 id="vacancies-documents" className="font-display text-h3 font-semibold">
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

// Направление: возраст учеников, педагог, где занятия — и только те группы, где есть места
function VacancyCard({ direction }: { direction: Direction }) {
  const place = [direction.room, direction.scheduleNote].filter(Boolean).join(' · ');
  return (
    <article className="rounded-card border border-line p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold leading-snug">{direction.title}</h3>
      <dl className="mt-3 flex flex-wrap gap-2 text-sm">
        <div className="rounded-full bg-accent px-3 py-1 font-semibold">
          <dt className="inline">Возраст учеников: </dt>
          <dd className="inline">{ageRange(direction.ageFrom, direction.ageTo)}</dd>
        </div>
        <div className="rounded-full bg-surface px-3 py-1">
          <dt className="sr-only">Уровень</dt>
          <dd>{direction.level}</dd>
        </div>
        <div className="rounded-full bg-surface px-3 py-1">
          <dt className="sr-only">Нагрузка</dt>
          <dd>{direction.hoursPerWeek} ч в неделю</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-muted">
        Педагог: {direction.teacher}
        {place && ` · ${place}`}
      </p>

      <ul className="mt-5 divide-y divide-line border-t border-line">
        {openGroups(direction).map((group) => (
          <li key={group.id} className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between [&:not(:last-child)]:pb-4">
            <div className="min-w-0">
              <p className="font-semibold">{group.name}</p>
              <p className="mt-0.5 text-sm tabular-nums text-muted">{formatSlots(group.lessons) || 'Дни и время уточним, когда позвоним по заявке'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold">
                {group.seats} {plural(group.seats, ['место', 'места', 'мест'])}
              </span>
              <Button to={enrollUrl(direction, group)} arrow>
                Записаться
                <span className="sr-only">
                  {' '}
                  в группу «{group.name}», {direction.title}
                </span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
