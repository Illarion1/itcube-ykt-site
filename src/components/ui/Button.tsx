import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/cn';

type Variant = 'accent' | 'dark' | 'outline' | 'light';
type Size = 'md' | 'lg';

type Props = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  // Показать круглую стрелку ↗ справа (при наведении она сдвигается вверх-вправо)
  arrow?: boolean;
  className?: string;
  // Куда ведёт кнопка: to — страница нашего сайта, href — внешний сайт или файл.
  // Если ни того, ни другого нет — это обычная кнопка <button>.
  to?: string;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
};

const variantClasses: Record<Variant, string> = {
  accent: 'bg-accent text-ink hover:bg-accent-hover',
  dark: 'bg-ink text-white hover:bg-ink-soft',
  outline: 'border border-ink/15 text-ink hover:border-ink',
  light: 'bg-white text-ink hover:bg-surface',
};

// Цвет кружка со стрелкой подбираем под фон кнопки
const arrowClasses: Record<Variant, string> = {
  accent: 'bg-ink text-accent',
  dark: 'bg-accent text-ink',
  outline: 'bg-ink text-white',
  light: 'bg-ink text-white',
};

const sizeClasses: Record<Size, string> = {
  // min-h и py: если текст не помещается (крупный шрифт, узкий экран), кнопка становится выше, а не шире экрана
  md: 'min-h-11 gap-2 py-1.5 pl-5 text-sm',
  lg: 'min-h-14 gap-3 py-2 pl-7 text-base',
};

export function Button({
  children,
  variant = 'accent',
  size = 'md',
  arrow = false,
  className,
  to,
  href,
  onClick,
  type = 'button',
}: Props) {
  const classes = cn(
    'group inline-flex max-w-full shrink-0 items-center justify-center rounded-full text-left font-semibold transition-colors duration-300',
    variantClasses[variant],
    sizeClasses[size],
    // Справа отступ меньше, если там кружок со стрелкой
    arrow ? (size === 'lg' ? 'pr-2' : 'pr-1.5') : size === 'lg' ? 'pr-7' : 'pr-5',
    className,
  );

  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-full transition-transform duration-300 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5',
            size === 'lg' ? 'h-10 w-10' : 'h-8 w-8',
            arrowClasses[variant],
          )}
          aria-hidden="true"
        >
          <ArrowUpRight size={size === 'lg' ? 20 : 16} strokeWidth={2.25} />
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {content}
    </button>
  );
}
