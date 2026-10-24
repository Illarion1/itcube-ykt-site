// Анонс из начала текста: примерно 200 символов, обрезка по границе слова.
// Нужен и сайту, и админ-панели, и серверу, поэтому лежит отдельно и ничего не импортирует.
export function makeExcerpt(paragraphs: string[], length = 200) {
  const text = paragraphs.join(' ').replace(/\s+/g, ' ').trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length).replace(/\s+\S*$/, '')}…`;
}
