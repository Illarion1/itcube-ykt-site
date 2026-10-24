import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarClock, ClipboardCheck, ExternalLink, Inbox, KeyRound, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import logoUrl from '../assets/logo-itcube.png';
import { cn } from '../lib/cn';
import type { SessionUser } from './api';
import { useNewApplicationsCount } from './applications';
import { useCanLeave, useGuardedLink } from './guard';
import { collectionList } from './schema';
import { views } from './views';

export function AdminLogo() {
  return (
    <span className="flex items-center gap-3">
      <span className="relative block h-[42px] w-10 overflow-hidden" aria-hidden="true">
        <img src={logoUrl} alt="" width={40} height={53} className="absolute left-0 top-0 w-full max-w-none brightness-0" />
      </span>
      <span className="font-display text-[15px] font-semibold leading-none tracking-tight">
        IT-куб
        <span className="mt-1 block font-sans text-xs font-medium text-muted">Админ-панель</span>
      </span>
    </span>
  );
}

type Props = { user: SessionUser; onLogout: () => void; children: ReactNode };

/** Каркас админ-панели: меню разделов слева (на телефоне — по кнопке), содержимое справа */
export function AdminLayout({ user, onLogout, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMenuOpen(false), [pathname]);

  // Меню на телефоне закрывается и клавишей Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-white lg:block">
        <Nav user={user} onLogout={onLogout} />
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white px-4 py-2.5 lg:hidden">
        <Link to="/admin">
          <AdminLogo />
        </Link>
        <button type="button" onClick={() => setMenuOpen(true)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface" aria-label="Открыть меню">
          <Menu size={22} aria-hidden="true" />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Меню админ-панели">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-white shadow-dropdown">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full hover:bg-surface"
              aria-label="Закрыть меню"
            >
              <X size={22} aria-hidden="true" />
            </button>
            <Nav user={user} onLogout={onLogout} />
          </div>
        </div>
      )}

      <main id="content" className="min-w-0 px-4 pb-36 pt-6 sm:px-6 lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function Nav({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const guarded = useGuardedLink();
  const canLeave = useCanLeave();
  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors',
      isActive ? 'bg-accent-soft font-semibold text-ink' : 'text-ink/80 hover:bg-surface hover:text-ink',
    );

  const newApplications = useNewApplicationsCount();
  const items = [
    { to: '/admin', label: 'Обзор', icon: LayoutDashboard, end: true, badge: 0 },
    { to: '/admin/applications', label: 'Заявки', icon: Inbox, end: false, badge: newApplications },
    { to: '/admin/enrollment', label: 'Запись и места', icon: ClipboardCheck, end: false, badge: 0 },
    { to: '/admin/schedule', label: 'Расписание', icon: CalendarClock, end: false, badge: 0 },
    ...collectionList.map((c) => ({ to: `/admin/${c.name}`, label: c.label, icon: views[c.name].icon, end: false, badge: 0 })),
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <Link to="/admin" onClick={guarded('/admin')} className="px-2 pb-6 pt-1">
        <AdminLogo />
      </Link>

      <nav aria-label="Разделы" className="flex-1">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon, end, badge }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={link} onClick={guarded(to)}>
                <Icon size={19} aria-hidden="true" />
                <span className="min-w-0 flex-1">{label}</span>
                {/* Счётчик новых заявок */}
                {badge > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-ink" aria-label={`новых: ${badge}`}>
                    {badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <ul className="mt-6 space-y-1 border-t border-line pt-6">
          <li>
            <NavLink to="/admin/users" className={link} onClick={guarded('/admin/users')}>
              <KeyRound size={19} aria-hidden="true" />
              Пользователи и пароли
            </NavLink>
          </li>
          <li>
            <a href="/" target="_blank" rel="noopener noreferrer" className={link({ isActive: false })}>
              <ExternalLink size={19} aria-hidden="true" />
              Открыть сайт
            </a>
          </li>
        </ul>
      </nav>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-surface p-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{user.name}</span>
          <span className="block truncate text-xs text-muted">{user.login}</span>
        </span>
        <button
          type="button"
          onClick={() => void canLeave().then((ok) => ok && onLogout())}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-white hover:text-ink"
          aria-label="Выйти из админ-панели"
          title="Выйти"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
