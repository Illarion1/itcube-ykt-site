// PostCSS прогоняет наши стили через Tailwind и добавляет префиксы для старых браузеров
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
