import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { search } from '../api';
import type { SearchResults } from '../api/types';
import { useData } from '../hooks/useData';
import { formatDate, plural } from '../lib/format';
import { PageHeader } from '../components/ui/PageHeader';

// Подсвечивает найденные слова в тексте тегом <mark>
function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return <>{text}</>;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-accent/40 px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

const groupTitles: Record<keyof SearchResults, string> = {
  pages: 'Разделы сайта',
  categories: 'Категории направлений',
  directions: 'Направления',
  news: 'Новости',
};

/**
 * Поиск по сайту. Запрос хранится в адресе (/search?q=роботы),
 * поэтому результатами можно поделиться, а «Назад» возвращает прошлый запрос.
 */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [input, setInput] = useState(query);

  // Если адрес поменялся (кнопка «Назад»), обновляем поле ввода
  useEffect(() => setInput(query), [query]);

  const { data } = useData(() => search(query), [query]);
  const groups = data ? (Object.keys(groupTitles) as (keyof SearchResults)[]).filter((key) => data[key].length > 0) : [];
  const total = data ? groups.reduce((sum, key) => sum + data[key].length, 0) : 0;

  return (
    <>
      <PageHeader title="Поиск по сайту" />
      <div className="container-x pb-20 lg:pb-28">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setParams(input.trim() ? { q: input.trim() } : {});
          }}
          className="flex max-w-3xl gap-2"
        >
          <label className="relative flex-1">
            <span className="sr-only">Что ищем?</span>
            <Search size={20} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              placeholder="Например: роботы, Python, приём, лагерь"
              className="h-14 w-full rounded-full border border-line bg-white pl-14 pr-5 text-lg outline-none transition-colors focus-visible:border-ink"
            />
          </label>
          <button type="submit" className="h-14 shrink-0 rounded-full bg-ink px-7 font-semibold text-white transition-colors hover:bg-ink-soft">
            Найти
          </button>
        </form>

        {query && data && (
          <p className="mt-8 font-medium" aria-live="polite">
            {total > 0
              ? `По запросу «${query}» найдено ${total} ${plural(total, ['результат', 'результата', 'результатов'])}`
              : `По запросу «${query}» ничего не найдено. Попробуйте другое слово.`}
          </p>
        )}

        <div className="mt-10 space-y-14">
          {data &&
            groups.map((key) => (
              <section key={key} aria-labelledby={`results-${key}`}>
                <h2 id={`results-${key}`} className="font-display text-h3 font-semibold">
                  {groupTitles[key]} <span className="text-muted">{data[key].length}</span>
                </h2>
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {data[key].slice(0, key === 'news' ? 20 : 50).map((result, index) => (
                    // Номер в ключе: у разных направлений могут совпадать название, уровень и ссылка
                    <li key={`${result.to}-${index}`}>
                      <Link to={result.to} className="group flex items-start justify-between gap-6 py-5 transition-colors hover:bg-surface sm:px-4">
                        <span className="min-w-0">
                          {'date' in result && typeof result.date === 'string' && (
                            <span className="block text-sm text-muted">{formatDate(result.date)}</span>
                          )}
                          <span className="block font-semibold leading-snug">
                            <Highlight text={result.title} query={query} />
                          </span>
                          <span className="mt-1 line-clamp-2 block text-sm text-muted">
                            <Highlight text={result.description} query={query} />
                          </span>
                        </span>
                        <ArrowUpRight size={18} className="mt-1 shrink-0 text-muted group-hover:text-ink" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {key === 'news' && data.news.length > 20 && (
                  <p className="mt-3 text-sm text-muted">Показаны первые 20 новостей — уточните запрос.</p>
                )}
              </section>
            ))}
        </div>
      </div>
    </>
  );
}
