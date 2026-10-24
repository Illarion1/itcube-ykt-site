import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/cn';

type Props = {
  page: number;
  pages: number;
  // Как получить адрес страницы с номером n (чтобы сохранить остальные параметры, например год)
  hrefFor: (n: number) => string;
};

// Какие номера показывать: первую, последнюю и соседние с текущей; пропуски — «…»
function pageNumbers(page: number, pages: number): (number | '…')[] {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) result.push('…');
    result.push(n);
  });
  return result;
}

/** Переключатель страниц: ← 1 … 4 5 6 … 22 → */
export function Pagination({ page, pages, hrefFor }: Props) {
  if (pages <= 1) return null;
  const arrow = 'grid h-11 w-11 place-items-center rounded-full border border-line transition-colors hover:border-ink';

  return (
    <nav aria-label="Страницы" className="flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link to={hrefFor(page - 1)} className={arrow} aria-label="Предыдущая страница">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
      ) : (
        <span className={cn(arrow, 'opacity-30')} aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
      )}

      <ol className="flex items-center gap-1">
        {pageNumbers(page, pages).map((n, i) =>
          n === '…' ? (
            <li key={`gap-${i}`} className="w-8 text-center text-muted" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                to={hrefFor(n)}
                aria-current={n === page ? 'page' : undefined}
                aria-label={`Страница ${n}`}
                className={cn(
                  'grid h-11 min-w-11 place-items-center rounded-full px-3 font-semibold transition-colors',
                  n === page ? 'bg-ink text-white' : 'hover:bg-surface',
                )}
              >
                {n}
              </Link>
            </li>
          ),
        )}
      </ol>

      {page < pages ? (
        <Link to={hrefFor(page + 1)} className={arrow} aria-label="Следующая страница">
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      ) : (
        <span className={cn(arrow, 'opacity-30')} aria-hidden="true">
          <ArrowRight size={18} />
        </span>
      )}
    </nav>
  );
}
