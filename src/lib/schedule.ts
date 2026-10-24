// Группы направления и их расписание: дни недели, время, группировка для вывода на сайте.
// Файл общий для сайта, админ-панели и сервера (проверка в src/admin/schema.ts), поэтому без React.

export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Одно занятие группы: «понедельник, 09:00–10:40» */
export type GroupLesson = {
  day: Day;
  start: string;
  end: string;
};

/**
 * Группа направления: название, свободные места и занятия по дням недели.
 * id не меняется при переименовании — по нему заявка на запись находит свою группу.
 */
export type Group = {
  id: string;
  name: string;
  // Сколько учеников ещё нужно в группу; 0 — мест нет
  seats: number;
  lessons: GroupLesson[];
};

/** Занятие вместе с названием группы — для таблицы по дням недели */
export type Lesson = GroupLesson & { group: string };

export const days: { value: Day; label: string; short: string }[] = [
  { value: 'mon', label: 'Понедельник', short: 'Пн' },
  { value: 'tue', label: 'Вторник', short: 'Вт' },
  { value: 'wed', label: 'Среда', short: 'Ср' },
  { value: 'thu', label: 'Четверг', short: 'Чт' },
  { value: 'fri', label: 'Пятница', short: 'Пт' },
  { value: 'sat', label: 'Суббота', short: 'Сб' },
  { value: 'sun', label: 'Воскресенье', short: 'Вс' },
];

const dayIndex = (day: Day) => days.findIndex((d) => d.value === day);
export const dayShort = (day: Day) => days[dayIndex(day)]?.short ?? day;

// Время в формате 09:00
export const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// '09:00', '10:40' → '09:00–10:40'
export const timeRange = (lesson: Pick<GroupLesson, 'start' | 'end'>) => `${lesson.start}–${lesson.end}`;

// «Группа 2» раньше «Группа 10»
const byName = (a: string, b: string) => a.localeCompare(b, 'ru', { numeric: true });

/** Занятия по порядку: по дням недели, внутри дня — по времени */
export function sortLessons<T extends GroupLesson>(lessons: T[]): T[] {
  return [...lessons].sort(
    (a, b) => dayIndex(a.day) - dayIndex(b.day) || a.start.localeCompare(b.start) || byName('group' in a ? String(a.group) : '', 'group' in b ? String(b.group) : ''),
  );
}

/** Все занятия направления одним списком, с названием группы у каждого */
export const flatLessons = (groups: Group[]): Lesson[] => groups.flatMap((g) => g.lessons.map((l) => ({ ...l, group: g.name })));

/** Занятия одного дня недели, по времени */
export const lessonsOn = (lessons: Lesson[], day: Day) => sortLessons(lessons.filter((l) => l.day === day));

/** Дни, в которые есть занятия: пригодится, чтобы не показывать пустое воскресенье */
export const busyDays = (lessons: GroupLesson[]) => days.filter((d) => lessons.some((l) => l.day === d.value)).map((d) => d.value);

/**
 * Занятия группы, где дни с одинаковым временем объединены:
 * пн 09:00–10:40 и ср 09:00–10:40 → [{ days: ['mon', 'wed'], start: '09:00', end: '10:40' }]
 */
export function slotsOf(lessons: GroupLesson[]) {
  const slots: { days: Day[]; start: string; end: string }[] = [];
  for (const lesson of sortLessons(lessons)) {
    const same = slots.find((s) => s.start === lesson.start && s.end === lesson.end);
    if (same) same.days.push(lesson.day);
    else slots.push({ days: [lesson.day], start: lesson.start, end: lesson.end });
  }
  return slots;
}

/** Расписание группы одной строкой: «Пн, Ср 09:00–10:40; Пт 14:30–16:10» (пустая строка — время не указано) */
export const formatSlots = (lessons: GroupLesson[]) => slotsOf(lessons).map((s) => `${s.days.map(dayShort).join(', ')} ${timeRange(s)}`).join('; ');

/** Номер новой группы: короткий и случайный */
export const newGroupId = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0');

/**
 * Перевод из прежнего формата, где расписание было списком занятий с названием группы, в группы.
 * Свободных мест у групп пока нет — их отмечают в админ-панели.
 */
export function groupsFromLessons(lessons: Lesson[]): Group[] {
  const names = [...new Set(lessons.map((l) => l.group.trim()))].sort(byName);
  return names.map((name, index) => ({
    id: `g${index + 1}`,
    name: name || 'Основная группа',
    seats: 0,
    lessons: lessons.filter((l) => l.group.trim() === name).map(({ day, start, end }) => ({ day, start, end })),
  }));
}
