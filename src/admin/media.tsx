/**
 * Поля для фото и файлов: загрузка с компьютера или телефона (кнопкой или перетаскиванием),
 * предпросмотр, замена и удаление. Большие фото перед загрузкой уменьшаются прямо в браузере —
 * снимок с телефона весит 5–10 МБ, а для сайта хватает 300–600 КБ.
 */
import { useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, FileText, ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import { fileUrl } from '../lib/asset';
import { cn } from '../lib/cn';
import { ApiError, uploadFile } from './api';
import { Btn, describedBy, inputClass, useToast } from './ui';

const MAX_SIDE = 2000;

/** Уменьшает фото до 2000 пикселей по длинной стороне. GIF (анимация) и маленькие фото не трогаем */
async function shrinkImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    // PNG может быть с прозрачностью (логотипы) — оставляем PNG, остальное сохраняем как JPEG
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.\w+$/, '') + (type === 'image/png' ? '.png' : '.jpg');
    return new File([blob], name, { type });
  } catch {
    // Браузер не смог прочитать фото — отправим как есть, сервер разберётся
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Загрузка одного файла с процентами и понятными ошибками */
function useUpload() {
  const toast = useToast();
  const [progress, setProgress] = useState<number | null>(null);

  async function upload(file: File, { image = false } = {}): Promise<string | null> {
    setProgress(0);
    try {
      const prepared = image ? await shrinkImage(file) : file;
      const { url } = await uploadFile(prepared, setProgress);
      return url;
    } catch (error) {
      toast({ tone: 'error', text: error instanceof ApiError ? error.message : 'Файл не загрузился. Попробуйте ещё раз.' });
      return null;
    } finally {
      setProgress(null);
    }
  }

  return { upload, progress, busy: progress !== null };
}

// Перетаскивание файлов мышью на поле
function useDropZone(onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(false);
  return {
    over,
    handlers: {
      onDragOver: (e: DragEvent) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: DragEvent) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setOver(false);
        onFiles([...e.dataTransfer.files]);
      },
    },
  };
}

function ProgressOverlay({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-white/85 text-sm font-semibold" role="status">
      <div className="w-3/4 text-center">
        Загрузка… {Math.round(progress * 100)}%
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

type SingleProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
};

/** Одно фото: обложка новости, фото педагога, логотип партнёра */
export function ImageInput({ id, value, onChange, hint, error, aspect = '4/3' }: SingleProps & { aspect?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, progress, busy } = useUpload();

  async function handle(files: File[]) {
    const file = files.find((f) => f.type.startsWith('image/'));
    if (!file) return;
    const url = await upload(file, { image: true });
    if (url) onChange(url);
  }
  const drop = useDropZone(handle);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        {...drop.handlers}
        className={cn(
          'relative w-full max-w-[14rem] shrink-0 overflow-hidden rounded-2xl border-2 border-dashed transition-colors',
          drop.over ? 'border-accent bg-accent-soft' : value ? 'border-transparent' : 'border-line bg-surface hover:border-ink/30',
        )}
        style={{ aspectRatio: aspect }}
        aria-label={value ? 'Заменить фото' : 'Загрузить фото'}
      >
        {value ? (
          <img src={fileUrl(value)} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted">
            <ImagePlus size={28} aria-hidden="true" />
            Нажмите или перетащите фото сюда
          </span>
        )}
        {progress !== null && <ProgressOverlay progress={progress} />}
      </button>

      <div className="flex flex-wrap gap-2 sm:flex-col">
        <Btn icon={Upload} onClick={() => inputRef.current?.click()} disabled={busy}>
          {value ? 'Заменить фото' : 'Загрузить фото'}
        </Btn>
        {value && (
          <Btn variant="danger" icon={Trash2} onClick={() => onChange('')} disabled={busy}>
            Убрать
          </Btn>
        )}
        <p className="text-sm text-muted sm:max-w-[16rem]">JPG, PNG или WebP. Большие фото уменьшатся сами.</p>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(e) => {
          void handle([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/** Несколько фото — фотоотчёт к новости. Порядок меняется стрелками */
export function GalleryInput({ id, value, onChange, hint, error }: Omit<SingleProps, 'value' | 'onChange'> & { value: string[]; onChange: (value: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [queue, setQueue] = useState<{ key: string; progress: number }[]>([]);
  // Актуальный список фото: пока идёт загрузка нескольких файлов, value в замыкании устаревает
  const latest = useRef(value);
  latest.current = value;

  async function handle(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    setQueue(images.map((f, i) => ({ key: `${i}-${f.name}`, progress: 0 })));
    // По очереди, а не все сразу: так надёжнее на медленном интернете
    for (const [index, file] of images.entries()) {
      try {
        const { url } = await uploadFile(await shrinkImage(file), (progress) =>
          setQueue((q) => q.map((item, i) => (i === index ? { ...item, progress } : item))),
        );
        latest.current = [...latest.current, url];
        onChange(latest.current);
      } catch (error) {
        toast({ tone: 'error', text: `${file.name}: ${error instanceof ApiError ? error.message : 'не загрузилось'}` });
      }
      setQueue((q) => q.map((item, i) => (i === index ? { ...item, progress: 1 } : item)));
    }
    setQueue([]);
  }
  const drop = useDropZone(handle);

  const move = (from: number, to: number) => {
    const next = [...value];
    const [photo] = next.splice(from, 1);
    next.splice(to, 0, photo);
    onChange(next);
  };

  const tileButton = 'grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink shadow transition-colors hover:bg-white disabled:opacity-40';

  return (
    <div {...drop.handlers} className={cn('rounded-2xl transition-colors', drop.over && 'bg-accent-soft ring-2 ring-accent')}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((src, index) => (
          <li key={src} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
            <img src={fileUrl(src)} alt={`Фото ${index + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1">
              <span className="flex gap-1">
                <button type="button" className={tileButton} onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={`Фото ${index + 1}: переместить левее`}>
                  <ArrowLeft size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={tileButton}
                  onClick={() => move(index, index + 1)}
                  disabled={index === value.length - 1}
                  aria-label={`Фото ${index + 1}: переместить правее`}
                >
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </span>
              <button
                type="button"
                className={cn(tileButton, 'text-[#B42318]')}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Удалить фото ${index + 1}`}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
        {queue
          .filter((item) => item.progress < 1)
          .map((item) => (
            <li key={item.key} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
              <ProgressOverlay progress={item.progress} />
            </li>
          ))}
        <li>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={queue.length > 0}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface p-3 text-center text-sm font-semibold text-muted transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-60"
          >
            <ImagePlus size={26} aria-hidden="true" />
            Добавить фото
          </button>
        </li>
      </ul>
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(e) => {
          void handle([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// Что показать вместо адреса файла: «polozhenie-3fa2c1.pdf» или «disk.yandex.ru»
function describeLink(url: string): { title: string; uploaded: boolean } {
  if (url.startsWith('/')) return { title: decodeURIComponent(url.split('/').pop() ?? url), uploaded: true };
  try {
    return { title: new URL(url).hostname.replace(/^www\./, ''), uploaded: false };
  } catch {
    return { title: url, uploaded: false };
  }
}

/** Файл документа: загрузить на сайт или вставить ссылку (Яндекс Диск, Google Таблицы и т.п.) */
export function FileInput({ id, value, onChange, hint, error }: SingleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, progress, busy } = useUpload();
  // Поле для ссылки открыто, пока человек её вводит (значение ещё не похоже на готовую ссылку)
  const [typing, setTyping] = useState(false);

  async function handle(files: File[]) {
    if (!files[0]) return;
    const url = await upload(files[0]);
    if (url) {
      setTyping(false);
      onChange(url);
    }
  }
  const drop = useDropZone(handle);

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      className="sr-only"
      tabIndex={-1}
      onChange={(e) => {
        void handle([...(e.target.files ?? [])]);
        e.target.value = '';
      }}
    />
  );

  let body: ReactNode;
  if (value && !typing) {
    const { title, uploaded } = describeLink(value);
    const Icon = uploaded ? FileText : Link2;
    body = (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface" aria-hidden="true">
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium" id={id}>
            {title}
          </span>
          <span className="text-sm text-muted">{uploaded ? 'Файл на сайте' : 'Ссылка'}</span>
        </span>
        <span className="flex flex-wrap gap-1">
          <Btn size="sm" variant="ghost" icon={ExternalLink} href={fileUrl(value)}>
            Открыть
          </Btn>
          <Btn size="sm" variant="ghost" icon={Upload} onClick={() => inputRef.current?.click()} loading={busy}>
            Заменить
          </Btn>
          <Btn size="sm" variant="danger" icon={Trash2} onClick={() => onChange('')} aria-label="Убрать файл" />
        </span>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Btn icon={Upload} onClick={() => inputRef.current?.click()} loading={busy}>
          {busy ? `Загрузка… ${Math.round((progress ?? 0) * 100)}%` : 'Загрузить файл'}
        </Btn>
        <span className="text-sm text-muted">или</span>
        <input
          id={id}
          type="url"
          inputMode="url"
          value={value}
          placeholder="вставьте ссылку https://…"
          onChange={(e) => {
            setTyping(true);
            onChange(e.target.value);
          }}
          onBlur={() => setTyping(false)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(inputClass, 'sm:flex-1')}
        />
      </div>
    );
  }

  return (
    <div {...drop.handlers} className={cn('rounded-2xl', drop.over && 'bg-accent-soft ring-2 ring-accent')}>
      {body}
      {fileInput}
    </div>
  );
}
