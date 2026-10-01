import { daysInMonth, formatIsoDate, isValidDate, parseDate } from './parseDate.js';

export function addMonths(iso, months) {
  if (!isValidDate(iso)) {
    throw new Error(`Fecha inválida para addMonths: "${iso}"`);
  }
  if (!Number.isInteger(months)) {
    throw new Error(`La cantidad de meses debe ser un entero: "${months}"`);
  }
  const { year, month, day } = parseDate(iso);
  const zeroBased = month - 1 + months;
  const targetYear = year + Math.floor(zeroBased / 12);
  const targetMonth = (((zeroBased % 12) + 12) % 12) + 1;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return formatIsoDate({ year: targetYear, month: targetMonth, day: targetDay });
}
