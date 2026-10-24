/**
 * Небольшой набор элементов интерфейса админ-панели: кнопки, обёртка поля формы,
 * всплывающие уведомления и окно подтверждения. Цвета и скругления — те же, что у сайта.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Info, Loader2, X } from 'lucide-react';
import { cn } from '../lib/cn';

// ---------- Кнопки ----------

type Variant = 'primary' | 'dark' | 'outline' | 'ghost' | 'danger' | 'destructive';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-ink hover:bg-accent-hover',
  dark: 'bg-ink text-white hover:bg-ink-soft',
  outline: 'border border-ink/15 bg-white text-ink hover:border-ink',
  ghost: 'text-ink hover:bg-surface',
  // danger — неброская красная кнопка «Удалить», destructive — яркая кнопка подтверждения удаления
  danger: 'text-[#B42318] hover:bg-[#FEF3F2]',
  destructive: 'bg-[#B42318] text-white hover:bg-[#912018]',
};

type BtnProps = {
  children?: ReactNode;
  variant?: Variant;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  // to — страница админ-панели, href — внешняя ссылка (откроется в новой вкладке)
  to?: string;
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit';
  className?: string;
  title?: string;
  'aria-label'?: string;
};

export function Btn({ children, variant = 'outline', size = 'md', icon: Icon, loading, disabled, to, href, onClick, type = 'button', className, ...rest }: BtnProps) {
  // Кнопка без текста (только значок) — круглая
  const shape = size === 'md' ? (children ? 'min-h-11 px-5' : 'h-11 w-11') : children ? 'min-h-9 px-3.5' : 'h-9 w-9';
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
    shape,
    variants[variant],
    className,
  );
  const content = (
    <>
      {loading ? (
        <Loader2 size={18} className="shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={18} className="shrink-0" aria-hidden="true" />
      )}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} onClick={onClick} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}

// ---------- Поля формы ----------

export const inputClass =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-base outline-none transition-colors placeholder:text-muted/60 hover:border-ink/30 focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-ink/10 aria-[invalid=true]:border-[#D92D20] disabled:bg-surface';

/** id подсказки и ошибки — экранный чтец зачитает их вместе с полем */
export function describedBy(id: string, hint?: string, error?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
}

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  // group — несколько элементов выбора (радиокнопки, значки): подпись не привязана к одному полю
  group?: boolean;
  className?: string;
  children: ReactNode;
};

/** Обёртка поля: название, пояснение, само поле и текст ошибки */
export function FieldShell({ id, label, required, hint, error, group, className, children }: FieldShellProps) {
  const title = (
    <>
      {label}
      {required && (
        <span className="text-[#D92D20]" title="Обязательное поле">
          {' '}
          *
        </span>
      )}
    </>
  );
  return (
    <div className={className} data-field={id}>
      {group ? (
        <p id={`${id}-label`} className="font-semibold">
          {title}
        </p>
      ) : (
        <label htmlFor={id} className="block font-semibold">
          {title}
        </label>
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm leading-relaxed text-muted">
          {hint}
        </p>
      )}
      <div className="mt-2.5">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-[#B42318]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Переключатель «да / нет» с подписью, которая меняется вместе с ним: «Запись открыта» / «Запись закрыта» */
export function Switch({
  id,
  checked,
  onChange,
  onLabel,
  offLabel,
  describedby,
  disabled,
}: {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLabel: string;
  offLabel: string;
  describedby?: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={describedby}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-11 items-center gap-3 rounded-full pr-2 text-left font-semibold disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-line')} aria-hidden="true">
        <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      </span>
      {checked ? onLabel : offLabel}
    </button>
  );
}

// ---------- Разное ----------

export function Spinner({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <p className="flex items-center gap-3 py-10 text-muted" role="status">
      <Loader2 size={20} className="animate-spin" aria-hidden="true" />
      {label}
    </p>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error'; children: ReactNode }) {
  const Icon = tone === 'error' ? AlertCircle : Info;
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl p-4 text-sm leading-relaxed', tone === 'error' ? 'bg-[#FEF3F2] text-[#B42318]' : 'bg-accent-soft text-ink')}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Заголовок страницы админ-панели: ссылка «назад», название, пояснение и кнопки справа */
export function PageHeading({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: ReactNode;
  back?: { to: string; label: string; onClick?: (e: MouseEvent<HTMLElement>) => void };
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link to={back.to} onClick={back.onClick} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
          {description && <div className="mt-2 max-w-2xl text-muted">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

// ---------- Окно поверх страницы ----------

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Последняя версия onClose — чтобы не перезапускать эффект ниже при каждой отрисовке
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Фокус — на первое поле или кнопку окна, чтобы с клавиатуры сразу можно было ответить
    panelRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeRef.current();
      }}
    >
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-md rounded-card bg-white p-6 shadow-dropdown sm:p-7">
        <h2 id="modal-title" className="font-display text-xl font-semibold leading-snug">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ---------- Подтверждение действия ----------

type ConfirmOptions = { title: string; text?: string; confirmLabel?: string; danger?: boolean };
type ConfirmState = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...options, resolve })), []);
  const close = useCallback(
    (ok: boolean) => {
      state?.resolve(ok);
      setState(null);
    },
    [state],
  );
  const cancel = useCallback(() => close(false), [close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <Modal title={state.title} onClose={cancel}>
          {state.text && <p className="mt-3 leading-relaxed text-muted">{state.text}</p>}
          <div className="mt-7 flex flex-wrap justify-end gap-2">
            {/* «Отмена» первая — на ней будет фокус: случайное нажатие Enter ничего не удалит */}
            <Btn variant="outline" onClick={cancel}>
              Отмена
            </Btn>
            <Btn variant={state.danger ? 'destructive' : 'primary'} onClick={() => close(true)}>
              {state.confirmLabel ?? 'Да'}
            </Btn>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

/** confirm({ title: 'Удалить?' }) → Promise<boolean> */
export const useConfirm = () => useContext(ConfirmContext);

// ---------- Уведомления ----------

type Toast = { id: number; text: string; tone: 'success' | 'error'; action?: { label: string; href: string } };

const ToastContext = createContext<(toast: Omit<Toast, 'id'>) => void>(() => {});
let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = ++toastId;
      setToasts((list) => [...list.slice(-2), { ...toast, id }]);
      // Ошибки висят дольше, чтобы их успели прочитать
      window.setTimeout(() => dismiss(id), toast.tone === 'error' ? 9000 : 6000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-4 z-[90] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:top-6 sm:w-[24rem]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl bg-ink p-4 text-sm text-white shadow-dropdown"
          >
            {toast.tone === 'error' ? (
              <AlertCircle size={20} className="shrink-0 text-[#FDA29B]" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={20} className="shrink-0 text-accent" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1 leading-relaxed">
              <p>{toast.text}</p>
              {toast.action && (
                <a href={toast.action.href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-accent hover:underline">
                  {toast.action.label}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
            </div>
            <button type="button" onClick={() => dismiss(toast.id)} className="shrink-0 rounded-full p-1 text-white/60 hover:text-white" aria-label="Закрыть уведомление">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** toast({ text: 'Сохранено', tone: 'success' }) */
export const useToast = () => useContext(ToastContext);
