import { getTeam } from '../api';
import type { TeamMember } from '../api/types';
import { useData } from '../hooks/useData';
import { TeacherCard } from '../components/cards/TeacherCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Reveal } from '../components/ui/Reveal';

/** Команда центра: руководство и педагоги */
export function TeamPage() {
  const { data } = useData(getTeam);
  const leadership = data?.filter((m) => m.group === 'leadership') ?? [];
  const teachers = data?.filter((m) => m.group === 'teacher') ?? [];

  return (
    <>
      <PageHeader eyebrow="О центре" title="Команда центра" crumbs={[{ label: 'О центре', to: '/about' }]} />
      <div className="container-x space-y-20 pb-20 lg:pb-28">
        <Group id="leadership" title="Руководство" members={leadership} />
        <Group id="teachers" title="Педагоги" members={teachers} />
      </div>
    </>
  );
}

function Group({ id, title, members }: { id: string; title: string; members: TeamMember[] }) {
  return (
    <section aria-labelledby={`${id}-title`} className="rounded-panel bg-surface p-4 sm:p-6 lg:p-8">
      <h2 id={`${id}-title`} className="px-2 pt-2 font-display text-h2 font-semibold">
        {title} <span className="text-muted">{members.length || ''}</span>
      </h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((member, index) => (
          <li key={member.id}>
            <Reveal delay={(index % 4) * 0.06} className="h-full">
              <TeacherCard member={member} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
