import { isValidDate, parseDate } from './parseDate.js';

function daysFromCivil({ year, month, day }) {
  const shiftedYear = month <= 2 ? year - 1 : year;
  const era = Math.floor(shiftedYear / 400);
  const yearOfEra = shiftedYear - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra;
}

export function diffDays(fromIso, toIso) {
  if (!isValidDate(fromIso) || !isValidDate(toIso)) {
    throw new Error(`Fechas inválidas para diffDays: "${fromIso}" a "${toIso}"`);
  }
  return daysFromCivil(parseDate(toIso)) - daysFromCivil(parseDate(fromIso));
}
