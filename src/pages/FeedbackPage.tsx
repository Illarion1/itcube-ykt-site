import { useSearchParams } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import type { FeedbackData } from '../api';
import { site } from '../data/site';
import { ContactForm } from '../components/forms/ContactForm';
import { PageHeader } from '../components/ui/PageHeader';
import { SocialLinks } from '../components/ui/SocialLinks';

const topics: FeedbackData['topic'][] = ['enroll', 'question', 'idea'];

/**
 * Обратная связь: форма и прямые контакты сбоку.
 * Кнопка «Записаться» ведёт сюда с готовым выбором: /feedback?topic=enroll&direction=it-01&group=g2
 */
export function FeedbackPage() {
  const [params] = useSearchParams();
  const topicParam = params.get('topic') as FeedbackData['topic'] | null;
  const topic = topicParam && topics.includes(topicParam) ? topicParam : undefined;
  const direction = params.get('direction') ?? '';
  const group = params.get('group') ?? '';

  return (
    <>
      <PageHeader
        eyebrow="Контакты"
        title={topic === 'enroll' ? 'Запись на обучение' : 'Обратная связь'}
        crumbs={[{ label: 'Контакты', to: '/contacts' }]}
        lead={
          topic === 'enroll'
            ? 'Оставьте заявку — сотрудники центра свяжутся с вами, чтобы подтвердить запись. Поля со звёздочкой обязательны.'
            : 'Задайте вопрос, оставьте заявку на обучение или предложение. Поля со звёздочкой обязательны.'
        }
      />
      <div className="container-x grid gap-12 pb-20 lg:grid-cols-12 lg:pb-28">
        <div className="lg:col-span-7">
          {/* key: при переходе по другой ссылке «Записаться» форма начинается заново, с новыми направлением и группой */}
          <ContactForm key={`${topic}-${direction}-${group}`} initialTopic={topic} initialDirection={direction} initialGroup={group} />
        </div>
        <aside className="lg:col-span-5">
          <div className="space-y-5 rounded-panel bg-surface p-6 lg:sticky lg:top-24 lg:p-8">
            <h2 className="font-display text-xl font-semibold">Удобнее позвонить?</h2>
            <a href={site.phones[0].href} className="flex items-center gap-3 text-lg font-semibold hover:underline">
              <Phone size={20} aria-hidden="true" />
              {site.phones[0].display}
            </a>
            <a href={`mailto:${site.emails[0].value}`} className="flex items-center gap-3 hover:underline">
              <Mail size={20} aria-hidden="true" />
              {site.emails[0].value}
            </a>
            <SocialLinks tone="surface" />
          </div>
        </aside>
      </div>
    </>
  );
}
