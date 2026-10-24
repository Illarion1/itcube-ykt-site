import { Link } from 'react-router-dom';
import logoUrl from '../../assets/logo-itcube.png';
import { cn } from '../../lib/cn';

type Props = {
  // dark — чёрный логотип для белого фона, light — белый для тёмного
  tone?: 'dark' | 'light';
  className?: string;
};

/**
 * Логотип в шапке. Оригинальная картинка вертикальная: сверху куб, снизу надпись.
 * Показываем только куб — блок высотой 42px обрезает нижнюю часть (overflow-hidden).
 * Фильтр brightness-0 перекрашивает синий логотип в чёрный под минималистичный стиль
 * (чтобы вернуть фирменный синий — уберите brightness-0).
 */
export function Logo({ tone = 'dark', className }: Props) {
  return (
    <Link to="/" className={cn('flex shrink-0 items-center gap-3', className)} aria-label="IT-куб Якутск — на главную">
      <span className="relative block h-[42px] w-10 overflow-hidden" aria-hidden="true">
        <img
          src={logoUrl}
          alt=""
          width={40}
          height={53}
          className={cn('absolute left-0 top-0 w-full max-w-none', tone === 'dark' ? 'site-logo-dark brightness-0' : 'site-logo-light brightness-0 invert')}
        />
      </span>
      <span className="font-display text-[15px] font-semibold leading-none tracking-tight">
        IT-куб
        <span className={cn('mt-1 block font-sans text-xs font-medium', tone === 'dark' ? 'text-muted' : 'text-white/60')}>
          Якутск
        </span>
      </span>
    </Link>
  );
}
