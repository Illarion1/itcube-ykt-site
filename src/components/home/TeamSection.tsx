import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getTeam } from '../../api';
import { useData } from '../../hooks/useData';
import { cn } from '../../lib/cn';
import { TeacherCard } from '../cards/TeacherCard';
import { Button } from '../ui/Button';
import { SectionHeader } from '../ui/SectionHeader';

/**
 * Слайдер педагогов. Это обычный горизонтальный список с прокруткой:
 * на телефоне листается пальцем, на компьютере — кнопками «влево/вправо».
 * scroll-snap «примагничивает» карточки к краю, чтобы они не останавливались на середине.
 */
export function TeamSection() {
  const { data } = useData(getTeam);
  const teachers = data?.filter((member) => member.group === 'teacher') ?? [];

  const listRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Можно ли ещё листать влево/вправо — чтобы выключать кнопки на краях
  const updateButtons = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setCanPrev(list.scrollLeft > 4);
    setCanNext(list.scrollLeft + list.clientWidth < list.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateButtons();
    window.addEventListener('resize', updateButtons);
    return () => window.removeEventListener('resize', updateButtons);
  }, [updateButtons, teachers.length]);

  // Сдвиг ровно на одну карточку (ширина карточки + промежуток 16px)
  const scrollByCard = (direction: 1 | -1) => {
    const list = listRef.current;
    const card = list?.querySelector('li');
    if (!list || !card) return;
    list.scrollBy({ left: direction * (card.getBoundingClientRect().width + 16), behavior: 'smooth' });
  };

  const arrowButton =
    'grid h-11 w-11 place-items-center rounded-full bg-white text-ink transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white';

  return (
    <section aria-labelledby="team-title" className="overflow-hidden bg-surface py-20 lg:py-28">
      <div className="container-x">
        <SectionHeader
          eyebrow="Команда"
          titleId="team-title"
          title="Педагоги IT-куба"
          description="Наставники, которые ведут занятия по направлениям центра: от робототехники для младших до мобильной разработки для старшеклассников."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => scrollByCard(-1)} disabled={!canPrev} className={arrowButton} aria-label="Предыдущие педагоги">
                <ArrowLeft size={20} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => scrollByCard(1)} disabled={!canNext} className={arrowButton} aria-label="Следующие педагоги">
                <ArrowRight size={20} aria-hidden="true" />
              </button>
              <Button to="/team" variant="dark" className="ml-2">
                Вся команда
              </Button>
            </div>
          }
        />

        <ul
          ref={listRef}
          onScroll={updateButtons}
          tabIndex={0}
          aria-label="Педагоги, список листается по горизонтали"
          className={cn(
            'no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2',
            // На телефоне и планшете лента выходит за поля до краёв экрана (видно, что её можно листать),
            // а карточки «примагничиваются» к полю. На компьютере — ровно по ширине контейнера, 4 карточки.
            '-mx-4 scroll-px-4 px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0',
          )}
        >
          {data
            ? teachers.map((member) => (
                <li key={member.id} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-3rem)/4)]">
                  <TeacherCard member={member} />
                </li>
              ))
            : Array.from({ length: 4 }, (_, index) => (
                <li key={index} className="h-[28rem] w-[78%] shrink-0 animate-pulse rounded-card bg-white sm:w-[45%] lg:w-[calc((100%-3rem)/4)]" />
              ))}
        </ul>
      </div>
    </section>
  );
}
