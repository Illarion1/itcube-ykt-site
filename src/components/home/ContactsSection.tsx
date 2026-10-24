import { site } from '../../data/site';
import { routeUrl } from '../../lib/maps';
import { Button } from '../ui/Button';
import { MapEmbed } from '../ui/MapEmbed';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';
import { SocialLinks } from '../ui/SocialLinks';

/** Контакты и карта */
export function ContactsSection() {
  const label = 'text-sm font-semibold uppercase tracking-[0.12em] text-muted';

  return (
    <section aria-labelledby="contacts-title" className="pb-20 pt-6 lg:pb-28 lg:pt-10">
      <div className="container-x">
        <SectionHeader
          eyebrow="Контакты"
          titleId="contacts-title"
          title="Как нас найти"
          action={
            <Button to="/contacts" variant="outline" arrow>
              Все контакты
            </Button>
          }
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="flex h-full flex-col rounded-panel bg-surface p-6 sm:p-8 lg:p-10">
              <dl className="space-y-6">
                <div>
                  <dt className={label}>Адрес</dt>
                  <dd className="mt-2 text-lg font-semibold">{site.address.full}</dd>
                </div>
                <div>
                  <dt className={label}>Телефон</dt>
                  {site.phones.map((phone) => (
                    <dd key={phone.href} className="mt-2">
                      <a href={phone.href} className="text-lg font-semibold hover:underline">
                        {phone.display}
                      </a>
                      <span className="text-muted"> — {phone.label.toLowerCase()}</span>
                    </dd>
                  ))}
                </div>
                <div>
                  <dt className={label}>E-mail</dt>
                  <dd className="mt-2">
                    <a href={`mailto:${site.emails[0].value}`} className="text-lg font-semibold hover:underline">
                      {site.emails[0].value}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className={label}>Приём документов</dt>
                  <dd className="mt-2 text-lg font-semibold">{site.admissionHours}</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-10">
                <Button href={routeUrl} variant="dark" arrow>
                  Маршрут в 2ГИС
                </Button>
                <SocialLinks tone="surface" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <MapEmbed className="h-[22rem] sm:h-[28rem] lg:h-full lg:min-h-[34rem]" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
