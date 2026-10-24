import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { site } from '../../data/site';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';

type Step = {
  title: string;
  text: ReactNode;
  // Ссылка внутри сайта (to) или на внешний сайт (href)
  link?: { label: string; to?: string; href?: string };
};

// Алгоритм записи — со страницы «Приём» старого сайта
const steps: Step[] = [
  {
    title: 'Выберите направление',
    text: 'Посмотрите направления: возраст, уровень и часы занятий в неделю. Где идёт запись — отмечено.',
    link: { label: 'Все направления', to: '/directions' },
  },
  {
    title: 'Подайте заявку',
    // whitespace-nowrap — чтобы «IT-кубе» не разорвалось по дефису на две строки
    text: (
      <>
        В Навигаторе дополнительного образования, на Госуслугах или лично в{' '}
        <span className="whitespace-nowrap">IT-кубе</span>.
      </>
    ),
    link: { label: 'Навигатор', href: site.navigatorUrl },
  },
  {
    title: 'Дождитесь ответа',
    //   — неразрывный пробел: «4» не останется в конце строки отдельно от «рабочих дня»
    text: 'Заявку рассматривают 4 рабочих дня. Если есть свободные места, вас пригласят в приёмную комиссию.',
  },
  {
    title: 'Принесите документы',
    text: (
      <>
        {site.address.short}, актовый зал, 4&nbsp;этаж. <span className="whitespace-nowrap">{site.admissionHours}</span>.
      </>
    ),
    link: { label: 'Список документов', to: '/admission' },
  },
];

/** «Как записаться»: тёмный блок с четырьмя шагами */
export function AdmissionSteps() {
  const linkClass =
    'mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-accent transition-colors hover:text-white';

  return (
    <section aria-labelledby="admission-title" className="py-6 lg:py-10">
      <div className="container-x">
        <div className="on-dark rounded-panel bg-ink px-6 py-14 text-white sm:px-10 lg:px-16 lg:py-20">
          <SectionHeader
            tone="dark"
            eyebrow="Приём"
            titleId="admission-title"
            title="Как записаться в IT-куб"
            action={
              <Button to="/admission" variant="accent" arrow>
                Подробнее о приёме
              </Button>
            }
          />

          <ol className="mt-14 grid gap-px overflow-hidden rounded-card bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex bg-ink">
                <Reveal delay={index * 0.08} className="flex w-full flex-col p-6 lg:p-8">
                  <span className="font-display text-h2 font-semibold text-accent">0{index + 1}</span>
                  <h3 className="mt-8 font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-white/60">{step.text}</p>
                  {step.link?.to && (
                    <Link to={step.link.to} className={linkClass}>
                      {step.link.label}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  )}
                  {step.link?.href && (
                    <a href={step.link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {step.link.label}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  )}
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
