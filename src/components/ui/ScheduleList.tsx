import { Fragment } from 'react';
import { cn } from '../../lib/cn';
import { plural } from '../../lib/format';
import { dayShort, slotsOf, timeRange } from '../../lib/schedule';
import type { Group } from '../../lib/schedule';

/**
 * Расписание направления по группам: «Группа 1 — Пн, Ср 09:00–10:40».
 * Дни с одинаковым временем объединяются, чтобы строка была короче.
 * vacancies — у направления идёт запись: рядом с группами, где есть места, показываем их число.
 */
export function ScheduleList({ groups, vacancies = false, className }: { groups: Group[]; vacancies?: boolean; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm', className)}>
      {groups.map((group) => (
        <Fragment key={group.id}>
          <dt className="font-semibold">{group.name}</dt>
          <dd className="tabular-nums">
            {group.lessons.length === 0 && <span className="text-muted">время уточняется</span>}
            {slotsOf(group.lessons).map((slot, index) => (
              <Fragment key={index}>
                {index > 0 && '; '}
                <span className="whitespace-nowrap">
                  {slot.days.map(dayShort).join(', ')} {timeRange(slot)}
                </span>
              </Fragment>
            ))}
            {vacancies && group.seats > 0 && (
              <span className="ml-2 whitespace-nowrap rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold">
                {group.seats} {plural(group.seats, ['место', 'места', 'мест'])}
              </span>
            )}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}
