import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getCategory } from '../api';
import { useData } from '../hooks/useData';
import { ageRange, hoursRange, plural } from '../lib/format';
import { DirectionCard } from '../components/cards/DirectionCard';
import { Button } from '../components/ui/Button';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { PageHeader } from '../components/ui/PageHeader';
import { Reveal } from '../components/ui/Reveal';
import { NotFoundPage } from './NotFoundPage';

/** Страница категории: сводка и все её направления */
export function CategoryPage() {
  const { slug = '' } = useParams();
  const { hash } = useLocation();
  const { data, loading } = useData(() => getCategory(slug), [slug]);

  // Ссылка вида /directions/python#it-01 ведёт к карточке направления.
  // Карточки появляются после загрузки данных, поэтому прокручиваем к ним сами
  useEffect(() => {
    if (data && hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'center' });
  }, [data, hash]);

  if (loading) return <div className="container-x h-[60vh]" />;
  if (!data) return <NotFoundPage />;

  // Пока в категории нет направлений, сводку посчитать не из чего — показываем прочерк
  const hasDirections = data.directionsCount > 0;
  const facts = [
    { term: 'Возраст', value: hasDirections ? ageRange(data.ageFrom, data.ageTo) : '—' },
    { term: 'Срок обучения', value: hasDirections ? data.duration : '—' },
    { term: 'Занятия', value: hasDirections ? hoursRange(data.hoursMin, data.hoursMax) : '—' },
    { term: 'Идёт запись', value: data.openCount > 0 ? `${data.openCount} из ${data.directionsCount}` : 'нет' },
  ];

  return (
    <>
      <PageHeader
        eyebrow={data.kind === 'core' ? 'Базовые направления «IT-куба»' : 'Дополнительные направления'}
        title={data.title}
        crumbs={[{ label: 'Направления', to: '/directions' }]}
        lead={data.short}
        action={
          <Button to={data.openCount > 0 ? '/vacancies' : '/admission'} arrow>
            {data.openCount > 0 ? 'Свободные места' : 'Как записаться'}
          </Button>
        }
      />

      <div className="container-x space-y-16 pb-20 lg:pb-28">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-line lg:grid-cols-4">
          {facts.map((fact, index) => (
            <div key={fact.term} className="relative bg-surface p-6">
              {index === 0 && (
                <span className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white" aria-hidden="true">
                  <CategoryIcon name={data.icon} />
                </span>
              )}
              <dt className="text-sm text-muted">{fact.term}</dt>
              <dd className="mt-2 font-display text-h3 font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="directions-title">
          <h2 id="directions-title" className="font-display text-h2 font-semibold">
            {data.directionsCount} {plural(data.directionsCount, ['направление', 'направления', 'направлений'])}
          </h2>
          {hasDirections ? (
            <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.directions.map((direction, index) => (
                <li key={direction.id}>
                  <Reveal delay={(index % 3) * 0.06} className="h-full">
                    <DirectionCard direction={direction} />
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 max-w-2xl rounded-card bg-surface p-6 text-muted">
              Направления этой категории скоро появятся. Чтобы узнать подробности, позвоните нам или напишите через форму обратной связи.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
