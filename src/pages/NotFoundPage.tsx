import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Seo } from '../components/ui/Seo';
import { Button } from '../components/ui/Button';
import { CubeOutline } from '../components/ui/CubeOutline';

// Куда чаще всего хотят попасть
const popular = [
  { label: 'Направления', to: '/directions' },
  { label: 'Приём на обучение', to: '/admission' },
  { label: 'Новости', to: '/news' },
  { label: 'Контакты', to: '/contacts' },
];

/** «Страница не найдена» — для неправильных адресов, несуществующих новостей и направлений */
export function NotFoundPage() {
  return (
    <section className="container-x grid items-center gap-12 py-16 lg:grid-cols-12 lg:py-24">
      <Seo title="Страница не найдена" noindex />
      <div className="lg:col-span-7">
        <p className="eyebrow">Ошибка 404</p>
        <h1 className="mt-6 font-display text-h1 font-semibold">Такой страницы нет</h1>
        <p className="mt-6 max-w-xl text-lead text-muted">
          Возможно, в адресе опечатка или страница переехала при обновлении сайта. Попробуйте найти нужное через поиск.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button to="/" variant="dark" arrow>
            На главную
          </Button>
          <Button to="/search" variant="outline">
            Поиск по сайту
          </Button>
        </div>
        <ul className="mt-12 grid gap-2 sm:grid-cols-2">
          {popular.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="group flex items-center justify-between rounded-2xl bg-surface px-5 py-4 font-semibold transition-colors hover:bg-accent">
                {link.label}
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative hidden aspect-square lg:col-span-5 lg:block" aria-hidden="true">
        <CubeOutline className="absolute inset-0 h-full w-full text-line" />
        <span className="absolute inset-0 grid place-items-center font-display text-[9rem] font-bold tracking-tighter">404</span>
      </div>
    </section>
  );
}
