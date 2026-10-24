import { useEffect, useState } from 'react';

// Возвращает true, когда страницу прокрутили ниже offset пикселей.
// Нужен шапке, чтобы она становилась компактной при скролле.
export function useScrolled(offset = 16) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);

  return scrolled;
}
