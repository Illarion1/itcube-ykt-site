// Публикация сайта на GitHub Pages: собранная папка dist → ветка gh-pages репозитория.
// Запуск: npm run deploy:gh (сначала соберёт сайт командой build:gh, потом вызовет этот файл)
import ghpages from 'gh-pages';

await new Promise((resolve, reject) => {
  ghpages.publish(
    'dist',
    {
      nojekyll: true,
      message: 'Обновление сайта',
      // Когда ветки gh-pages ещё нет, она создаётся из основного кода, и в ней остаются служебные файлы
      // (.gitignore и др.). А .gitignore исключает папку data — тогда данные сайта не попали бы на GitHub Pages
      beforeAdd: (git) => git.rm(['.gitignore', '.env.example']),
    },
    (error) => (error ? reject(error) : resolve()),
  );
});
console.log('Готово: сайт отправлен в ветку gh-pages. Через 1–2 минуты он обновится на GitHub Pages.');
