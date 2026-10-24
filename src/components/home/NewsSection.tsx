import { getLatestNews } from '../../api';
import { useData } from '../../hooks/useData';
import { NewsCard } from '../cards/NewsCard';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';

/** Три свежие новости и кнопка «Все новости» */
export function NewsSection() {
  const { data } = useData(() => getLatestNews(3));

  return (
    <section aria-labelledby="news-title" className="py-20 lg:py-28">
      <div className="container-x">
        <SectionHeader
          eyebrow="Новости"
          titleId="news-title"
          title="Жизнь IT-куба"
          action={
            <Button to="/news" variant="outline" arrow>
              Все новости
            </Button>
          }
        />

        <ul className="mt-12 grid gap-x-4 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {data
            ? data.map((item, index) => (
                <li key={item.id}>
                  <Reveal delay={index * 0.08} className="h-full">
                    <NewsCard item={item} />
                  </Reveal>
                </li>
              ))
            : Array.from({ length: 3 }, (_, index) => (
                <li key={index} className="aspect-[4/3] animate-pulse rounded-card bg-surface" />
              ))}
        </ul>
      </div>
    </section>
  );
}
