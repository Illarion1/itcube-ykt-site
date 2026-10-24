/**
 * Маска телефона: из любых введённых символов оставляет цифры
 * и раскладывает их по шаблону +7 (999) 123-45-67.
 * Первую 8 или 7 считаем кодом страны.
 */
export function formatPhone(input: string) {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('8') || digits.startsWith('7')) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length === 0) return '';

  let result = '+7 (' + digits.slice(0, 3);
  // Скобку добавляем только когда есть 4-я цифра — иначе её нельзя было бы стереть Backspace
  if (digits.length > 3) result += ') ' + digits.slice(3, 6);
  if (digits.length > 6) result += '-' + digits.slice(6, 8);
  if (digits.length > 8) result += '-' + digits.slice(8, 10);
  return result;
}

// Телефон полный, если в нём 11 цифр (7 + 10)
export function isPhoneComplete(phone: string) {
  return phone.replace(/\D/g, '').length === 11;
}
