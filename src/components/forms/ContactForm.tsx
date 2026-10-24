import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { FeedbackError, getOpenDirections, invalidate, openGroups, sendFeedback } from '../../api';
import type { FeedbackData } from '../../api';
import type { Direction } from '../../api/types';
import { site } from '../../data/site';
import { useData } from '../../hooks/useData';
import { cn } from '../../lib/cn';
import { grades, isFullName, STUDENT_AGE_MAX, STUDENT_AGE_MIN } from '../../lib/enroll';
import { ageRange, plural } from '../../lib/format';
import { formatPhone, isPhoneComplete } from '../../lib/phone';
import { formatSlots } from '../../lib/schedule';
import type { Group } from '../../lib/schedule';

type Values = Omit<FeedbackData, 'website'>;
type Errors = Partial<Record<keyof Values, string>>;

const topics: { value: FeedbackData['topic']; label: string }[] = [
  { value: 'enroll', label: 'Запись на обучение' },
  { value: 'question', label: 'Вопрос' },
  { value: 'idea', label: 'Предложение или отзыв' },
];

// Выбранная группа. Если на направлении набор только в одну группу — она и выбрана
function chosenGroup(values: Values, direction: Direction | undefined) {
  const groups = direction ? openGroups(direction) : [];
  return values.group || (groups.length === 1 ? groups[0].id : '');
}

/**
 * Проверка всех полей. Возвращает тексты ошибок для неправильно заполненных полей —
 * в том порядке, в каком поля идут на экране: при отправке курсор встанет в первое неправильное.
 * open — направления, на которые сейчас идёт запись (null — ещё загружаются)
 */
function validate(values: Values, open: Direction[] | null): Errors {
  const errors: Errors = {};
  if (values.topic === 'enroll') {
    if (open && open.length === 0) errors.direction = 'Сейчас запись закрыта: свободных мест нет';
    else if (!values.direction) errors.direction = 'Выберите направление';
    else if (open && !open.some((d) => d.id === values.direction)) errors.direction = 'На это направление сейчас нет записи — выберите другое';
    const direction = open?.find((d) => d.id === values.direction);
    if (direction) {
      const group = chosenGroup(values, direction);
      if (!group) errors.group = 'Выберите группу';
      else if (!openGroups(direction).some((g) => g.id === group)) errors.group = 'В этой группе мест уже нет — выберите другую';
    }
    if (!isFullName(values.name)) errors.name = 'Укажите фамилию и имя ученика';
    const age = Number(values.age);
    if (!values.age) errors.age = 'Укажите возраст ученика';
    else if (age < STUDENT_AGE_MIN || age > STUDENT_AGE_MAX) errors.age = `Возраст — от ${STUDENT_AGE_MIN} до ${STUDENT_AGE_MAX} лет`;
    if (!values.grade) errors.grade = 'Выберите класс';
  } else if (values.name.trim().length < 2) errors.name = 'Укажите имя — хотя бы 2 буквы';
  if (!values.phone && !values.email) errors.phone = 'Оставьте телефон или e-mail, чтобы мы могли ответить';
  if (values.phone && !isPhoneComplete(values.phone)) errors.phone = 'Номер неполный: нужно 10 цифр после +7';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) errors.email = 'Проверьте e-mail: например, name@mail.ru';
  if (values.topic !== 'enroll' && values.message.trim().length < 10) errors.message = 'Напишите сообщение — хотя бы 10 символов';
  if (!values.consent) errors.consent = 'Нужно согласие на обработку персональных данных';
  return errors;
}

// 'Белолюбский Михаил Михайлович' → 'Белолюбский М. М.'
const shortName = (full: string) => {
  const [surname = '', ...rest] = full.trim().split(/\s+/);
  return [surname, ...rest.map((part) => `${part.charAt(0)}.`)].join(' ');
};

// «Шахматы — ознакомительный, 7–14 лет». Если названия совпадают — добавляем педагога, чтобы различать
function optionLabel(direction: Direction, all: Direction[]) {
  const twins = all.filter((d) => d.title === direction.title).length > 1;
  return `${direction.title} — ${direction.level.toLowerCase()}, ${ageRange(direction.ageFrom, direction.ageTo)}${twins ? `, ${shortName(direction.teacher)}` : ''}`;
}

// «Группа 2 — Пн, Пт 10:50–12:30 (2 места)»
const groupLabel = (group: Group) =>
  `${group.name} — ${formatSlots(group.lessons) || 'время уточняется'} (${group.seats} ${plural(group.seats, ['место', 'места', 'мест'])})`;

type Props = {
  initialTopic?: FeedbackData['topic'];
  // Направление и группа, выбранные заранее (кнопка «Записаться» на сайте)
  initialDirection?: string;
  initialGroup?: string;
};

/**
 * Форма обратной связи и записи на обучение. Заявка уходит на сервер,
 * сотрудники видят её в админ-панели. Записаться можно только на направления,
 * где открыта запись, и только в группы со свободными местами. В заявке на запись — ФИО, возраст и класс ученика,
 * а телефон или e-mail — для связи (обычно родителя).
 * Ошибки показываются после ухода с поля и при отправке; поле с ошибкой связано
 * с текстом ошибки через aria-describedby — экранный чтец его зачитает.
 */
export function ContactForm({ initialTopic = 'question', initialDirection = '', initialGroup = '' }: Props) {
  // reload — после ответа «мест уже нет» список направлений загружается заново
  const [reload, setReload] = useState(0);
  const { data: open } = useData(getOpenDirections, [reload]);
  const formId = useId();
  const [values, setValues] = useState<Values>({
    topic: initialTopic,
    name: '',
    age: '',
    grade: '',
    phone: '',
    email: '',
    direction: initialDirection,
    group: initialGroup,
    message: '',
    consent: false,
  });
  // Скрытое поле-ловушка для спам-ботов (люди его не видят)
  const [website, setWebsite] = useState('');
  // Какие поля пользователь уже «трогал» — ошибки показываем только для них
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>(initialDirection ? { direction: true, group: Boolean(initialGroup) } : {});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  // Ошибки, которые вернул сервер, и общая ошибка отправки
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [sendError, setSendError] = useState('');
  // После отправки длинная форма сменяется коротким сообщением — прокручиваем к нему, иначе на экране окажется подвал
  const sentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status === 'sent') sentRef.current?.scrollIntoView({ block: 'center' });
  }, [status]);

  const errors = validate(values, open);
  const visibleError = (key: keyof Values) => (touched[key] ? errors[key] : undefined) ?? serverErrors[key];

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setServerErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const touch = (key: keyof Values) => setTouched((prev) => ({ ...prev, [key]: true }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSendError('');
    // При отправке показываем все ошибки сразу и ставим курсор в первое неправильное поле
    setTouched({ direction: true, group: true, name: true, age: true, grade: true, phone: true, email: true, message: true, consent: true });
    const firstError = (Object.keys(errors) as (keyof Values)[])[0];
    if (firstError) {
      document.getElementById(`${formId}-${firstError}`)?.focus();
      return;
    }
    setStatus('sending');
    try {
      const enroll = values.topic === 'enroll';
      await sendFeedback({
        ...values,
        direction: enroll ? values.direction : '',
        group: enroll ? chosenGroup(values, open?.find((d) => d.id === values.direction)) : '',
        age: enroll ? values.age : '',
        grade: enroll ? values.grade : '',
        website,
      });
      setStatus('sent');
    } catch (error) {
      setStatus('idle');
      if (error instanceof FeedbackError) {
        setServerErrors(error.fields);
        setSendError(error.message);
        // Пока заполняли форму, места в группе могли закончиться — обновим список
        if (error.fields.direction || error.fields.group) {
          invalidate('directions');
          setReload((n) => n + 1);
        }
      } else {
        setSendError('Не удалось отправить. Попробуйте ещё раз или позвоните нам.');
      }
    }
  };

  if (status === 'sent') {
    const direction = open?.find((d) => d.id === values.direction);
    const group = direction?.groups.find((g) => g.id === chosenGroup(values, direction));
    const enroll = values.topic === 'enroll';
    return (
      <div ref={sentRef} role="status" className="rounded-panel bg-accent-soft p-8 lg:p-10">
        <CheckCircle2 size={40} className="text-ink" aria-hidden="true" />
        <h2 className="mt-6 font-display text-h3 font-semibold">{enroll ? 'Заявка отправлена' : `Спасибо, ${values.name.trim()}!`}</h2>
        <p className="mt-3 text-lg">
          {enroll
            ? `Заявка на запись${direction ? ` на направление «${direction.title}»` : ''}${group ? ` (${group.name})` : ''} принята. Сотрудники центра свяжутся с вами, чтобы подтвердить запись.`
            : 'Сообщение отправлено. Мы ответим по указанным контактам.'}
        </p>
        {enroll && (
          <p className="mt-3">
            Ученик: {values.name.trim()}, {ageRange(Number(values.age), Number(values.age))}, {values.grade.toLowerCase()}
          </p>
        )}
        <p className="mt-4 text-sm text-muted">
          Если вопрос срочный, позвоните нам: <a href={site.phones[0].href} className="underline underline-offset-4">{site.phones[0].display}</a>.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setTouched({});
            // Вторую заявку на запись обычно отправляют за другого ребёнка: контакты оставляем, ученика — очищаем
            setValues((prev) => ({ ...prev, message: '', consent: false, ...(prev.topic === 'enroll' ? { name: '', age: '', grade: '' } : {}) }));
          }}
          className="mt-6 font-semibold underline underline-offset-4"
        >
          Отправить ещё одно сообщение
        </button>
      </div>
    );
  }

  const enroll = values.topic === 'enroll';
  const enrollClosed = enroll && open !== null && open.length === 0;
  // Возраст ученика не подходит выбранному направлению — подсказываем, но отправить не мешаем
  const chosen = enroll ? open?.find((d) => d.id === values.direction) : undefined;
  // Группы выбранного направления, где есть места
  const chosenGroups = chosen ? openGroups(chosen) : [];
  const groupId = chosenGroup(values, chosen);
  const groupKnown = chosenGroups.some((g) => g.id === groupId);
  const ageNumber = Number(values.age);
  const ageMismatch = Boolean(chosen && values.age && !visibleError('age') && (ageNumber < chosen.ageFrom || ageNumber > chosen.ageTo));

  const field = (key: keyof Values) =>
    cn(
      'w-full rounded-2xl border bg-white px-5 text-base outline-none transition-colors focus-visible:border-ink',
      visibleError(key) ? 'border-[#D92D20]' : 'border-line hover:border-ink/40',
    );

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6" aria-label="Форма обратной связи">
      <fieldset>
        <legend className="mb-3 font-semibold">Тема обращения</legend>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <label
              key={topic.value}
              className={cn(
                'cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                values.topic === topic.value ? 'bg-ink text-white' : 'bg-surface hover:bg-surface-strong',
              )}
            >
              <input
                type="radio"
                name={`${formId}-topic`}
                value={topic.value}
                checked={values.topic === topic.value}
                onChange={() => set('topic', topic.value)}
                className="sr-only"
              />
              {topic.label}
            </label>
          ))}
        </div>
      </fieldset>

      {enroll &&
        (enrollClosed ? (
          // Ни на одно направление сейчас нет записи — выбирать не из чего
          <div id={`${formId}-direction`} tabIndex={-1} className="rounded-2xl bg-surface p-5">
            <p className="font-semibold">Сейчас запись закрыта: свободных мест нет</p>
            <p className="mt-1 text-sm text-muted">
              Выберите тему «Вопрос» — подскажем, когда начнётся набор. Свободные места появляются на странице{' '}
              <Link to="/vacancies" className="underline underline-offset-4">
                «Вакантные места»
              </Link>
              .
            </p>
          </div>
        ) : (
          <Field id={`${formId}-direction`} label="Направление" error={visibleError('direction')} required>
            <select
              id={`${formId}-direction`}
              value={values.direction}
              onChange={(e) => {
                // Другое направление — группу выбираем заново
                set('direction', e.target.value);
                set('group', '');
                setTouched((prev) => ({ ...prev, group: false }));
              }}
              onBlur={() => touch('direction')}
              aria-invalid={Boolean(visibleError('direction'))}
              aria-describedby={visibleError('direction') ? `${formId}-direction-error` : undefined}
              className={cn(field('direction'), 'h-14')}
            >
              <option value="">{open ? 'Выберите направление' : 'Загружаем направления…'}</option>
              {(open ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {optionLabel(d, open ?? [])}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-muted">
              В списке — направления, где сейчас идёт набор хотя бы в одну группу.{' '}
              <Link to="/vacancies" className="underline underline-offset-4">
                Все свободные места
              </Link>
            </p>
          </Field>
        ))}

      {enroll && chosen && (
        <Field id={`${formId}-group`} label="Группа" error={visibleError('group')} required>
          <select
            id={`${formId}-group`}
            value={groupKnown ? groupId : ''}
            onChange={(e) => set('group', e.target.value)}
            onBlur={() => touch('group')}
            aria-invalid={Boolean(visibleError('group'))}
            aria-describedby={visibleError('group') ? `${formId}-group-error` : undefined}
            className={cn(field('group'), 'h-14')}
          >
            {(chosenGroups.length !== 1 || !groupKnown) && <option value="">Выберите группу</option>}
            {chosenGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {groupLabel(g)}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-muted">В списке — группы, в которые сейчас нужны ученики.</p>
        </Field>
      )}

      <Field id={`${formId}-name`} label={enroll ? 'ФИО ученика' : 'Ваше имя'} error={visibleError('name')} required>
        <input
          id={`${formId}-name`}
          type="text"
          // ФИО ученика браузер не должен подставлять из данных родителя
          autoComplete={enroll ? 'off' : 'name'}
          placeholder={enroll ? 'Иванов Иван Иванович' : undefined}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          onBlur={() => touch('name')}
          aria-invalid={Boolean(visibleError('name'))}
          aria-describedby={visibleError('name') ? `${formId}-name-error` : undefined}
          className={cn(field('name'), 'h-14')}
        />
      </Field>

      {enroll && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id={`${formId}-age`} label="Возраст ученика" error={visibleError('age')} required>
            <input
              id={`${formId}-age`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Полных лет"
              value={values.age}
              onChange={(e) => set('age', e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={() => touch('age')}
              aria-invalid={Boolean(visibleError('age'))}
              aria-describedby={[visibleError('age') && `${formId}-age-error`, ageMismatch && `${formId}-age-note`].filter(Boolean).join(' ') || undefined}
              className={cn(field('age'), 'h-14')}
            />
            {ageMismatch && chosen && (
              <p id={`${formId}-age-note`} className="mt-2 text-sm text-muted">
                Направление рассчитано на {ageRange(chosen.ageFrom, chosen.ageTo)}. Заявку можно отправить — сотрудники подскажут, подойдёт ли оно.
              </p>
            )}
          </Field>
          <Field id={`${formId}-grade`} label="Класс" error={visibleError('grade')} required>
            <select
              id={`${formId}-grade`}
              value={values.grade}
              onChange={(e) => set('grade', e.target.value)}
              onBlur={() => touch('grade')}
              aria-invalid={Boolean(visibleError('grade'))}
              aria-describedby={visibleError('grade') ? `${formId}-grade-error` : undefined}
              className={cn(field('grade'), 'h-14')}
            >
              <option value="">Выберите класс</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={`${formId}-phone`} label={enroll ? 'Телефон для связи' : 'Телефон'} error={visibleError('phone')}>
          <input
            id={`${formId}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 (___) ___-__-__"
            value={values.phone}
            onChange={(e) => set('phone', formatPhone(e.target.value))}
            onBlur={() => touch('phone')}
            aria-invalid={Boolean(visibleError('phone'))}
            aria-describedby={visibleError('phone') ? `${formId}-phone-error` : undefined}
            className={cn(field('phone'), 'h-14')}
          />
        </Field>
        <Field id={`${formId}-email`} label="E-mail" error={visibleError('email')}>
          <input
            id={`${formId}-email`}
            type="email"
            autoComplete="email"
            placeholder="name@mail.ru"
            value={values.email}
            onChange={(e) => set('email', e.target.value.trim())}
            onBlur={() => touch('email')}
            aria-invalid={Boolean(visibleError('email'))}
            aria-describedby={visibleError('email') ? `${formId}-email-error` : undefined}
            className={cn(field('email'), 'h-14')}
          />
        </Field>
      </div>

      <Field
        id={`${formId}-message`}
        label={enroll ? 'Комментарий (удобная группа или время)' : 'Сообщение'}
        error={visibleError('message')}
        required={!enroll}
      >
        <textarea
          id={`${formId}-message`}
          rows={5}
          value={values.message}
          onChange={(e) => set('message', e.target.value)}
          onBlur={() => touch('message')}
          aria-invalid={Boolean(visibleError('message'))}
          aria-describedby={visibleError('message') ? `${formId}-message-error` : undefined}
          className={cn(field('message'), 'resize-y py-4')}
        />
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            id={`${formId}-consent`}
            type="checkbox"
            checked={values.consent}
            onChange={(e) => {
              set('consent', e.target.checked);
              touch('consent');
            }}
            aria-invalid={Boolean(visibleError('consent'))}
            aria-describedby={visibleError('consent') ? `${formId}-consent-error` : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--color-ink))]"
          />
          <span className="text-sm">
            Я согласен(на) на обработку персональных данных в соответствии с{' '}
            <Link to="/privacy" className="underline underline-offset-4" target="_blank">
              политикой обработки персональных данных
            </Link>
          </span>
        </label>
        {visibleError('consent') && <ErrorText id={`${formId}-consent-error`}>{visibleError('consent')}</ErrorText>}
      </div>

      {/* Ловушка для спам-ботов: поле спрятано от людей и от экранных чтецов */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Сайт
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {sendError && (
        <p role="alert" className="rounded-2xl bg-[#FEF3F2] p-4 text-sm font-medium text-[#B42318]">
          {sendError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending' || enrollClosed}
        className="inline-flex h-14 items-center gap-2 rounded-full bg-accent px-8 font-semibold text-ink transition-colors hover:bg-accent-hover disabled:opacity-70"
      >
        {status === 'sending' && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
        {status === 'sending' ? 'Отправляем…' : enroll ? 'Отправить заявку' : 'Отправить'}
      </button>
    </form>
  );
}

function Field({ id, label, error, required, children }: { id: string; label: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold">
        {label}
        {required && (
          <span className="text-muted" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  );
}

// Текст ошибки красным; role="alert" — экранный чтец сразу его озвучит
function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-2 text-sm font-medium text-[#B42318]">
      {children}
    </p>
  );
}
