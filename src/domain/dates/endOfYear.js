import { isValidDate, parseDate } from './parseDate.js';

export function endOfYear(todayIso) {
  if (!isValidDate(todayIso)) {
    throw new Error(`Fecha inválida para endOfYear: "${todayIso}"`);
  }
  const { year } = parseDate(todayIso);
  return `${String(year).padStart(4, '0')}-12-31`;
}
