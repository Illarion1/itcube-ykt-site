import { getDocuments } from '../api';
import { useData } from '../hooks/useData';
import { DocList } from '../components/ui/DocList';
import { PageHeader } from '../components/ui/PageHeader';

// Сведения из раздела «Образование» старого сайта
const educationFacts = [
  { term: 'Уровень образования', value: 'Дополнительное образование' },
  { term: 'Форма обучения', value: 'Очная, дистанционная, смешанная' },
  { term: 'Нормативный срок обучения', value: 'Определяется образовательной программой (п. 6.2 Устава МБУ ДО ЦТТ)' },
];

/**
 * Документы: оглавление групп слева (на компьютере оно «прилипает» при прокрутке)
 * и списки документов справа. Каждая группа — отдельный якорь (#federal и т.д.).
 */
export function DocumentsPage() {
  const groups = useData(getDocuments).data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="О центре"
        title="Документы"
        crumbs={[{ label: 'О центре', to: '/about' }]}
        lead="Программы, нормативные документы и локальные акты. Часть файлов спасена из веб-архива и хранится на этом сайте, остальные ведут на сайты, где они опубликованы."
      />

      <div className="container-x grid gap-12 pb-20 lg:grid-cols-12 lg:pb-28">
        <nav aria-label="Разделы документов" className="lg:col-span-4">
          <ul className="space-y-1 lg:sticky lg:top-24">
            {groups.map((group) => (
              <li key={group.slug}>
                <a
                  href={`#${group.slug}`}
                  className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3 font-medium transition-colors hover:bg-surface"
                >
                  {group.title}
                  <span className="text-sm text-muted">{group.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-16 lg:col-span-8">
          {groups.map((group) => (
            <section key={group.slug} id={group.slug} aria-labelledby={`${group.slug}-title`} className="scroll-mt-24">
              <h2 id={`${group.slug}-title`} className="font-display text-h3 font-semibold">
                {group.title}
              </h2>
              {group.slug === 'education' && (
                <dl className="mt-6 grid gap-px overflow-hidden rounded-card bg-line sm:grid-cols-3">
                  {educationFacts.map((fact) => (
                    <div key={fact.term} className="bg-surface p-5">
                      <dt className="text-sm text-muted">{fact.term}</dt>
                      <dd className="mt-1 font-semibold">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-6">
                <DocList items={group.items} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
