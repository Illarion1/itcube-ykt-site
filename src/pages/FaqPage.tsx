import { Plus } from 'lucide-react';
import { getFaq } from '../api';
import { useData } from '../hooks/useData';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { SocialLinks } from '../components/ui/SocialLinks';

/**
 * Частые вопросы. Каждый вопрос — <details>: браузер сам раскрывает и сворачивает ответ,
 * это работает и мышью, и клавиатурой (Tab + Enter), и для экранных чтецов.
 */
export function FaqPage() {
  const faq = useData(getFaq).data ?? [];

  return (
    <>
      <PageHeader eyebrow="Контакты" title="Часто задаваемые вопросы" crumbs={[{ label: 'Контакты', to: '/contacts' }]} />
      <div className="container-x grid gap-12 pb-20 lg:grid-cols-12 lg:pb-28">
        <div className="divide-y divide-line border-y border-line lg:col-span-8">
          {faq.map((item, index) => (
            <details key={item.id} className="group py-2" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 font-display text-lg font-semibold leading-snug [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface transition-transform duration-300 group-open:rotate-45 group-open:bg-accent" aria-hidden="true">
                  <Plus size={18} />
                </span>
              </summary>
              <div className="space-y-3 pb-5 pr-14 text-muted">
                {item.answer.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
        <aside className="lg:col-span-4">
          <div className="rounded-card bg-surface p-6 lg:sticky lg:top-24 lg:p-8">
            <h2 className="font-display text-xl font-semibold">Не нашли ответ?</h2>
            <p className="mt-3 text-muted">Напишите нам или задайте вопрос в соцсетях — ответим.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button to="/feedback" variant="dark" arrow>
                Обратная связь
              </Button>
              <SocialLinks tone="surface" />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
