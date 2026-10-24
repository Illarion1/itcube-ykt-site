import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CookieBanner } from './CookieBanner';
import { Footer } from './Footer';
import { Header } from './Header';
import { ScrollTopButton } from './ScrollTopButton';
import { ScrollToTop } from './ScrollToTop';

function PageFallback() {
  return (
    <div className="container-x min-h-[60vh] pt-12" aria-busy="true" aria-label="Загрузка страницы">
      <div className="h-4 w-48 animate-pulse rounded-full bg-surface" />
      <div className="mt-10 h-16 w-2/3 animate-pulse rounded-2xl bg-surface" />
      <div className="mt-6 h-6 w-1/2 animate-pulse rounded-full bg-surface" />
    </div>
  );
}

/** Общий каркас всех страниц: шапка сверху, подвал снизу, между ними — содержимое страницы */
export function Layout() {
  const [cookieVisible, setCookieVisible] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#content" className="skip-link">
        Перейти к содержанию
      </a>
      <ScrollToTop />
      <Header />
      {/* Сюда React Router подставляет текущую страницу */}
      <main id="content" tabIndex={-1} className="flex-1 outline-none">
        {/* Пока код «ленивой» страницы загружается, показываем заглушку того же размера */}
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ScrollTopButton raised={cookieVisible} />
      <CookieBanner onVisibleChange={setCookieVisible} />
    </div>
  );
}
