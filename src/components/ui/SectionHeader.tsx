import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Reveal } from './Reveal';

type Props = {
  eyebrow: string;
  title: ReactNode;
  // id заголовка — на него ссылается секция через aria-labelledby (для экранных чтецов)
  titleId?: string;
  description?: ReactNode;
  // Кнопка или ссылка справа от заголовка
  action?: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
};

/** Шапка секции: маленькая подпись, большой заголовок, описание и кнопка справа */
export function SectionHeader({ eyebrow, title, titleId, description, action, tone = 'light', className }: Props) {
  return (
    <div className={cn('flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="max-w-3xl">
        <Reveal>
          <p className={cn('eyebrow', tone === 'dark' && 'text-white/50')}>{eyebrow}</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 id={titleId} className="mt-5 font-display text-h2 font-semibold">
            {title}
          </h2>
        </Reveal>
        {description && (
          <Reveal delay={0.1}>
            <p className={cn('mt-5 text-lead', tone === 'dark' ? 'text-white/60' : 'text-muted')}>{description}</p>
          </Reveal>
        )}
      </div>
      {action && (
        <Reveal delay={0.15} className="shrink-0">
          {action}
        </Reveal>
      )}
    </div>
  );
}
