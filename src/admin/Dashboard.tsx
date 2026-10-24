import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardCheck, Inbox, Plus } from 'lucide-react';
import { freeSeats, isEnrollable, openGroups } from '../lib/enroll';
import type { Group } from '../lib/schedule';
import { formatDate, plural } from '../lib/format';
import type { SessionUser } from './api';
import { useApplications } from './applications';
import { collectionList } from './schema';
import type { Collection } from './schema';
import { useCollection } from './store';
import { Btn, PageHeading } from './ui';
import { views } from './views';

/** Главная страница админ-панели: быстрые действия, разделы и короткая инструкция */
export function Dashboard({ user }: { user: SessionUser }) {
  return (
    <>
      <PageHeading
        title={`Здравствуйте, ${user.name}!`}
        description="Здесь принимают заявки с сайта и меняют его содержимое. Всё, что вы сохраните, сразу появляется на сайте."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ApplicationsCard />
        <EnrollmentCard />
      </div>

      <section aria-label="Быстрые действия" className="mt-6 flex flex-wrap gap-2">
        <Btn to="/admin/news/new" variant="primary" icon={Plus}>
          Добавить новость
        </Btn>
        <Btn to="/admin/directions/new" icon={Plus}>
          Добавить направление
        </Btn>
        <Btn to="/admin/team/new" icon={Plus}>
          Добавить сотрудника
        </Btn>
      </section>

      <section aria-labelledby="sections-title" className="mt-10">
        <h2 id="sections-title" className="font-display text-lg font-semibold">
          Разделы сайта
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {collectionList.map((collection) => (
            <li key={collection.name}>
              <SectionCard collection={collection} />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <LatestNews />
        <Help />
      </div>
    </>
  );
}

/** Новые заявки с сайта — самое срочное, поэтому наверху */
function ApplicationsCard() {
  const { list } = useApplications();
  const fresh = list?.filter((a) => a.status === 'new').length ?? 0;
  return (
    <Link to="/admin/applications" className={`group flex items-center gap-4 rounded-card p-6 transition-colors ${fresh > 0 ? 'bg-accent hover:bg-accent-hover' : 'bg-white hover:bg-surface-strong'}`}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white" aria-hidden="true">
        <Inbox size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-semibold">
          {list ? (fresh > 0 ? `${fresh} ${plural(fresh, ['новая заявка', 'новые заявки', 'новых заявок'])}` : 'Новых заявок нет') : 'Заявки…'}
        </span>
        <span className="mt-0.5 block text-sm">{fresh > 0 ? 'Откройте, чтобы позвонить или ответить' : 'Заявки с формы на сайте появятся здесь'}</span>
      </span>
      <ChevronRight size={20} className="shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

/** Сводка по записи: на сколько направлений сейчас можно записаться */
function EnrollmentCard() {
  const { items } = useCollection('directions');
  const open = (items ?? []).filter(isEnrollable);
  const seats = open.reduce((sum, d) => sum + freeSeats(d), 0);
  const groups = open.flatMap((d) => openGroups(d as { enrollOpen?: unknown; groups?: Group[] })).length;
  return (
    <Link to="/admin/enrollment" className="group flex items-center gap-4 rounded-card bg-white p-6 transition-colors hover:bg-surface-strong">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface" aria-hidden="true">
        <ClipboardCheck size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-semibold">
          {items ? (open.length > 0 ? `Запись идёт: ${open.length} ${plural(open.length, ['направление', 'направления', 'направлений'])}` : 'Запись закрыта') : 'Запись…'}
        </span>
        <span className="mt-0.5 block text-sm text-muted">
          {open.length > 0
            ? `Свободно ${seats} ${plural(seats, ['место', 'места', 'мест'])} в ${groups} ${plural(groups, ['группе', 'группах', 'группах'])}. Изменить — в «Запись и места»`
            : 'Откройте запись и укажите свободные места в группах'}
        </span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

function SectionCard({ collection }: { collection: Collection }) {
  const { items } = useCollection(collection.name);
  const { icon: Icon, forms } = views[collection.name];

  return (
    <Link
      to={`/admin/${collection.name}`}
      className="group flex h-full items-center gap-4 rounded-card bg-white p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-card"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface transition-colors group-hover:bg-accent" aria-hidden="true">
        <Icon size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{collection.label}</span>
        <span className="mt-0.5 block text-sm text-muted">{items ? `${items.length} ${plural(items.length, forms)}` : '…'}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

function LatestNews() {
  const { items } = useCollection('news');
  const latest = [...(items ?? [])].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 4);

  return (
    <section aria-labelledby="latest-title" className="rounded-card bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id="latest-title" className="font-display text-lg font-semibold">
          Последние новости
        </h2>
        <Link to="/admin/news" className="text-sm font-semibold text-muted hover:text-ink">
          Все новости
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-line">
        {latest.map((item) => (
          <li key={String(item.id)}>
            <Link to={`/admin/news/${item.id}`} className="block py-3 hover:text-muted">
              <span className="block font-medium leading-snug">{String(item.title)}</span>
              <span className="text-sm text-muted">{formatDate(String(item.date))}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Help() {
  return (
    <section aria-labelledby="help-title" className="rounded-card bg-ink p-6 text-white">
      <h2 id="help-title" className="font-display text-lg font-semibold">
        Как это работает
      </h2>
      <ol className="mt-4 list-decimal space-y-2.5 pl-5 leading-relaxed text-white/80 marker:font-semibold marker:text-accent">
        <li>Выберите раздел в меню слева (на телефоне — кнопка меню вверху).</li>
        <li>Нажмите «Добавить…» или выберите запись, чтобы её изменить.</li>
        <li>Заполните поля: под названием каждого поля написано, что туда вписать. Сбоку видно, как запись будет выглядеть на сайте.</li>
        <li>Нажмите «Опубликовать» или «Сохранить» — изменения сразу появятся на сайте.</li>
      </ol>
      <p className="mt-5 text-sm leading-relaxed text-white/60">
        Удалили что-то по ошибке? Сервер хранит предыдущие версии данных — обратитесь к тому, кто обслуживает сайт, и их восстановят.
      </p>
    </section>
  );
}
