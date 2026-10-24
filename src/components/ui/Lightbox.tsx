import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { asset } from '../../lib/asset';

export type LightboxImage = {
  src: string;
  caption: string;
};

type Props = {
  images: LightboxImage[];
  // Номер открытой картинки; null — лайтбокс закрыт
  index: number | null;
  onChange: (index: number | null) => void;
};

/**
 * Просмотр фото на весь экран. Листается стрелками на экране и на клавиатуре (← →),
 * закрывается крестиком, клавишей Escape или кликом по тёмному фону.
 */
export function Lightbox({ images, index, onChange }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;

  useEffect(() => {
    if (index === null) return;
    const count = images.length;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(null);
      if (e.key === 'ArrowRight') onChange((index + 1) % count);
      if (e.key === 'ArrowLeft') onChange((index - 1 + count) % count);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [index, images.length, onChange]);

  const image = index !== null ? images[index] : null;
  const roundButton = 'grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-accent hover:text-ink';

  return createPortal(
    <AnimatePresence>
      {open && image && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Фото: ${image.caption}`}
          className="on-dark fixed inset-0 z-[60] flex flex-col bg-ink/95 p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onChange(null);
          }}
        >
          <div className="flex items-center justify-between text-white">
            <p className="text-sm text-white/70">
              {index! + 1} / {images.length}
            </p>
            <button ref={closeRef} type="button" onClick={() => onChange(null)} className={roundButton} aria-label="Закрыть просмотр">
              <X size={22} aria-hidden="true" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center gap-4 py-4" onClick={(e) => e.target === e.currentTarget && onChange(null)}>
            <button
              type="button"
              onClick={() => onChange((index! - 1 + images.length) % images.length)}
              className={`${roundButton} hidden shrink-0 sm:grid`}
              aria-label="Предыдущее фото"
            >
              <ArrowLeft size={22} aria-hidden="true" />
            </button>
            <motion.img
              key={image.src}
              src={asset(image.src)}
              alt={image.caption}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="max-h-full min-w-0 max-w-full rounded-card object-contain"
            />
            <button
              type="button"
              onClick={() => onChange((index! + 1) % images.length)}
              className={`${roundButton} hidden shrink-0 sm:grid`}
              aria-label="Следующее фото"
            >
              <ArrowRight size={22} aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 text-white">
            <button
              type="button"
              onClick={() => onChange((index! - 1 + images.length) % images.length)}
              className={`${roundButton} sm:hidden`}
              aria-label="Предыдущее фото"
            >
              <ArrowLeft size={22} aria-hidden="true" />
            </button>
            <p className="text-center font-medium">{image.caption}</p>
            <button
              type="button"
              onClick={() => onChange((index! + 1) % images.length)}
              className={`${roundButton} sm:hidden`}
              aria-label="Следующее фото"
            >
              <ArrowRight size={22} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
