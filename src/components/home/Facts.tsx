import { getStats } from '../../api';
import { useData } from '../../hooks/useData';
import { plural } from '../../lib/format';
import { CountUp } from '../ui/CountUp';
import { Reveal } from '../ui/Reveal';

/** «Центр в цифрах»: четыре больших числа. Количество считается по данным, а не вписано вручную */
export function Facts() {
  const { data } = useData(getStats);
  if (!data) return <div className="h-48 border-y border-line" />;

  const items = [
    {
      value: <CountUp value={data.directions} />,
      label: `${plural(data.directions, ['направление', 'направления', 'направлений'])} дополнительного образования`,
    },
    {
      value: <CountUp value={data.categories} />,
      label: `${plural(data.categories, ['категория', 'категории', 'категорий'])} — от Python до архитектуры`,
    },
    {
      value: <CountUp value={data.teachers} />,
      label: `${plural(data.teachers, ['педагог', 'педагога', 'педагогов'])}-наставников`,
    },
    // Год открытия не «досчитываем» — это не количество
    { value: data.foundedYear, label: 'год открытия центра' },
  ];

  return (
    <section aria-label="Центр в цифрах" className="border-b border-line">
      <div className="container-x">
        {/* gap-px + фон цвета линии — получаются тонкие разделители между ячейками */}
        <ul className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
          {items.map((item, index) => (
            <li key={item.label} className="bg-white py-10 pr-4 even:pl-6 lg:py-14 lg:pl-8 lg:even:pl-8 lg:first:pl-0">
              <Reveal delay={index * 0.08}>
                <p className="font-display text-h1 font-semibold">{item.value}</p>
                <p className="mt-3 max-w-[15rem] text-sm text-muted sm:text-base">{item.label}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
