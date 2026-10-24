import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type Props = {
  children: ReactNode;
  // Задержка в секундах — чтобы карточки в ряду появлялись по очереди
  delay?: number;
  className?: string;
};

/**
 * Плавное появление при прокрутке: блок поднимается на 24px и проявляется.
 * Срабатывает один раз, когда блок попадает на экран. Длительность — 0.6 с.
 */
export function Reveal({ children, delay = 0, className }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
