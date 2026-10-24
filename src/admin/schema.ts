/**
 * Схема содержимого сайта: какие разделы можно менять в админ-панели и из каких полей
 * состоит каждая запись.
 *
 * Файл общий для двух сторон: по нему админ-панель строит формы, а сервер (папка server)
 * проверяет присланные данные. Поэтому здесь нет React — только описание и проверки
 * (и общие правила из src/lib, которые тоже нужны обеим сторонам).
 * Чтобы добавить поле, достаточно дописать его сюда: форма и проверка появятся сами.
 */
import { days, newGroupId, TIME } from '../lib/schedule.ts';

export type CollectionName = 'news' | 'directions' | 'categories' | 'team' | 'documents' | 'faq' | 'partners';

/** Запись любого раздела: объект «имя поля → значение» */
export type Item = Record<string, unknown>;

/** Ошибки формы: «имя поля → текст ошибки». У полей списка имя вида items.2.title */
export type FieldErrors = Record<string, string>;

export type Option = { value: string; label: string };

/** Подсказки при вводе берутся из значений поля другого раздела (например, ФИО педагогов) */
export type Suggest = { collection: CollectionName; field: string };

type Base = {
  name: string;
  label: string;
  // Пояснение под названием поля — пишем простыми словами, что и как заполнять
  hint?: string;
  required?: boolean;
  // Ширина на компьютере: половина или треть строки (на телефоне все поля во всю ширину)
  width?: 'half' | 'third';
};

export type Field =
  | (Base & { type: 'text'; max?: number; placeholder?: string; suggest?: Suggest; default?: string })
  | (Base & { type: 'textarea'; max?: number; rows?: number; placeholder?: string })
  // Текст из нескольких абзацев: в форме — одно большое поле, абзацы разделяются переводом строки
  | (Base & { type: 'paragraphs'; placeholder?: string })
  | (Base & { type: 'number'; min: number; max: number; integer?: boolean })
  | (Base & { type: 'select' | 'radio'; options: Option[]; default?: string })
  // Переключатель «да / нет», например «Запись открыта»
  | (Base & { type: 'boolean'; onLabel: string; offLabel: string })
  // Выбор записи из другого раздела (например, категория направления)
  | (Base & { type: 'reference'; collection: CollectionName })
  // Несколько коротких значений («метки»): направления педагога
  | (Base & { type: 'tags'; suggest?: Suggest; placeholder?: string })
  | (Base & { type: 'image'; aspect?: string })
  | (Base & { type: 'images' })
  // Файл: загрузить на сайт или вставить ссылку
  | (Base & { type: 'file' })
  | (Base & { type: 'url'; placeholder?: string })
  | (Base & { type: 'date' })
  | (Base & { type: 'icon' })
  // Адрес записи латиницей. Заполняется сам по полю from; после создания не меняется
  | (Base & { type: 'slug'; from: string; prefix?: string; hidden?: boolean })
  // Список однотипных элементов, например документы раздела
  | (Base & { type: 'list'; of: Field[]; addLabel: string })
  // Группы направления: название, свободные места и занятия по дням недели (см. src/lib/schedule.ts)
  | (Base & { type: 'groups' })
  // Служебное поле: в форме не показывается, значение сохраняется как есть
  | (Base & { type: 'hidden' });

export type Collection = {
  name: CollectionName;
  // Название раздела в меню админ-панели
  label: string;
  // Как назвать одну запись в винительном падеже: «Добавить новость», «Удалить сотрудника?»
  one: string;
  // Заголовок формы для новой записи
  newTitle: string;
  // Поле с уникальным номером записи и как этот номер получается:
  // number — следующее число, slug — из поля-адреса, auto — латиницей из названия
  idField: string;
  idKind: 'number' | 'slug' | 'auto';
  // Поле, которое служит названием записи в списках
  titleField: string;
  // true — порядок записей задают вручную, и на сайте они идут в том же порядке
  ordered: boolean;
  // Новые записи добавляются в начало файла (новости), остальные — в конец
  newFirst?: boolean;
  fields: Field[];
  // Дополнительные проверки, в которых участвуют несколько полей
  check?: (item: Item) => FieldErrors;
};

// ---------- Разделы ----------

const news: Collection = {
  name: 'news',
  label: 'Новости и события',
  one: 'новость',
  newTitle: 'Новая новость',
  idField: 'id',
  idKind: 'number',
  titleField: 'title',
  ordered: false,
  newFirst: true,
  fields: [
    { name: 'title', label: 'Заголовок', type: 'text', required: true, max: 200 },
    {
      name: 'date',
      label: 'Дата',
      type: 'date',
      required: true,
      width: 'half',
      hint: 'На сайте новости идут от новых к старым.',
    },
    {
      name: 'image',
      label: 'Обложка',
      type: 'image',
      aspect: '4/3',
      hint: 'Главное фото, его видно в списке новостей. Лучше горизонтальное. Без обложки будет цветная карточка с датой.',
    },
    {
      name: 'content',
      label: 'Текст',
      type: 'paragraphs',
      hint: 'Каждый абзац начинайте с новой строки. Ссылки (https://…) станут кликабельными сами.',
    },
    {
      name: 'gallery',
      label: 'Фотографии',
      type: 'images',
      hint: 'Фотоотчёт под текстом новости. Можно выбрать сразу несколько фото.',
    },
    {
      name: 'excerpt',
      label: 'Анонс',
      type: 'textarea',
      rows: 3,
      max: 500,
      // Пустой анонс так и хранится пустым: сайт сам берёт начало текста (см. src/api/index.ts),
      // поэтому после правки текста анонс тоже обновится
      hint: 'Пара предложений для карточки в списке новостей. Можно не заполнять: возьмём начало текста.',
    },
  ],
  check: (item): FieldErrors => {
    const content = item.content as string[];
    const excerpt = item.excerpt as string;
    return content.length === 0 && !excerpt ? { content: 'Напишите текст новости' } : {};
  },
};

// Направление — то, на что записывают ребёнка: «Шахматы», «Python-разработка» и т.д.
// У каждого свой возраст, уровень и педагог, а ещё запись на обучение и свободные места
const directions: Collection = {
  name: 'directions',
  label: 'Направления',
  one: 'направление',
  newTitle: 'Новое направление',
  idField: 'id',
  idKind: 'auto',
  titleField: 'title',
  ordered: true,
  fields: [
    { name: 'title', label: 'Название направления', type: 'text', required: true, max: 200 },
    { name: 'category', label: 'Категория', type: 'reference', collection: 'categories', required: true, width: 'half' },
    {
      name: 'level',
      label: 'Уровень',
      type: 'select',
      required: true,
      width: 'half',
      options: ['Ознакомительный', 'Стартовый', 'Базовый', 'Продвинутый', 'Углубленный'].map((value) => ({ value, label: value })),
    },
    {
      name: 'enrollOpen',
      label: 'Запись на обучение',
      type: 'boolean',
      onLabel: 'Запись открыта',
      offLabel: 'Запись закрыта',
      hint: 'Включите, когда идёт набор, и укажите свободные места у нужных групп (ниже, в «Группах и расписании»). В «Вакантных местах» и в форме записи появятся только группы со свободными местами.',
    },
    { name: 'ageFrom', label: 'Возраст от, лет', type: 'number', min: 5, max: 18, integer: true, required: true, width: 'third' },
    { name: 'ageTo', label: 'Возраст до, лет', type: 'number', min: 5, max: 18, integer: true, required: true, width: 'third' },
    { name: 'hoursPerWeek', label: 'Часов в неделю', type: 'number', min: 0.5, max: 40, required: true, width: 'third' },
    { name: 'duration', label: 'Срок обучения', type: 'text', required: true, default: '1 год', max: 40, width: 'half' },
    {
      name: 'teacher',
      label: 'Педагог',
      type: 'text',
      required: true,
      max: 200,
      width: 'half',
      suggest: { collection: 'team', field: 'name' },
      hint: 'Выберите из подсказок или впишите ФИО.',
    },
    {
      name: 'groups',
      label: 'Группы и расписание',
      type: 'groups',
      hint: 'У каждой группы — название, свободные места и дни занятий. Если группа занимается два раза в неделю, добавьте ей два дня. Свободные места видны на сайте, только когда запись открыта.',
    },
    { name: 'room', label: 'Где проходят занятия', type: 'text', max: 100, width: 'half', placeholder: 'Кабинет 303' },
    {
      name: 'scheduleNote',
      label: 'Примечание к расписанию',
      type: 'text',
      max: 200,
      width: 'half',
      placeholder: 'Например: только со своими наборами',
    },
    {
      name: 'annotation',
      label: 'Описание',
      type: 'textarea',
      required: true,
      rows: 6,
      max: 5000,
      hint: 'Чему научится ребёнок. На сайте открывается кнопкой «Показать описание».',
    },
    {
      name: 'url',
      label: 'Программа обучения',
      type: 'file',
      hint: 'Документ программы: загрузите PDF или вставьте ссылку, например на Яндекс Диск. На карточке появится ссылка «Программа обучения».',
    },
  ],
  check: (item): FieldErrors =>
    typeof item.ageFrom === 'number' && typeof item.ageTo === 'number' && item.ageTo < item.ageFrom
      ? { ageTo: 'Не может быть меньше возраста «от»' }
      : {},
};

// Категория — общий раздел, в котором собраны похожие направления
// («Программирование на Python», «Го и шахматы»). Нужна, чтобы на сайте было удобно искать
const categories: Collection = {
  name: 'categories',
  label: 'Категории направлений',
  one: 'категорию',
  newTitle: 'Новая категория',
  idField: 'slug',
  idKind: 'slug',
  titleField: 'title',
  ordered: true,
  fields: [
    { name: 'title', label: 'Название категории', type: 'text', required: true, max: 80 },
    {
      name: 'slug',
      label: 'Адрес страницы',
      type: 'slug',
      from: 'title',
      prefix: '/directions/',
      hint: 'Латинскими буквами. Заполняется сам по названию, после создания не меняется.',
    },
    {
      name: 'kind',
      label: 'Тип',
      type: 'radio',
      required: true,
      default: 'extra',
      options: [
        { value: 'core', label: 'Базовая — из федерального проекта «IT-куб»' },
        { value: 'extra', label: 'Дополнительная' },
      ],
      hint: 'Базовые показываются на главной странице карточками, дополнительные — списком под ними.',
    },
    {
      name: 'short',
      label: 'Короткое описание',
      type: 'textarea',
      required: true,
      rows: 3,
      max: 300,
      hint: 'Одно-два предложения о том, что изучают. Видно на карточке категории.',
    },
    { name: 'icon', label: 'Значок', type: 'icon', hint: 'Картинка на карточке категории.' },
  ],
};

const team: Collection = {
  name: 'team',
  label: 'Педагоги и сотрудники',
  one: 'сотрудника',
  newTitle: 'Новый сотрудник',
  idField: 'id',
  idKind: 'auto',
  titleField: 'name',
  ordered: true,
  fields: [
    { name: 'name', label: 'Фамилия, имя, отчество', type: 'text', required: true, max: 120, placeholder: 'Иванова Анна Петровна' },
    { name: 'role', label: 'Должность', type: 'text', required: true, max: 200, placeholder: 'Педагог дополнительного образования' },
    {
      name: 'group',
      label: 'Где показывать',
      type: 'radio',
      required: true,
      default: 'teacher',
      options: [
        { value: 'teacher', label: 'В разделе «Педагоги»' },
        { value: 'leadership', label: 'В разделе «Руководство»' },
      ],
    },
    {
      name: 'photo',
      label: 'Фото',
      type: 'image',
      aspect: '4/5',
      hint: 'Вертикальное фото, лицо по центру. Пока фото нет, на сайте показываются инициалы.',
    },
    {
      name: 'directions',
      label: 'Направления',
      type: 'tags',
      suggest: { collection: 'directions', field: 'title' },
      placeholder: 'Например, Web-разработка',
      hint: 'Чему учит педагог. Напечатайте и нажмите Enter или выберите из подсказок. На карточке видны первые три.',
    },
  ],
};

const documents: Collection = {
  name: 'documents',
  label: 'Документы',
  one: 'раздел документов',
  newTitle: 'Новый раздел документов',
  idField: 'slug',
  idKind: 'slug',
  titleField: 'title',
  ordered: true,
  fields: [
    { name: 'title', label: 'Название раздела', type: 'text', required: true, max: 200 },
    { name: 'slug', label: 'Адрес раздела', type: 'slug', from: 'title', hidden: true },
    {
      name: 'page',
      label: 'Где показывать',
      type: 'radio',
      required: true,
      default: 'documents',
      options: [
        { value: 'documents', label: 'На странице «Документы»' },
        { value: 'events-plan', label: 'На странице «План мероприятий»' },
        { value: 'vacancies', label: 'На странице «Вакантные места»' },
        { value: 'schedule', label: 'На странице «Расписание занятий»' },
      ],
    },
    {
      name: 'items',
      label: 'Файлы и ссылки',
      type: 'list',
      addLabel: 'Добавить документ',
      hint: 'Порядок здесь — порядок на сайте.',
      of: [
        { name: 'title', label: 'Название документа', type: 'text', required: true, max: 300 },
        { name: 'url', label: 'Файл или ссылка', type: 'file', required: true },
        // Адрес файла на старом сайте — для истории, на сайте не показывается
        { name: 'originalUrl', label: 'Адрес на старом сайте', type: 'hidden' },
      ],
    },
  ],
};

const faq: Collection = {
  name: 'faq',
  label: 'Вопросы и ответы',
  one: 'вопрос',
  newTitle: 'Новый вопрос',
  idField: 'id',
  idKind: 'auto',
  titleField: 'question',
  ordered: true,
  fields: [
    { name: 'question', label: 'Вопрос', type: 'text', required: true, max: 300 },
    { name: 'answer', label: 'Ответ', type: 'paragraphs', required: true, hint: 'Каждый абзац начинайте с новой строки.' },
  ],
};

const partners: Collection = {
  name: 'partners',
  label: 'Партнёры',
  one: 'партнёра',
  newTitle: 'Новый партнёр',
  idField: 'id',
  idKind: 'auto',
  titleField: 'name',
  ordered: true,
  fields: [
    { name: 'name', label: 'Название организации', type: 'text', required: true, max: 200 },
    { name: 'role', label: 'Чем помогает', type: 'text', max: 200, placeholder: 'Например, федеральный оператор проекта' },
    {
      name: 'short',
      label: 'Сокращение',
      type: 'text',
      max: 5,
      width: 'half',
      placeholder: 'ИНТ',
      hint: '2–4 буквы. Показываются в квадратике, если нет логотипа.',
    },
    { name: 'logo', label: 'Логотип', type: 'image', aspect: '1/1', width: 'half' },
    { name: 'url', label: 'Сайт', type: 'url', placeholder: 'https://' },
  ],
  check: (item): FieldErrors => (!item.short && !item.logo ? { short: 'Укажите сокращение или загрузите логотип' } : {}),
};

/** Все разделы — в том порядке, в каком они идут в меню админ-панели */
export const collectionList: Collection[] = [news, directions, categories, team, documents, faq, partners];

export const collections = Object.fromEntries(collectionList.map((c) => [c.name, c])) as Record<CollectionName, Collection>;

export function isCollectionName(name: string): name is CollectionName {
  return Object.prototype.hasOwnProperty.call(collections, name);
}

// ---------- Помощники ----------

// Русские (и якутские) буквы латиницей — для адресов страниц и имён файлов
const translitMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ҕ: 'g', ҥ: 'ng', ө: 'o', һ: 'h', ү: 'u',
};

/** «Программирование на Python» → 'programmirovanie-na-python' */
export function slugify(text: string) {
  return [...text.toLowerCase()]
    .map((ch) => translitMap[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Значение по умолчанию для поля новой записи */
export function emptyValue(field: Field): unknown {
  switch (field.type) {
    case 'paragraphs':
    case 'tags':
    case 'images':
    case 'list':
    case 'groups':
      return [];
    case 'image':
    case 'file':
    case 'url':
    case 'number':
      return null;
    case 'text':
    case 'select':
    case 'radio':
      return field.default ?? '';
    case 'boolean':
      return false;
    case 'hidden':
      return undefined;
    default:
      return '';
  }
}

// ---------- Проверка записи ----------

/** Как найти записи другого раздела — нужно, чтобы проверить выбор категории у направления */
export type Lookup = (name: CollectionName) => Item[] | undefined;

const asText = (value: unknown) => (typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '');

// Ссылку без https:// дополняем сами: vk.com/itcube → https://vk.com/itcube
function normalizeLink(value: string) {
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value) && !value.startsWith('/')) return `https://${value}`;
  return value;
}
const isLink = (value: string) => /^https?:\/\/\S+$/i.test(value) || /^\/[^/\s]/.test(value);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function checkField(field: Field, raw: unknown, key: string, errors: FieldErrors, lookup?: Lookup): unknown {
  const fail = (message: string) => {
    errors[key] = message;
  };

  switch (field.type) {
    case 'boolean':
      return raw === true || raw === 'true' || raw === 'on';

    case 'text':
    case 'textarea':
    case 'select':
    case 'radio':
    case 'reference':
    case 'icon':
    case 'date':
    case 'slug': {
      const value = field.type === 'textarea' ? (typeof raw === 'string' ? raw.replace(/\r\n/g, '\n').trim() : '') : asText(raw);
      const choose = field.type === 'select' || field.type === 'radio' || field.type === 'reference';
      if (!value) {
        if (field.required) fail(choose ? 'Выберите вариант' : 'Заполните это поле');
        return '';
      }
      const max = field.type === 'text' || field.type === 'textarea' ? (field.max ?? (field.type === 'text' ? 300 : 5000)) : 200;
      if (value.length > max) fail(`Слишком длинно: не больше ${max} символов`);
      if ((field.type === 'select' || field.type === 'radio') && !field.options.some((o) => o.value === value)) fail('Выберите вариант из списка');
      if (field.type === 'reference') {
        const target = collections[field.collection];
        const items = lookup?.(field.collection);
        if (items && !items.some((x) => String(x[target.idField]) === value)) fail('Такой записи нет — выберите из списка');
      }
      if (field.type === 'date' && !ISO_DATE.test(value)) fail('Укажите дату');
      if (field.type === 'slug' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) fail('Только латинские буквы, цифры и дефис');
      if (field.type === 'icon' && !/^[a-z0-9-]+$/.test(value)) fail('Выберите значок');
      return value;
    }

    case 'paragraphs': {
      const lines = (Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split('\n') : []).map(asText).filter(Boolean);
      if (field.required && lines.length === 0) fail('Заполните это поле');
      if (lines.join('').length > 100_000) fail('Слишком длинный текст');
      return lines;
    }

    case 'tags': {
      const tags = [...new Set((Array.isArray(raw) ? raw : []).map(asText).filter(Boolean))];
      if (field.required && tags.length === 0) fail('Добавьте хотя бы одно значение');
      if (tags.some((t) => t.length > 150)) fail('Слишком длинное значение: не больше 150 символов');
      return tags;
    }

    case 'number': {
      const value = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw.replace(',', '.')) : NaN;
      if (Number.isNaN(value)) {
        if (field.required) fail(raw === null || raw === undefined || raw === '' ? 'Укажите число' : 'Нужно число');
        return null;
      }
      if (field.integer && !Number.isInteger(value)) fail('Нужно целое число');
      else if (value < field.min || value > field.max) fail(`Число от ${field.min} до ${field.max}`);
      return value;
    }

    case 'image':
    case 'file':
    case 'url': {
      const value = normalizeLink(asText(raw));
      if (!value) {
        if (field.required) fail(field.type === 'image' ? 'Загрузите фото' : field.type === 'file' ? 'Загрузите файл или вставьте ссылку' : 'Вставьте ссылку');
        return null;
      }
      if (!isLink(value)) fail('Ссылка должна начинаться с https://');
      return value;
    }

    case 'images': {
      const list = (Array.isArray(raw) ? raw : []).map(asText).filter(Boolean);
      if (list.some((src) => !isLink(src))) fail('Неверная ссылка на фото');
      if (field.required && list.length === 0) fail('Загрузите хотя бы одно фото');
      return list;
    }

    case 'list': {
      const rows = Array.isArray(raw) ? raw : [];
      if (rows.length > 500) fail('Слишком много элементов: не больше 500');
      if (field.required && rows.length === 0) fail('Добавьте хотя бы один элемент');
      return rows.map((row, index) => {
        const source = row && typeof row === 'object' ? (row as Item) : {};
        const result: Item = {};
        for (const sub of field.of) {
          const value = checkField(sub, source[sub.name], `${key}.${index}.${sub.name}`, errors, lookup);
          if (value !== undefined) result[sub.name] = value;
        }
        return result;
      });
    }

    case 'groups': {
      const rows = Array.isArray(raw) ? raw : [];
      if (rows.length > 50) fail('Слишком много групп: не больше 50');
      const ids = new Set<string>();
      const names = new Set<string>();
      return rows.map((row, index) => {
        const source = row && typeof row === 'object' ? (row as Item) : {};
        const at = (name: string) => `${key}.${index}.${name}`;
        // Номер группы не меняется при переименовании: по нему заявка находит свою группу
        let id = asText(source.id);
        if (!/^[a-z0-9-]{1,40}$/.test(id) || ids.has(id)) id = newGroupId();
        ids.add(id);

        const name = asText(source.name);
        if (!name) errors[at('name')] = 'Напишите название группы';
        else if (name.length > 60) errors[at('name')] = 'Слишком длинно: не больше 60 символов';
        else if (names.has(name.toLowerCase())) errors[at('name')] = 'Группа с таким названием уже есть';
        names.add(name.toLowerCase());

        const rawSeats = asText(source.seats);
        const seats = rawSeats === '' ? 0 : Number(rawSeats);
        if (!Number.isInteger(seats) || seats < 0 || seats > 100) errors[at('seats')] = 'Свободных мест — целое число от 0 до 100';

        const list = Array.isArray(source.lessons) ? source.lessons : [];
        if (list.length > 20) errors[at('name')] ??= 'Слишком много занятий у группы: не больше 20';
        const lessons = list.map((lesson, j) => {
          const from = lesson && typeof lesson === 'object' ? (lesson as Item) : {};
          const lessonAt = (part: string) => at(`lessons.${j}.${part}`);
          const day = asText(from.day);
          const start = asText(from.start);
          const end = asText(from.end);
          if (!days.some((d) => d.value === day)) errors[lessonAt('day')] = 'Выберите день недели';
          if (!TIME.test(start)) errors[lessonAt('start')] = 'Укажите время начала';
          if (!TIME.test(end)) errors[lessonAt('end')] = 'Укажите время окончания';
          else if (TIME.test(start) && end <= start) errors[lessonAt('end')] = 'Занятие должно закончиться позже, чем началось';
          return { day, start, end };
        });
        return { id, name, seats: Number.isInteger(seats) ? seats : 0, lessons };
      });
    }

    case 'hidden':
      return raw === undefined ? undefined : raw;
  }
}

/**
 * Проверяет и «причёсывает» запись: обрезает пробелы, приводит числа и ссылки к одному виду,
 * отбрасывает лишние поля. Возвращает готовую запись и ошибки (пустой объект — ошибок нет).
 */
export function validateItem(collection: Collection, input: unknown, lookup?: Lookup): { item: Item; errors: FieldErrors } {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? (input as Item) : {};
  const errors: FieldErrors = {};
  const item: Item = {};

  for (const field of collection.fields) {
    const value = checkField(field, source[field.name], field.name, errors, lookup);
    if (value !== undefined) item[field.name] = value;
  }

  for (const [key, message] of Object.entries(collection.check?.(item) ?? {})) {
    errors[key] ??= message;
  }
  return { item, errors };
}

/** Есть ли ошибки */
export const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;
