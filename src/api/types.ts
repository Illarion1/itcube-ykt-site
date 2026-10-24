// Типы данных сайта — «форма» каждой записи.
// Поля и их проверки для админ-панели описаны в src/admin/schema.ts — при изменении меняйте оба файла.
import type { Group } from '../lib/schedule';

export type CategoryKind = 'core' | 'extra';

/**
 * Категория — общий раздел, в котором собраны похожие направления
 * (например, «Программирование на Python» или «Го и шахматы»)
 */
export type Category = {
  slug: string;
  title: string;
  // core — базовые категории федерального проекта «IT-куб», extra — дополнительные
  kind: CategoryKind;
  short: string;
  // Название значка (см. components/ui/CategoryIcon.tsx)
  icon?: string;
};

/** Категория + сводка по её направлениям (считается автоматически) */
export type CategorySummary = Category & {
  directionsCount: number;
  // Сколько направлений категории сейчас принимают заявки на запись
  openCount: number;
  ageFrom: number;
  ageTo: number;
  hoursMin: number;
  hoursMax: number;
  duration: string;
};

/** Направление — то, на что записывают ребёнка (например, «Шахматы» или «Python-разработка») */
export type Direction = {
  id: string;
  // slug категории
  category: string;
  title: string;
  level: string;
  duration: string;
  hoursPerWeek: number;
  ageFrom: number;
  ageTo: number;
  teacher: string;
  annotation: string;
  // Документ программы обучения: загруженный на сайт (/uploads/…) или ссылка (Яндекс Диск)
  url: string | null;
  // Запись открыта; записаться можно только в группы, где ещё есть свободные места
  enrollOpen: boolean;
  // Группы: название, свободные места и занятия по дням недели (пустой список — групп и расписания ещё нет)
  groups: Group[];
  // Где проходят занятия: «Кабинет 303»
  room: string;
  // Примечание к расписанию: «Только со своими наборами»
  scheduleNote: string;
};

/** Новость */
export type NewsItem = {
  id: number;
  title: string;
  // Дата в формате ISO: '2026-06-01T18:30:49+09:00'
  date: string;
  excerpt: string;
  image: string | null;
  // Полный текст по абзацам (у части старых новостей сохранился только анонс)
  content?: string[];
  // Фотоотчёт под текстом
  gallery?: string[];
};

/** Результаты поиска по сайту, сгруппированные по типам */
export type SearchResults = {
  pages: { title: string; description: string; to: string }[];
  categories: { title: string; description: string; to: string }[];
  directions: { title: string; description: string; to: string }[];
  news: { title: string; description: string; to: string; date: string }[];
};

/** Сотрудник центра */
export type TeamMember = {
  id: string;
  name: string;
  role: string;
  group: 'leadership' | 'teacher';
  directions: string[];
  photo: string | null;
};

/** Цифры для блока «Центр в цифрах» */
export type Stats = {
  directions: number;
  categories: number;
  teachers: number;
  foundedYear: number;
};

export type DocItem = { title: string; url: string; originalUrl?: string };

/** На какой странице показывается раздел документов */
export type DocPage = 'documents' | 'events-plan' | 'vacancies' | 'schedule';

/** Группа документов (например, «Документы федерального уровня») */
export type DocGroup = {
  slug: string;
  title: string;
  page: DocPage;
  items: DocItem[];
};

/** Вопрос и ответ (страница «Вопросы и ответы») */
export type FaqItem = {
  id: string;
  question: string;
  answer: string[];
};

/** Партнёр центра */
export type Partner = {
  id: string;
  name: string;
  // Аббревиатура — показывается вместо логотипа
  short: string;
  role: string;
  url: string | null;
  logo: string | null;
};

/** Одна страница списка (для новостей с пагинацией) */
export type Paginated<T> = {
  items: T[];
  page: number;
  pages: number;
  total: number;
};
