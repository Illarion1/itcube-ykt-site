import { Fragment, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Expand } from 'lucide-react';
import { getLatestNews, getNewsItem } from '../api';
import { useData } from '../hooks/useData';
import { Seo } from '../components/ui/Seo';
import { asset } from '../lib/asset';
import { dayMonth, formatDate } from '../lib/format';
import { NewsCard } from '../components/cards/NewsCard';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { CubeOutline } from '../components/ui/CubeOutline';
import { Lightbox } from '../components/ui/Lightbox';
import { SocialLinks } from '../components/ui/SocialLinks';
import { NotFoundPage } from './NotFoundPage';

// Делает адреса в тексте кликабельными ссылками
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-ink underline underline-offset-4 hover:text-muted">
            {part.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Фотоотчёт: сетка фото, по клику — просмотр на весь экран */
function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const images = photos.map((src, index) => ({ src, caption: `${title} — фото ${index + 1} из ${photos.length}` }));

  return (
    <section aria-label="Фотографии" className="mt-12">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <li key={image.src}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block w-full overflow-hidden rounded-card"
              aria-label={`Открыть фото ${index + 1} из ${photos.length}`}
            >
              <img
                src={asset(image.src)}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
              />
              <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
                <Expand size={16} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Lightbox images={images} index={openIndex} onChange={setOpenIndex} />
    </section>
  );
}

/** Страница одной новости: дата, заголовок, обложка, текст, фотоотчёт и «Другие новости» */
export function NewsItemPage() {
  const { id = '' } = useParams();
  const { data: item, loading } = useData(() => getNewsItem(Number(id)), [id]);
  const { data: latest } = useData(() => getLatestNews(4), []);

  if (loading) return <div className="container-x h-[60vh]" />;
  if (!item) return <NotFoundPage />;

  const others = (latest ?? []).filter((n) => n.id !== item.id).slice(0, 3);
  const { day, month } = dayMonth(item.date);
  // У части старых новостей сохранился только анонс
  const hasText = Boolean(item.content?.length);
  const gallery = item.gallery ?? [];

  return (
    <>
      <article className="container-x pb-20 pt-8 lg:pb-28 lg:pt-12">
        <Seo title={item.title} description={item.excerpt} type="article" />
        <Breadcrumbs items={[{ label: 'Новости', to: '/news' }, { label: item.title.length > 50 ? `${item.title.slice(0, 50)}…` : item.title }]} />

        <header className="mt-10 max-w-4xl">
          <time dateTime={item.date} className="eyebrow">
            {formatDate(item.date)}
          </time>
          <h1 className="mt-5 font-display text-h2 font-semibold">{item.title}</h1>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {item.image ? (
              <img src={asset(item.image)} alt="" className="aspect-[16/9] w-full rounded-panel object-cover" />
            ) : (
              <div className="on-dark relative flex aspect-[16/9] w-full items-end overflow-hidden rounded-panel bg-ink p-8 text-white" aria-hidden="true">
                <span className="font-display leading-none">
                  <span className="block text-7xl font-semibold lg:text-8xl">{day}</span>
                  <span className="mt-2 block text-2xl text-accent">{month}</span>
                </span>
                <CubeOutline className="absolute -right-16 -top-16 h-80 w-80 text-white opacity-10" />
              </div>
            )}

            <div className="mt-10 max-w-3xl space-y-4 text-lg leading-relaxed">
              {(hasText ? item.content! : [item.excerpt]).map((paragraph, i) => (
                <p key={i}>
                  <Linkified text={paragraph} />
                </p>
              ))}
              {!hasText && (
                <p className="rounded-card bg-surface p-5 text-base text-muted">
                  Полный текст этой новости не сохранился в веб-архиве старого сайта — показан анонс.
                </p>
              )}
            </div>

            {gallery.length > 0 && <Gallery photos={gallery} title={item.title} />}
          </div>

          <aside className="lg:col-span-4">
            <div className="space-y-6 rounded-card bg-surface p-6 lg:sticky lg:top-24">
              <p className="font-display text-lg font-semibold">Больше новостей — в наших соцсетях</p>
              <SocialLinks tone="surface" />
              <Link to="/news" className="inline-flex items-center gap-2 font-semibold hover:underline">
                <ArrowLeft size={18} aria-hidden="true" />
                Все новости
              </Link>
            </div>
          </aside>
        </div>
      </article>

      {others.length > 0 && (
        <section aria-labelledby="other-news" className="bg-surface py-20 lg:py-24">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 id="other-news" className="font-display text-h2 font-semibold">
                Другие новости
              </h2>
              <Button to="/news" variant="dark" arrow>
                Все новости
              </Button>
            </div>
            <ul className="mt-10 grid gap-x-4 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {others.map((n) => (
                <li key={n.id}>
                  <NewsCard item={n} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
