import type { ReactNode } from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { contactPeople } from '../data/pages';
import { site } from '../data/site';
import { routeUrl } from '../lib/maps';
import { Button } from '../components/ui/Button';
import { MapEmbed } from '../components/ui/MapEmbed';
import { PageHeader } from '../components/ui/PageHeader';
import { SocialLinks } from '../components/ui/SocialLinks';

/** Контакты: адрес и карта, телефоны, почта, руководство */
export function ContactsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Контакты"
        title="Контакты"
        lead={site.fullName}
        action={
          <Button href={routeUrl} variant="dark" arrow>
            Маршрут в 2ГИС
          </Button>
        }
      />

      <div className="container-x space-y-16 pb-20 lg:pb-28">
        <div className="grid gap-4 lg:grid-cols-12">
          <ul className="space-y-6 rounded-panel bg-surface p-6 sm:p-8 lg:col-span-5 lg:p-10">
            <Item icon={<MapPin size={20} />} label="Адрес">
              {site.address.full}
            </Item>
            <Item icon={<Phone size={20} />} label="Телефоны">
              {site.phones.map((phone) => (
                <span key={phone.href} className="block">
                  <a href={phone.href} className="hover:underline">
                    {phone.display}
                  </a>{' '}
                  <span className="font-normal text-muted">— {phone.label.toLowerCase()}</span>
                </span>
              ))}
            </Item>
            <Item icon={<Mail size={20} />} label="E-mail">
              {site.emails.map((email) => (
                <span key={email.value} className="block">
                  <a href={`mailto:${email.value}`} className="hover:underline">
                    {email.value}
                  </a>
                </span>
              ))}
            </Item>
            <Item icon={<Clock size={20} />} label="Приём документов">
              {site.admissionHours}
            </Item>
            <li className="pt-2">
              <SocialLinks tone="surface" />
            </li>
          </ul>
          <MapEmbed className="h-[24rem] sm:h-[28rem] lg:col-span-7 lg:h-auto lg:min-h-[32rem]" />
        </div>

        <section aria-labelledby="people-title">
          <h2 id="people-title" className="font-display text-h2 font-semibold">
            Руководство
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {contactPeople.map((person) => (
              <li key={person.name} className="rounded-card border border-line p-6 lg:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">{person.role}</p>
                <p className="mt-3 font-display text-xl font-semibold">{person.name}</p>
                <p className="mt-4">
                  <a href={person.phone.href} className="font-semibold hover:underline">
                    {person.phone.display}
                  </a>
                  {person.phone.note && <span className="text-muted"> — {person.phone.note}</span>}
                </p>
                {person.emails.map((email) => (
                  <a key={email} href={`mailto:${email}`} className="mt-1 block hover:underline">
                    {email}
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Item({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <div className="mt-1 text-lg font-semibold">{children}</div>
      </div>
    </li>
  );
}
