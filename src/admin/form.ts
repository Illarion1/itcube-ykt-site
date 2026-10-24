/**
 * Перевод записи в значения формы и обратно.
 * В форме всё хранится так, как удобно человеку: текст новости — одной строкой с абзацами,
 * числа — строкой (пока человек печатает, «1,» — ещё не число). Обратно в запись значения
 * приводит validateItem из schema.ts: он же проверяет их и отбрасывает служебные поля (_key).
 */
import { emptyValue } from './schema';
import type { Collection, Field, Item } from './schema';

let keyCounter = 0;
// Ключ строки списка, чтобы React не путал строки при перестановке
export const rowKey = () => `row-${++keyCounter}`;

export function toFormValues(fields: Field[], item: Item): Item {
  const values: Item = {};
  for (const field of fields) {
    const value = item[field.name];
    switch (field.type) {
      case 'paragraphs':
        values[field.name] = Array.isArray(value) ? value.join('\n\n') : typeof value === 'string' ? value : '';
        break;
      case 'number':
        values[field.name] = typeof value === 'number' ? String(value) : '';
        break;
      case 'boolean':
        values[field.name] = value === true;
        break;
      case 'tags':
      case 'images':
        values[field.name] = Array.isArray(value) ? value : [];
        break;
      case 'list':
        values[field.name] = Array.isArray(value) ? value.map((row) => newRow(field.of, row as Item)) : [];
        break;
      case 'groups':
        values[field.name] = Array.isArray(value) ? value.map((group) => groupRow(group as Item)) : [];
        break;
      case 'hidden':
        if (value !== undefined) values[field.name] = value;
        break;
      default:
        values[field.name] = typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
    }
  }
  return values;
}

/** Группа направления в виде значений формы: места — строкой, у группы и её занятий — ключи строк */
export function groupRow(group: Item): Item {
  return {
    ...group,
    seats: typeof group.seats === 'number' ? String(group.seats) : '0',
    lessons: Array.isArray(group.lessons) ? group.lessons.map((lesson) => ({ ...(lesson as Item), _key: rowKey() })) : [],
    _key: rowKey(),
  };
}

/** Строка списка (например, документ раздела) в виде значений формы */
export function newRow(fields: Field[], row: Item = {}): Item {
  return { ...toFormValues(fields, row), _key: rowKey() };
}

// Сейчас по якутскому времени в формате '2026-10-24T15:30:00+09:00'
export function nowInYakutsk() {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Yakutsk',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
  return `${parts.replace(' ', 'T')}+09:00`;
}

/** Значения формы для новой записи */
export function newFormValues(collection: Collection): Item {
  const item: Item = {};
  for (const field of collection.fields) {
    item[field.name] = field.type === 'date' ? nowInYakutsk() : emptyValue(field);
  }
  return toFormValues(collection.fields, item);
}
