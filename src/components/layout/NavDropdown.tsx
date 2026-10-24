import { useEffect, useId, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import type { NavGroup } from '../../data/navigation';
import { cn } from '../../lib/cn';

/**
 * Пункт меню с выпадающим списком (для компьютера).
 * Открывается при наведении мышью, по клику и с клавиатуры (Tab + Enter).
 * Закрывается: уводом мыши, кликом мимо, клавишей Escape, выбором пункта.
 */
export function NavDropdown({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number>();
  // Чем нажали на кнопку: мышью, пальцем или клавиатурой (тогда пусто)
  const pointerTypeRef = useRef('');
  const panelId = useId();
  const { pathname } = useLocation();

  // Раздел подсвечивается, если открыта одна из его страниц
  const isActive = group.children.some((child) => !child.external && pathname.startsWith(child.to));

  // Закрываем меню при переходе на другую страницу
  useEffect(() => setOpen(false), [pathname]);

  // Пока меню открыто, слушаем клик мимо и клавишу Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Наведение работает только для мыши: на планшете касание сразу вызвало бы
  // и «наведение», и клик, и меню тут же закрывалось бы обратно
  const handlePointerEnter = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handlePointerLeave = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    // Небольшая задержка, чтобы меню не схлопывалось, если мышь чуть дрогнула
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  };

  return (
    <li
      ref={rootRef}
      className="relative"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      // Ушли табом за пределы пункта — закрываем
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onPointerDown={(e) => (pointerTypeRef.current = e.pointerType)}
        onClick={() => {
          // Мышью меню уже открылось наведением — клик его не закрывает.
          // Пальцем и клавиатурой клик открывает/закрывает.
          if (pointerTypeRef.current === 'mouse') setOpen(true);
          else setOpen((value) => !value);
          pointerTypeRef.current = '';
        }}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-medium transition-colors duration-200',
          open || isActive ? 'bg-surface text-ink' : 'text-ink/75 hover:bg-surface hover:text-ink',
        )}
      >
        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />}
        {group.label}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn('transition-transform duration-300', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          // pt-3 — «мостик» между кнопкой и списком, чтобы мышь не теряла меню по пути
          <div className="absolute left-0 top-full z-50 pt-3">
            <motion.ul
              id={panelId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-[22rem] rounded-card border border-line bg-white p-2 shadow-dropdown"
              // Клик по пункту закрывает меню, даже если мы уже на этой странице
              onClick={() => setOpen(false)}
            >
              {group.children.map((child) => {
                const itemClasses =
                  'group/item flex items-start justify-between gap-4 rounded-2xl px-4 py-3 transition-colors duration-200 hover:bg-surface';
                const text = (
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">{child.label}</span>
                    {child.description && <span className="mt-0.5 block text-sm text-muted">{child.description}</span>}
                  </span>
                );
                return (
                  <li key={child.label}>
                    {child.external ? (
                      <a href={child.to} target="_blank" rel="noopener noreferrer" className={itemClasses}>
                        {text}
                        <ArrowUpRight size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link
                        to={child.to}
                        className={cn(itemClasses, pathname === child.to && 'bg-surface')}
                        aria-current={pathname === child.to ? 'page' : undefined}
                      >
                        {text}
                      </Link>
                    )}
                  </li>
                );
              })}
            </motion.ul>
          </div>
        )}
      </AnimatePresence>
    </li>
  );
}
