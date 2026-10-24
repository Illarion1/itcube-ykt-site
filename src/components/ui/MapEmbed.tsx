import { site } from '../../data/site';
import { cn } from '../../lib/cn';
import { mapWidgetUrl } from '../../lib/maps';

type Props = {
  className?: string;
};

/**
 * Карта 2ГИС с карточкой IT-куба (адрес, телефон, «Путь сюда», «Доехать с 2ГИС»).
 * loading="lazy" — карта загружается, только когда до неё докрутили.
 */
export function MapEmbed({ className }: Props) {
  return (
    <div className={cn('overflow-hidden rounded-panel bg-surface', className)}>
      <iframe
        src={mapWidgetUrl}
        title={`Карта 2ГИС: ${site.shortName}, ${site.address.short}`}
        loading="lazy"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
