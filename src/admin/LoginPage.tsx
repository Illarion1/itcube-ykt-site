import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react';
import { ApiError, adminApi } from './api';
import type { SessionUser } from './api';
import { AdminLogo } from './Layout';
import { Btn, inputClass, Notice } from './ui';

/** Форма входа. compact — вариант для окна «Сессия закончилась» поверх открытой страницы */
export function LoginForm({ onLogin, compact = false }: { onLogin: (user: SessionUser) => void; compact?: boolean }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!login.trim() || !password) {
      setError('Введите логин и пароль');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { user } = await adminApi.login(login, password);
      onLogin(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось войти. Попробуйте ещё раз.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={compact ? 'mt-5 space-y-4' : 'mt-8 space-y-5'} noValidate>
      <div>
        <label htmlFor="login" className="block font-semibold">
          Логин
        </label>
        <input
          id="login"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className={`${inputClass} mt-2`}
        />
      </div>
      <div>
        <label htmlFor="password" className="block font-semibold">
          Пароль
        </label>
        <div className="relative mt-2">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-1 my-auto grid h-10 w-10 place-items-center rounded-full text-muted hover:text-ink"
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Btn type="submit" variant="dark" icon={LogIn} loading={busy} className="w-full">
        Войти
      </Btn>
    </form>
  );
}

/** Страница входа в админ-панель */
export function LoginPage({ setup, onLogin }: { setup: boolean; onLogin: (user: SessionUser) => void }) {
  return (
    <AuthScreen>
      <h1 className="mt-8 font-display text-2xl font-semibold">Вход в админ-панель</h1>
      <p className="mt-2 text-muted">Здесь сотрудники центра принимают заявки и меняют сайт: новости, направления, педагогов, документы.</p>
      {setup ? (
        <div className="mt-6">
          <Notice>
            <p className="font-semibold">Пока нет ни одного пользователя.</p>
            <p className="mt-1">
              Первого пользователя создаёт тот, кто обслуживает сайт: в папке сайта нужно выполнить команду <code className="font-semibold">npm run admin</code> и
              придумать логин и пароль. Остальных можно будет добавить прямо здесь.
            </p>
          </Notice>
        </div>
      ) : (
        <LoginForm onLogin={onLogin} />
      )}
    </AuthScreen>
  );
}

/** Сайт открыт без сервера — например, статическая версия на Vercel или GitHub Pages */
export function StaticNotice() {
  return (
    <AuthScreen>
      <h1 className="mt-8 font-display text-2xl font-semibold">Админ-панель здесь недоступна</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Эта копия сайта — статическая: у неё нет сервера, который мог бы сохранять изменения. Админ-панель работает, когда сайт запущен командой{' '}
        <code className="font-semibold text-ink">npm run dev</code> (на своём компьютере) или <code className="font-semibold text-ink">npm start</code> (на хостинге).
      </p>
    </AuthScreen>
  );
}

function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-panel bg-white p-6 sm:p-10">
          <AdminLogo />
          {children}
        </div>
        <a href={import.meta.env.BASE_URL} className="mt-6 inline-flex items-center gap-2 px-2 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} aria-hidden="true" />
          Вернуться на сайт
        </a>
      </div>
    </div>
  );
}
