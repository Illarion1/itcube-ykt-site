// Путь к файлу из папки public с учётом базового адреса сайта.
// Нужно для публикации в подпапке (например, на GitHub Pages: /itcube-site/…).
export function asset(path: string) {
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}

// Ссылка на файл: свой (/uploads/…, /docs/…) — с учётом базового адреса, на другом сайте — как есть
export function fileUrl(url: string) {
  return url.startsWith('/') ? asset(url) : url;
}
