import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Save, Send, Trash2 } from 'lucide-react';
import { cn } from '../lib/cn';
import { ApiError } from './api';
import { FieldInput, fieldId } from './fields';
import { newFormValues, toFormValues } from './form';
import { useGuardedLink, useLeaveGuard } from './guard';
import { collections, hasErrors, isCollectionName, slugify, validateItem } from './schema';
import type { CollectionName, Field, FieldErrors, Item, Lookup } from './schema';
import { deleteItem, saveItem, useCollection, useCollections } from './store';
import { Btn, Notice, PageHeading, Spinner, useConfirm, useToast } from './ui';
import { views } from './views';

export function EditPage() {
  const { collection = '', id } = useParams();
  if (!isCollectionName(collection)) return <Notice tone="error">Такого раздела нет.</Notice>;
  // key: при переходе к другой записи форма создаётся заново, со своими значениями
  return <Editor key={`${collection}/${id ?? 'new'}`} name={collection} id={id ?? null} />;
}

// Разделы, которые нужны форме: для выбора из списка и подсказок
function relatedCollections(fields: Field[]): CollectionName[] {
  return fields.flatMap((field) => {
    if (field.type === 'reference') return [field.collection];
    if ((field.type === 'text' || field.type === 'tags') && field.suggest) return [field.suggest.collection];
    if (field.type === 'list') return relatedCollections(field.of);
    return [];
  });
}

export const widthClass = (field: Field) =>
  field.width === 'half' ? 'col-span-6 sm:col-span-3' : field.width === 'third' ? 'col-span-3 sm:col-span-2' : 'col-span-6';

// Ставит курсор в первое поле с ошибкой и прокручивает к нему
export function focusFirstError(errors: FieldErrors) {
  const shells = Object.keys(errors)
    .map((key) => document.querySelector<HTMLElement>(`[data-field="${fieldId(key)}"]`))
    .filter((el): el is HTMLElement => el !== null)
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const first = shells[0];
  if (!first) return;
  first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  first.querySelector<HTMLElement>('input:not([tabindex="-1"]), textarea, select, button')?.focus({ preventScroll: true });
}

// Предпросмотр нельзя «нажать»: inert убирает его из фокуса и кликов
function Inert({ children }: { children: ReactNode }) {
  return (
    <div ref={(el) => el?.setAttribute('inert', '')} aria-hidden="true" className="select-none">
      {children}
    </div>
  );
}

function Editor({ name, id }: { name: CollectionName; id: string | null }) {
  const collection = collections[name];
  const view = views[name];
  const isNew = id === null;
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const guarded = useGuardedLink();

  const { items, error: loadError } = useCollection(name);
  const ctx = useCollections([...new Set([name, ...(view.uses ?? []), ...relatedCollections(collection.fields)])]);
  const stored = isNew ? null : (items?.find((x) => String(x[collection.idField]) === id) ?? null);

  const [values, setValues] = useState<Item | null>(null);
  // Значения на момент последнего сохранения — чтобы понять, есть ли несохранённые изменения
  const [snapshot, setSnapshot] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const slugTouched = useRef(false);

  // Заполняем форму: новая запись — пустыми значениями, существующая — когда загрузится
  useEffect(() => {
    if (values) return;
    const initial = isNew ? newFormValues(collection) : stored && toFormValues(collection.fields, stored);
    if (initial) {
      setValues(initial);
      setSnapshot(JSON.stringify(initial));
    }
  }, [values, isNew, stored, collection]);

  // Проверка выбора из списка — только если список уже загружен
  const lookup: Lookup = (other) => {
    const list = ctx.get(other);
    return list.length > 0 ? list : undefined;
  };
  const result = values ? validateItem(collection, values, lookup) : null;
  const dirty = values !== null && JSON.stringify(values) !== snapshot;
  // Ошибки показываем после первой попытки сохранить; ошибки сервера — сразу
  const errors = submitted && result ? { ...result.errors, ...serverErrors } : serverErrors;

  useLeaveGuard(dirty);

  const slugField = collection.fields.find((f): f is Extract<Field, { type: 'slug' }> => f.type === 'slug');

  function change(fieldName: string, value: unknown) {
    setValues((prev) => {
      const next = { ...prev, [fieldName]: value };
      // Адрес новой записи заполняется сам по названию, пока его не начали править вручную
      if (isNew && slugField && !slugField.hidden && !slugTouched.current && fieldName === slugField.from) {
        next[slugField.name] = slugify(String(value)).slice(0, 60);
      }
      return next;
    });
    if (fieldName === slugField?.name) slugTouched.current = true;
    // Ошибка сервера для этого поля больше не актуальна
    setServerErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== fieldName && !key.startsWith(`${fieldName}.`))));
  }

  async function save() {
    if (!values || saving) return;
    setSubmitted(true);
    const check = validateItem(collection, values, lookup);
    if (hasErrors(check.errors)) {
      focusFirstError(check.errors);
      toast({ tone: 'error', text: 'Проверьте поля, выделенные красным.' });
      return;
    }
    setSaving(true);
    try {
      const item = await saveItem(name, id, values);
      const next = toFormValues(collection.fields, item);
      setValues(next);
      setSnapshot(JSON.stringify(next));
      setServerErrors({});
      setSubmitted(false);
      toast({
        tone: 'success',
        text: isNew ? 'Готово! Запись опубликована на сайте.' : 'Изменения сохранены и уже на сайте.',
        action: { label: 'Посмотреть на сайте', href: view.siteUrl(item) },
      });
      if (isNew) navigate(`/admin/${name}/${encodeURIComponent(String(item[collection.idField]))}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerErrors(err.fields);
        if (hasErrors(err.fields)) focusFirstError(err.fields);
        toast({ tone: 'error', text: err.message });
      } else {
        toast({ tone: 'error', text: 'Не удалось сохранить. Попробуйте ещё раз.' });
      }
    } finally {
      setSaving(false);
    }
  }

  // Ctrl + S (⌘ + S на Mac) — сохранить. e.code, а не e.key: так работает и в русской раскладке
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault();
        void saveRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  async function remove() {
    if (!stored || id === null) return;
    const title = String(stored[collection.titleField] ?? '');
    const ok = await confirm({
      title: `Удалить ${collection.one}?`,
      text: `«${title}» исчезнет с сайта. Отменить удаление здесь нельзя.`,
      confirmLabel: 'Удалить',
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteItem(name, id);
      toast({ tone: 'success', text: `Удалено: «${title}»` });
      navigate(`/admin/${name}`);
    } catch (err) {
      toast({ tone: 'error', text: err instanceof ApiError ? err.message : 'Не удалось удалить. Попробуйте ещё раз.' });
      setDeleting(false);
    }
  }

  const back = { to: `/admin/${name}`, label: collection.label, onClick: guarded(`/admin/${name}`) };

  if (!isNew && items && !stored) {
    return (
      <>
        <PageHeading back={back} title="Запись не найдена" />
        <Notice>Возможно, её уже удалили. Вернитесь к списку и выберите другую запись.</Notice>
      </>
    );
  }
  if (loadError && !values) {
    return (
      <>
        <PageHeading back={back} title={collection.label} />
        <Notice tone="error">{loadError}</Notice>
      </>
    );
  }
  if (!values || !result) return <Spinner />;

  const title = isNew ? collection.newTitle : String(stored?.[collection.titleField] ?? '') || 'Без названия';
  const status = saving ? 'Сохраняем…' : dirty ? 'Есть несохранённые изменения' : isNew ? '' : 'Все изменения сохранены';

  return (
    <>
      <PageHeading
        back={back}
        title={title}
        actions={
          stored && (
            <Btn href={view.siteUrl(stored)} icon={ExternalLink}>
              Открыть на сайте
            </Btn>
          )
        }
      />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className={cn('grid gap-6', view.preview && 'lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_24rem]')}
      >
        <div className="min-w-0 rounded-card bg-white p-5 sm:p-8">
          <div className="grid grid-cols-6 gap-x-4 gap-y-8">
            {collection.fields.map((field) => (
              <FieldInput
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={(value) => change(field.name, value)}
                errors={errors}
                path={field.name}
                ctx={ctx}
                isNew={isNew}
                className={widthClass(field)}
              />
            ))}
          </div>
        </div>

        {view.preview && (
          <aside aria-label="Предпросмотр" className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-card bg-white p-5">
              <p className="eyebrow mb-5">Так будет на сайте</p>
              <Inert>{view.preview(result.item, ctx)}</Inert>
            </div>
          </aside>
        )}

        {/* Панель с кнопками всегда видна внизу экрана */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:left-[17rem]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6 lg:px-10">
            <Btn type="submit" variant="primary" icon={isNew ? Send : Save} loading={saving} disabled={!isNew && !dirty} title="Ctrl + S">
              {isNew ? 'Опубликовать' : 'Сохранить изменения'}
            </Btn>
            <Btn to={`/admin/${name}`} variant="ghost" onClick={guarded(`/admin/${name}`)}>
              {dirty ? 'Отмена' : 'К списку'}
            </Btn>
            {status && (
              <span className={cn('hidden items-center gap-1.5 text-sm sm:inline-flex', dirty ? 'text-ink' : 'text-muted')} role="status">
                {!dirty && !saving && <CheckCircle2 size={16} className="text-accent-hover" aria-hidden="true" />}
                {status}
              </span>
            )}
            {stored && (
              <Btn variant="danger" icon={Trash2} onClick={() => void remove()} loading={deleting} className="ml-auto">
                Удалить
              </Btn>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
