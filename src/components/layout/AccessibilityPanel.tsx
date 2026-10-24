import type { ReactNode } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';
import type { A11ySettings } from '../../hooks/useAccessibility';
import { cn } from '../../lib/cn';

// Группа кнопок-переключателей: выбрана может быть только одна (как радиокнопки)
function Options<K extends keyof A11ySettings>({
  label,
  settingKey,
  options,
}: {
  label: string;
  settingKey: K;
  options: { value: A11ySettings[K]; label: ReactNode; title: string; className?: string }[];
}) {
  const { settings, update } = useAccessibility();
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold">{label}:</span>
      {options.map((option) => {
        const checked = settings[settingKey] === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={checked}
            title={option.title}
            aria-label={option.title}
            onClick={() => update(settingKey, option.value)}
            className={cn(
              'grid h-11 min-w-11 place-items-center rounded-full border-2 px-3 font-semibold transition-colors',
              checked ? 'border-ink' : 'border-transparent hover:border-ink/40',
              option.className ?? 'bg-white',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Панель версии для слабовидящих: размер шрифта, цветовая схема,
 * изображения, интервал и кнопка «Обычная версия».
 */
export function AccessibilityPanel() {
  const { panelOpen, setPanelOpen, reset } = useAccessibility();
  if (!panelOpen) return null;

  return (
    <section aria-label="Настройки версии для слабовидящих" className="border-t border-line bg-surface">
      <div className="container-x flex flex-wrap items-center gap-x-8 gap-y-4 py-4">
        <Options
          label="Шрифт"
          settingKey="font"
          options={[
            { value: 'normal', label: <span className="text-sm">А</span>, title: 'Обычный размер шрифта' },
            { value: 'large', label: <span className="text-lg">А</span>, title: 'Крупный шрифт' },
            { value: 'xlarge', label: <span className="text-2xl">А</span>, title: 'Очень крупный шрифт' },
          ]}
        />
        <Options
          label="Цвет"
          settingKey="scheme"
          options={[
            // Цвета образцов заданы явно (не токенами), чтобы они не перекрашивались вместе с сайтом
            { value: 'default', label: 'Ц', title: 'Обычные цвета', className: 'bg-[#2BD46B] text-[#0E0E0E]' },
            { value: 'bw', label: 'Ч', title: 'Чёрным по белому', className: 'bg-[#fff] text-[#000] !border-[#000]' },
            { value: 'wb', label: 'Б', title: 'Белым по чёрному', className: 'bg-[#000] text-[#fff]' },
            { value: 'blue', label: 'С', title: 'Тёмно-синим по голубому', className: 'bg-[#9DD1FF] text-[#063385]' },
          ]}
        />
        <Options
          label="Изображения"
          settingKey="images"
          options={[
            { value: 'on', label: <span className="text-sm">Вкл</span>, title: 'Показывать изображения' },
            { value: 'off', label: <span className="text-sm">Выкл</span>, title: 'Скрыть изображения' },
          ]}
        />
        <Options
          label="Интервал"
          settingKey="spacing"
          options={[
            { value: 'normal', label: <span className="text-sm">Обычный</span>, title: 'Обычный интервал между буквами' },
            { value: 'wide', label: <span className="text-sm tracking-[0.2em]">Шире</span>, title: 'Увеличенный интервал между буквами' },
          ]}
        />
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={reset} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-white">
            <RotateCcw size={16} aria-hidden="true" />
            Обычная версия
          </button>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="grid h-11 w-11 place-items-center rounded-full bg-white"
            aria-label="Свернуть панель (настройки сохранятся)"
            title="Свернуть панель"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
