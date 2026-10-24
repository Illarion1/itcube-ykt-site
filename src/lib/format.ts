// Небольшие помощники для красивого вывода чисел, дат и имён

/**
 * Правильное окончание слова после числа:
 * plural(1, ['программа', 'программы', 'программ']) → 'программа'
 * plural(3, …) → 'программы', plural(7, …) → 'программ'
 */
export function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

// 7, 11 → «7–11 лет»
export function ageRange(from: number, to: number) {
  return from === to ? `${from} ${plural(from, ['год', 'года', 'лет'])}` : `${from}–${to} лет`;
}

// 2, 4 → «2–4 ч/нед»
export function hoursRange(min: number, max: number) {
  return min === max ? `${min} ч/нед` : `${min}–${max} ч/нед`;
}

// Даты новостей хранятся по якутскому времени
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Yakutsk',
});

// '2026-06-01T18:30:49+09:00' → '1 июня 2026'
export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso)).replace(/\s?г\.$/, '');
}

const dayMonthFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  timeZone: 'Asia/Yakutsk',
});

// '2026-06-01T…' → { day: '01', month: 'июня' }
export function dayMonth(iso: string) {
  const parts = dayMonthFormatter.formatToParts(new Date(iso));
  return {
    day: parts.find((p) => p.type === 'day')?.value ?? '',
    month: parts.find((p) => p.type === 'month')?.value ?? '',
  };
}

// 'Белолюбский Михаил Михайлович' → 'МБ' (имя + фамилия)
export function initials(fullName: string) {
  const [surname = '', firstName = ''] = fullName.split(/\s+/);
  return `${firstName.charAt(0)}${surname.charAt(0)}`;
}
