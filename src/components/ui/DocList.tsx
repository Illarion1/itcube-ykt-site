import { ArrowUpRight, FileText, Link2 } from 'lucide-react';
import type { DocLink } from '../../data/pages';
import { asset } from '../../lib/asset';

// Ссылка на PDF внутри нашего сайта (папка public/docs) или на внешний сайт
const isLocal = (url: string) => url.startsWith('/');
const isPdf = (url: string) => /\.pdf($|\?)/i.test(url);

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Список документов: иконка, название и подпись — PDF на нашем сайте
 * или внешняя ссылка (Яндекс Диск, сайт ЦТТ и т.д.). Всё открывается в новой вкладке.
 */
export function DocList({ items }: { items: DocLink[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((doc) => {
        const local = isLocal(doc.url);
        const Icon = isPdf(doc.url) ? FileText : Link2;
        return (
          <li key={doc.title + doc.url}>
            <a
              href={local ? asset(doc.url) : doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 py-5 transition-colors hover:bg-surface sm:px-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface transition-colors group-hover:bg-accent" aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-snug">{doc.title}</span>
                <span className="mt-1 block text-sm text-muted">
                  {local ? 'PDF · откроется в новой вкладке' : `${isPdf(doc.url) ? 'PDF · ' : ''}${hostOf(doc.url)}`}
                </span>
              </span>
              <ArrowUpRight
                size={18}
                aria-hidden="true"
                className="mt-1 shrink-0 text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
