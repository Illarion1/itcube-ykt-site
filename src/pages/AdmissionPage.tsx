import type { ReactNode } from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { admission } from '../data/pages';
import { site } from '../data/site';
import { ContactForm } from '../components/forms/ContactForm';
import { Button } from '../components/ui/Button';
import { DocList } from '../components/ui/DocList';
import { PageHeader } from '../components/ui/PageHeader';
import { Reveal } from '../components/ui/Reveal';

/** Приём на обучение: алгоритм записи, документы, бланки */
export function AdmissionPage() {
  return (
    <>
      <PageHeader
        eyebrow="Обучение"
        title="Приём на обучение"
        crumbs={[{ label: 'Обучение', to: '/directions' }]}
        lead={admission.note}
        action={
          <Button href={site.navigatorUrl} arrow>
            Подать заявку в Навигаторе
          </Button>
        }
      />

      <div className="container-x space-y-20 pb-20 lg:space-y-28 lg:pb-28">
        <section aria-labelledby="steps-title">
          <h2 id="steps-title" className="font-display text-h2 font-semibold">
            Алгоритм записи
          </h2>
          <ol className="mt-10 grid gap-4 lg:grid-cols-3">
            <Step number={1} title="Выберите направление и группу">
              <p>
                Посмотрите направления по возрасту и интересам. Где сейчас идёт запись — видно на странице «Вакантные места», дни и время групп — в
                расписании.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button to="/directions" variant="dark">
                  Все направления
                </Button>
                <Button to="/vacancies" variant="outline">
                  Вакантные места
                </Button>
                <Button to="/schedule" variant="outline">
                  Расписание
                </Button>
              </div>
            </Step>
            <Step number={2} title="Подайте заявку одним из способов">
              <ul className="space-y-3">
                {admission.ways.map((way) => (
                  <li key={way.title}>
                    {way.url ? (
                      <a href={way.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold hover:underline">
                        {way.title}
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="font-semibold">{way.title}</span>
                    )}
                    <span className="block text-sm text-muted">{way.text}</span>
                  </li>
                ))}
              </ul>
            </Step>
            <Step number={3} title="Дождитесь ответа и принесите документы">
              <p>{admission.review}</p>
            </Step>
          </ol>
        </section>

        <section aria-labelledby="docs-title" className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="docs-title" className="font-display text-h2 font-semibold">
              Документы для зачисления
            </h2>
            <div className="on-dark mt-8 rounded-card bg-ink p-6 text-white">
              <p className="flex items-start gap-3">
                <MapPin size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  Приёмная комиссия: {site.address.short.replace('Якутск, ', '')}, актовый зал, 4&nbsp;этаж.
                  <span className="mt-1 block text-white/60">{site.admissionHours}, без обеда. Суббота и воскресенье — выходные.</span>
                </span>
              </p>
            </div>
          </div>
          <ul className="space-y-4 lg:col-span-7">
            {admission.documents.map((doc, index) => (
              <li key={doc} className="flex gap-4 border-b border-line pb-4">
                <span className="font-display text-sm font-semibold text-muted">{String(index + 1).padStart(2, '0')}</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="forms-title" className="grid gap-12 lg:grid-cols-12">
          <h2 id="forms-title" className="font-display text-h2 font-semibold lg:col-span-5">
            Бланки и списки направлений
          </h2>
          <div className="space-y-10 lg:col-span-7">
            <DocList items={admission.forms} />
            <div>
              <h3 className="font-display text-xl font-semibold">Списки направлений на 2024–2025 учебный год</h3>
              <div className="mt-4">
                <DocList items={admission.programLists} />
              </div>
              <p className="mt-4 text-sm text-muted">{admission.scheduleNote}</p>
            </div>
          </div>
        </section>

        <section id="enroll" aria-labelledby="enroll-title" className="grid scroll-mt-24 gap-12 rounded-panel bg-surface p-6 sm:p-10 lg:grid-cols-12 lg:p-14">
          <div className="lg:col-span-5">
            <h2 id="enroll-title" className="font-display text-h2 font-semibold">
              Оставить заявку на сайте
            </h2>
            <p className="mt-5 text-lead text-muted">
              Выберите направление, где идёт запись, и оставьте контакты. Не знаете, что выбрать? Выберите тему «Вопрос» — подскажем по возрасту и интересам.
            </p>
          </div>
          <div className="rounded-card bg-white p-6 sm:p-8 lg:col-span-7">
            <ContactForm initialTopic="enroll" />
          </div>
        </section>
      </div>
    </>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <li>
      <Reveal delay={(number - 1) * 0.08} className="h-full">
        <div className="flex h-full flex-col rounded-card bg-surface p-6 lg:p-8">
          <span className="font-display text-h2 font-semibold text-ink/25">0{number}</span>
          <h3 className="mt-6 font-display text-xl font-semibold">{title}</h3>
          <div className="mt-4 text-muted [&_a]:text-ink [&_span.font-semibold]:text-ink">{children}</div>
        </div>
      </Reveal>
    </li>
  );
}
