// Запись на обучение: правила одни для сайта, админ-панели и сервера, поэтому лежат отдельно и ничего не импортируют.

const hasSeats = (group: unknown) => {
  const seats = (group as { seats?: unknown } | null)?.seats;
  return typeof seats === 'number' && seats > 0;
};

/** Группы, в которые сейчас можно записаться: у направления открыта запись, а в группе есть свободные места */
export function openGroups<G>(direction: { enrollOpen?: unknown; groups?: G[] }): G[] {
  if (direction.enrollOpen !== true || !Array.isArray(direction.groups)) return [];
  return direction.groups.filter(hasSeats);
}

// Можно ли сейчас записаться на направление: запись открыта и хотя бы в одной группе есть места
export function isEnrollable(direction: { enrollOpen?: unknown; groups?: unknown }) {
  return direction.enrollOpen === true && Array.isArray(direction.groups) && direction.groups.some(hasSeats);
}

// Сколько всего свободных мест в группах, куда идёт запись
export function freeSeats(direction: { enrollOpen?: unknown; groups?: unknown }) {
  return openGroups(direction as { enrollOpen?: unknown; groups?: { seats: number }[] }).reduce((sum, g) => sum + g.seats, 0);
}

// Возраст ученика в заявке на запись — как у направлений в админ-панели
export const STUDENT_AGE_MIN = 5;
export const STUDENT_AGE_MAX = 18;

// Класс ученика в заявке на запись
export const grades = ['Дошкольник', ...Array.from({ length: 11 }, (_, i) => `${i + 1} класс`), 'Колледж, техникум'];

// ФИО ученика: хотя бы фамилия и имя
export const isFullName = (name: string) => name.trim().split(/\s+/).filter((part) => part.length >= 2).length >= 2;
