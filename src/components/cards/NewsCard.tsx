import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { NewsItem } from '../../api/types';
import { asset } from '../../lib/asset';
import { cn } from '../../lib/cn';
import { dayMonth, formatDate } from '../../lib/format';
import { CubeOutline } from '../ui/CubeOutline';

type Props = {
  item: NewsItem;
};

/**
 * Карточка новости. Вся карточка кликабельна: ссылка в заголовке растянута
 * на всю карточку через псевдоэлемент ::after (after:absolute after:inset-0).
 */
export function NewsCard({ item }: Props) {
  // Нет обложки — берём первое фото из фотоотчёта
  const cover = item.image ?? item.gallery?.[0];

  return (
    <article className="group relative flex h-full flex-col">
      <div className="aspect-[4/3] overflow-hidden rounded-card">
        {cover ? (
          <img
            src={asset(cover)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
          />
        ) : (
          <NewsCover id={item.id} date={item.date} />
        )}
      </div>

      <time dateTime={item.date} className="mt-5 text-sm font-medium text-muted">
        {formatDate(item.date)}
      </time>
      <h3 className="mt-2 font-display text-lg font-semibold leading-snug lg:text-xl">
        <Link to={`/news/${item.id}`} className="after:absolute after:inset-0 after:rounded-card">
          {item.title}
        </Link>
      </h3>
      <p className="mt-3 line-clamp-3 text-muted">{item.excerpt}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold" aria-hidden="true">
        Читать
        <ArrowUpRight
          size={16}
          className="transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </span>
    </article>
  );
}

// Три варианта обложки чередуются, чтобы ряд карточек не был одинаковым
const coverVariants = ['bg-ink text-white', 'bg-accent text-ink', 'bg-surface text-ink'];

/**
 * Обложка для новости без фото: крупная дата и контур куба.
 * (Фото новостей старого сайта не сохранились в веб-архиве; к новым новостям фото добавляют в админ-панели.)
 */
function NewsCover({ id, date }: { id: number; date: string }) {
  const { day, month } = dayMonth(date);
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative flex h-full w-full flex-col justify-between overflow-hidden p-6 transition-transform duration-700 ease-out-expo group-hover:scale-105',
        coverVariants[id % coverVariants.length],
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.14em] opacity-60">IT-куб · новости</span>
      <span className="font-display leading-none">
        <span className="block text-[4.5rem] font-semibold tracking-tight">{day}</span>
        <span className="mt-1 block text-xl">{month}</span>
      </span>
      <CubeOutline className="absolute -right-12 -top-12 h-56 w-56 opacity-15" />
    </div>
  );
}
