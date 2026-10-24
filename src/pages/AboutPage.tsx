import { ArrowUpRight, Check } from 'lucide-react';
import { about } from '../data/pages';
import { site } from '../data/site';
import { asset } from '../lib/asset';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Reveal } from '../components/ui/Reveal';

/** «Общая информация о центре» — полный текст со старого сайта, разбитый на блоки */
export function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="О центре"
        title="Общая информация о центре"
        crumbs={[{ label: 'О центре' }]}
        lead={`Структурное подразделение ${site.parentOrg}. Адрес: ${site.address.full}.`}
      />

      <div className="container-x space-y-20 pb-20 lg:space-y-28 lg:pb-28">
        <section className="grid gap-12 lg:grid-cols-12">
          <div className="space-y-6 text-lg leading-relaxed lg:col-span-7">
            {about.intro.map((paragraph) => (
              <Reveal key={paragraph.slice(0, 30)}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
            <Reveal>
              <p className="rounded-card bg-accent-soft p-6 text-base">{about.studentsNote}</p>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-5">
            <img
              src={asset('/images/rooms/room-4.jpg')}
              alt="Аудитория направления «Программирование роботов»: длинный стол, интерактивная панель"
              width={1024}
              height={576}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-panel object-cover"
            />
          </Reveal>
        </section>

        <section aria-labelledby="cubes-title">
          <h2 id="cubes-title" className="font-display text-h2 font-semibold">
            Образовательные направления — «кубы»
          </h2>
          {/* items-start — карточки по высоте своего текста, без пустых растянутых блоков */}
          <div className="mt-10 grid items-start gap-4 lg:grid-cols-3">
            <DirectionList title="Обязательные" items={about.mandatory} dark />
            <DirectionList title="Вариативные" items={about.variative} />
            <DirectionList title="Дополнительные и с партнёрами" items={about.additional} />
          </div>
          <div className="mt-8">
            <Button to="/directions" variant="outline" arrow>
              Все направления центра
            </Button>
          </div>
        </section>

        <section aria-labelledby="activities-title" className="grid gap-10 lg:grid-cols-12">
          <h2 id="activities-title" className="font-display text-h2 font-semibold lg:col-span-5">
            Чем занимается центр
          </h2>
          <ul className="space-y-5 lg:col-span-7">
            {about.activities.map((text) => (
              <li key={text} className="flex gap-4 border-b border-line pb-5 text-lg">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent" aria-hidden="true">
                  <Check size={16} strokeWidth={3} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="organizers-title">
          <h2 id="organizers-title" className="font-display text-h2 font-semibold">
            Кто создаёт центры «IT-куб»
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {about.organizers.map((org) => (
              <li key={org.url}>
                <a
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-start justify-between gap-6 rounded-card border border-line p-6 transition-colors hover:border-ink"
                >
                  <span>
                    <span className="block text-sm font-semibold uppercase tracking-[0.12em] text-muted">{org.role}</span>
                    <span className="mt-2 block text-lg font-semibold leading-snug">{org.name}</span>
                    <span className="mt-2 block text-sm text-muted">{org.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                  </span>
                  <ArrowUpRight size={20} aria-hidden="true" className="shrink-0 text-muted group-hover:text-ink" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function DirectionList({ title, items, dark = false }: { title: string; items: string[]; dark?: boolean }) {
  return (
    <Reveal className="h-full">
      <div className={`h-full rounded-card p-6 lg:p-8 ${dark ? 'on-dark bg-ink text-white' : 'bg-surface'}`}>
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span className={dark ? 'text-white/80' : ''}>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
