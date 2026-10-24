import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'framer-motion';

// Шрифты подключены как пакеты — сайт не зависит от Google Fonts и работает без интернета
import '@fontsource-variable/manrope';
import '@fontsource-variable/unbounded';
import './styles/index.css';

import App from './App';
import { AccessibilityProvider } from './hooks/useAccessibility';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HelmetProvider — нужен компоненту Seo, который меняет заголовок и мета-теги страницы */}
    <HelmetProvider>
      {/* basename — если сайт лежит в подпапке (GitHub Pages: /itcube-site/), адреса строятся от неё */}
      <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* reducedMotion="user": если в системе включено «уменьшить движение», анимации отключатся */}
        <MotionConfig reducedMotion="user">
          {/* Настройки версии для слабовидящих доступны всем страницам */}
          <AccessibilityProvider>
            <App />
          </AccessibilityProvider>
        </MotionConfig>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
