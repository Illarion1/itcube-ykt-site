// Склеивает CSS-классы, пропуская пустые значения: cn('a', isOpen && 'b') → 'a b'
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
