/**
 * Админ-панель сайта (адрес /admin). Загружается отдельным файлом только тогда,
 * когда её открывают, — посетителям сайта этот код не скачивается.
 *
 * Здесь: проверка входа, каркас с меню и адреса страниц панели.
 */
import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Route, Routes } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { ApiError, adminApi, setUnauthorizedHandler } from './api';
import type { SessionUser } from './api';
import { refreshApplications } from './applications';
import { ApplicationsPage } from './ApplicationsPage';
import { Dashboard } from './Dashboard';
import { EditPage } from './EditPage';
import { EnrollmentPage } from './EnrollmentPage';
import { GuardProvider } from './guard';
import { AdminLayout } from './Layout';
import { ListPage } from './ListPage';
import { LoginForm, LoginPage, StaticNotice } from './LoginPage';
import { SchedulePage } from './SchedulePage';
import { Btn, ConfirmProvider, Modal, Notice, Spinner, ToastProvider } from './ui';
import { UsersPage } from './UsersPage';

type State =
  | { status: 'loading' }
  | { status: 'static' }
  | { status: 'error'; message: string }
  // expired — сессия закончилась во время работы: покажем окно входа поверх страницы
  | { status: 'ready'; user: SessionUser | null; setup: boolean; expired: boolean };

export default function AdminApp() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const check = useCallback(() => {
    setState({ status: 'loading' });
    adminApi
      .session()
      .then((session) =>
        setState(session === 'static' ? { status: 'static' } : { status: 'ready', user: session.user, setup: session.setup, expired: false }),
      )
      .catch((error) => setState({ status: 'error', message: error instanceof ApiError ? error.message : 'Не удалось открыть админ-панель' }));
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    setUnauthorizedHandler(() => setState((s) => (s.status === 'ready' && s.user ? { ...s, expired: true } : s)));
    return () => setUnauthorizedHandler(() => {});
  }, []);

  // Пока сотрудник в панели, раз в минуту проверяем, нет ли новых заявок (счётчик в меню)
  const working = state.status === 'ready' && state.user !== null && !state.expired;
  useEffect(() => {
    if (!working) return;
    void refreshApplications();
    const timer = window.setInterval(() => void refreshApplications(), 60_000);
    return () => window.clearInterval(timer);
  }, [working]);

  const signIn = (user: SessionUser) => setState({ status: 'ready', user, setup: false, expired: false });

  const head = (
    <Helmet>
      <title>Админ-панель — IT-куб Якутск</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );

  if (state.status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        {head}
        <Spinner label="Открываем админ-панель…" />
      </div>
    );
  }

  if (state.status === 'static') {
    return (
      <>
        {head}
        <StaticNotice />
      </>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="grid min-h-screen place-items-center bg-surface px-4">
        {head}
        <div className="w-full max-w-md space-y-4">
          <Notice tone="error">{state.message}</Notice>
          <Btn icon={RotateCcw} onClick={check}>
            Попробовать ещё раз
          </Btn>
        </div>
      </div>
    );
  }

  if (!state.user) {
    return (
      <>
        {head}
        <LoginPage setup={state.setup} onLogin={signIn} />
      </>
    );
  }

  const user = state.user;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <GuardProvider>
          {head}
          <AdminLayout
            user={user}
            onLogout={() => {
              void adminApi
                .logout()
                .catch(() => undefined)
                .then(() => setState({ status: 'ready', user: null, setup: false, expired: false }));
            }}
          >
            <Routes>
              <Route index element={<Dashboard user={user} />} />
              <Route path="users" element={<UsersPage me={user} onRenamed={(renamed) => setState({ ...state, user: renamed })} />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="enrollment" element={<EnrollmentPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path=":collection" element={<ListPage />} />
              <Route path=":collection/new" element={<EditPage />} />
              <Route path=":collection/:id" element={<EditPage />} />
            </Routes>
          </AdminLayout>

          {state.expired && (
            <Modal title="Войдите снова" onClose={() => {}}>
              <p className="mt-3 leading-relaxed text-muted">Сессия закончилась. Войдите ещё раз — всё, что вы ввели на странице, останется на месте.</p>
              <LoginForm compact onLogin={signIn} />
            </Modal>
          )}
        </GuardProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
