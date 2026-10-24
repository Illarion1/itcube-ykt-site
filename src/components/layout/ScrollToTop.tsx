import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * При переходе на новую страницу прокручивает её в начало.
 * Если в адресе есть якорь (#раздел) — прокручивает к этому разделу.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
