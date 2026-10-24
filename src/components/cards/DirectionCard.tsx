import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, User } from 'lucide-react';
import { enrollUrl, freeSeats, isEnrollable } from '../../api';
import type { Direction } from '../../api/types';
import { fileUrl } from '../../lib/asset';
import { ageRange, plural } from '../../lib/format';
import { ScheduleList } from '../ui/ScheduleList';

/**
 * Карточка направления: уровень, возраст, название, часы, срок, педагог, запись на обучение
 * (свободные места и кнопка «Записаться»), описание и расписание (раскрываются кнопкой) и программа обучения.
 * id карточки — номер направления, поэтому на неё можно сослаться: /directions/python#it-01
 */
export function DirectionCard({ direction, categoryTitle }: { direction: Direction; categoryTitle?: string }) {
  const open = isEnrollable(direction);
  const seats = freeSeats(direction);

  return (
    <article id={direction.id} className="flex h-full scroll-mt-24 flex-col rounded-card border border-line p-6 target:border-ink">
      {categoryTitle && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{categoryTitle}</p>}
      <div className="flex flex-wrap gap-2 text-sm font-medium">
        <span className="rounded-full bg-accent px-3 py-1">{direction.level}</span>
        <span className="rounded-full bg-surface px-3 py-1">{ageRange(direction.ageFrom, direction.ageTo)}</span>
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold leading-snug">{direction.title}</h3>

      <ul className="mt-4 space-y-2 text-sm text-muted">
        <li className="flex items-center gap-2">
          <Clock size={16} aria-hidden="true" />
          {direction.duration}, {direction.hoursPerWeek} ч в неделю
        </li>
        <li className="flex items-center gap-2">
          <User size={16} aria-hidden="true" />
          {direction.teacher}
        </li>
      </ul>

      {/* <details> — встроенная в браузер «раскрывашка»: работает с клавиатуры без JavaScript */}
      <details className="group mt-4">
        <summary className="cursor-pointer list-none text-sm font-semibold underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Показать описание</span>
          <span className="hidden group-open:inline">Скрыть описание</span>
        </summary>
        <p className="mt-3 text-sm leading-relaxed text-muted">{direction.annotation}</p>
      </details>
      {direction.groups.length > 0 && (
        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-sm font-semibold underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Показать расписание</span>
            <span className="hidden group-open:inline">Скрыть расписание</span>
          </summary>
          <ScheduleList groups={direction.groups} vacancies={direction.enrollOpen} className="mt-3" />
          {(direction.room || direction.scheduleNote) && (
            <p className="mt-2 text-sm text-muted">{[direction.room, direction.scheduleNote].filter(Boolean).join(' · ')}</p>
          )}
        </details>
      )}

      <div className="mt-auto space-y-4 pt-6">
        {direction.url && (
          <a href={fileUrl(direction.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
            Программа обучения
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        )}
        {open ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent-soft p-3 pl-4">
            <span className="text-sm font-semibold">
              Идёт запись · {seats} {plural(seats, ['место', 'места', 'мест'])}
            </span>
            <Link
              to={enrollUrl(direction)}
              className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-soft"
            >
              Записаться
            </Link>
          </div>
        ) : (
          <p className="rounded-2xl bg-surface px-4 py-3 text-sm text-muted">Запись сейчас закрыта</p>
        )}
      </div>
    </article>
  );
}
