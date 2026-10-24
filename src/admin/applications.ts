/**
 * Заявки с сайта внутри админ-панели: общий список для меню (счётчик новых),
 * главной страницы панели и раздела «Заявки и обращения».
 * Пока панель открыта, список обновляется раз в минуту — новые заявки появляются сами.
 */
import { useSyncExternalStore } from 'react';
import { adminApi, ApiError } from './api';
import type { Application, ApplicationStatus } from './api';
import { replaceItem } from './store';

type State = { list: Application[] | null; error: string | null };

let state: State = { list: null, error: null };
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useApplications(): State {
  return useSyncExternalStore(subscribe, () => state);
}

/** Сколько заявок ещё никто не смотрел */
export function useNewApplicationsCount() {
  return useApplications().list?.filter((a) => a.status === 'new').length ?? 0;
}

export async function refreshApplications() {
  try {
    const { applications } = await adminApi.applications();
    setState({ list: applications, error: null });
  } catch (error) {
    setState({ ...state, error: error instanceof ApiError ? error.message : 'Не удалось загрузить заявки' });
  }
}

/** Изменить статус, комментарий или вычесть место (takeSeat) */
export async function updateApplication(id: string, changes: { status?: ApplicationStatus; note?: string; takeSeat?: boolean }) {
  const { application, direction } = await adminApi.updateApplication(id, changes);
  setState({ list: state.list?.map((a) => (a.id === id ? application : a)) ?? null, error: null });
  // Место вычтено — число мест у направления в админ-панели тоже должно обновиться
  if (direction) replaceItem('directions', direction);
  return application;
}

export async function deleteApplication(id: string) {
  await adminApi.removeApplication(id);
  setState({ list: state.list?.filter((a) => a.id !== id) ?? null, error: null });
}
