import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Eye, Menu, Search } from 'lucide-react';
import { isGroup, mainNav } from '../../data/navigation';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useScrolled } from '../../hooks/useScrolled';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { AccessibilityPanel } from './AccessibilityPanel';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { NavDropdown } from './NavDropdown';

/**
 * Шапка сайта. «Прилипает» к верху экрана; когда страницу прокручивают,
 * становится ниже, полупрозрачной и с размытием фона.
 * На широких экранах (от 1280px) — меню в строку, на остальных — кнопка-бургер.
 */
export function Header() {
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  const a11y = useAccessibility();

  // При переходе на другую страницу мобильное меню закрывается
  useEffect(() => setMenuOpen(false), [pathname]);

  // После закрытия меню возвращаем фокус на бургер — важно для работы с клавиатуры
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    burgerRef.current?.focus();
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b transition-colors duration-300',
          scrolled ? 'border-line bg-white/95 backdrop-blur-md' : 'border-transparent bg-white',
        )}
      >
        <div
          className={cn(
            // min-h вместо h: при очень крупном шрифте (версия для слабовидящих) шапка может стать в две строки
            'container-x flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2 transition-[min-height] duration-300 ease-out-expo',
            scrolled ? 'min-h-16' : 'min-h-20 lg:min-h-24',
          )}
        >
          <Logo />

          <nav aria-label="Основное меню" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {mainNav.map((item) =>
                isGroup(item) ? (
                  <NavDropdown key={item.label} group={item} />
                ) : (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-medium transition-colors duration-200',
                          isActive ? 'bg-surface text-ink' : 'text-ink/75 hover:bg-surface hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />}
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => a11y.setPanelOpen(!a11y.panelOpen)}
              aria-expanded={a11y.panelOpen}
              aria-label="Версия для слабовидящих"
              title="Версия для слабовидящих"
              className={cn(
                'grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface',
                (a11y.panelOpen || a11y.active) && 'bg-surface',
              )}
            >
              <Eye size={20} aria-hidden="true" />
            </button>
            <Link
              to="/search"
              aria-label="Поиск по сайту"
              className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface"
            >
              <Search size={20} aria-hidden="true" />
            </Link>

            <Button to="/admission" variant="dark" arrow className="hidden sm:inline-flex">
              Записаться
            </Button>

            <button
              ref={burgerRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="grid h-11 w-11 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-surface-strong xl:hidden"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
        <AccessibilityPanel />
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
