import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useScrolled } from '../../hooks/useScrolled';
import { cn } from '../../lib/cn';

/**
 * Кнопка «Наверх»: появляется, когда страницу прокрутили больше чем на 600px.
 * raised — поднять кнопку выше, пока внизу виден баннер про cookie (на телефоне).
 */
export function ScrollTopButton({ raised }: { raised: boolean }) {
  const visible = useScrolled(600);
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
          aria-label="Наверх"
          title="Наверх"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-ink text-white shadow-card transition-[bottom,background-color] duration-300 hover:bg-accent hover:text-ink sm:right-6',
            raised ? 'bottom-48 sm:bottom-6' : 'bottom-4 sm:bottom-6',
          )}
        >
          <ArrowUp size={20} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
