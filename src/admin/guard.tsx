/**
 * Защита от потери изменений: если в форме есть несохранённые правки, админ-панель
 * спросит «Уйти без сохранения?» при переходе в другой раздел, а браузер — при закрытии вкладки.
 */
import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from './ui';

type Guard = { isDirty: () => boolean; setDirty: (dirty: boolean) => void };

const GuardContext = createContext<Guard>({ isDirty: () => false, setDirty: () => {} });

export function GuardProvider({ children }: { children: ReactNode }) {
  const dirty = useRef(false);
  const guard = useRef<Guard>({
    isDirty: () => dirty.current,
    setDirty: (value) => {
      dirty.current = value;
    },
  });
  return <GuardContext.Provider value={guard.current}>{children}</GuardContext.Provider>;
}

/** Форма сообщает, есть ли в ней несохранённые изменения */
export function useLeaveGuard(dirty: boolean) {
  const { setDirty } = useContext(GuardContext);

  useEffect(() => {
    setDirty(dirty);
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, setDirty]);

  useEffect(() => () => setDirty(false), [setDirty]);
}

/** Спросить, можно ли уйти со страницы (true — можно) */
export function useCanLeave() {
  const { isDirty } = useContext(GuardContext);
  const confirm = useConfirm();
  return useCallback(async () => {
    if (!isDirty()) return true;
    return confirm({
      title: 'Уйти без сохранения?',
      text: 'На этой странице есть изменения, которые ещё не сохранены. Если уйти, они пропадут.',
      confirmLabel: 'Уйти без сохранения',
      danger: true,
    });
  }, [isDirty, confirm]);
}

/** onClick для ссылок внутри админ-панели: при несохранённых изменениях сначала спросит */
export function useGuardedLink() {
  const { isDirty } = useContext(GuardContext);
  const canLeave = useCanLeave();
  const navigate = useNavigate();
  return useCallback(
    (to: string) => (e: MouseEvent<HTMLElement>) => {
      if (!isDirty()) return;
      e.preventDefault();
      void canLeave().then((ok) => {
        if (ok) navigate(to);
      });
    },
    [isDirty, canLeave, navigate],
  );
}
