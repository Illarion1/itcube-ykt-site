import type { ReactNode } from 'react';
import { getDocList } from '../api';
import { useData } from '../hooks/useData';
import { equipmentDoc } from '../data/pages';
import type { DocLink } from '../data/pages';
import type { Crumb } from '../components/ui/Breadcrumbs';
import { DocList } from '../components/ui/DocList';
import { PageHeader } from '../components/ui/PageHeader';

type Props = {
  title: string;
  eyebrow: string;
  crumbs: Crumb[];
  lead?: ReactNode;
  // null — список ещё загружается
  items: DocLink[] | null;
};

/**
 * Простая страница «заголовок + список файлов».
 * Используется для «Оборудования» и «Плана мероприятий».
 */
export function DocListPage({ title, eyebrow, crumbs, lead, items }: Props) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} crumbs={crumbs} lead={lead} />
      <div className="container-x pb-20 lg:pb-28">
        <div className="max-w-4xl">
          {items && items.length === 0 ? (
            <p className="rounded-card bg-surface p-6 text-muted">Документы скоро появятся.</p>
          ) : (
            <DocList items={items ?? []} />
          )}
        </div>
      </div>
    </>
  );
}

// Две готовые страницы на основе DocListPage.
// Файлы «Плана мероприятий» добавляют в админ-панели (раздел «Документы»)
const aboutCrumbs = [{ label: 'О центре', to: '/about' }];

export function EquipmentPage() {
  return <DocListPage eyebrow="О центре" title="Оборудование центра" crumbs={aboutCrumbs} items={[equipmentDoc]} />;
}

export function EventsPlanPage() {
  const { data } = useData(() => getDocList('events-plan'));
  return <DocListPage eyebrow="О центре" title="План мероприятий" crumbs={aboutCrumbs} items={data} />;
}
