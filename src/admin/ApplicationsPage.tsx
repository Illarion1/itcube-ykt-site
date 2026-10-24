import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, Mail, Phone, Search, Trash2, UserCheck } from 'lucide-react';
import { cn } from '../lib/cn';
import { ageRange, plural } from '../lib/format';
import { formatSlots } from '../lib/schedule';
import type { Group } from '../lib/schedule';
import { ApiError } from './api';
import type { Application, ApplicationStatus } from './api';
import { deleteApplication, refreshApplications, updateApplication, useApplications } from './applications';
import type { Item } from './schema';
import { useCollection } from './store';
import { Btn, inputClass, Notice, PageHeading, Spinner, useConfirm, useToast } from './ui';

const topicLabels: Record<Application['topic'], string> = {
  enroll: 'Запись на обучение',
  question: 'Вопрос',
  idea: 'Предложение или отзыв',
};

const statuses: { value: ApplicationStatus; label: string }[] = [
  { value: 'new', label: 'Новая' },
  { value: 'progress', label: 'В работе' },
  { value: 'done', label: 'Обработана' },
];

const tabs: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'new', label: 'Новые' },
  { value: 'progress', label: 'В работе' },
  { value: 'done', label: 'Обработанные' },
  { value: 'all', label: 'Все' },
];

// '2026-10-24T06:30:00.000Z' → '24 октября 2026, 15:30' (по якутскому времени)
const dateTime = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Yakutsk',
});

const normalize = (text: string) => text.toLowerCase().replace(/ё/g, 'е');

/** Заявки и вопросы, которые пришли через форму на сайте */
export function ApplicationsPage() {
  const { list, error } = useApplications();
  const directions = useCollection('directions').items ?? [];
  const [tab, setTab] = useState<ApplicationStatus | 'all'>('new');
  const [query, setQuery] = useState('');

  // При открытии страницы — свежий список
  useEffect(() => {
    void refreshApplications();
  }, []);

  const count = (value: ApplicationStatus | 'all') => (list ?? []).filter((a) => value === 'all' || a.status === value).length;
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = (list ?? [])
    .filter((a) => tab === 'all' || a.status === tab)
    .filter((a) => {
      const text = normalize([a.name, a.grade ?? '', a.phone, a.email, a.message, a.note, a.directionTitle ?? '', a.groupName ?? ''].join(' '));
      return words.every((w) => text.includes(w));
    });

  return (
    <>
      <PageHeading
        title="Заявки и обращения"
        description="Заявки на запись и вопросы из формы на сайте, новые — сверху. Отмечайте, что взяли заявку в работу, — так коллеги не позвонят дважды."
      />

      {error && (
        <div className="mb-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Какие заявки показать">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                tab === t.value ? 'bg-ink text-white' : 'bg-white hover:bg-surface-strong',
              )}
            >
              {t.label} <span className={tab === t.value ? 'text-white/60' : 'text-muted'}>{count(t.value)}</span>
            </button>
          ))}
        </div>
        <label className="relative lg:w-80">
          <span className="sr-only">Поиск по заявкам</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Имя, телефон, направление…" className={cn(inputClass, 'pl-11')} />
        </label>
      </div>

      {!list && !error && <Spinner />}

      {list && visible.length === 0 && (
        <div className="rounded-card bg-white p-10 text-center">
          <p className="font-semibold">{tab === 'new' && words.length === 0 ? 'Новых заявок нет' : 'Ничего не нашлось'}</p>
          <p className="mt-1 text-muted">Заявки появляются здесь сами, когда кто-то отправляет форму на сайте.</p>
        </div>
      )}

      <ul className="space-y-4">
        {visible.map((application) => (
          <li key={application.id}>
            <ApplicationCard application={application} direction={directions.find((d) => d.id === application.directionId) ?? null} />
          </li>
        ))}
      </ul>
    </>
  );
}

function ApplicationCard({ application: a, direction }: { application: Application; direction: Item | null }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [note, setNote] = useState(a.note);
  const [busy, setBusy] = useState<string | null>(null);

  // Комментарий поменяли в другой вкладке или после обновления списка
  useEffect(() => setNote(a.note), [a.note]);

  async function change(key: string, changes: Parameters<typeof updateApplication>[1], done: string) {
    setBusy(key);
    try {
      await updateApplication(a.id, changes);
      toast({ tone: 'success', text: done });
    } catch (error) {
      toast({ tone: 'error', text: error instanceof ApiError ? error.message : 'Не удалось сохранить' });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    const ok = await confirm({
      title: 'Удалить заявку?',
      text: `Заявка ${a.topic === 'enroll' ? 'на ученика' : 'от'} «${a.name}» исчезнет из списка. Отменить удаление нельзя.`,
      confirmLabel: 'Удалить',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteApplication(a.id);
      toast({ tone: 'success', text: 'Заявка удалена' });
    } catch (error) {
      toast({ tone: 'error', text: error instanceof ApiError ? error.message : 'Не удалось удалить' });
    }
  }

  const enroll = a.topic === 'enroll';
  // Группа заявки — по номеру, поэтому находится, даже если её переименовали
  const group = direction && a.groupId && Array.isArray(direction.groups) ? ((direction.groups as Group[]).find((g) => g.id === a.groupId) ?? null) : null;
  const seats = group?.seats ?? 0;
  // Возраст ученика вне возраста направления — сотруднику стоит уточнить при звонке
  const ageFrom = typeof direction?.ageFrom === 'number' ? direction.ageFrom : null;
  const ageTo = typeof direction?.ageTo === 'number' ? direction.ageTo : null;
  const ageMismatch = typeof a.age === 'number' && ageFrom !== null && ageTo !== null && (a.age < ageFrom || a.age > ageTo);

  return (
    <article className={cn('rounded-card bg-white p-5 sm:p-6', a.status === 'new' && 'ring-2 ring-accent')}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold">{topicLabels[a.topic]}</span>
          <span className="text-muted">{dateTime.format(new Date(a.createdAt))}</span>
        </p>
        {/* Статус — тремя кнопками: видно сразу все варианты */}
        <div className="flex gap-1 rounded-full bg-surface p-1" role="group" aria-label="Статус заявки">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={a.status === s.value}
              disabled={busy !== null}
              onClick={() => a.status !== s.value && void change('status', { status: s.value }, `Статус: ${s.label.toLowerCase()}`)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                a.status === s.value ? (s.value === 'new' ? 'bg-accent text-ink' : 'bg-ink text-white') : 'text-muted hover:text-ink',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      {enroll && <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Ученик</p>}
      <h2 className={cn('font-display text-xl font-semibold', enroll ? 'mt-1' : 'mt-3')}>{a.name}</h2>
      {enroll && (typeof a.age === 'number' || a.grade) && (
        <p className="mt-1 text-muted">{[typeof a.age === 'number' && ageRange(a.age, a.age), a.grade].filter(Boolean).join(' · ')}</p>
      )}
      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
        {a.phone && (
          <a href={`tel:${a.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 font-semibold hover:underline">
            <Phone size={16} aria-hidden="true" />
            {a.phone}
          </a>
        )}
        {a.email && (
          <a href={`mailto:${a.email}`} className="inline-flex items-center gap-2 font-semibold hover:underline">
            <Mail size={16} aria-hidden="true" />
            {a.email}
          </a>
        )}
      </p>

      {enroll && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p>
              Направление:{' '}
              {direction ? (
                <Link to={`/admin/directions/${encodeURIComponent(String(direction.id))}`} className="font-semibold underline-offset-4 hover:underline">
                  {String(direction.title)}
                </Link>
              ) : (
                <span className="font-semibold">{a.directionTitle ?? '—'} (направление удалено)</span>
              )}
              {direction && (
                <span className="text-muted">
                  {ageFrom !== null && ageTo !== null && ` · ${ageRange(ageFrom, ageTo)}`}
                  {direction.enrollOpen !== true && ' · запись закрыта'}
                </span>
              )}
            </p>
            <p className="mt-1">
              Группа:{' '}
              {group ? (
                <>
                  <span className="font-semibold">{group.name}</span>
                  <span className="text-muted">
                    {' '}
                    · {formatSlots(group.lessons) || 'время не указано'} · {seats > 0 ? `свободно ${seats} ${plural(seats, ['место', 'места', 'мест'])}` : 'мест нет'}
                  </span>
                </>
              ) : (
                <span className="font-semibold">{a.groupName ? `${a.groupName} (группа удалена)` : 'не указана'}</span>
              )}
            </p>
            {ageMismatch && (
              <p className="mt-1 flex items-center gap-1.5 font-medium text-[#B42318]">
                <AlertCircle size={15} aria-hidden="true" />
                Возраст ученика не подходит направлению — уточните при звонке
              </p>
            )}
          </div>
          {a.seatTaken ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
              <Check size={16} className="text-accent-hover" aria-hidden="true" />
              Место вычтено
            </span>
          ) : (
            group &&
            seats > 0 && (
              <Btn
                size="sm"
                variant="dark"
                icon={UserCheck}
                loading={busy === 'seat'}
                disabled={busy !== null}
                title="Ребёнка записали в группу: свободных мест в ней станет на одно меньше, заявка — обработанной"
                onClick={() => void change('seat', { takeSeat: true }, `Записан(а): в группе «${group.name}» свободных мест стало на одно меньше`)}
              >
                Записали — вычесть место
              </Btn>
            )
          )}
        </div>
      )}

      {a.message && <p className="mt-4 whitespace-pre-line rounded-2xl border border-line p-4 leading-relaxed">{a.message}</p>}

      <div className="mt-4">
        <label htmlFor={`note-${a.id}`} className="text-sm font-semibold">
          Комментарий сотрудника
        </label>
        <textarea
          id={`note-${a.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Например: позвонили, записали в субботнюю группу"
          className={cn(inputClass, 'mt-2 resize-y')}
        />
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {note !== a.note ? (
          <Btn size="sm" variant="primary" loading={busy === 'note'} onClick={() => void change('note', { note }, 'Комментарий сохранён')}>
            Сохранить комментарий
          </Btn>
        ) : (
          <span />
        )}
        <Btn size="sm" variant="danger" icon={Trash2} onClick={() => void remove()}>
          Удалить
        </Btn>
      </footer>
    </article>
  );
}
