import { Check } from 'lucide-react';
import { asset } from '../../lib/asset';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';

// Чем занимается центр — со страницы «Общая информация о центре» старого сайта
const activities = [
  'Программы цифрового образования для детей разного возраста',
  'Профориентация и просвещение по цифровой грамотности и информационной безопасности',
  'Конкурсы, олимпиады и хакатоны по программированию и цифровым технологиям',
  'Методическая поддержка школ в преподавании математики и технологии',
];

/** «О центре»: два фото кабинетов, короткий рассказ и ссылка на подробную страницу */
export function AboutSection() {
  return (
    <section aria-labelledby="about-title" className="py-20 lg:py-28">
      <div className="container-x grid items-center gap-16 lg:grid-cols-12">
        <Reveal className="relative pb-10 lg:col-span-6 lg:pb-12">
          <img
            src={asset('/images/rooms/room-9.jpg')}
            alt="Компьютерный класс IT-куба: столы с мониторами, на синей стене — логотип сети центров «IT-куб»"
            width={1024}
            height={576}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-panel object-cover"
          />
          <img
            src={asset('/images/rooms/room-8.jpg')}
            alt="Аудитория направления «VR/AR-разработка» с компьютерами и VR-шлемом"
            width={1024}
            height={576}
            loading="lazy"
            className="absolute bottom-0 right-4 aspect-[4/3] w-[48%] rounded-card border-[6px] border-white object-cover shadow-card sm:right-8"
          />
        </Reveal>

        <div className="lg:col-span-6">
          <SectionHeader eyebrow="О центре" titleId="about-title" title="Цифровое образование для детей Якутска" />
          <Reveal delay={0.1}>
            <p className="mt-6 text-lead text-muted">
              IT-куб.Якутск открылся в 2021 году в рамках федерального проекта «Цифровая образовательная среда»
              национального проекта «Образование». Центр — структурное подразделение Центра технического творчества
              г. Якутска.
            </p>
          </Reveal>
          <ul className="mt-8 space-y-4">
            {activities.map((text, index) => (
              <li key={text}>
                <Reveal delay={0.15 + index * 0.05} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent" aria-hidden="true">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span>{text}</span>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal delay={0.35} className="mt-10">
            <Button to="/about" variant="dark" arrow>
              Подробнее о центре
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
