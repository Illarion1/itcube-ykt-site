/**
 * Поля формы админ-панели. FieldInput по описанию поля из schema.ts выбирает,
 * что показать: строку, большое текстовое поле, выбор из списка, загрузку фото и т.д.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { categoryIcons } from '../components/ui/CategoryIcon';
import { cn } from '../lib/cn';
import { days, newGroupId } from '../lib/schedule';
import { newRow, rowKey } from './form';
import { FileInput, GalleryInput, ImageInput } from './media';
import { collections, slugify } from './schema';
import type { CollectionName, Field, FieldErrors, Item, Option } from './schema';
import type { Ctx } from './store';
import { Btn, describedBy, FieldShell, inputClass, Switch, useConfirm } from './ui';

type Props = {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  // Все ошибки формы: полям списка нужны ошибки их строк (items.2.title)
  errors: FieldErrors;
  // Имя поля с учётом списка: 'title' или 'items.2.title'
  path: string;
  ctx: Ctx;
  isNew: boolean;
  className?: string;
};

export const fieldId = (path: string) => `f-${path.replace(/\./g, '-')}`;

const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** Поле формы целиком: название, пояснение, само поле, ошибка */
export function FieldInput({ field, value, onChange, errors, path, ctx, isNew, className }: Props) {
  if (field.type === 'hidden' || (field.type === 'slug' && field.hidden)) return null;

  const id = fieldId(path);
  const error = errors[path];
  const common = { id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy(id, field.hint, error) };
  const group = field.type === 'radio' || field.type === 'icon' || field.type === 'list' || field.type === 'images' || field.type === 'groups';
  let input;

  switch (field.type) {
    case 'boolean':
      input = (
        <Switch
          id={id}
          checked={value === true}
          onChange={onChange}
          onLabel={field.onLabel}
          offLabel={field.offLabel}
          describedby={common['aria-describedby']}
        />
      );
      break;

    case 'text': {
      const suggestions = field.suggest ? suggestionsFor(ctx, field.suggest.collection, field.suggest.field) : [];
      input = (
        <>
          <input
            {...common}
            type="text"
            value={text(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.max ? field.max + 50 : undefined}
            list={suggestions.length > 0 ? `${id}-list` : undefined}
            className={inputClass}
          />
          {suggestions.length > 0 && (
            <datalist id={`${id}-list`}>
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
          <Counter value={text(value)} max={field.max} />
        </>
      );
      break;
    }

    case 'textarea':
      input = (
        <>
          <AutoTextarea {...common} value={text(value)} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} minRows={field.rows ?? 4} />
          <Counter value={text(value)} max={field.max} />
        </>
      );
      break;

    case 'paragraphs':
      input = <AutoTextarea {...common} value={text(value)} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} minRows={8} />;
      break;

    case 'number':
      input = (
        <input
          {...common}
          type="number"
          inputMode="decimal"
          min={field.min}
          max={field.max}
          step={field.integer ? 1 : 0.5}
          value={text(value)}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, 'max-w-[10rem]')}
        />
      );
      break;

    case 'select':
    case 'reference': {
      let options: Option[] = [];
      if (field.type === 'reference') {
        const target = collections[field.collection];
        options = ctx.get(field.collection).map((item) => ({ value: String(item[target.idField]), label: String(item[target.titleField] ?? '') }));
      } else {
        options = field.options;
      }
      input = (
        <select {...common} value={text(value)} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, 'pr-10')}>
          <option value="">— выберите —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    }

    case 'radio':
      input = (
        <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={common['aria-describedby']} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {field.options.map((option) => {
            const checked = value === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                  checked ? 'border-ink bg-surface font-semibold' : 'border-line hover:border-ink/30',
                )}
              >
                <input type="radio" name={id} value={option.value} checked={checked} onChange={() => onChange(option.value)} className="h-4 w-4 accent-ink" />
                {option.label}
              </label>
            );
          })}
        </div>
      );
      break;

    case 'tags':
      input = (
        <TagsInput
          id={id}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          suggestions={field.suggest ? suggestionsFor(ctx, field.suggest.collection, field.suggest.field) : []}
          placeholder={field.placeholder}
          describedby={common['aria-describedby']}
        />
      );
      break;

    case 'date': {
      // Дата хранится вместе со временем по Якутску: '2026-06-01T18:30:49+09:00'. В форме меняем только дату
      const iso = text(value);
      input = (
        <input
          {...common}
          type="date"
          value={iso.slice(0, 10)}
          onChange={(e) => e.target.value && onChange(`${e.target.value}${iso.slice(10) || 'T12:00:00+09:00'}`)}
          className={cn(inputClass, 'max-w-[14rem]')}
        />
      );
      break;
    }

    case 'url':
      input = (
        <input
          {...common}
          type="url"
          inputMode="url"
          value={text(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      );
      break;

    case 'icon':
      input = (
        <div role="radiogroup" aria-labelledby={`${id}-label`} className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2">
          {categoryIcons.map(({ name, label, Icon }) => {
            const checked = value === name;
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={checked}
                title={label}
                aria-label={label}
                onClick={() => onChange(name)}
                className={cn(
                  'grid aspect-square place-items-center rounded-xl border transition-colors',
                  checked ? 'border-ink bg-accent' : 'border-line bg-white hover:border-ink/30',
                )}
              >
                <Icon size={22} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      );
      break;

    case 'slug':
      input = isNew ? (
        <div className="flex items-center overflow-hidden rounded-xl border border-line bg-white focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/10">
          {field.prefix && <span className="shrink-0 pl-4 text-muted">{field.prefix}</span>}
          <input
            {...common}
            type="text"
            value={text(value)}
            // Пока человек печатает, переводим в латиницу, но дефис в конце оставляем
            onChange={(e) => onChange(slugify(e.target.value) + (/[-\s]$/.test(e.target.value) ? '-' : ''))}
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-0.5 pr-4 outline-none"
          />
        </div>
      ) : (
        <p id={id} className="rounded-xl bg-surface px-4 py-2.5 text-muted">
          {field.prefix}
          <span className="font-semibold text-ink">{text(value)}</span>
        </p>
      );
      break;

    case 'image':
      input = <ImageInput id={id} value={text(value)} onChange={onChange} hint={field.hint} error={error} aspect={field.aspect} />;
      break;

    case 'images':
      input = <GalleryInput id={id} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} hint={field.hint} error={error} />;
      break;

    case 'file':
      input = <FileInput id={id} value={text(value)} onChange={onChange} hint={field.hint} error={error} />;
      break;

    case 'list':
      input = <ListInput field={field} rows={Array.isArray(value) ? (value as Item[]) : []} onChange={onChange} errors={errors} path={path} ctx={ctx} isNew={isNew} />;
      break;

    case 'groups':
      input = <GroupsInput groups={Array.isArray(value) ? (value as Item[]) : []} onChange={onChange} errors={errors} path={path} />;
      break;
  }

  return (
    <FieldShell id={id} label={field.label} required={field.required} hint={field.hint} error={error} group={group} className={className}>
      {input}
    </FieldShell>
  );
}

// Уникальные непустые значения поля другого раздела — для подсказок при вводе
function suggestionsFor(ctx: Ctx, collection: CollectionName, field: string) {
  return [...new Set(ctx.get(collection).map((item) => String(item[field] ?? '').trim()))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ru'));
}

// Счётчик символов появляется, когда текст подходит к пределу
function Counter({ value, max }: { value: string; max?: number }) {
  if (!max || value.length < max * 0.8) return null;
  return <p className={cn('mt-1 text-right text-xs', value.length > max ? 'font-semibold text-[#B42318]' : 'text-muted')}>{`${value.length} / ${max}`}</p>;
}

/** Текстовое поле, которое растёт вместе с текстом — не нужно прокручивать маленькое окошко */
function AutoTextarea({ minRows = 4, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={minRows} {...props} className={cn(inputClass, 'resize-y leading-relaxed', className)} />;
}

/** Несколько коротких значений: печатаем и жмём Enter, лишнее убираем крестиком */
function TagsInput({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  describedby,
}: {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  describedby?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, '');
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-2 focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/10">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-surface py-1 pl-3 pr-1 text-sm font-medium">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="rounded-full p-1 hover:bg-line" aria-label={`Убрать «${tag}»`}>
            <X size={14} aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        list={`${id}-list`}
        aria-describedby={describedby}
        placeholder={value.length === 0 ? placeholder : 'Ещё…'}
        onChange={(e) => {
          // Выбор из подсказок браузер присылает целиком — сразу добавляем
          if (suggestions.includes(e.target.value)) add(e.target.value);
          else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        className="min-w-[10rem] flex-1 border-0 bg-transparent px-2 py-1.5 outline-none"
      />
      <datalist id={`${id}-list`}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}

/** Список однотипных элементов, например документы раздела: добавить, переставить, удалить */
function ListInput({
  field,
  rows,
  onChange,
  errors,
  path,
  ctx,
  isNew,
}: {
  field: Extract<Field, { type: 'list' }>;
  rows: Item[];
  onChange: (rows: Item[]) => void;
  errors: FieldErrors;
  path: string;
  ctx: Ctx;
  isNew: boolean;
}) {
  const update = (index: number, name: string, value: unknown) => onChange(rows.map((row, i) => (i === index ? { ...row, [name]: value } : row)));
  const move = (from: number, to: number) => {
    const next = [...rows];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  };
  const add = () => {
    onChange([...rows, newRow(field.of)]);
    // Курсор — в первое поле новой строки
    requestAnimationFrame(() => document.getElementById(fieldId(`${path}.${rows.length}.${field.of[0].name}`))?.focus());
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="rounded-2xl bg-surface p-4 text-sm text-muted">Пока пусто — нажмите «{field.addLabel}».</p>}
      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li key={String(row._key ?? index)} className="rounded-2xl border border-line bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-muted">№ {index + 1}</span>
              <span className="flex gap-1">
                <Btn size="sm" variant="ghost" icon={ArrowUp} onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={`№ ${index + 1}: выше`} />
                <Btn size="sm" variant="ghost" icon={ArrowDown} onClick={() => move(index, index + 1)} disabled={index === rows.length - 1} aria-label={`№ ${index + 1}: ниже`} />
                <Btn size="sm" variant="danger" icon={Trash2} onClick={() => onChange(rows.filter((_, i) => i !== index))} aria-label={`Удалить № ${index + 1}`} />
              </span>
            </div>
            <div className="space-y-4">
              {field.of.map((sub) => (
                <FieldInput
                  key={sub.name}
                  field={sub}
                  value={row[sub.name]}
                  onChange={(value) => update(index, sub.name, value)}
                  errors={errors}
                  path={`${path}.${index}.${sub.name}`}
                  ctx={ctx}
                  isNew={isNew}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>
      <Btn icon={Plus} onClick={add}>
        {field.addLabel}
      </Btn>
    </div>
  );
}

const LESSON_PARTS = ['day', 'start', 'end'];

// Текст ошибки под строкой или под шапкой группы
function RowError({ id, messages }: { id: string; messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-[#B42318]">
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      {[...new Set(messages)].join('. ')}
    </p>
  );
}

/**
 * Группы направления: у каждой — название, свободные места и занятия по дням недели.
 * Группы можно переставлять; удаление группы нужно подтвердить.
 */
export function GroupsInput({ groups, onChange, errors, path }: { groups: Item[]; onChange: (groups: Item[]) => void; errors: FieldErrors; path: string }) {
  const confirm = useConfirm();
  const update = (index: number, changes: Item) => onChange(groups.map((g, i) => (i === index ? { ...g, ...changes } : g)));
  const move = (from: number, to: number) => {
    const next = [...groups];
    const [group] = next.splice(from, 1);
    next.splice(to, 0, group);
    onChange(next);
  };
  const add = () => {
    // Следующий номер: после «Группа 7» — «Группа 8»
    const numbers = groups.map((g) => Number(/\d+/.exec(text(g.name))?.[0] ?? 0));
    const name = `Группа ${Math.max(0, ...numbers) + 1}`;
    onChange([...groups, { id: newGroupId(), name, seats: '0', lessons: [], _key: rowKey() }]);
    requestAnimationFrame(() => (document.getElementById(fieldId(`${path}.${groups.length}.name`)) as HTMLInputElement | null)?.select());
  };
  const remove = async (index: number) => {
    const group = groups[index];
    const lessons = Array.isArray(group.lessons) ? group.lessons.length : 0;
    const ok =
      lessons === 0 ||
      (await confirm({
        title: `Удалить «${text(group.name) || 'группу'}»?`,
        text: 'Группа исчезнет вместе с расписанием. Изменение вступит в силу после сохранения.',
        confirmLabel: 'Удалить группу',
        danger: true,
      }));
    if (ok) onChange(groups.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {groups.length === 0 && <p className="rounded-2xl bg-surface p-4 text-sm text-muted">Групп пока нет — нажмите «Добавить группу».</p>}
      <ol className="space-y-3">
        {groups.map((group, index) => (
          <GroupCard
            key={String(group._key ?? index)}
            group={group}
            index={index}
            count={groups.length}
            path={`${path}.${index}`}
            errors={errors}
            onChange={(changes) => update(index, changes)}
            onMove={(to) => move(index, to)}
            onRemove={() => void remove(index)}
          />
        ))}
      </ol>
      <Btn icon={Plus} onClick={add}>
        Добавить группу
      </Btn>
    </div>
  );
}

type GroupCardProps = {
  group: Item;
  index: number;
  count: number;
  path: string;
  errors: FieldErrors;
  onChange: (changes: Item) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
};

function GroupCard({ group, index, count, path, errors, onChange, onMove, onRemove }: GroupCardProps) {
  const name = text(group.name) || `Группа № ${index + 1}`;
  const lessons = Array.isArray(group.lessons) ? (group.lessons as Item[]) : [];
  const nameId = fieldId(`${path}.name`);
  const seatsId = fieldId(`${path}.seats`);
  const headErrorId = `${fieldId(path)}-error`;
  const headErrors = [errors[`${path}.name`], errors[`${path}.seats`]].filter(Boolean);

  const setLessons = (next: Item[]) => onChange({ lessons: next });
  const updateLesson = (j: number, part: string, value: string) => setLessons(lessons.map((l, i) => (i === j ? { ...l, [part]: value } : l)));
  const addLesson = () => {
    // Новый день повторяет время предыдущего: часто остаётся выбрать только день
    const last = lessons[lessons.length - 1];
    setLessons([...lessons, { day: '', start: text(last?.start), end: text(last?.end), _key: rowKey() }]);
    requestAnimationFrame(() => document.getElementById(fieldId(`${path}.lessons.${lessons.length}.day`))?.focus());
  };

  return (
    <li className="rounded-2xl border border-line bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label data-field={nameId} className="min-w-[10rem] flex-1">
          <span className="mb-1.5 block text-sm font-semibold">Название группы</span>
          <input
            id={nameId}
            type="text"
            maxLength={80}
            value={text(group.name)}
            onChange={(e) => onChange({ name: e.target.value })}
            aria-invalid={Boolean(errors[`${path}.name`])}
            aria-describedby={errors[`${path}.name`] ? headErrorId : undefined}
            placeholder="Группа 1"
            className={inputClass}
          />
        </label>
        <label data-field={seatsId} className="w-36">
          <span className="mb-1.5 block text-sm font-semibold">Свободных мест</span>
          <input
            id={seatsId}
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={text(group.seats)}
            onChange={(e) => onChange({ seats: e.target.value })}
            aria-invalid={Boolean(errors[`${path}.seats`])}
            aria-describedby={errors[`${path}.seats`] ? headErrorId : undefined}
            className={inputClass}
          />
        </label>
        <span className="flex gap-1 pb-1">
          <Btn size="sm" variant="ghost" icon={ArrowUp} onClick={() => onMove(index - 1)} disabled={index === 0} aria-label={`${name}: выше`} />
          <Btn size="sm" variant="ghost" icon={ArrowDown} onClick={() => onMove(index + 1)} disabled={index === count - 1} aria-label={`${name}: ниже`} />
          <Btn size="sm" variant="danger" icon={Trash2} onClick={onRemove} aria-label={`Удалить ${name}`} />
        </span>
      </div>
      <RowError id={headErrorId} messages={headErrors} />

      <p className="mt-4 text-sm font-semibold">Дни занятий</p>
      {lessons.length === 0 && <p className="mt-1 text-sm text-muted">Пока не указаны — на сайте будет «время уточняется».</p>}
      <ol className="mt-2 space-y-2">
        {lessons.map((lesson, j) => {
          const at = (part: string) => `${path}.lessons.${j}.${part}`;
          const errorId = `${fieldId(path)}-lesson-${j}-error`;
          const label = `${name}, день ${j + 1}`;
          // Общие свойства поля занятия: id для перехода к ошибке, подпись для экранного чтеца
          const part = (key: string, title: string) => ({
            id: fieldId(at(key)),
            value: text(lesson[key]),
            'aria-label': `${label}: ${title}`,
            'aria-invalid': Boolean(errors[at(key)]),
            'aria-describedby': errors[at(key)] ? errorId : undefined,
          });
          return (
            <li key={String(lesson._key ?? j)} className="rounded-xl bg-surface p-2">
              <div className="flex flex-wrap items-center gap-2">
                <span data-field={fieldId(at('day'))} className="order-1 min-w-0 flex-1 sm:w-52 sm:flex-none">
                  <select {...part('day', 'день недели')} onChange={(e) => updateLesson(j, 'day', e.target.value)} className={cn(inputClass, 'pr-10')}>
                    <option value="">— день недели —</option>
                    {days.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </span>
                <span className="order-3 flex w-full items-center gap-1.5 sm:order-2 sm:w-auto">
                  <span data-field={fieldId(at('start'))} className="min-w-0 flex-1 sm:w-32 sm:flex-none">
                    <input {...part('start', 'начало')} type="time" step={300} onChange={(e) => updateLesson(j, 'start', e.target.value)} className={cn(inputClass, 'pl-3 pr-2')} />
                  </span>
                  <span aria-hidden="true">–</span>
                  <span data-field={fieldId(at('end'))} className="min-w-0 flex-1 sm:w-32 sm:flex-none">
                    <input {...part('end', 'окончание')} type="time" step={300} onChange={(e) => updateLesson(j, 'end', e.target.value)} className={cn(inputClass, 'pl-3 pr-2')} />
                  </span>
                </span>
                {/* На телефоне кнопка — в одной строке с днём недели, чтобы времени хватило места */}
                <span className="order-2 sm:order-3">
                  <Btn size="sm" variant="danger" icon={Trash2} onClick={() => setLessons(lessons.filter((_, i) => i !== j))} aria-label={`Удалить: ${label}`} />
                </span>
              </div>
              <RowError id={errorId} messages={LESSON_PARTS.map((key) => errors[at(key)]).filter(Boolean)} />
            </li>
          );
        })}
      </ol>
      <Btn size="sm" variant="ghost" icon={Plus} onClick={addLesson} className="mt-2">
        Добавить день
      </Btn>
    </li>
  );
}
