import { resources } from '../data/pages';
import { DocList } from '../components/ui/DocList';
import { PageHeader } from '../components/ui/PageHeader';

/** Электронные образовательные ресурсы, сгруппированные по темам */
export function ResourcesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Обучение"
        title="Электронные образовательные ресурсы"
        crumbs={[{ label: 'Обучение', to: '/directions' }]}
        lead={resources.intro}
      />
      <div className="container-x grid gap-16 pb-20 lg:grid-cols-2 lg:gap-x-12 lg:pb-28">
        {resources.groups.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h2 className="font-display text-h3 font-semibold">{group.title}</h2>
            <div className="mt-6">
              <DocList items={group.items} />
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
