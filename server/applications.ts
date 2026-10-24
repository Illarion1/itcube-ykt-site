/**
 * Заявки и обращения с сайта (форма «Обратная связь»).
 * Посетитель отправляет форму → заявка сохраняется в data/private/applications.json →
 * сотрудники видят её в админ-панели, в разделе «Заявки и обращения».
 *
 * Заявку на запись принимаем только в группу, где есть свободные места, на направление с открытой записью.
 * В заявке на запись name — ФИО ученика, а не родителя; ещё указываются возраст и класс ученика.
 */
import { randomBytes } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Item } from '../src/admin/schema.ts';
import { grades, isFullName, openGroups, STUDENT_AGE_MAX, STUDENT_AGE_MIN } from '../src/lib/enroll.ts';
import type { Group } from '../src/lib/schedule.ts';
import { clientIp, HttpError } from './http.ts';
import type { Store } from './store.ts';

export type ApplicationStatus = 'new' | 'progress' | 'done';

export type Application = {
  id: string;
  createdAt: string;
  topic: 'enroll' | 'question' | 'idea';
  // Заявка на запись — ФИО ученика, вопрос или отзыв — имя автора
  name: string;
  // Возраст и класс ученика (только в заявке на запись)
  age: number | null;
  grade: string | null;
  phone: string;
  email: string;
  // Направление (для заявки на запись): номер и название на момент отправки
  directionId: string | null;
  directionTitle: string | null;
  // Группа: номер и название на момент отправки (у заявок, отправленных до групп, их нет)
  groupId?: string | null;
  groupName?: string | null;
  message: string;
  status: ApplicationStatus;
  // Комментарий сотрудника: «позвонили, записали в субботнюю группу»
  note: string;
  // Место по этой заявке уже вычтено из свободных мест группы
  seatTaken: boolean;
};

const TOPICS = ['enroll', 'question', 'idea'];
const STATUSES: ApplicationStatus[] = ['new', 'progress', 'done'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Защита от спама: не больше 5 обращений за 10 минут с одного адреса
const LIMIT = 5;
const WINDOW = 10 * 60 * 1000;

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export function createApplications(store: Store) {
  const recent = new Map<string, number[]>();

  function checkRate(req: IncomingMessage) {
    const ip = clientIp(req);
    const now = Date.now();
    const times = (recent.get(ip) ?? []).filter((time) => now - time < WINDOW);
    if (times.length >= LIMIT) throw new HttpError(429, 'Слишком много сообщений подряд. Подождите несколько минут или позвоните нам.');
    recent.set(ip, [...times, now]);
  }

  /** Новая заявка с сайта. null — сообщение от спам-бота: делаем вид, что приняли, но не сохраняем */
  async function submit(req: IncomingMessage, input: unknown): Promise<Application | null> {
    const body = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
    // Скрытое поле-ловушка: человек его не видит и не заполняет, а спам-боты заполняют всё подряд
    if (text(body.website, 200)) return null;
    checkRate(req);

    const topic = TOPICS.includes(String(body.topic)) ? (String(body.topic) as Application['topic']) : null;
    const name = text(body.name, 100);
    const phone = text(body.phone, 30);
    const email = text(body.email, 120);
    const message = text(body.message, 3000);
    const directionId = text(body.direction, 100);
    const groupId = text(body.group, 60);

    const enroll = topic === 'enroll';
    const age = enroll ? Number(typeof body.age === 'number' ? body.age : text(body.age, 10) || NaN) : null;
    const grade = enroll ? text(body.grade, 40) : null;

    const errors: Record<string, string> = {};
    if (!topic) errors.topic = 'Выберите тему обращения';
    if (enroll) {
      if (!isFullName(name)) errors.name = 'Укажите фамилию и имя ученика';
      if (!Number.isInteger(age) || (age as number) < STUDENT_AGE_MIN || (age as number) > STUDENT_AGE_MAX) {
        errors.age = `Укажите возраст ученика: от ${STUDENT_AGE_MIN} до ${STUDENT_AGE_MAX} лет`;
      }
      if (!grades.includes(grade ?? '')) errors.grade = 'Выберите класс';
    } else if (name.length < 2) errors.name = 'Укажите имя — хотя бы 2 буквы';
    const digits = phone.replace(/\D/g, '').length;
    if (!phone && !email) errors.phone = 'Оставьте телефон или e-mail, чтобы мы могли ответить';
    else if (phone && digits !== 10 && digits !== 11) errors.phone = 'Проверьте номер телефона';
    if (email && !EMAIL.test(email)) errors.email = 'Проверьте e-mail: например, name@mail.ru';
    if (topic && topic !== 'enroll' && message.length < 10) errors.message = 'Напишите сообщение — хотя бы 10 символов';
    if (body.consent !== true) errors.consent = 'Нужно согласие на обработку персональных данных';

    let directionTitle: string | null = null;
    let groupName: string | null = null;
    if (enroll) {
      const direction = (await store.read('directions')).find((d) => d.id === directionId);
      const groups = direction ? openGroups(direction as { enrollOpen?: unknown; groups?: Group[] }) : [];
      if (!directionId) errors.direction = 'Выберите направление';
      else if (!direction || groups.length === 0) errors.direction = 'На это направление сейчас нет записи — выберите другое';
      else {
        directionTitle = String(direction.title);
        const group = groups.find((g) => g.id === groupId);
        if (!groupId) errors.group = 'Выберите группу';
        else if (!group) errors.group = 'В этой группе мест уже нет — выберите другую';
        else groupName = group.name;
      }
    }
    if (!topic || Object.keys(errors).length > 0) throw new HttpError(422, 'Проверьте поля формы', errors);

    const application: Application = {
      id: `${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`,
      createdAt: new Date().toISOString(),
      topic,
      name,
      age,
      grade,
      phone,
      email,
      directionId: enroll ? directionId : null,
      directionTitle,
      groupId: enroll ? groupId : null,
      groupName,
      message,
      status: 'new',
      note: '',
      seatTaken: false,
    };
    // Новые — в начало списка
    await store.updatePrivate<Application, null>('applications', async (list) => ({ list: [application, ...list], result: null }));
    return application;
  }

  const list = () => store.readPrivate<Application>('applications');

  /**
   * Изменения от сотрудника: статус, комментарий и «записан — вычесть место».
   * Место вычитается из группы заявки — это меняет само направление; возвращаем его, чтобы админ-панель обновила числа.
   */
  async function update(id: string, input: unknown) {
    const body = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
    const status = body.status === undefined ? undefined : (String(body.status) as ApplicationStatus);
    if (status !== undefined && !STATUSES.includes(status)) throw new HttpError(422, 'Неизвестный статус заявки');
    const note = body.note === undefined ? undefined : text(body.note, 2000);
    const takeSeat = body.takeSeat === true;

    return store.updatePrivate<Application, { application: Application; direction: Item | null }>('applications', async (applications) => {
      const index = applications.findIndex((a) => a.id === id);
      if (index === -1) throw new HttpError(404, 'Заявка не найдена — возможно, её уже удалили');
      let application: Application = { ...applications[index], ...(status ? { status } : {}), ...(note !== undefined ? { note } : {}) };
      let direction: Item | null = null;

      if (takeSeat) {
        const { directionId, groupId } = application;
        if (application.topic !== 'enroll' || !directionId) throw new HttpError(400, 'Это не заявка на запись');
        if (application.seatTaken) throw new HttpError(409, 'Место по этой заявке уже вычтено');
        if (!groupId) throw new HttpError(409, 'В заявке не указана группа — уменьшите число мест в разделе «Запись и места»');
        direction = await store.update('directions', (items) => {
          const at = items.findIndex((d) => d.id === directionId);
          if (at === -1) throw new HttpError(404, 'Направление не найдено — возможно, его удалили');
          const groups = Array.isArray(items[at].groups) ? (items[at].groups as Group[]) : [];
          const group = groups.find((g) => g.id === groupId);
          if (!group) throw new HttpError(404, 'Группа не найдена — возможно, её удалили из расписания');
          if (group.seats <= 0) throw new HttpError(409, 'Свободных мест в этой группе уже нет');
          const changed = { ...items[at], groups: groups.map((g) => (g.id === groupId ? { ...g, seats: g.seats - 1 } : g)) };
          const next = [...items];
          next[at] = changed;
          return { items: next, result: changed };
        });
        application = { ...application, seatTaken: true, status: 'done' };
      }

      const next = [...applications];
      next[index] = application;
      return { list: next, result: { application, direction } };
    });
  }

  async function remove(id: string) {
    await store.updatePrivate<Application, null>('applications', async (applications) => {
      if (!applications.some((a) => a.id === id)) throw new HttpError(404, 'Заявка не найдена — возможно, её уже удалили');
      return { list: applications.filter((a) => a.id !== id), result: null };
    });
  }

  return { submit, list, update, remove };
}
