import { contest } from '../data/pages';
import { Button } from '../components/ui/Button';
import { DocList } from '../components/ui/DocList';
import { PageHeader } from '../components/ui/PageHeader';

/** Региональный конкурс «Высший пилотаж — Якутск» */
export function ContestPage() {
  return (
    <>
      <PageHeader
        eyebrow="Конкурс НИУ ВШЭ"
        title="Высший пилотаж — Якутск"
        lead={contest.intro}
        action={
          <Button href={contest.links[0].url} arrow>
            Сайт конкурса
          </Button>
        }
      />
      <div className="container-x space-y-16 pb-20 lg:pb-28">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="on-dark rounded-card bg-ink p-6 text-white lg:p-8">
            <h2 className="font-display text-xl font-semibold">Регистрация</h2>
            <p className="mt-4 text-white/70">{contest.registration}</p>
            <a href={contest.registrationUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block font-semibold text-accent hover:underline">
              Страница регистрации в «Сетевом городе» ↗
            </a>
          </div>
          <div className="rounded-card bg-accent p-6 lg:p-8">
            <h2 className="font-display text-xl font-semibold">Зачем участвовать</h2>
            <p className="mt-4">{contest.reward}</p>
          </div>
        </div>

        <section aria-labelledby="contest-links" className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 id="contest-links" className="font-display text-h3 font-semibold">
              Полезные ссылки
            </h2>
            <div className="mt-6">
              <DocList items={contest.links} />
            </div>
          </div>
          <div>
            <h2 className="font-display text-h3 font-semibold">Документы конкурса</h2>
            <div className="mt-6">
              <DocList items={contest.documents} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
