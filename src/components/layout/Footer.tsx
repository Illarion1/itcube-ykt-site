import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { aboutGroup, contactsGroup, learningGroup } from '../../data/navigation';
import type { NavLinkItem } from '../../data/navigation';
import { site } from '../../data/site';
import { Button } from '../ui/Button';
import { SocialLinks } from '../ui/SocialLinks';
import { Logo } from './Logo';

// Третья колонка подвала: пункты, которые в шапке стоят отдельно, + раздел «Контакты»
const moreLinks: NavLinkItem[] = [
  { label: 'Новости', to: '/news' },
  { label: 'Высший пилотаж — Якутск', to: '/vysshiy-pilotazh' },
  ...contactsGroup.children,
];

const columns = [
  { title: aboutGroup.label, links: aboutGroup.children },
  { title: learningGroup.label, links: learningGroup.children },
  { title: 'Ещё', links: moreLinks },
];

/** Подвал сайта: призыв записаться, контакты, карта сайта, копирайт */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark relative overflow-hidden bg-ink text-white">
      <div className="container-x relative">
        {/* Призыв к действию */}
        <div className="flex flex-col gap-8 border-b border-white/10 py-14 lg:flex-row lg:items-end lg:justify-between lg:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow text-white/50">Приём на обучение</p>
            <h2 className="mt-5 font-display text-h2 font-semibold">
              Запишите ребёнка в&nbsp;
              <span className="whitespace-nowrap text-accent">IT-куб</span>
            </h2>
            <p className="mt-4 text-lead text-white/60">
              Заявку можно подать в Навигаторе дополнительного образования, на Госуслугах или лично в центре.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button to="/admission" variant="accent" size="lg" arrow>
              Как записаться
            </Button>
            <Button href={site.navigatorUrl} variant="light" size="lg">
              Навигатор
            </Button>
          </div>
        </div>

        {/* Контакты и карта сайта */}
        <div className="grid gap-12 py-14 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-4">
            <Logo tone="light" />
            <ul className="space-y-4 text-white/70">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <span>{site.address.full}</span>
              </li>
              {site.phones.map((phone) => (
                <li key={phone.href} className="flex items-start gap-3">
                  <Phone size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    <a href={phone.href} className="text-white transition-colors hover:text-accent">
                      {phone.display}
                    </a>
                    <span className="text-white/50"> — {phone.label.toLowerCase()}</span>
                  </span>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <span className="flex flex-col">
                  {site.emails.slice(0, 2).map((email) => (
                    <a key={email.value} href={`mailto:${email.value}`} className="transition-colors hover:text-accent">
                      {email.value}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <span>Приём документов: {site.admissionHours}</span>
              </li>
            </ul>
            <SocialLinks tone="dark" />
          </div>

          <nav aria-label="Карта сайта" className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/40">{column.title}</h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-white/75 transition-colors hover:text-white"
                        >
                          {link.label}
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </a>
                      ) : (
                        <Link to={link.to} className="text-white/75 transition-colors hover:text-white">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Нижняя строка */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-8 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {site.foundedYear}–{year} {site.parentOrg}
          </p>
          <Link to="/privacy" className="transition-colors hover:text-white">
            Политика обработки персональных данных
          </Link>
          <a
            href={site.nationalProjectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-white"
          >
            Национальный проект «Образование»
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          {/* Вход в админ-панель: сотрудники добавляют новости, педагогов, направления, смотрят заявки */}
          <Link to="/admin" className="transition-colors hover:text-white">
            Для сотрудников
          </Link>
        </div>
      </div>

      {/* Огромная декоративная надпись на фоне */}
      <p
        aria-hidden="true"
        className="pointer-events-none select-none whitespace-nowrap text-center font-display text-[22vw] font-bold leading-[0.8] tracking-tighter text-white/[0.04]"
      >
        IT-куб
      </p>
    </footer>
  );
}
