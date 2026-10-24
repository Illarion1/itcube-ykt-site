import type { Config } from 'tailwindcss';

/**
 * Дизайн-токены сайта — единственное место, где задаются цвета, шрифты,
 * размеры заголовков, скругления и тени. Компоненты используют только эти имена
 * (bg-accent, text-ink, rounded-card…), поэтому сменить акцентный цвет
 * на всём сайте можно здесь одной строкой.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Цвета берутся из CSS-переменных (их значения — в styles/index.css).
      // Так версия для слабовидящих может перекрасить весь сайт, поменяв только переменные.
      // <alpha-value> нужен, чтобы работала прозрачность: bg-ink/95, text-white/60.
      colors: {
        // Почти чёрный (#0E0E0E) — основной текст и тёмные блоки
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
        },
        // Белый тоже через переменную: в схеме «белым по чёрному» он становится чёрным
        white: 'rgb(var(--color-white) / <alpha-value>)',
        // Серый (#6B6B6B) для второстепенного текста (контраст на белом 5.3:1 — проходит WCAG AA)
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        // Тонкие линии и рамки (#E6E6E6)
        line: 'rgb(var(--color-line) / <alpha-value>)',
        // Светло-серые карточки (#F3F3F3)
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          strong: 'rgb(var(--color-surface-strong) / <alpha-value>)',
        },
        // Акцент — «технологичный» зелёный (#2BD46B). На белом его нельзя ставить текстом
        // (низкий контраст), поэтому он только фон кнопок/маркеров с тёмным текстом.
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover: 'rgb(var(--color-accent-hover) / <alpha-value>)',
          soft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Manrope Variable"', 'system-ui', 'sans-serif'],
        display: ['"Unbounded Variable"', '"Manrope Variable"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Заголовки «резиновые»: clamp(минимум, рост от ширины экрана, максимум)
        // Unbounded очень широкий: размер подобран так, чтобы самое длинное слово
        // первого экрана («образования») помещалось в колонку и не рвалось посередине
        display: ['clamp(2.5rem, 4.4vw + 0.5rem, 5.25rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
        h1: ['clamp(2.25rem, 3.6vw + 0.75rem, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        h2: ['clamp(1.875rem, 2.4vw + 0.75rem, 3.25rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h3: ['clamp(1.25rem, 0.8vw + 0.9rem, 1.75rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        lead: ['clamp(1.0625rem, 0.4vw + 0.95rem, 1.375rem)', { lineHeight: '1.5' }],
      },
      borderRadius: {
        card: '1.5rem', // 24px — карточки
        panel: '2rem', // 32px — большие блоки
      },
      boxShadow: {
        dropdown: '0 24px 60px -20px rgba(14, 14, 14, 0.25)',
        card: '0 20px 40px -24px rgba(14, 14, 14, 0.35)',
      },
      maxWidth: {
        container: '80rem', // 1280px
      },
      transitionTimingFunction: {
        // Плавное «дорогое» замедление в конце движения
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        // Бегущая строка: лента уезжает влево на свою ширину, вторая копия занимает её место
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' },
        },
        // Лёгкое «парение» плашек на первом экране
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
