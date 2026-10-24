import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, ExternalLink, Loader2, Minus, Plus, Search } from 'lucide-react';
import { freeSeats, isEnrollable, openGroups } from '../lib/enroll';
import { cn } from '../lib/cn';
import { ageRange, plural } from '../lib/format';
import { formatSlots } from '../lib/schedule';
import type { Group } from '../lib/schedule';
import { ApiError } from './api';
import type { Item } from './schema';
import { saveItem, useCollection, useCollections } from './store';
import { Btn, inputClass, Notice, PageHeading, Spinner, Switch, useToast } from './ui';

const normalize = (text: string) => text.toLowerCase().replace(/ё/g, 'е');
const groupsOf = (direction: Item) => (Array.isArray(direction.groups) ? (direction.groups as Group[]) : []);
const seatsOf = (groups: Group[]) => Object.fromEntries(groups.map((g) => [g.id, String(g.seats)]));

/**
 * Запись на обучение: у направления — переключатель «Запись открыта», у каждой его группы — число
 * свободных мест. Изменения сохраняются сами. На сайте (в «Вакантных местах» и в форме записи)
 * появляются только группы со свободными местами у направлений с открытой записью.
 */
export function EnrollmentPage() {
  const { items, error } = useCollection('directions');
  const ctx = useCollections(['categories']);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);

  const all = items ?? [];
  const open = all.filter(isEnrollable);
  const seatsTotal = open.reduce((sum, d) => sum + freeSeats(d), 0);
  const groupsTotal = open.reduce((sum, d) => sum + openGroups(d as { enrollOpen?: unknown; groups?: Group[] }).length, 0);
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = all.filter((d) => {
    if (category && d.category !== category) return false;
    if (onlyOpen && d.enrollOpen !== true) return false;
    const text = normalize(`${String(d.title)} ${String(d.teacher)}`);
    return words.every((w) => text.includes(w));
  });

  const categories = ctx.get('categories');
  const known = new Set(categories.map((c) => c.slug));
  const groups = [
    ...categories.map((c) => ({ key: String(c.slug), title: String(c.title), items: visible.filter((d) => d.category === c.slug) })),
    { key: 'other', title: 'Без категории', items: visible.filter((d) => !known.has(d.category)) },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeading
        title="Запись и свободные места"
        description="Включите запись у направления и укажите, сколько мест свободно в каждой группе. В «Вакантных местах» и в форме записи появятся только группы, в которые нужны ученики. Изменения сохраняются сами."
        actions={
          <Btn href="/vacancies" icon={ExternalLink}>
            Вакантные места на сайте
          </Btn>
        }
      />

      {items && (
        <p className="mb-6 rounded-card bg-white p-5 text-lg">
          {open.length > 0 ? (
            <>
              Набор идёт в <b>{groupsTotal}</b> {plural(groupsTotal, ['группу', 'группы', 'групп'])} на {open.length}{' '}
              {plural(open.length, ['направлении', 'направлениях', 'направлениях'])}, свободно <b>{seatsTotal}</b> {plural(seatsTotal, ['место', 'места', 'мест'])}.
            </>
          ) : (
            'Сейчас набора нет ни в одну группу — записаться через сайт нельзя.'
          )}
        </p>
      )}

      {error && (
        <div className="mb-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Поиск по направлениям</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название или педагог…" className={cn(inputClass, 'pl-11')} />
        </label>
        <label className="sm:w-60">
          <span className="sr-only">Категория</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={String(c.slug)} value={String(c.slug)}>
                {String(c.title)}
              </option>
            ))}
          </select>
        </label>
        <Switch checked={onlyOpen} onChange={setOnlyOpen} onLabel="Только открытые" offLabel="Только открытые" />
      </div>

      {!items && !error && <Spinner />}
      {items && groups.length === 0 && <p className="rounded-card bg-white p-8 text-center text-muted">Ничего не нашлось.</p>}

      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`group-${group.key}`} className="rounded-card bg-white p-5 sm:p-6">
            <h2 id={`group-${group.key}`} className="font-display text-lg font-semibold">
              {group.title}
            </h2>
            <ul className="mt-2 divide-y divide-line">
              {group.items.map((direction) => (
                <EnrollmentRow key={String(direction.id)} direction={direction} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function EnrollmentRow({ direction }: { direction: Item }) {
  const toast = useToast();
  const id = String(direction.id);
  const groups = groupsOf(direction);
  const [open, setOpen] = useState(direction.enrollOpen === true);
  // Места по группам — строками, пока человек печатает
  const [seats, setSeats] = useState<Record<string, string>>(() => seatsOf(groups));
  const [state, setState] = useState<SaveState>('idle');
  const timer = useRef<number | undefined>(undefined);
  // Есть правки, которые ещё сохраняются, — свежие данные с сервера их не перезапишут
  const busy = useRef(false);

  // Места могли поменяться не здесь (например, вычли по заявке) — показываем свежие значения
  useEffect(() => {
    if (busy.current) return;
    setOpen(direction.enrollOpen === true);
    setSeats(seatsOf(groupsOf(direction)));
  }, [direction]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function save(nextOpen: boolean, nextSeats: Record<string, string>) {
    window.clearTimeout(timer.current);
    const changed = groups.map((g) => {
      const raw = (nextSeats[g.id] ?? '').trim();
      return { ...g, seats: raw === '' ? 0 : Number(raw) };
    });
    if (changed.some((g) => !Number.isInteger(g.seats) || g.seats < 0 || g.seats > 100)) {
      busy.current = false;
      setState('error');
      return;
    }
    busy.current = true;
    setState('saving');
    try {
      await saveItem('directions', id, { ...direction, enrollOpen: nextOpen, groups: changed });
      setState('saved');
    } catch (error) {
      setState('error');
      toast({ tone: 'error', text: `«${String(direction.title)}»: ${error instanceof ApiError ? error.message : 'не удалось сохранить'}` });
    } finally {
      busy.current = false;
    }
  }

  // Число мест сохраняем, когда человек перестал печатать
  function changeSeats(groupId: string, value: string) {
    const next = { ...seats, [groupId]: value };
    setSeats(next);
    setState('idle');
    busy.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void save(open, next), 700);
  }

  const step = (groupId: string, delta: number) => {
    const next = { ...seats, [groupId]: String(Math.min(100, Math.max(0, (Number(seats[groupId]) || 0) + delta))) };
    setSeats(next);
    void save(open, next);
  };

  const anySeats = groups.some((g) => (Number(seats[g.id]) || 0) > 0);

  return (
    <li className="py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">
          <Link to={`/admin/directions/${encodeURIComponent(id)}`} className="font-semibold leading-snug hover:underline">
            {String(direction.title)}
          </Link>
          <p className="mt-0.5 text-sm text-muted">
            {[String(direction.level), typeof direction.ageFrom === 'number' && typeof direction.ageTo === 'number' && ageRange(direction.ageFrom, direction.ageTo), String(direction.teacher)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Switch
            checked={open}
            onChange={(next) => {
              setOpen(next);
              void save(next, seats);
            }}
            onLabel="Запись открыта"
            offLabel="Запись закрыта"
          />
          <SaveStatus state={state} />
        </div>
      </div>

      {/* Группы показываем, только когда запись открыта: так длинный список остаётся коротким */}
      {open &&
        (groups.length === 0 ? (
          <p className="mt-3 flex items-start gap-1.5 rounded-2xl bg-surface p-4 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              У направления пока нет групп.{' '}
              <Link to={`/admin/schedule?edit=${encodeURIComponent(id)}`} className="font-semibold underline underline-offset-4">
                Добавьте группы в расписании
              </Link>{' '}
              — и здесь можно будет указать свободные места.
            </span>
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-2 rounded-2xl bg-surface p-2 sm:p-3">
              {groups.map((group) => {
                const value = seats[group.id] ?? '';
                const number = Number(value) || 0;
                const inputId = `seats-${id}-${group.id}`;
                return (
                  <li key={group.id} className="flex flex-col gap-2 rounded-xl bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {group.name}
                        {number > 0 && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold">идёт набор</span>}
                      </p>
                      <p className="text-sm tabular-nums text-muted">{formatSlots(group.lessons) || 'Дни и время не указаны'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor={inputId} className="text-sm text-muted">
                        Свободных мест
                      </label>
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          type="button"
                          onClick={() => step(group.id, -1)}
                          disabled={number <= 0}
                          className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface disabled:opacity-30"
                          aria-label={`${group.name}: минус одно место`}
                        >
                          <Minus size={16} aria-hidden="true" />
                        </button>
                        <input
                          id={inputId}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={100}
                          value={value}
                          onChange={(e) => changeSeats(group.id, e.target.value)}
                          className="w-12 border-0 bg-transparent text-center font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => step(group.id, 1)}
                          className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
                          aria-label={`${group.name}: плюс одно место`}
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {!anySeats && state !== 'saving' && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#B42318]">
                <AlertCircle size={15} aria-hidden="true" />
                Укажите свободные места хотя бы в одной группе — иначе записаться нельзя
              </p>
            )}
          </>
        ))}
    </li>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  return (
    <span className="inline-flex w-28 items-center gap-1.5 text-sm text-muted" role="status">
      {state === 'saving' && (
        <>
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          Сохраняем…
        </>
      )}
      {state === 'saved' && (
        <>
          <Check size={15} className="text-accent-hover" aria-hidden="true" />
          Сохранено
        </>
      )}
      {state === 'error' && <span className="font-medium text-[#B42318]">Не сохранилось</span>}
    </span>
  );
}
