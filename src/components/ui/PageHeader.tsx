import type { ReactNode } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import type { Crumb } from './Breadcrumbs';
import { Reveal } from './Reveal';
import { Seo } from './Seo';

type Props = {
  title: string;
  // Подпись над заголовком (обычно — раздел меню)
  eyebrow?: string;
  lead?: ReactNode;
  // Крошки между «Главная» и текущей страницей
  crumbs?: Crumb[];
  // Что-то справа от заголовка (кнопка)
  action?: ReactNode;
};

/**
 * Верх каждой внутренней страницы: крошки, подпись, большой заголовок и вводный текст.
 * Заодно ставит заголовок вкладки браузера.
 */
export function PageHeader({ title, eyebrow, lead, crumbs = [], action }: Props) {
  return (
    <header className="container-x pb-12 pt-8 lg:pb-16 lg:pt-12">
      <Seo title={title} description={typeof lead === 'string' ? lead : undefined} />
      <Breadcrumbs items={[...crumbs, { label: title }]} />
      <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          {eyebrow && (
            <Reveal>
              <p className="eyebrow">{eyebrow}</p>
            </Reveal>
          )}
          <Reveal delay={0.05}>
            <h1 className="mt-5 font-display text-h1 font-semibold">{title}</h1>
          </Reveal>
          {lead && (
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-3xl text-lead text-muted">{lead}</p>
            </Reveal>
          )}
        </div>
        {action && (
          <Reveal delay={0.15} className="shrink-0">
            {action}
          </Reveal>
        )}
      </div>
    </header>
  );
}
