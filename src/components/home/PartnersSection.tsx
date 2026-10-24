import { ArrowUpRight } from 'lucide-react';
import { getPartners } from '../../api';
import type { Partner } from '../../api/types';
import { useData } from '../../hooks/useData';
import { asset } from '../../lib/asset';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';

/** Партнёры и организаторы проекта */
export function PartnersSection() {
  const { data: partners } = useData(getPartners);
  if (partners && partners.length === 0) return null;

  return (
    <section aria-labelledby="partners-title" className="py-20 lg:py-28">
      <div className="container-x">
        <SectionHeader eyebrow="Партнёры" titleId="partners-title" title="Проект реализуется при поддержке" />
        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(partners ?? []).map((partner, index) => (
            <li key={partner.id}>
              <Reveal delay={(index % 3) * 0.08} className="h-full">
                <PartnerCard partner={partner} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Карточка партнёра: логотип (или аббревиатура), название, роль; если есть сайт — вся карточка ссылка */
export function PartnerCard({ partner }: { partner: Partner }) {
  const content = (
    <>
      {partner.logo ? (
        <img src={asset(partner.logo)} alt="" className="h-14 w-14 shrink-0 rounded-2xl bg-white object-contain" />
      ) : (
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface font-display text-sm font-bold transition-colors duration-300 group-hover:bg-accent"
          aria-hidden="true"
        >
          {partner.short}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{partner.name}</span>
        {partner.role && <span className="mt-1 block text-sm text-muted">{partner.role}</span>}
      </span>
      {partner.url && <ArrowUpRight size={18} className="shrink-0 text-muted transition-colors group-hover:text-ink" aria-hidden="true" />}
    </>
  );
  const classes = 'group flex h-full items-start gap-5 rounded-card border border-line p-6 transition-colors duration-300';

  if (!partner.url) return <div className={classes}>{content}</div>;
  return (
    <a href={partner.url} target="_blank" rel="noopener noreferrer" className={`${classes} hover:border-ink`}>
      {content}
    </a>
  );
}
