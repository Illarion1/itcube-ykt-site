import { useEffect, useState } from 'react';
import type { DependencyList } from 'react';

type State<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Загружает данные из слоя src/api и запоминает состояние загрузки.
 *   const { data, loading, error } = useData(getDirections);
 * deps — от чего зависит запрос (например, номер страницы): при их изменении данные загрузятся заново.
 */
export function useData<T>(load: () => Promise<T>, deps: DependencyList = []): State<T> {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    // Если компонент исчез или запрос сменился раньше ответа — старый ответ игнорируем
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    load()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: error instanceof Error ? error : new Error(String(error)) });
      });
    return () => {
      cancelled = true;
    };
    // load не добавляем в зависимости: стрелочная функция создаётся заново при каждой отрисовке
  }, deps);

  return state;
}
