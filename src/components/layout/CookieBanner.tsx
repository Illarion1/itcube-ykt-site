import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'itcube-cookie-accepted';

function wasAccepted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

type Props = {
  // Сообщаем наверх, виден ли баннер (чтобы кнопка «Наверх» его не перекрывала)
  onVisibleChange: (visible: boolean) => void;
};

/** Баннер про cookie внизу экрана. После «Понятно» больше не показывается */
export function CookieBanner({ onVisibleChange }: Props) {
  const [visible, setVisible] = useState(() => !wasAccepted());

  useEffect(() => onVisibleChange(visible), [visible, onVisibleChange]);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // без localStorage баннер просто покажется снова в следующий раз
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="region"
          aria-label="Уведомление об использовании cookie"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="on-dark fixed inset-x-4 bottom-4 z-40 rounded-card bg-ink p-5 text-white shadow-dropdown sm:left-6 sm:right-auto sm:max-w-md"
        >
          <div className="flex gap-4">
            <Cookie size={24} className="shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm text-white/80">
              Сайт использует файлы cookie и карту 2ГИС, чтобы работать удобнее.
              Подробнее — в{' '}
              <Link to="/privacy" className="text-white underline underline-offset-4">
                политике обработки данных
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={accept}
            className="mt-4 h-11 w-full rounded-full bg-accent px-5 font-semibold text-ink transition-colors hover:bg-accent-hover sm:w-auto"
          >
            Понятно
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
