import { useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronRight, GripVertical, Plus, Search } from 'lucide-react';
import { cn } from '../lib/cn';
import { plural } from '../lib/format';
import { ApiError } from './api';
import { collections, isCollectionName } from './schema';
import type { CollectionName, Item } from './schema';
import { reorderItems, useCollection, useCollections } from './store';
import { Btn, inputClass, Notice, PageHeading, Spinner, useToast } from './ui';
import { views } from './views';

const PAGE_SIZE = 40;

// Поиск без учёта регистра; «ё» и «е» — одна буква
const normalize = (text: string) => text.toLowerCase().replace(/ё/g, 'е');

// Все тексты записи одной строкой — по ней ищем
function searchText(item: Item): string {
  return normalize(
    Object.values(item)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === 'string')
      .join(' '),
  );
}

export function ListPage() {
  const { collection = '' } = useParams();
  if (!isCollectionName(collection)) return <Notice tone="error">Такого раздела нет.</Notice>;
  return <CollectionList key={collection} name={collection} />;
}

function CollectionList({ name }: { name: CollectionName }) {
  const collection = collections[name];
  const view = views[name];
  const toast = useToast();
  const { items, error } = useCollection(name);
  const ctx = useCollections(view.uses ?? []);

  const [query, setQuery] = useState('');
  // Значения фильтров по порядку: '' — «все»
  const [filterValues, setFilterValues] = useState<string[]>(() => (view.filters ?? []).map(() => ''));
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [dragged, setDragged] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const keyOf = (item: Item) => String(item[collection.idField]);

  // Новости — от новых к старым, в остальных разделах порядок задают вручную
  const all = useMemo(
    () => (collection.ordered ? (items ?? []) : [...(items ?? [])].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))),
    [items, collection.ordered],
  );
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = all.filter((item) => {
    if ((view.filters ?? []).some((f, i) => filterValues[i] && f.valueOf(item) !== filterValues[i])) return false;
    if (words.length === 0) return true;
    const text = searchText(item);
    return words.every((w) => text.includes(w));
  });
  // Порядок меняем только когда не идёт поиск — иначе непонятно, куда встанет запись
  const canReorder = collection.ordered && words.length === 0;

  async function move(fromKey: string, toKey: string) {
    if (fromKey === toKey) return;
    const next = [...all];
    const from = next.findIndex((x) => keyOf(x) === fromKey);
    const to = next.findIndex((x) => keyOf(x) === toKey);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    try {
      await reorderItems(name, next);
    } catch (err) {
      toast({ tone: 'error', text: err instanceof ApiError ? err.message : 'Не удалось сохранить порядок' });
    }
  }

  const dragHandlers = (item: Item) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      setDragged(keyOf(item));
    },
    onDragOver: (e: DragEvent) => {
      if (!dragged) return;
      e.preventDefault();
      setDropTarget(keyOf(item));
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (dragged) void move(dragged, keyOf(item));
      setDragged(null);
      setDropTarget(null);
    },
    onDragEnd: () => {
      setDragged(null);
      setDropTarget(null);
    },
  });

  return (
    <>
      <PageHeading
        title={collection.label}
        description={
          items &&
          (collection.ordered
            ? `${items.length} ${plural(items.length, view.forms)}. Порядок здесь — порядок на сайте: перетащите строку или нажмите стрелки.`
            : `${items.length} ${plural(items.length, view.forms)}. На сайте — от новых к старым.`)
        }
        actions={
          <Btn to={`/admin/${name}/new`} variant="primary" icon={Plus}>
            Добавить {collection.one}
          </Btn>
        }
      />

      {error && (
        <div className="mb-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Поиск</span>
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE_SIZE);
              }}
              placeholder="Найти по названию или тексту…"
              className={cn(inputClass, 'pl-11')}
            />
          </label>
          {(view.filters ?? []).map((f, i) => (
            <label key={f.label} className="sm:w-56">
              <span className="sr-only">Фильтр: {f.label}</span>
              <select
                value={filterValues[i]}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterValues((prev) => prev.map((v, j) => (j === i ? value : v)));
                  setLimit(PAGE_SIZE);
                }}
                className={inputClass}
              >
                <option value="">{f.label}</option>
                {f.options(all, ctx).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      {!items && !error && <Spinner />}

      {items && items.length === 0 && (
        <div className="rounded-card bg-white p-10 text-center">
          <p className="font-semibold">Здесь пока ничего нет</p>
          <p className="mt-1 text-muted">Нажмите «Добавить {collection.one}», чтобы создать первую запись.</p>
        </div>
      )}

      {items && items.length > 0 && visible.length === 0 && (
        <p className="rounded-card bg-white p-8 text-center text-muted">Ничего не нашлось. Попробуйте другое слово или сбросьте фильтр.</p>
      )}

      {visible.length > 0 && (
        <ul className="overflow-hidden rounded-card bg-white">
          {visible.slice(0, limit).map((item, index) => {
            const key = keyOf(item);
            const { title, meta, thumb, badge } = view.row(item, ctx);
            return (
              <li
                key={key}
                {...(canReorder ? dragHandlers(item) : {})}
                className={cn(
                  'flex items-center gap-1 border-b border-line pr-2 last:border-b-0 sm:gap-2 sm:pr-3',
                  dragged === key && 'opacity-40',
                  dropTarget === key && dragged !== key && 'bg-accent-soft',
                )}
              >
                {canReorder && (
                  <span className="hidden cursor-grab pl-3 text-muted active:cursor-grabbing sm:block" title="Перетащите, чтобы поменять порядок" aria-hidden="true">
                    <GripVertical size={18} />
                  </span>
                )}
                {/* draggable={false}: строку перетаскивают целиком, а не как ссылку */}
                <Link
                  to={`/admin/${name}/${encodeURIComponent(key)}`}
                  draggable={false}
                  className="group flex min-w-0 flex-1 items-center gap-4 py-3 pl-4 sm:pl-2"
                >
                  {thumb}
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug group-hover:underline">{title || 'Без названия'}</span>
                    {meta && <span className="mt-0.5 block truncate text-sm text-muted">{meta}</span>}
                    {badge && <span className="mt-1.5 block sm:hidden">{badge}</span>}
                  </span>
                  {badge && <span className="hidden shrink-0 sm:block">{badge}</span>}
                </Link>
                {canReorder && (
                  <span className="flex shrink-0">
                    <Btn
                      size="sm"
                      variant="ghost"
                      icon={ArrowUp}
                      disabled={index === 0}
                      onClick={() => void move(key, keyOf(visible[index - 1]))}
                      aria-label={`«${title}»: выше`}
                    />
                    <Btn
                      size="sm"
                      variant="ghost"
                      icon={ArrowDown}
                      disabled={index === visible.length - 1}
                      onClick={() => void move(key, keyOf(visible[index + 1]))}
                      aria-label={`«${title}»: ниже`}
                    />
                  </span>
                )}
                <ChevronRight size={18} className="hidden shrink-0 text-muted sm:block" aria-hidden="true" />
              </li>
            );
          })}
        </ul>
      )}

      {visible.length > limit && (
        <div className="mt-4 text-center">
          <Btn onClick={() => setLimit((l) => l + PAGE_SIZE)}>Показать ещё ({visible.length - limit})</Btn>
        </div>
      )}
    </>
  );
}
