import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

type Props = {
  value: number;
};

const format = (n: number) => Math.round(n).toLocaleString('ru-RU');

/**
 * Число, которое «досчитывает» от 0 до value, когда появляется на экране.
 * Экранный чтец сразу слышит итоговое число (span.sr-only), а не мелькание цифр.
 */
export function CountUp({ value }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!inView || !node) return;
    if (reduceMotion) {
      node.textContent = format(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        0
      </span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
