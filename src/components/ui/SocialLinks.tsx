import { Send } from 'lucide-react';
import { site } from '../../data/site';
import { cn } from '../../lib/cn';

type Tone = 'dark' | 'light' | 'surface';

type Props = {
  // dark — для тёмного фона (подвал, мобильное меню), light — для белого, surface — для светло-серого
  tone?: Tone;
  className?: string;
};

const toneClasses: Record<Tone, string> = {
  dark: 'bg-white/10 text-white hover:bg-accent hover:text-ink',
  light: 'bg-surface text-ink hover:bg-accent',
  surface: 'bg-white text-ink hover:bg-accent',
};

// Круглые кнопки соцсетей: ВКонтакте и Telegram
export function SocialLinks({ tone = 'light', className }: Props) {
  const chip = cn('grid h-11 w-11 place-items-center rounded-full transition-colors duration-300', toneClasses[tone]);

  return (
    <ul className={cn('flex items-center gap-2', className)}>
      <li>
        <a href={site.socials.vk} target="_blank" rel="noopener noreferrer" className={chip} aria-label="IT-куб во ВКонтакте">
          <span className="text-[13px] font-extrabold tracking-tight" aria-hidden="true">
            VK
          </span>
        </a>
      </li>
      <li>
        <a href={site.socials.telegram} target="_blank" rel="noopener noreferrer" className={chip} aria-label="IT-куб в Telegram">
          <Send size={18} aria-hidden="true" />
        </a>
      </li>
    </ul>
  );
}
