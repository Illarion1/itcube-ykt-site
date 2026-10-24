import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { getCategories } from '../../api';
import { site } from '../../data/site';
import { useData } from '../../hooks/useData';
import { Button } from '../ui/Button';
import { Marquee } from '../ui/Marquee';
import { Reveal } from '../ui/Reveal';
import { HeroCube } from './HeroCube';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

// Слова заголовка «выезжают» снизу по очереди. overflow-hidden у обёртки прячет слово,
// пока оно ниже строки; отступы pb/-mb не дают обрезать буквы с «хвостиками» (р, у, д).
function RisingWords({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split(' ').map((word, index) => (
        <Fragment key={index}>
          {index > 0 && ' '}
          <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, delay: delay + index * 0.08, ease }}
            >
              {word}
            </motion.span>
          </span>
        </Fragment>
      ))}
    </>
  );
}

/** Первый экран: заголовок, подзаголовок, кнопки, 3D-куб и бегущая строка с категориями направлений */
export function Hero() {
  const { data: categories } = useData(getCategories);

  return (
    <section aria-labelledby="hero-title">
      <div className="container-x grid items-center gap-12 pb-14 pt-6 lg:grid-cols-12 lg:gap-8 lg:pb-20 lg:pt-10">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="eyebrow">Нацпроект «Образование» · Якутск</p>
          </Reveal>

          <h1 id="hero-title" className="isolate mt-6 font-display text-display font-semibold">
            <RisingWords text="Центр цифрового образования" />{' '}
            <span className="relative inline-block whitespace-nowrap">
              {/* Зелёный «маркер» под словом: вырастает слева направо */}
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-[-0.12em] bottom-[0.02em] top-[0.18em] -z-10 origin-left rounded-[0.18em] bg-accent"
                style={{ rotate: -1 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.4, ease }}
              />
              <RisingWords text="IT-куб" delay={0.3} />
            </span>
          </h1>

          <Reveal delay={0.35}>
            <p className="mt-8 max-w-xl text-lead text-muted">
              Программирование, робототехника, VR/AR, дизайн, 3D и ещё много направлений для школьников от{' '}
              {site.ages.from} до {site.ages.to} лет.
            </p>
          </Reveal>

          <Reveal delay={0.45}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button to="/admission" size="lg" arrow>
                Записаться
              </Button>
              <Button to="/directions" variant="outline" size="lg">
                Направления
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="lg:col-span-5">
          <HeroVisual />
        </Reveal>
      </div>

      <Marquee items={categories?.map((c) => c.title) ?? []} />
    </section>
  );
}

// Правая часть первого экрана: светлая панель с точечной сеткой, куб и «парящие» плашки
function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem] overflow-hidden rounded-panel bg-surface">
      <div className="dot-grid absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 grid place-items-center">
        <HeroCube />
      </div>
      <p className="absolute left-4 top-4 flex animate-float items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-card sm:left-6 sm:top-6">
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        {site.ages.from}–{site.ages.to} лет
      </p>
      <p
        className="absolute bottom-4 right-4 animate-float rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-card sm:bottom-6 sm:right-6"
        style={{ animationDelay: '-3s' }}
      >
        Python · Роботы · VR/AR
      </p>
    </div>
  );
}
