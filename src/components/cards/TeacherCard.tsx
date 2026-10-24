import type { TeamMember } from '../../api/types';
import { asset } from '../../lib/asset';
import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';
import { CubeOutline } from '../ui/CubeOutline';

type Props = {
  member: TeamMember;
};

/** Карточка педагога: фото (или инициалы), ФИО, должность, направления */
export function TeacherCard({ member }: Props) {
  return (
    <article className="flex h-full flex-col rounded-card bg-white p-3">
      <Avatar member={member} />
      <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
        <h3 className="font-display text-lg font-semibold leading-snug">{member.name}</h3>
        <p className="mt-1 text-sm text-muted">{member.role}</p>
        {member.directions.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Направления">
            {member.directions.slice(0, 3).map((direction) => (
              <li key={direction} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium">
                {direction}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

const avatarVariants = ['bg-surface text-ink', 'bg-ink text-white', 'bg-accent text-ink'];

// Стабильный «случайный» номер по id, чтобы у человека всегда был один и тот же цвет
function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Фото сотрудника. Фотографии старого сайта не сохранились в веб-архиве,
 * поэтому пока показываем инициалы. Как только в team.json появится photo —
 * вместо инициалов будет фотография.
 */
function Avatar({ member }: { member: TeamMember }) {
  const frame = 'aspect-[4/5] w-full rounded-[1.1rem]';

  if (member.photo) {
    return <img src={asset(member.photo)} alt={member.name} loading="lazy" className={cn(frame, 'object-cover')} />;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(frame, 'relative grid place-items-center overflow-hidden', avatarVariants[hash(member.id) % avatarVariants.length])}
    >
      <span className="font-display text-5xl font-semibold tracking-tight">{initials(member.name)}</span>
      <CubeOutline className="absolute -bottom-10 -right-10 h-40 w-40 opacity-15" />
    </div>
  );
}
