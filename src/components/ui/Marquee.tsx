type Props = {
  items: string[];
};

/**
 * Бегущая строка. Лента нарисована два раза подряд: пока первая копия уезжает влево,
 * вторая занимает её место — так движение получается бесконечным и без рывков.
 * При наведении мыши строка останавливается. Для экранных чтецов скрыта:
 * те же направления перечислены ниже на странице.
 */
export function Marquee({ items }: Props) {
  if (items.length === 0) return <div className="h-[4.5rem] border-y border-line" />;

  return (
    <div className="group flex overflow-hidden border-y border-line py-5" aria-hidden="true">
      {[0, 1].map((copy) => (
        <ul
          key={copy}
          className="flex shrink-0 animate-marquee items-center gap-8 pr-8 group-hover:[animation-play-state:paused]"
        >
          {items.map((item) => (
            <li key={item} className="flex items-center gap-8 whitespace-nowrap font-display text-xl font-medium lg:text-2xl">
              {item}
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
