import { Link, useSearchParams } from 'react-router-dom';
import { getNews, getNewsYears } from '../api';
import { useData } from '../hooks/useData';
import { cn } from '../lib/cn';
import { plural } from '../lib/format';
import { NewsCard } from '../components/cards/NewsCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';

const PER_PAGE = 9;

/**
 * Лента новостей: фильтр по годам и страницы по 9 новостей.
 * Год и номер страницы хранятся в адресе: /news?year=2025&page=2
 */
export function NewsPage() {
  const [params] = useSearchParams();
  const year = params.get('year') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;

  const years = useData(getNewsYears).data ?? [];
  const { data } = useData(() => getNews({ page, perPage: PER_PAGE, year }), [page, year]);

  // Адрес с нужными годом и страницей (первая страница — без параметра)
  const href = (y: string, p = 1) => {
    const q = new URLSearchParams();
    if (y) q.set('year', y);
    if (p > 1) q.set('page', String(p));
    const s = q.toString();
    return s ? `/news?${s}` : '/news';
  };

  const chip = (active: boolean) =>
    cn('rounded-full px-5 py-2.5 text-sm font-semibold transition-colors', active ? 'bg-ink text-white' : 'bg-surface hover:bg-surface-strong');

  return (
    <>
      <PageHeader
        eyebrow="Новости"
        title="Новости"
        lead={data ? `${data.total} ${plural(data.total, ['новость', 'новости', 'новостей'])}${year ? ` за ${year} год` : ''}` : ' '}
      />

      <div className="container-x pb-20 lg:pb-28">
        <nav aria-label="Фильтр по годам">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link to={href('')} className={chip(!year)} aria-current={!year ? 'true' : undefined}>
                Все
              </Link>
            </li>
            {years.map((y) => (
              <li key={y}>
                <Link to={href(y)} className={chip(year === y)} aria-current={year === y ? 'true' : undefined}>
                  {y}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="mt-10 grid gap-x-4 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {data
            ? data.items.map((item) => (
                <li key={item.id}>
                  <NewsCard item={item} />
                </li>
              ))
            : Array.from({ length: PER_PAGE }, (_, i) => <li key={i} className="aspect-[4/3] animate-pulse rounded-card bg-surface" />)}
        </ul>

        {data && (
          <div className="mt-16">
            <Pagination page={data.page} pages={data.pages} hrefFor={(p) => href(year, p)} />
          </div>
        )}
      </div>
    </>
  );
}
