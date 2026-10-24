import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export type Crumb = {
  label: string;
  // Нет адреса — значит, это текущая страница
  to?: string;
};

/** «Хлебные крошки»: Главная › О центре › Помещения */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: 'Главная', to: '/' }, ...items];

  return (
    <nav aria-label="Вы здесь">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        {all.map((crumb, index) => (
          <li key={crumb.label} className="flex items-center gap-2">
            {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
            {crumb.to ? (
              <Link to={crumb.to} className="transition-colors hover:text-ink">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
