import { useState } from 'react';
import { Expand } from 'lucide-react';
import { rooms } from '../data/pages';
import { asset } from '../lib/asset';
import { Lightbox } from '../components/ui/Lightbox';
import { PageHeader } from '../components/ui/PageHeader';
import { Reveal } from '../components/ui/Reveal';

/** Помещения: таблица-сводка и галерея фото кабинетов с просмотром на весь экран */
export function RoomsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { table } = rooms;

  return (
    <>
      <PageHeader
        eyebrow="О центре"
        title="Помещения для занятий"
        crumbs={[{ label: 'О центре', to: '/about' }]}
        lead={rooms.description}
      />

      <div className="container-x space-y-16 pb-20 lg:pb-28">
        <dl className="grid gap-px overflow-hidden rounded-card bg-line sm:grid-cols-3">
          {[
            { term: table.name, value: table.count },
            { term: 'Площадь, м²', value: table.area },
            { term: 'Рабочих мест в аудитории', value: table.seats },
          ].map((item) => (
            <div key={item.term} className="bg-surface p-6 lg:p-8">
              <dt className="text-sm text-muted">{item.term}</dt>
              <dd className="mt-2 font-display text-h2 font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="gallery-title">
          <h2 id="gallery-title" className="font-display text-h2 font-semibold">
            Фотографии
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.photos.map((photo, index) => (
              <li key={photo.src}>
                <Reveal delay={(index % 3) * 0.08}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    className="group relative block w-full overflow-hidden rounded-card text-left"
                    aria-label={`Открыть фото: ${photo.caption}`}
                  >
                    <img
                      src={asset(photo.src)}
                      alt=""
                      width={1024}
                      height={576}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    />
                    <span className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full bg-white/90 px-4 py-2 text-sm font-semibold backdrop-blur">
                      {photo.caption}
                      <Expand size={16} aria-hidden="true" />
                    </span>
                  </button>
                </Reveal>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">Фото с сайта центра, 2021 год.</p>
        </section>
      </div>

      <Lightbox images={rooms.photos} index={openIndex} onChange={setOpenIndex} />
    </>
  );
}
