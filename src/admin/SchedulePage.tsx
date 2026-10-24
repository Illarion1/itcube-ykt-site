import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, Pencil, Save, Search } from 'lucide-react';
import { ScheduleList } from '../components/ui/ScheduleList';
import { cn } from '../lib/cn';
import { ageRange } from '../lib/format';
import type { Group } from '../lib/schedule';
import { ApiError } from './api';
import { focusFirstError, widthClass } from './EditPage';
import { FieldInput } from './fields';
import { toFormValues } from './form';
import { useCanLeave, useLeaveGuard } from './guard';
import { collections, validateItem } from './schema';
import type { FieldErrors, Item } from './schema';
import { saveItem, useCollection, useCollections } from './store';
import type { Ctx } from './store';
import { Btn, inputClass, Notice, PageHeading, Spinner, Switch, useToast } from './ui';

const normalize = (text: string) => text.toLowerCase().replace(/ё/g, 'е');
const groupsOf = (direction: Item) => (Array.isArray(direction.groups) ? (direction.groups as Group[]) : []);
// Расписание указано: хотя бы у одной группы есть дни занятий
const hasSchedule = (direction: Item) => groupsOf(direction).some((g) => g.lessons.length > 0);

// Поля направления, которые меняются на этой странице
const fields = collections.directions.fields.filter((f) => ['groups', 'room', 'scheduleNote'].includes(f.name));
const isOwnError = (key: string) => fields.some((f) => key === f.name || key.startsWith(`${f.name}.`));

/**
 * Группы и расписание занятий всех направлений на одной странице: сразу видно, где расписание не указано,
 * и его можно поправить здесь же, не открывая всю карточку направления.
 * Ссылка /admin/schedule?edit=<направление> сразу открывает правку нужного направления.
 * На сайте расписание видно на страницах «Расписание занятий» и «Вакантные места».
 */
export function SchedulePage() {
  const { items, error } = useCollection('directions');
  const ctx = useCollections(['categories']);
  const canLeave = useCanLeave();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  // Направление, расписание которого сейчас правят (одновременно — только одно)
  const [editing, setEditing] = useState<string | null>(() => params.get('edit'));

  // Открыли по ссылке «добавьте группы» — прокручиваем к нужному направлению, когда список загрузится
  const loaded = items !== null;
  useEffect(() => {
    const id = params.get('edit');
    if (loaded && id) document.getElementById(`schedule-${id}`)?.scrollIntoView({ block: 'start' });
  }, [loaded, params]);

  const all = items ?? [];
  const filled = all.filter(hasSchedule).length;
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = all.filter((d) => {
    if (category && d.category !== category) return false;
    // Направление, которое сейчас правят, не прячем, даже если у него уже появилось расписание
    if (onlyEmpty && hasSchedule(d) && d.id !== editing) return false;
    const text = normalize(`${String(d.title)} ${String(d.teacher)} ${String(d.room ?? '')}`);
    return words.every((w) => text.includes(w));
  });

  const categories = ctx.get('categories');
  const known = new Set(categories.map((c) => c.slug));
  const groups = [
    ...categories.map((c) => ({ key: String(c.slug), title: String(c.title), items: visible.filter((d) => d.category === c.slug) })),
    { key: 'other', title: 'Без категории', items: visible.filter((d) => !known.has(d.category)) },
  ].filter((g) => g.items.length > 0);

  // Перед переходом к другому направлению спрашиваем, если остались несохранённые правки
  const edit = (id: string | null) => void canLeave().then((ok) => ok && setEditing(id));

  return (
    <>
      <PageHeading
        title="Расписание занятий"
        description="Группы каждого направления: дни и время занятий и свободные места. Нажмите «Изменить», поправьте и сохраните — на сайте всё обновится сразу."
        actions={
          <Btn href="/schedule" icon={ExternalLink}>
            Расписание на сайте
          </Btn>
        }
      />

      {items && (
        <p className="mb-6 rounded-card bg-white p-5 text-lg">
          Расписание указано у <b>{filled}</b> из {all.length} направлений.
          {filled < all.length && (
            <span className="mt-1 block text-base text-muted">Направления без расписания на сайте собраны в список «Расписание уточняется».</span>
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
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название, педагог или кабинет…" className={cn(inputClass, 'pl-11')} />
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
        <Switch checked={onlyEmpty} onChange={setOnlyEmpty} onLabel="Только без расписания" offLabel="Только без расписания" />
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
              {group.items.map((direction) => {
                const id = String(direction.id);
                return (
                  <ScheduleRow
                    key={id}
                    direction={direction}
                    ctx={ctx}
                    editing={editing === id}
                    onEdit={() => edit(id)}
                    onClose={() => setEditing(null)}
                  />
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

type RowProps = { direction: Item; ctx: Ctx; editing: boolean; onEdit: () => void; onClose: () => void };

function ScheduleRow({ direction, ctx, editing, onEdit, onClose }: RowProps) {
  const groups = groupsOf(direction);
  const place = [direction.room, direction.scheduleNote].filter(Boolean).join(' · ');

  return (
    <li id={`schedule-${String(direction.id)}`} className="scroll-mt-6 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link to={`/admin/directions/${encodeURIComponent(String(direction.id))}`} className="font-semibold leading-snug hover:underline">
            {String(direction.title)}
          </Link>
          <p className="mt-0.5 text-sm text-muted">
            {[
              String(direction.level),
              typeof direction.ageFrom === 'number' && typeof direction.ageTo === 'number' && ageRange(direction.ageFrom, direction.ageTo),
              String(direction.teacher),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {!editing &&
            (groups.length > 0 ? (
              <>
                <ScheduleList groups={groups} vacancies={direction.enrollOpen === true} className="mt-3" />
                {place && <p className="mt-1.5 text-sm text-muted">{place}</p>}
              </>
            ) : (
              <p className="mt-2 text-sm font-medium text-muted">Групп и расписания пока нет</p>
            ))}
        </div>
        {!editing && (
          <Btn size="sm" icon={Pencil} onClick={onEdit}>
            {groups.length > 0 ? 'Изменить' : 'Добавить группы'}
          </Btn>
        )}
      </div>
      {editing && <ScheduleEditor direction={direction} ctx={ctx} onClose={onClose} />}
    </li>
  );
}

/** Правка расписания одного направления: занятия, где проходят, примечание */
function ScheduleEditor({ direction, ctx, onClose }: { direction: Item; ctx: Ctx; onClose: () => void }) {
  const toast = useToast();
  const [values, setValues] = useState(() => toFormValues(fields, direction));
  const [snapshot] = useState(() => JSON.stringify(values));
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(values) !== snapshot;
  useLeaveGuard(dirty);

  // Проверяем направление целиком, но показываем только ошибки полей расписания
  const check = validateItem(collections.directions, { ...direction, ...values });
  const ownErrors = Object.fromEntries(Object.entries(check.errors).filter(([key]) => isOwnError(key)));
  const errors = submitted ? { ...ownErrors, ...serverErrors } : serverErrors;

  function change(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setServerErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== name && !key.startsWith(`${name}.`))));
  }

  async function save() {
    if (saving) return;
    setSubmitted(true);
    if (Object.keys(ownErrors).length > 0) {
      focusFirstError(ownErrors);
      toast({ tone: 'error', text: 'Проверьте строки расписания, выделенные красным.' });
      return;
    }
    setSaving(true);
    try {
      await saveItem('directions', String(direction.id), { ...direction, ...values });
      toast({ tone: 'success', text: `Расписание «${String(direction.title)}» сохранено и уже на сайте.`, action: { label: 'Посмотреть на сайте', href: '/schedule' } });
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerErrors(err.fields);
        if (Object.keys(err.fields).length > 0) focusFirstError(err.fields);
        toast({ tone: 'error', text: err.message });
      } else {
        toast({ tone: 'error', text: 'Не удалось сохранить. Попробуйте ещё раз.' });
      }
      setSaving(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="mt-4 rounded-2xl border border-ink/15 p-4 sm:p-5"
    >
      <div className="grid grid-cols-6 gap-x-4 gap-y-6">
        {fields.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(value) => change(field.name, value)}
            errors={errors}
            path={field.name}
            ctx={ctx}
            isNew={false}
            className={widthClass(field)}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Btn type="submit" variant="primary" icon={Save} loading={saving}>
          Сохранить расписание
        </Btn>
        <Btn variant="ghost" onClick={onClose}>
          Отмена
        </Btn>
      </div>
    </form>
  );
}
