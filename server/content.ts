/**
 * Изменение разделов сайта: добавить, изменить, удалить запись и поменять порядок.
 * Все данные проверяются по схеме из src/admin/schema.ts — той же, по которой
 * админ-панель строит формы.
 */
import { collectionList, collections, hasErrors, slugify, validateItem } from '../src/admin/schema.ts';
import type { Collection, CollectionName, Field, Item, Lookup } from '../src/admin/schema.ts';
import { HttpError } from './http.ts';
import type { Store } from './store.ts';

// Разделы, на которые ссылаются поля раздела (например, программы → направления)
function referencedCollections(fields: Field[]): CollectionName[] {
  return fields.flatMap((field) => {
    if (field.type === 'reference') return [field.collection];
    if (field.type === 'list') return referencedCollections(field.of);
    return [];
  });
}

function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

const idOf = (collection: Collection, item: Item) => String(item[collection.idField]);

// Номер для новой записи
function makeId(collection: Collection, item: Item, items: Item[]): string | number {
  const taken = new Set(items.map((x) => idOf(collection, x)));

  if (collection.idKind === 'number') {
    return items.reduce((max, x) => Math.max(max, Number(x[collection.idField]) || 0), 0) + 1;
  }

  const slugField = collection.fields.find((f) => f.type === 'slug');
  const typed = collection.idKind === 'slug' ? String(item[collection.idField] ?? '') : '';
  // Адрес, который человек видел в форме, должен остаться таким же — если он занят, просим придумать другой
  if (typed && slugField?.type === 'slug' && !slugField.hidden) {
    if (taken.has(typed)) throw new HttpError(422, 'Проверьте поля формы', { [collection.idField]: 'Такой адрес уже занят — придумайте другой' });
    return typed;
  }

  const base = typed || slugify(String(item[collection.titleField] ?? '')).slice(0, 48).replace(/-+$/, '') || collection.name;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

export function createContent(store: Store) {
  // Загружаем разделы, на которые ссылается раздел, — для проверки выбора из списка
  async function lookupFor(collection: Collection): Promise<Lookup> {
    const names = [...new Set(referencedCollections(collection.fields))];
    const loaded = new Map(await Promise.all(names.map(async (name) => [name, await store.read(name)] as const)));
    return (name) => loaded.get(name);
  }

  function checked(collection: Collection, input: unknown, lookup: Lookup) {
    const { item, errors } = validateItem(collection, input, lookup);
    if (hasErrors(errors)) throw new HttpError(422, 'Проверьте поля формы', errors);
    return item;
  }

  async function create(name: CollectionName, input: unknown) {
    const collection = collections[name];
    const lookup = await lookupFor(collection);
    return store.update(name, (items) => {
      const item = checked(collection, input, lookup);
      const id = makeId(collection, item, items);
      // Номер — первым полем записи (так удобнее читать файл), и он же заменяет пустой адрес из формы
      const saved = { [collection.idField]: id, ...item, [collection.idField]: id };
      return { items: collection.newFirst ? [saved, ...items] : [...items, saved], result: saved };
    });
  }

  async function update(name: CollectionName, id: string, input: unknown) {
    const collection = collections[name];
    const lookup = await lookupFor(collection);
    return store.update(name, (items) => {
      const index = items.findIndex((x) => idOf(collection, x) === id);
      if (index === -1) throw new HttpError(404, 'Запись не найдена — возможно, её уже удалили');
      const currentId = items[index][collection.idField];
      // Номер и адрес записи не меняются: на них ссылаются страницы сайта и другие разделы
      const item = checked(collection, { ...(input as Item), [collection.idField]: currentId }, lookup);
      const saved = { [collection.idField]: currentId, ...item };
      const next = [...items];
      next[index] = saved;
      return { items: next, result: saved };
    });
  }

  async function remove(name: CollectionName, id: string) {
    const collection = collections[name];
    // Нельзя удалить направление, к которому относятся программы: они остались бы «ничьими»
    for (const other of collectionList) {
      const fields = other.fields.filter((f) => f.type === 'reference' && f.collection === name);
      if (fields.length === 0) continue;
      const count = (await store.read(other.name)).filter((x) => fields.some((f) => String(x[f.name]) === id)).length;
      if (count > 0) {
        throw new HttpError(
          409,
          `Нельзя удалить: с этой записью ${plural(count, ['связана', 'связаны', 'связаны'])} ${count} ${plural(count, ['запись', 'записи', 'записей'])} в разделе «${other.label}». Сначала перенесите их в другое место или удалите.`,
        );
      }
    }
    return store.update(name, (items) => {
      const next = items.filter((x) => idOf(collection, x) !== id);
      if (next.length === items.length) throw new HttpError(404, 'Запись не найдена — возможно, её уже удалили');
      return { items: next, result: { ok: true } };
    });
  }

  async function reorder(name: CollectionName, order: unknown) {
    const collection = collections[name];
    if (!collection.ordered) throw new HttpError(400, 'В этом разделе порядок задаётся автоматически');
    if (!Array.isArray(order)) throw new HttpError(400, 'Неверный порядок');
    return store.update(name, (items) => {
      const byId = new Map(items.map((x) => [idOf(collection, x), x]));
      const ids = order.map(String);
      if (ids.length !== items.length || new Set(ids).size !== ids.length || ids.some((id) => !byId.has(id))) {
        throw new HttpError(409, 'Список успел измениться. Обновите страницу и попробуйте ещё раз.');
      }
      return { items: ids.map((id) => byId.get(id)!), result: { ok: true } };
    });
  }

  return { create, update, remove, reorder };
}
