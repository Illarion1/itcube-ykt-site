import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Mail, MapPin, Phone, Plus, X } from 'lucide-react';
import { isGroup, mainNav } from '../../data/navigation';
import type { NavGroup } from '../../data/navigation';
import { site } from '../../data/site';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { SocialLinks } from '../ui/SocialLinks';
import { Logo } from './Logo';

type Props = {
  open: boolean;
  onClose: () => void;
};

// Кривая плавности движения (как ease-out-expo в tailwind.config.ts)
const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Меню для телефона и планшета — тёмный экран поверх сайта.
 * Рендерится через портал прямо в <body>, чтобы ничто в шапке
 * (например, размытие фона) не мешало ему растянуться на весь экран.
 */
export function MobileMenu({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Пока меню открыто, страница под ним не прокручивается
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // «Ловушка фокуса»: Tab переключает элементы только внутри меню, по кругу
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Меню сайта"
          className="on-dark fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ink text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          // Клик по любой ссылке внутри меню закрывает его (даже если это текущая страница)
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) onClose();
          }}
        >
          <div className="container-x flex h-20 shrink-0 items-center justify-between">
            <Logo tone="light" />
            <button
              type="button"
              onClick={onClose}
              autoFocus
              aria-label="Закрыть меню"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Разделы сайта" className="container-x flex-1 py-6">
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {mainNav.map((item, index) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.05, duration: 0.4, ease: easeOut }}
                >
                  {isGroup(item) ? (
                    <MobileGroup group={item} />
                  ) : (
                    <Link
                      to={item.to}
                      className="flex items-center justify-between py-5 font-display text-2xl font-medium"
                    >
                      {item.label}
                      <ArrowUpRight size={24} className="text-white/40" aria-hidden="true" />
                    </Link>
                  )}
                </motion.li>
              ))}
            </ul>
          </nav>

          <div className="container-x space-y-8 pb-10">
            <Button to="/admission" variant="accent" size="lg" arrow className="w-full">
              Записаться на обучение
            </Button>

            <ul className="space-y-3 text-white/70">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                {site.address.short}
              </li>
              <li className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <a href={site.phones[0].href} className="hover:text-white">
                  {site.phones[0].display}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <a href={`mailto:${site.emails[0].value}`} className="hover:text-white">
                  {site.emails[0].value}
                </a>
              </li>
            </ul>

            <SocialLinks tone="dark" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Раздел мобильного меню, который раскрывается «гармошкой»
function MobileGroup({ group }: { group: NavGroup }) {
  const { pathname } = useLocation();
  // Если сейчас открыта страница из этого раздела — он сразу раскрыт
  const [expanded, setExpanded] = useState(() =>
    group.children.some((child) => !child.external && pathname.startsWith(child.to)),
  );
  const listId = useId();

  return (
    <>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between py-5 text-left font-display text-2xl font-medium"
      >
        {group.label}
        <Plus
          size={24}
          aria-hidden="true"
          className={cn('text-white/60 transition-transform duration-300', expanded && 'rotate-45')}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={listId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="overflow-hidden"
          >
            <ul className="space-y-1 pb-5">
              {group.children.map((child) => (
                <li key={child.label}>
                  {child.external ? (
                    <a
                      href={child.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 py-2 text-lg text-white/70 hover:text-white"
                    >
                      {child.label}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  ) : (
                    <Link
                      to={child.to}
                      aria-current={pathname === child.to ? 'page' : undefined}
                      className={cn(
                        'block py-2 text-lg hover:text-white',
                        pathname === child.to ? 'text-accent' : 'text-white/70',
                      )}
                    >
                      {child.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
