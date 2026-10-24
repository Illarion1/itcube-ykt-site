/**
 * Данные разделов внутри админ-панели. Каждый раздел загружается с сервера при открытии
 * страницы, а после сохранения обновляется сразу, без повторной загрузки.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { invalidate } from '../api';
import { adminApi } from './api';
import { collections } from './schema';
import type { CollectionName, Item } from './schema';

type Entry = { items: Item[] | null; error: string | null };

/** Доступ к записям других разделов — для выбора направления, подсказок ФИО и т.п. */
export type Ctx = { get: (name: CollectionName) => Item[] };

const EMPTY: Entry = { items: null, error: null };
const entries = new Map<CollectionName, Entry>();
const pending = new Map<CollectionName, Promise<void>>();
const listeners = new Set<() => void>();
// Номер изменения: растёт при любом обновлении данных
let version = 0;

function set(name: CollectionName, entry: Entry) {
  entries.set(name, entry);
  version++;
  // Публичная часть сайта (если открыта в этой же вкладке) тоже должна увидеть свежие данные
  invalidate(name);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Загрузить раздел с сервера заново */
export function refresh(name: CollectionName) {
  let promise = pending.get(name);
  if (!promise) {
    promise = fetch(`/data/${name}.json`, { cache: 'no-cache' })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        set(name, { items: (await res.json()) as Item[], error: null });
      })
      .catch(() => {
        set(name, { items: entries.get(name)?.items ?? null, error: 'Не удалось загрузить данные. Обновите страницу.' });
      })
      .finally(() => pending.delete(name));
    pending.set(name, promise);
  }
  return promise;
}

/** Записи раздела. При каждом открытии страницы данные уточняются у сервера */
export function useCollection(name: CollectionName): Entry {
  const entry = useSyncExternalStore(subscribe, () => entries.get(name) ?? EMPTY);
  useEffect(() => {
    void refresh(name);
  }, [name]);
  return entry;
}

/** Записи нескольких разделов сразу — для подписей в списках, выбора из списка и предпросмотра */
export function useCollections(names: CollectionName[]): Ctx {
  useSyncExternalStore(subscribe, () => version);
  const key = names.join(',');
  useEffect(() => {
    if (!key) return;
    key.split(',').forEach((name) => void refresh(name as CollectionName));
  }, [key]);
  return { get: (name) => entries.get(name)?.items ?? [] };
}

const keyOf = (name: CollectionName, item: Item) => String(item[collections[name].idField]);

/** Сохранить запись: id = null — новая запись. Возвращает запись в том виде, как её сохранил сервер */
export async function saveItem(name: CollectionName, id: string | null, values: Item): Promise<Item> {
  const { item } = id === null ? await adminApi.create(name, values) : await adminApi.update(name, id, values);
  const current = entries.get(name)?.items ?? [];
  const key = keyOf(name, item);
  const next = current.some((x) => keyOf(name, x) === key)
    ? current.map((x) => (keyOf(name, x) === key ? item : x))
    : collections[name].newFirst
      ? [item, ...current]
      : [...current, item];
  set(name, { items: next, error: null });
  return item;
}

/** Запись изменилась не через форму (например, вычли место по заявке) — обновляем её в списке */
export function replaceItem(name: CollectionName, item: Item) {
  const current = entries.get(name)?.items;
  if (!current) return;
  const key = keyOf(name, item);
  set(name, { items: current.map((x) => (keyOf(name, x) === key ? item : x)), error: null });
}

export async function deleteItem(name: CollectionName, id: string) {
  await adminApi.remove(name, id);
  set(name, { items: (entries.get(name)?.items ?? []).filter((x) => keyOf(name, x) !== id), error: null });
}

/** Новый порядок записей. Список меняется сразу, а если сервер не согласится — загрузится заново */
export async function reorderItems(name: CollectionName, items: Item[]) {
  set(name, { items, error: null });
  try {
    await adminApi.reorder(name, items.map((x) => keyOf(name, x)));
  } catch (error) {
    void refresh(name);
    throw error;
  }
}
